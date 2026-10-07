import { describe, it, expect, vi } from 'vitest'
import { GradientRenderer, EngineError } from './renderer'
import { DEFAULT_PARAMETERS } from '../constants/parameters'

interface FakeGl {
  calls: string[]
  gl: WebGLRenderingContext
}

// A minimal stand-in that records calls; constants resolve to stable numbers.
function fakeGl(opts: { compileOk?: boolean; linkOk?: boolean } = {}): FakeGl {
  const { compileOk = true, linkOk = true } = opts
  const calls: string[] = []
  const constants = new Map<string, number>()
  const gl = new Proxy({}, {
    get(_t, prop: string) {
      if (/^[A-Z0-9_]+$/.test(prop)) {
        if (!constants.has(prop)) constants.set(prop, constants.size + 1)
        return constants.get(prop)
      }
      if (prop === 'getShaderParameter') return () => compileOk
      if (prop === 'getProgramParameter') return () => linkOk
      if (prop === 'getShaderInfoLog') return () => 'boom at line 3'
      if (prop === 'getProgramInfoLog') return () => 'link boom'
      if (prop === 'getParameter') return (p: number) => (p === constants.get('MAX_VIEWPORT_DIMS') ? new Int32Array([4096, 4096]) : 4096)
      if (prop === 'drawingBufferWidth' || prop === 'drawingBufferHeight') return 100
      return (...args: unknown[]) => {
        calls.push(prop)
        return prop.startsWith('create') ? { kind: prop, args } : null
      }
    },
  }) as unknown as WebGLRenderingContext
  return { calls, gl }
}

function canvasWith(gl: WebGLRenderingContext | null, size = { w: 400, h: 300 }) {
  return {
    width: 0, height: 0, clientWidth: size.w, clientHeight: size.h,
    getContext: vi.fn(() => gl),
  } as unknown as HTMLCanvasElement
}

const FRAME = {
  params: DEFAULT_PARAMETERS,
  colors: [{ hex: '#112233' }, { hex: '#445566' }],
  time: 1,
  effect: 'none' as const,
  amount: 0.5,
}

describe('GradientRenderer', () => {
  it('reports missing WebGL as an "unsupported" engine error', () => {
    const canvas = canvasWith(null)
    expect(() => new GradientRenderer(canvas, 'flow')).toThrowError(EngineError)
    try { new GradientRenderer(canvas, 'flow') } catch (e) {
      expect((e as EngineError).code).toBe('unsupported')
    }
  })

  it('reports a shader that fails to compile as a "compile" error carrying the GPU log', () => {
    const { gl } = fakeGl({ compileOk: false })
    try {
      new GradientRenderer(canvasWith(gl), 'mesh')
      throw new Error('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(EngineError)
      expect((e as EngineError).code).toBe('compile')
      expect((e as EngineError).message).toContain('boom at line 3')
    }
  })

  it('reports a program that fails to link as a "compile" error', () => {
    const { gl } = fakeGl({ linkOk: false })
    expect(() => new GradientRenderer(canvasWith(gl), 'flow')).toThrow(/link boom/)
  })

  it('sizes the drawing buffer from the element and the device pixel ratio', () => {
    const { gl } = fakeGl()
    const canvas = canvasWith(gl, { w: 400, h: 300 })
    vi.stubGlobal('devicePixelRatio', 2)
    const renderer = new GradientRenderer(canvas, 'flow')
    expect(renderer.resize()).toBe(true)
    expect([canvas.width, canvas.height]).toEqual([800, 600])
    expect(renderer.resize()).toBe(false)
    vi.unstubAllGlobals()
  })

  it('honours the dpr cap and an explicit override', () => {
    const { gl } = fakeGl()
    const canvas = canvasWith(gl, { w: 400, h: 300 })
    vi.stubGlobal('devicePixelRatio', 3)
    const renderer = new GradientRenderer(canvas, 'flow')
    renderer.resize({ maxDpr: 1.5 })
    expect([canvas.width, canvas.height]).toEqual([600, 450])
    expect(renderer.resize({ override: { w: 1600, h: 1200 } })).toBe(true)
    expect([canvas.width, canvas.height]).toEqual([1600, 1200])
    vi.unstubAllGlobals()
  })

  it('clamps sizes to what the GPU supports and never to zero', () => {
    const { gl } = fakeGl()
    const canvas = canvasWith(gl, { w: 0, h: 0 })
    const renderer = new GradientRenderer(canvas, 'flow')
    renderer.resize()
    expect([canvas.width, canvas.height]).toEqual([1, 1])
    renderer.resize({ override: { w: 99999, h: 99999 } })
    expect([canvas.width, canvas.height]).toEqual([4096, 4096])
  })

  it('draws once per frame without an effect and twice (scene + post) with one', () => {
    const plain = fakeGl()
    const a = new GradientRenderer(canvasWith(plain.gl), 'flow')
    a.resize()
    plain.calls.length = 0
    a.render(FRAME)
    expect(plain.calls.filter(c => c === 'drawArrays')).toHaveLength(1)

    const fx = fakeGl()
    const b = new GradientRenderer(canvasWith(fx.gl), 'flow')
    b.resize()
    fx.calls.length = 0
    b.render({ ...FRAME, effect: 'glow' })
    expect(fx.calls.filter(c => c === 'drawArrays')).toHaveLength(2)
  })

  it('treats grain as a scene effect: no extra pass', () => {
    const { gl, calls } = fakeGl()
    const renderer = new GradientRenderer(canvasWith(gl), 'flow')
    renderer.resize()
    calls.length = 0
    renderer.render({ ...FRAME, effect: 'grain' })
    expect(calls.filter(c => c === 'drawArrays')).toHaveLength(1)
  })

  it('releases every resource once, and ignores calls after dispose', () => {
    const { gl, calls } = fakeGl()
    const renderer = new GradientRenderer(canvasWith(gl), 'flow')
    renderer.resize()
    calls.length = 0
    renderer.dispose()
    expect(calls.filter(c => c === 'deleteProgram')).toHaveLength(2)
    expect(calls.filter(c => c === 'deleteTexture')).toHaveLength(2)
    expect(calls).toContain('deleteFramebuffer')
    expect(calls).toContain('deleteBuffer')

    calls.length = 0
    renderer.dispose()
    renderer.render(FRAME)
    expect(renderer.resize()).toBe(false)
    expect(calls).toEqual([])
  })

  it('frees the style program if the post program fails to build', () => {
    const { gl, calls } = fakeGl()
    let compiles = 0
    const proxied = new Proxy(gl, {
      get(target, prop: string) {
        if (prop === 'getShaderParameter') return () => ++compiles <= 2
        return Reflect.get(target, prop)
      },
    })
    expect(() => new GradientRenderer(canvasWith(proxied), 'flow')).toThrow(EngineError)
    expect(calls).toContain('deleteProgram')
  })
})
