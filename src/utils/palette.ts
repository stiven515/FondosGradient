// src/utils/palette.ts
import type { ColorEntry } from '../types/gradient'
import { generateId } from './color'

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) => {
    const k = (n + h / 30) % 12
    const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * c).toString(16).padStart(2, '0').toUpperCase()
  }
  return `#${f(0)}${f(8)}${f(4)}`
}

export function generateHarmoniousPalette(existing: ColorEntry[]): ColorEntry[] {
  const hue = Math.random() * 360
  const saturation = 45 + Math.random() * 35  // 45–80 %
  const count = existing.length

  return existing.map((color, i) => {
    if (color.locked) return color
    const hShift = (hue + (i / count) * 55 - 27) % 360
    const lightness = 38 + (i / Math.max(count - 1, 1)) * 42  // 38–80 %
    return {
      id: color.id ?? generateId(),
      hex: hslToHex((hShift + 360) % 360, saturation, lightness),
      locked: false,
    }
  })
}
