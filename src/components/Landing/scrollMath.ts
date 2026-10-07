const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** How far the first screen has scrolled away: 0 at the top, 1 once a full viewport is gone. */
export function heroProgress(scrollTop: number, viewport: number): number {
  if (viewport <= 0) return 1
  return clamp01(scrollTop / viewport)
}

/** Index of the section being read: the last one whose top has passed 40% of the way up the viewport. */
export function activeSection(scrollTop: number, viewport: number, tops: number[]): number {
  const line = scrollTop + viewport * 0.4
  let active = 0
  tops.forEach((top, i) => { if (top <= line) active = i })
  return active
}

/** 0 while a section is below the viewport, 1 once it has fully scrolled past. */
export function progressThrough(scrollTop: number, viewport: number, top: number, height: number): number {
  const travel = viewport + height
  if (travel <= 0) return 0
  return clamp01((scrollTop + viewport - top) / travel)
}
