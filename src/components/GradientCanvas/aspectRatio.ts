import type { AspectRatioType } from '../../types/gradient'

const AR_VALUE: Record<AspectRatioType, number | null> = {
  'free': null,
  '16:9': 16 / 9,
  '4:3':  4 / 3,
  '1:1':  1,
  '9:16': 9 / 16,
}

/** Width divided by height, or null for a free canvas. */
export function ratioValue(ar: AspectRatioType): number | null {
  return AR_VALUE[ar]
}

/** The largest box with the given ratio that fits inside the available space. */
export function fitBox(availableWidth: number, availableHeight: number, ratio: number | null): { width: number; height: number } {
  const w = Math.max(1, availableWidth)
  const h = Math.max(1, availableHeight)
  if (ratio === null) return { width: Math.round(w), height: Math.round(h) }
  const width = Math.min(w, h * ratio)
  return { width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(width / ratio)) }
}
