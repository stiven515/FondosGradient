import { useCallback, useEffect, useState } from 'react'
import type { RefObject } from 'react'
import { activeSection, heroProgress, progressThrough } from './scrollMath'
import { prefersReducedMotion } from '../../utils/media'

// Watches the landing's scroll container. It writes progress straight into CSS custom properties
// (--hero-p and --p-<section>) so layered motion never goes through React, and returns the section being read.
export function useScrollSections(scrollerRef: RefObject<HTMLElement>, ids: readonly string[]) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const scroller = scrollerRef.current
    if (!scroller) return
    const reduce = prefersReducedMotion()
    let raf = 0

    const update = () => {
      raf = 0
      const top = scroller.scrollTop
      const viewport = scroller.clientHeight
      const sections = ids.map(id => scroller.querySelector<HTMLElement>(`[data-section="${id}"]`))
      const tops = sections.map(el => el?.offsetTop ?? 0)

      const next = activeSection(top, viewport, tops)
      setActive(prev => (prev === next ? prev : next))

      if (reduce) return
      scroller.style.setProperty('--hero-p', heroProgress(top, viewport).toFixed(4))
      sections.forEach((el, i) => {
        if (i === 0 || !el) return
        scroller.style.setProperty(`--p-${ids[i]}`, progressThrough(top, viewport, tops[i], el.offsetHeight).toFixed(4))
      })
    }

    const schedule = () => { if (!raf) raf = requestAnimationFrame(update) }
    scroller.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()

    return () => {
      scroller.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [scrollerRef, ids])

  const scrollTo = useCallback((id: string) => {
    const scroller = scrollerRef.current
    const target = scroller?.querySelector<HTMLElement>(`[data-section="${id}"]`)
    if (!scroller || !target) return
    scroller.scrollTo({ top: target.offsetTop, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [scrollerRef])

  return { active, scrollTo }
}
