import type { EffectType, ShaderParameters, ShaderType } from '../types/gradient'
import { shaders } from '../shaders'
import { VERTEX_SHADER } from '../shaders/shared'
import { POST_FRAGMENT, POST_UNIFORMS } from '../shaders/post'
import { STYLE_UNIFORMS } from '../shaders/uniforms'
import { effectParams } from '../shaders/effectParams'
import { postEffectId } from '../constants/effects'
import { hexToRgbNorm } from '../utils/color'

export type EngineErrorCode = 'unsupported' | 'compile'

export class EngineError extends Error {
  constructor(public code: EngineErrorCode, message: string) {
    super(message)
    this.name = 'EngineError'
  }
}

export interface Frame {
  params: ShaderParameters
  colors: readonly { hex: string }[]
  /** Seconds, already mapped for seamless loops by the caller. */
  time:   number
  effect: EffectType
  amount: number
}

export interface ResizeOptions {
  /** Force this drawing-buffer size (used by exports) instead of following the element. */
  override?: { w: number; h: number } | null
  /** Cap on devicePixelRatio when following the element. */
  maxDpr?:   number
}

type Locations = Record<string, WebGLUniformLocation | null>

const PALETTE_SLOTS = 8

function compile(gl: WebGLRenderingContext, source: string, type: number): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new EngineError('compile', `Shader compile error:\n${log}`)
  }
  return shader
}

function link(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
  const vertex = compile(gl, vertexSource, gl.VERTEX_SHADER)
  const fragment = compile(gl, fragmentSource, gl.FRAGMENT_SHADER)
  const program = gl.createProgram()!
  gl.attachShader(program, vertex)
  gl.attachShader(program, fragment)
  gl.bindAttribLocation(program, 0, 'a_position')
  gl.linkProgram(program)
  gl.deleteShader(vertex)
  gl.deleteShader(fragment)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new EngineError('compile', `Program link error:\n${gl.getProgramInfoLog(program)}`)
  }
  return program
}

function configureTexture(gl: WebGLRenderingContext) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
}

function paletteBytes(colors: readonly { hex: string }[]): Uint8Array {
  const data = new Uint8Array(PALETTE_SLOTS * 4)
  colors.slice(0, PALETTE_SLOTS).forEach((c, i) => {
    const [r, g, b] = hexToRgbNorm(c.hex)
    data[i * 4]     = Math.round(r * 255)
    data[i * 4 + 1] = Math.round(g * 255)
    data[i * 4 + 2] = Math.round(b * 255)
    data[i * 4 + 3] = 255
  })
  return data
}

/**
 * One style program plus the optional post-processing pass, drawn into a canvas.
 * Owns every GL resource it creates and releases them in dispose().
 */
export class GradientRenderer {
  private gl: WebGLRenderingContext
  private program: WebGLProgram
  private post: WebGLProgram
  private styleLocs: Locations = {}
  private postLocs: Locations = {}
  private paletteTexture: WebGLTexture
  private sceneTexture: WebGLTexture
  private framebuffer: WebGLFramebuffer
  private buffer: WebGLBuffer
  private width = 0
  private height = 0
  private disposed = false

  constructor(private canvas: HTMLCanvasElement, shader: ShaderType) {
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
    if (!gl) throw new EngineError('unsupported', 'WebGL is not available')
    this.gl = gl

    const { vertex, fragment } = shaders[shader]
    this.program = link(gl, vertex, fragment)
    try {
      this.post = link(gl, VERTEX_SHADER, POST_FRAGMENT)
    } catch (error) {
      gl.deleteProgram(this.program)
      throw error
    }

    this.buffer = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    STYLE_UNIFORMS.forEach(name => { this.styleLocs[name] = gl.getUniformLocation(this.program, name) })
    POST_UNIFORMS.forEach(name => { this.postLocs[name] = gl.getUniformLocation(this.post, name) })

    gl.useProgram(this.program)
    this.paletteTexture = gl.createTexture()!
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, PALETTE_SLOTS, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(PALETTE_SLOTS * 4))
    configureTexture(gl)
    gl.uniform1i(this.styleLocs['u_colorPalette'], 0)

    this.sceneTexture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    configureTexture(gl)
    this.framebuffer = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.sceneTexture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  /** Sizes the drawing buffer. Returns true when it changed (the next render must redraw). */
  resize({ override = null, maxDpr = 2 }: ResizeOptions = {}): boolean {
    if (this.disposed) return false
    const { gl, canvas } = this
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr)
    const limit = Math.min(
      gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
      ...(gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array),
    )
    const want = override ?? { w: canvas.clientWidth * dpr, h: canvas.clientHeight * dpr }
    const w = Math.min(limit, Math.max(1, Math.floor(want.w)))
    const h = Math.min(limit, Math.max(1, Math.floor(want.h)))
    if (this.width === w && this.height === h) return false
    this.width = w
    this.height = h
    canvas.width = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.activeTexture(gl.TEXTURE0)
    return true
  }

  render({ params, colors, time, effect, amount }: Frame): void {
    if (this.disposed) return
    const { gl, styleLocs: locs } = this
    gl.useProgram(this.program)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, PALETTE_SLOTS, 1, gl.RGBA, gl.UNSIGNED_BYTE, paletteBytes(colors))

    gl.uniform1f(locs['u_numColors'], colors.length)
    gl.uniform1f(locs['u_speed'], params.speed)
    gl.uniform1f(locs['u_scale'], params.scale)
    gl.uniform1f(locs['u_curl'], params.curl)
    gl.uniform1f(locs['u_drift'], params.drift)
    gl.uniform1f(locs['u_openness'], params.openness)
    gl.uniform1f(locs['u_seed'], params.seed)
    gl.uniform1f(locs['u_grain'], params.grain)
    gl.uniform1f(locs['u_time'], time)
    gl.uniform2f(locs['u_resolution'], this.canvas.width || 1, this.canvas.height || 1)

    const effectId = postEffectId(effect)
    if (effectId === undefined) {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.useProgram(this.post)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, this.sceneTexture)
    gl.uniform1i(this.postLocs['u_scene'], 1)
    gl.uniform2f(this.postLocs['u_resolution'], gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(this.postLocs['u_effect'], effectId)
    gl.uniform4fv(this.postLocs['u_params'], effectParams(effect, amount))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.activeTexture(gl.TEXTURE0)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const { gl } = this
    gl.deleteProgram(this.program)
    gl.deleteProgram(this.post)
    gl.deleteTexture(this.sceneTexture)
    gl.deleteTexture(this.paletteTexture)
    gl.deleteFramebuffer(this.framebuffer)
    gl.deleteBuffer(this.buffer)
  }
}
