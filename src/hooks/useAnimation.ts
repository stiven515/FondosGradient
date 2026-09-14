// src/hooks/useAnimation.ts
import { useEffect, useRef } from 'react'
import type { ShaderParameters, ShaderType, ColorEntry } from '../types/gradient'

interface UseAnimationProps {
  drawFrame:      (time: number) => void
  updateUniforms: (params: ShaderParameters, colors: ColorEntry[], shader: ShaderType) => void
  resizeCanvas:   () => void
  params:         ShaderParameters
  colors:         ColorEntry[]
  shader:         ShaderType
  isPlaying:      boolean
}

export function useAnimation({
  drawFrame,
  updateUniforms,
  resizeCanvas,
  params,
  colors,
  shader,
  isPlaying,
}: UseAnimationProps): void {
  const rafRef      = useRef<number>(0)
  const startRef    = useRef<number>(0)
  const pausedAtRef = useRef<number>(0)

  // Keep latest values accessible inside the rAF callback without re-subscribing
  const paramsRef = useRef(params)
  const colorsRef = useRef(colors)
  const shaderRef = useRef(shader)
  paramsRef.current = params
  colorsRef.current = colors
  shaderRef.current = shader

  // Resize on window resize
  useEffect(() => {
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  // Animation loop — restarts when isPlaying changes
  useEffect(() => {
    if (!isPlaying) {
      cancelAnimationFrame(rafRef.current)
      return
    }

    startRef.current = performance.now() - pausedAtRef.current

    function frame(now: number) {
      const elapsed = now - startRef.current
      pausedAtRef.current = elapsed
      resizeCanvas()
      updateUniforms(paramsRef.current, colorsRef.current, shaderRef.current)
      drawFrame(elapsed)
      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, drawFrame, updateUniforms, resizeCanvas])
}
