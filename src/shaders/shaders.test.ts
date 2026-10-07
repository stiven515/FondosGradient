import { describe, it, expect } from 'vitest'
import { parser } from '@shaderfrog/glsl-parser'
import { shaders } from './index'
import { POST_FRAGMENT, POST_UNIFORMS, POST_FUNCTIONS } from './post'
import { STYLE_UNIFORMS } from './uniforms'
import { VERTEX_SHADER } from './shared'
import { SHADER_TYPES } from '../constants/shaders'
import { EFFECTS, postEffectId } from '../constants/effects'

// Effects defined purely in uv space look the same at any resolution.
const RESOLUTION_FREE = ['fxChromatic']

const BUILTINS = 'vec4 gl_FragColor; vec4 gl_FragCoord; vec4 gl_Position;\n'

// Throws on syntax errors and, because failOnWarn is on, on undeclared variables or functions.
function assertValidGlsl(source: string) {
  parser.parse(BUILTINS + source, { quiet: true, failOnWarn: true })
}

function declaredUniforms(source: string): string[] {
  return [...source.matchAll(/^\s*uniform\s+\w+\s+(\w+)\s*;/gm)].map(m => m[1])
}

function functionBody(source: string, name: string): string {
  const start = source.search(new RegExp(`\\b(?:float|vec[234]|void)\\s+${name}\\s*\\(`))
  expect(start, `function ${name} should exist`).toBeGreaterThanOrEqual(0)
  let depth = 0
  for (let i = source.indexOf('{', start); i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  throw new Error(`unterminated function ${name}`)
}

describe('GLSL validator (sanity)', () => {
  it('rejects a syntax error', () => {
    expect(() => assertValidGlsl('void main( { gl_FragColor = ; }')).toThrow()
  })

  it('rejects a typo in a variable name', () => {
    expect(() => assertValidGlsl('precision highp float; void main() { float a = 1.0; gl_FragColor = vec4(aa); }')).toThrow()
  })

  it('rejects a call to an undeclared function', () => {
    expect(() => assertValidGlsl('precision highp float; void main() { gl_FragColor = vec4(nope(1.0)); }')).toThrow()
  })

  it('accepts valid code that uses WebGL 1 built-ins', () => {
    expect(() => assertValidGlsl(
      'precision highp float; uniform sampler2D t; void main() { gl_FragColor = texture2D(t, gl_FragCoord.xy); }',
    )).not.toThrow()
  })
})

describe('style shaders', () => {
  it('covers every registered style', () => {
    expect(Object.keys(shaders).sort()).toEqual([...SHADER_TYPES].sort())
  })

  describe.each(SHADER_TYPES.map(type => [type, shaders[type]] as const))('%s', (_type, { vertex, fragment }) => {
    it('has a valid vertex shader', () => assertValidGlsl(vertex))
    it('has a valid fragment shader', () => assertValidGlsl(fragment))

    it('declares float precision', () => {
      expect(fragment).toMatch(/precision\s+(highp|mediump)\s+float\s*;/)
    })

    it('declares every uniform the app uploads', () => {
      const declared = declaredUniforms(fragment)
      for (const name of STYLE_UNIFORMS) expect(declared, `missing ${name}`).toContain(name)
    })

    it('writes an opaque colour', () => {
      expect(fragment).toMatch(/gl_FragColor\s*=\s*vec4\([^;]*1\.0\s*\)\s*;/)
    })

    it('uses only WebGL 1 syntax', () => {
      for (const source of [vertex, fragment]) {
        expect(source).not.toMatch(/#version/)
        expect(source).not.toMatch(/\btexture\s*\(/)
        expect(source).not.toMatch(/^\s*(in|out)\s+\w+\s+\w+\s*;/m)
      }
    })

    it('applies film grain only when enabled', () => {
      expect(fragment).toMatch(/if\s*\(\s*u_grain\s*>/)
      expect(fragment).toContain('filmGrain(')
    })

    it('makes grain independent of the output resolution', () => {
      const body = functionBody(fragment, 'filmGrain')
      expect(body).toContain('u_resolution')
      expect(body).toMatch(/gl_FragCoord\.xy\s*\/\s*grainCell/)
    })
  })
})

describe('shared vertex shader', () => {
  it('is valid and passes uv to the fragment stage', () => {
    assertValidGlsl(VERTEX_SHADER)
    expect(VERTEX_SHADER).toContain('v_uv')
  })
})

describe('post-processing shader', () => {
  it('is valid GLSL', () => assertValidGlsl(POST_FRAGMENT))

  it('declares float precision', () => {
    expect(POST_FRAGMENT).toMatch(/precision\s+(highp|mediump)\s+float\s*;/)
  })

  it('declares exactly the uniforms the app uploads', () => {
    expect(declaredUniforms(POST_FRAGMENT).sort()).toEqual([...POST_UNIFORMS].sort())
  })

  it('dispatches every post effect by its registered id, and nothing else', () => {
    const post = EFFECTS.filter(e => e.stage === 'post')
    const dispatched = [...POST_FRAGMENT.matchAll(/abs\(u_effect\s*-\s*(\d+)\.0\)\s*<\s*0\.5/g)].map(m => Number(m[1]))
    expect(dispatched.sort()).toEqual(post.map(e => postEffectId(e.id)!).sort())
  })

  it('defines the GLSL function every post effect dispatches to', () => {
    for (const e of EFFECTS.filter(x => x.stage === 'post')) {
      const fn = POST_FUNCTIONS[postEffectId(e.id)!]
      expect(fn, `${e.id} has no function registered`).toBeTruthy()
      expect(POST_FRAGMENT).toMatch(new RegExp(`vec3\\s+${fn}\\s*\\(`))
    }
  })

  it('uses constant loop bounds, as WebGL 1 requires', () => {
    const loops = [...POST_FRAGMENT.matchAll(/for\s*\(([^)]*)\)/g)].map(m => m[1])
    expect(loops.length).toBeGreaterThan(0)
    for (const header of loops) expect(header).toMatch(/int\s+\w+\s*=\s*0\s*;\s*\w+\s*<\s*\d+\s*;\s*\w+\+\+/)
  })

  it('scales pixel sizes with the output resolution so exports match the preview', () => {
    expect(functionBody(POST_FRAGMENT, 'pxScale')).toMatch(/u_resolution\.y\s*\/\s*900\.0/)
    for (const fn of Object.values(POST_FUNCTIONS)) {
      if (RESOLUTION_FREE.includes(fn)) continue
      expect(functionBody(POST_FRAGMENT, fn), `${fn} should use pxScale()`).toContain('pxScale()')
    }
  })

  it('always outputs an opaque, clamped colour', () => {
    expect(POST_FRAGMENT).toMatch(/gl_FragColor\s*=\s*vec4\(clamp\([^;]+\),\s*1\.0\)\s*;/)
  })
})
