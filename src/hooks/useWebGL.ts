// src/hooks/useWebGL.ts
import { useRef, useEffect, useCallback, useState } from 'react'
import type { RefObject } from 'react'
import type { ShaderParameters, ShaderType, ColorEntry, EffectType } from '../types/gradient'
import { GradientRenderer, EngineError } from '../engine/renderer'
import { renderOverride } from '../utils/exportPng'

export type WebGLStatus = 'ok' | 'unsupported' | 'error'

interface Pending {
  params: ShaderParameters
  colors: ColorEntry[]
  time:   number
}

export function useWebGL(
  canvasRef: RefObject<HTMLCanvasElement>,
  shaderType: ShaderType
) {
  const rendererRef = useRef<GradientRenderer | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const [status, setStatus] = useState<WebGLStatus>('ok')
  const [epoch, setEpoch]   = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: GradientRenderer
    try {
      renderer = new GradientRenderer(canvas, shaderType)
    } catch (error) {
      const unsupported = error instanceof EngineError && error.code === 'unsupported'
      if (!unsupported) console.error(error)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reports the result of initialising an external system (WebGL)
      setStatus(unsupported ? 'unsupported' : 'error')
      return
    }
    setStatus('ok')
    rendererRef.current = renderer

    const onLost = (e: Event) => { e.preventDefault(); rendererRef.current = null }
    const onRestored = () => setEpoch(n => n + 1)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    return () => {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      rendererRef.current = null
      renderer.dispose()
    }
  }, [canvasRef, shaderType, epoch])

  const resizeCanvas = useCallback((): boolean => {
    return rendererRef.current?.resize({ override: renderOverride.size }) ?? false
  }, [])

  const updateUniforms = useCallback((
    params: ShaderParameters,
    colors: ColorEntry[],
    _shader: ShaderType,
    time = 0
  ) => {
    pendingRef.current = { params, colors, time }
  }, [])

  const drawFrame = useCallback((effect: EffectType, amount: number) => {
    const renderer = rendererRef.current
    const pending = pendingRef.current
    if (!renderer || !pending) return
    renderer.render({ ...pending, effect, amount })
  }, [])

  return { updateUniforms, resizeCanvas, drawFrame, status }
}
