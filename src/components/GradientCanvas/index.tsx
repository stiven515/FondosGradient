// src/components/GradientCanvas/index.tsx
import { useRef } from 'react'
import { useGradientStore } from '../../store/gradientStore'
import { useWebGL } from '../../hooks/useWebGL'
import { useAnimation } from '../../hooks/useAnimation'

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { shader, parameters, colors, isPlaying } = useGradientStore()
  const { updateUniforms, resizeCanvas, drawFrame } = useWebGL(canvasRef, shader)

  useAnimation({
    drawFrame,
    updateUniforms,
    resizeCanvas,
    params:    parameters,
    colors,
    shader,
    isPlaying,
  })

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full block"
      aria-label="Animated gradient canvas"
    />
  )
}
