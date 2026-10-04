// src/hooks/useAnimation.ts
import { useEffect } from 'react'
import type { ShaderParameters, ShaderType, ColorEntry, EffectType } from '../types/gradient'
import { useGradientStore } from '../store/gradientStore'
import { clock, advance, shaderTime } from '../utils/timeline'

interface UseAnimationProps {
  drawFrame:      (effect: EffectType, amount: number) => void
  updateUniforms: (params: ShaderParameters, colors: ColorEntry[], shader: ShaderType, time: number) => void
  resizeCanvas:   () => boolean
}

export function useAnimation({ drawFrame, updateUniforms, resizeCanvas }: UseAnimationProps): void {
  useEffect(() => {
    let dirty = true
    let last  = performance.now()
    let raf   = 0
    const unsubscribe = useGradientStore.subscribe(() => { dirty = true })

    function frame(now: number) {
      const dt = Math.min(now - last, 100)
      last = now
      const s = useGradientStore.getState()
      const durationMs = s.duration * 1000

      let changed = dirty
      if (clock.seekTo !== null) {
        clock.elapsed = Math.min(Math.max(clock.seekTo, 0), durationMs)
        clock.seekTo  = null
        changed = true
      } else if (s.isPlaying) {
        const step = advance(clock.elapsed, dt, durationMs, s.isLooping)
        clock.elapsed = step.elapsed
        if (step.ended) s.setPlaying(false)
        changed = true
      }
      if (resizeCanvas()) changed = true

      if (changed) {
        dirty = false
        updateUniforms(s.parameters, s.colors, s.shader, shaderTime(clock.elapsed, s.duration, s.parameters.speed))
        drawFrame(s.effect, s.effectAmount)
      }
      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      unsubscribe()
    }
  }, [drawFrame, updateUniforms, resizeCanvas])
}
