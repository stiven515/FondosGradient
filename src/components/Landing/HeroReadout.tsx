import { useEffect, useRef } from 'react'
import { HERO_PALETTE } from './landingConfig'
import { prefersReducedMotion } from '../../utils/media'
import { t as translate, useT } from '../../i18n'

// Live numbers about the hero artwork: the style that is running, its colours, the canvas it paints and how long
// it has been running. Written straight to the DOM because the values change every frame.
export function HeroReadout() {
  const t = useT()
  const sizeRef = useRef<HTMLSpanElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return
    const startedAt = performance.now()
    let raf = 0
    const paint = (now: number) => {
      const canvas = document.querySelector<HTMLCanvasElement>('[data-section="hero"] canvas')
      if (sizeRef.current && canvas) sizeRef.current.textContent = translate('readout.canvas', { w: canvas.width, h: canvas.height })
      if (timeRef.current) timeRef.current.textContent = `${((now - startedAt) / 1000).toFixed(1).padStart(5, '0')} s`
      raf = requestAnimationFrame(paint)
    }
    raf = requestAnimationFrame(paint)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <p className="micro num m-0 hidden items-center gap-2 whitespace-nowrap md:flex">
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-copper" style={{ animation: 'pulse-dot 1.6s ease-in-out infinite' }} />
      <span>{t('style.ribbon')}</span>
      <span aria-hidden="true">·</span>
      <span>{t('readout.colors', { n: HERO_PALETTE.length })}</span>
      <span aria-hidden="true">·</span>
      <span ref={sizeRef} />
      <span aria-hidden="true">·</span>
      <span ref={timeRef} />
    </p>
  )
}
