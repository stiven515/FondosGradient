// src/components/GradientCanvas/index.tsx
import { useRef, useEffect } from 'react'
import { useGradientStore } from '../../store/gradientStore'
import { useWebGL } from '../../hooks/useWebGL'
import { useAnimation } from '../../hooks/useAnimation'
import { aspectRatioCss } from './aspectRatio'
import { registerCanvas } from '../../utils/exportPng'

export function GradientCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shader      = useGradientStore(s => s.shader)
  const aspectRatio = useGradientStore(s => s.aspectRatio)
  const { updateUniforms, resizeCanvas, drawFrame, status } = useWebGL(canvasRef, shader)

  useAnimation({ drawFrame, updateUniforms, resizeCanvas })

  useEffect(() => registerCanvas(canvasRef.current!), [])

  const arCss = aspectRatioCss(aspectRatio)

  return (
    <div
      className="relative rounded-2xl overflow-hidden"
      style={{
        width:       '100%',
        height:      arCss ? 'auto' : '100%',
        aspectRatio: arCss || undefined,
      }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        role="img"
        aria-label="Animated gradient canvas"
      />
      {status !== 'ok' && (
        <div
          role="alert"
          className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center px-6"
          style={{ background: 'var(--bg-panel)', color: 'var(--text-secondary)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
            {status === 'unsupported' ? 'WebGL is not available' : 'This style failed to render'}
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {status === 'unsupported'
              ? 'Enable hardware acceleration or try a different browser.'
              : 'Try another style or reload the page.'}
          </span>
        </div>
      )}
    </div>
  )
}
