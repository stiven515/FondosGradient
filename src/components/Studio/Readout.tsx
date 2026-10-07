import { useEffect, useRef } from 'react'
import { useGradientStore } from '../../store/gradientStore'
import { clock } from '../../utils/timeline'
import { getCanvas } from '../../utils/exportPng'
import { t as translate, useT, type TKey } from '../../i18n'

// Live numbers about the artwork, in the same micro type as every other label.
// Time and size change every frame, so they are written straight to the DOM instead of through React state.
export function Readout() {
  const t = useT()
  const shader = useGradientStore(s => s.shader)
  const count = useGradientStore(s => s.colors.length)
  const duration = useGradientStore(s => s.duration)
  const isPlaying = useGradientStore(s => s.isPlaying)
  const sizeRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    function paint() {
      const canvas = getCanvas()
      if (sizeRef.current && canvas) {
        sizeRef.current.textContent = translate('readout.canvas', { w: canvas.width, h: canvas.height })
      }
      if (timeRef.current) {
        timeRef.current.textContent = translate('readout.time', {
          now: (clock.elapsed / 1000).toFixed(1).padStart(4, '0'),
          total: duration.toFixed(1),
        })
      }
      raf = requestAnimationFrame(paint)
    }
    paint()
    return () => cancelAnimationFrame(raf)
  }, [duration])

  return (
    <footer className="micro num flex flex-shrink-0 items-center justify-between gap-4 px-5 pb-3 pt-1">
      <p className="m-0 flex min-w-0 items-center gap-2 truncate">
        <span className="truncate">{t(`style.${shader}` as TKey)}</span>
        <span aria-hidden="true">·</span>
        <span className="hidden whitespace-nowrap sm:inline">{t('readout.colors', { n: count })}</span>
        <span aria-hidden="true" className="hidden sm:inline">·</span>
        <span ref={sizeRef} className="hidden whitespace-nowrap sm:inline" />
      </p>
      <p className="m-0 flex items-center gap-2 whitespace-nowrap">
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-copper"
          style={{ opacity: isPlaying ? 1 : 0.35, animation: isPlaying ? 'pulse-dot 1.6s ease-in-out infinite' : 'none' }}
        />
        <span ref={timeRef} />
      </p>
    </footer>
  )
}
