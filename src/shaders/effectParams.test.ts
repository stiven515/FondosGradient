import { describe, it, expect } from 'vitest'
import { effectParams } from './effectParams'
import { EFFECT_IDS, isPostEffect } from '../constants/effects'
import type { EffectType } from '../types/gradient'

const POST = EFFECT_IDS.filter(isPostEffect)
const STEPS = Array.from({ length: 21 }, (_, i) => i / 20)

function series(effect: EffectType, index: number): number[] {
  return STEPS.map(k => effectParams(effect, k)[index])
}

function isNonDecreasing(values: number[]) { return values.every((v, i) => i === 0 || v >= values[i - 1] - 1e-9) }
function isNonIncreasing(values: number[]) { return values.every((v, i) => i === 0 || v <= values[i - 1] + 1e-9) }

describe('effectParams', () => {
  it.each(POST)('%s: every parameter is finite across the whole amount range', effect => {
    for (const k of STEPS) {
      const p = effectParams(effect, k)
      expect(p).toHaveLength(4)
      p.forEach(v => expect(Number.isFinite(v)).toBe(true))
    }
  })

  it.each(POST)('%s: the strongest setting actually differs from the weakest', effect => {
    expect(effectParams(effect, 1)).not.toEqual(effectParams(effect, 0))
  })

  it.each(POST)('%s: out-of-range and invalid amounts are clamped, never NaN', effect => {
    expect(effectParams(effect, -5)).toEqual(effectParams(effect, 0))
    expect(effectParams(effect, 9)).toEqual(effectParams(effect, 1))
    effectParams(effect, NaN).forEach(v => expect(Number.isFinite(v)).toBe(true))
    effectParams(effect, Infinity).forEach(v => expect(Number.isFinite(v)).toBe(true))
  })

  it('returns zeros for effects that are not post-processing', () => {
    expect(effectParams('none', 0.5)).toEqual([0, 0, 0, 0])
    expect(effectParams('grain', 0.5)).toEqual([0, 0, 0, 0])
  })

  describe('glow', () => {
    it('lowers the threshold and raises intensity and both radii with amount', () => {
      expect(isNonIncreasing(series('glow', 0))).toBe(true)
      expect(isNonDecreasing(series('glow', 1))).toBe(true)
      expect(isNonDecreasing(series('glow', 2))).toBe(true)
      expect(isNonDecreasing(series('glow', 3))).toBe(true)
    })

    it('keeps the wide halo larger than the tight one and the threshold inside (0, 1)', () => {
      for (const k of STEPS) {
        const [threshold, , tight, wide] = effectParams('glow', k)
        expect(wide).toBeGreaterThan(tight)
        expect(threshold).toBeGreaterThan(0)
        expect(threshold).toBeLessThan(1)
      }
    })
  })

  describe('chromatic', () => {
    it('increases fringing strength and edge falloff with amount', () => {
      expect(isNonDecreasing(series('chromatic', 0))).toBe(true)
      expect(isNonDecreasing(series('chromatic', 1))).toBe(true)
    })

    it('stays a subtle lens effect: fringing never exceeds 6% of the frame', () => {
      for (const k of STEPS) expect(effectParams('chromatic', k)[0]).toBeLessThanOrEqual(0.06)
    })
  })

  describe('glass', () => {
    it('makes flutes narrower and refraction, blur and sheen stronger with amount', () => {
      expect(isNonIncreasing(series('glass', 0))).toBe(true)
      expect(isNonDecreasing(series('glass', 1))).toBe(true)
      expect(isNonDecreasing(series('glass', 2))).toBe(true)
      expect(isNonDecreasing(series('glass', 3))).toBe(true)
    })

    it('never makes flutes thinner than 8 px, which would alias', () => {
      for (const k of STEPS) expect(effectParams('glass', k)[0]).toBeGreaterThanOrEqual(8)
    })
  })

  describe('dither', () => {
    it('reduces the number of colour levels and enlarges cells as amount grows', () => {
      expect(isNonIncreasing(series('dither', 0))).toBe(true)
      expect(isNonDecreasing(series('dither', 1))).toBe(true)
    })

    it('always uses whole levels (at least 3) and whole-pixel cells', () => {
      for (const k of STEPS) {
        const [levels, cell] = effectParams('dither', k)
        expect(Number.isInteger(levels)).toBe(true)
        expect(levels).toBeGreaterThanOrEqual(3)
        expect(Number.isInteger(cell)).toBe(true)
        expect(cell).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('halftone', () => {
    it('uses larger cells and more misregistration with amount', () => {
      expect(isNonDecreasing(series('halftone', 0))).toBe(true)
      expect(isNonDecreasing(series('halftone', 1))).toBe(true)
    })

    it('keeps cells large enough to read as dots', () => {
      for (const k of STEPS) expect(effectParams('halftone', k)[0]).toBeGreaterThanOrEqual(4)
    })
  })
})
