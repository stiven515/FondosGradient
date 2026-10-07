// src/components/GradientCanvas/index.tsx
import { useRef, useEffect, useState } from 'react'
import { useGradientStore } from '../../store/gradientStore'
import { useWebGL } from '../../hooks/useWebGL'
import { useAnimation } from '../../hooks/useAnimation'
import { ratioValue, fitBox } from './aspectRatio'
import { registerCanvas } from '../../utils/exportPng'
import { useT } from '../../i18n'

export function GradientCanvas() {
  const t = useT()
  const spaceRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shader      = useGradientStore(s => s.shader)
  const aspectRatio = useGradientStore(s => s.aspectRatio)
  const { updateUniforms, resizeCanvas, drawFrame, status } = useWebGL(canvasRef, shader)
  const [space, setSpace] = useState<{ w: number; h: number } | null>(null)

  useAnimation({ drawFrame, updateUniforms, resizeCanvas })

  useEffect(() => registerCanvas(canvasRef.current!), [])

  // Track the room the canvas has so a fixed ratio can fill it without overflowing.
  useEffect(() => {
    const el = spaceRef.current
    if (!el) return
    const measure = () => setSpace({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const ratio = ratioValue(aspectRatio)
  const box = space && ratio !== null ? fitBox(space.w, space.h, ratio) : null

  return (
    <div ref={spaceRef} className="flex h-full w-full items-center justify-center">
      <div
        className="relative overflow-hidden rounded-canvas bg-sunken"
        style={{
          width:  box ? box.width : '100%',
          height: box ? box.height : '100%',
          viewTransitionName: 'stage',
        } as React.CSSProperties}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          role="img"
          aria-label={t('canvas.label')}
        />
        {status !== 'ok' && (
          <div
            role="alert"
            className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-frame px-6 text-center"
          >
            <span className="text-[14px] font-bold text-ink">
              {status === 'unsupported' ? t('webgl.unsupported.title') : t('webgl.error.title')}
            </span>
            <span className="max-w-xs text-[12px] text-ink-2">
              {status === 'unsupported' ? t('webgl.unsupported.body') : t('webgl.error.body')}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
