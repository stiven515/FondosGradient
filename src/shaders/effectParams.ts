import type { EffectType } from '../types/gradient'

export type Vec4 = [number, number, number, number]

const lerp = (a: number, b: number, t: number) => a + (b - a) * t

// Lengths are in pixels of a 900 px tall frame; the shader scales them to the real resolution,
// so a 4K export looks like the on-screen preview.
export function effectParams(effect: EffectType, amount: number): Vec4 {
  const k = Math.min(1, Math.max(0, Number.isFinite(amount) ? amount : amount > 0 ? 1 : 0))

  switch (effect) {
    // [bright-pass threshold, bloom gain, tight halo radius, wide halo radius]
    case 'glow':
      return [lerp(0.60, 0.30, k), lerp(0.25, 0.95, k), lerp(10, 26, k), lerp(36, 120, k)]

    // [fringe strength (fraction of the offset from centre), edge falloff gain, edge saturation boost, unused]
    case 'chromatic':
      return [lerp(0.006, 0.055, k), lerp(0.4, 1.6, k), lerp(0, 0.35, k), 0]

    // [flute width, refraction (in flute widths), frost blur radius, sheen strength]
    case 'glass':
      return [lerp(54, 16, k), lerp(0.30, 1.0, k), lerp(1.5, 9, k), lerp(0.06, 0.22, k)]

    // [colour levels per channel, cell size in px, unused, unused]
    case 'dither':
      return [Math.round(Math.exp(lerp(Math.log(24), Math.log(3), k))), Math.round(lerp(1, 5, k)), 0, 0]

    // [cell size, plate misregistration in px, unused, unused]
    case 'halftone':
      return [lerp(5, 18, k), lerp(0, 2.5, k), 0, 0]

    default:
      return [0, 0, 0, 0]
  }
}
