// src/components/GradientCanvas/index.tsx
import { useRef } from 'react'
import { useGradientStore } from '../../store/gradientStore'
import { useWebGL } from '../../hooks/useWebGL'
import { useAnimation } from '../../hooks/useAnimation'
import { aspectRatioCss } from './aspectRatio'

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shader      = useGradientStore(s => s.shader)
  const aspectRatio = useGradientStore(s => s.aspectRatio)
  const { updateUniforms, resizeCanvas, drawFrame } = useWebGL(canvasRef, shader)

  useAnimation({ drawFrame, updateUniforms, resizeCanvas })

  const arCss = aspectRatioCss(aspectRatio)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        width:       '100%',
        height:      arCss ? 'auto' : '100%',
        aspectRatio: arCss || undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label="Animated gradient canvas"
      />
    </div>
  )
}
