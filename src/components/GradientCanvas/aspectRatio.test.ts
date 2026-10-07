import { describe, it, expect } from 'vitest'
import { ratioValue, fitBox } from './aspectRatio'

describe('ratioValue', () => {
  it('returns width over height, or null for a free canvas', () => {
    expect(ratioValue('free')).toBeNull()
    expect(ratioValue('16:9')).toBeCloseTo(16 / 9)
    expect(ratioValue('4:3')).toBeCloseTo(4 / 3)
    expect(ratioValue('1:1')).toBe(1)
    expect(ratioValue('9:16')).toBeCloseTo(9 / 16)
  })
})

describe('fitBox', () => {
  it('fills the space for a free canvas', () => {
    expect(fitBox(800, 500, null)).toEqual({ width: 800, height: 500 })
  })

  it('is limited by width when the space is taller than the ratio', () => {
    expect(fitBox(800, 800, 16 / 9)).toEqual({ width: 800, height: 450 })
  })

  it('is limited by height when the space is wider than the ratio', () => {
    expect(fitBox(1200, 400, 1)).toEqual({ width: 400, height: 400 })
  })

  it('fits a portrait ratio inside a landscape space', () => {
    const box = fitBox(900, 600, 9 / 16)
    expect(box.height).toBe(600)
    expect(box.width).toBe(338)
    expect(box.width / box.height).toBeCloseTo(9 / 16, 1)
  })

  it('never exceeds the available space and never returns zero', () => {
    for (const ratio of [16 / 9, 4 / 3, 1, 9 / 16]) {
      const box = fitBox(321, 123, ratio)
      expect(box.width).toBeLessThanOrEqual(321)
      expect(box.height).toBeLessThanOrEqual(123)
      expect(box.width).toBeGreaterThan(0)
      expect(box.height).toBeGreaterThan(0)
    }
    expect(fitBox(0, 0, 1)).toEqual({ width: 1, height: 1 })
  })
})

