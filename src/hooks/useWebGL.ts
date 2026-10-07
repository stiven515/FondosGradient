// src/hooks/useWebGL.ts
import { useRef, useEffect, useCallback, useState } from 'react'
import type { RefObject } from 'react'
import type { ShaderParameters, ShaderType, ColorEntry, EffectType } from '../types/gradient'
import { shaders } from '../shaders'
import { VERTEX_SHADER } from '../shaders/shared'
import { POST_FRAGMENT, POST_UNIFORMS } from '../shaders/post'
import { STYLE_UNIFORMS } from '../shaders/uniforms'
import { effectParams } from '../shaders/effectParams'
import { postEffectId } from '../constants/effects'
import { hexToRgbNorm } from '../utils/color'
import { useGradientStore } from '../store/gradientStore'
import { renderOverride } from '../utils/exportPng'

interface GLState {
  gl:               WebGLRenderingContext
  program:          WebGLProgram
  locs:             Record<string, WebGLUniformLocation | null>
  paletteTexture:   WebGLTexture
  post:             WebGLProgram
  postLocs:         Record<string, WebGLUniformLocation | null>
  sceneTexture:     WebGLTexture
  framebuffer:      WebGLFramebuffer
}

function compileShader(gl: WebGLRenderingContext, src: string, type: number): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`Shader compile error:\n${log}`)
  }
  return shader
}

function buildProgram(
  gl: WebGLRenderingContext,
  vertSrc: string,
  fragSrc: string
): WebGLProgram {
  const vert = compileShader(gl, vertSrc, gl.VERTEX_SHADER)
  const frag = compileShader(gl, fragSrc, gl.FRAGMENT_SHADER)
  const prog = gl.createProgram()!
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.bindAttribLocation(prog, 0, 'a_position')
  gl.linkProgram(prog)
  gl.deleteShader(vert)
  gl.deleteShader(frag)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`Program link error:\n${gl.getProgramInfoLog(prog)}`)
  }
  return prog
}

function makePaletteTexture(gl: WebGLRenderingContext, colors: ColorEntry[]): WebGLTexture {
  const tex = gl.createTexture()!
  gl.bindTexture(gl.TEXTURE_2D, tex)
  const data = new Uint8Array(8 * 4).fill(0)
  colors.slice(0, 8).forEach((c, i) => {
    const [r, g, b] = hexToRgbNorm(c.hex)
    data[i * 4]     = Math.round(r * 255)
    data[i * 4 + 1] = Math.round(g * 255)
    data[i * 4 + 2] = Math.round(b * 255)
    data[i * 4 + 3] = 255
  })
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 8, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE)
  return tex
}

export type WebGLStatus = 'ok' | 'unsupported' | 'error'

export function useWebGL(
  canvasRef: RefObject<HTMLCanvasElement>,
  shaderType: ShaderType
) {
  const stateRef = useRef<GLState | null>(null)
  const [status, setStatus] = useState<WebGLStatus>('ok')
  const [epoch, setEpoch]   = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true })
    if (!gl) { setStatus('unsupported'); return }

    const onLost = (e: Event) => { e.preventDefault(); stateRef.current = null }
    const onRestored = () => setEpoch(n => n + 1)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    const { vertex, fragment } = shaders[shaderType]
    let program: WebGLProgram
    let post: WebGLProgram
    try {
      program = buildProgram(gl, vertex, fragment)
      post    = buildProgram(gl, VERTEX_SHADER, POST_FRAGMENT)
    } catch (err) {
      console.error(err)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reports the result of initialising an external system (WebGL)
      setStatus('error')
      return
    }
    setStatus('ok')

    // Fullscreen quad — two triangles as TRIANGLE_STRIP
    const buf = gl.createBuffer()!
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)

    const locs: Record<string, WebGLUniformLocation | null> = {}
    STYLE_UNIFORMS.forEach(n => { locs[n] = gl.getUniformLocation(program, n) })

    gl.useProgram(program)

    const paletteTexture = makePaletteTexture(gl, useGradientStore.getState().colors)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture)
    gl.uniform1i(locs['u_colorPalette'], 0)

    const postLocs: Record<string, WebGLUniformLocation | null> = {}
    POST_UNIFORMS.forEach(n => {
      postLocs[n] = gl.getUniformLocation(post, n)
    })

    const sceneTexture = gl.createTexture()!
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S,     gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T,     gl.CLAMP_TO_EDGE)
    const framebuffer = gl.createFramebuffer()!
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, sceneTexture, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    canvas.width = 0

    stateRef.current = { gl, program, locs, paletteTexture, post, postLocs, sceneTexture, framebuffer }

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      stateRef.current = null
      gl.deleteProgram(program)
      gl.deleteProgram(post)
      gl.deleteTexture(sceneTexture)
      gl.deleteFramebuffer(framebuffer)
      gl.deleteTexture(paletteTexture)
      gl.deleteBuffer(buf)
    }
  }, [canvasRef, shaderType, epoch])

  const resizeCanvas = useCallback((): boolean => {
    const canvas = canvasRef.current
    const state  = stateRef.current
    if (!canvas || !state) return false
    const { gl, sceneTexture } = state
    const dpr = Math.min(window.devicePixelRatio, 2)
    const limit = Math.min(
      gl.getParameter(gl.MAX_TEXTURE_SIZE) as number,
      ...(gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array),
    )
    const want = renderOverride.size ?? { w: canvas.clientWidth * dpr, h: canvas.clientHeight * dpr }
    const w = Math.min(limit, Math.max(1, Math.floor(want.w)))
    const h = Math.min(limit, Math.max(1, Math.floor(want.h)))
    if (canvas.width === w && canvas.height === h) return false
    canvas.width  = w
    canvas.height = h
    gl.viewport(0, 0, w, h)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
    gl.activeTexture(gl.TEXTURE0)
    return true
  }, [canvasRef])

  const updateUniforms = useCallback((
    params: ShaderParameters,
    colors: ColorEntry[],
    _shader: ShaderType,
    time = 0
  ) => {
    const state = stateRef.current
    if (!state) return
    const { gl, locs, paletteTexture, program } = state
    gl.useProgram(program)
    gl.activeTexture(gl.TEXTURE0)

    // Refresh palette texture with current colors
    const data = new Uint8Array(8 * 4).fill(0)
    colors.slice(0, 8).forEach((c, i) => {
      const [r, g, b] = hexToRgbNorm(c.hex)
      data[i * 4]     = Math.round(r * 255)
      data[i * 4 + 1] = Math.round(g * 255)
      data[i * 4 + 2] = Math.round(b * 255)
      data[i * 4 + 3] = 255
    })
    gl.bindTexture(gl.TEXTURE_2D, paletteTexture)
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 8, 1, gl.RGBA, gl.UNSIGNED_BYTE, data)

    gl.uniform1f(locs['u_numColors'], colors.length)
    gl.uniform1f(locs['u_speed'],    params.speed)
    gl.uniform1f(locs['u_scale'],    params.scale)
    gl.uniform1f(locs['u_curl'],     params.curl)
    gl.uniform1f(locs['u_drift'],    params.drift)
    gl.uniform1f(locs['u_openness'], params.openness)
    gl.uniform1f(locs['u_seed'],     params.seed)
    gl.uniform1f(locs['u_grain'],    params.grain)
    gl.uniform1f(locs['u_time'], time)
    gl.uniform2f(
      locs['u_resolution'],
      canvasRef.current?.width  ?? 1,
      canvasRef.current?.height ?? 1
    )
  }, [canvasRef])

  const drawFrame = useCallback((effect: EffectType, amount: number) => {
    const state = stateRef.current
    if (!state) return
    const { gl, post, postLocs, sceneTexture, framebuffer } = state
    const effectId = postEffectId(effect)
    if (effectId === undefined) {
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      return
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    gl.useProgram(post)
    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture)
    gl.uniform1i(postLocs['u_scene'], 1)
    gl.uniform2f(postLocs['u_resolution'], gl.drawingBufferWidth, gl.drawingBufferHeight)
    gl.uniform1f(postLocs['u_effect'], effectId)
    gl.uniform4fv(postLocs['u_params'], effectParams(effect, amount))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    gl.activeTexture(gl.TEXTURE0)
  }, [])

  return { updateUniforms, resizeCanvas, drawFrame, status }
}
