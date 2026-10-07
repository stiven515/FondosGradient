import { describe, it, expect } from 'vitest'
import { activeSection, progressThrough, heroProgress } from './scrollMath'

// Four sections of 800 px each in a 600 px viewport.
const TOPS = [0, 800, 1600, 2400]

describe('heroProgress', () => {
  it('goes from 0 at the top to 1 after one viewport of scrolling', () => {
    expect(heroProgress(0, 600)).toBe(0)
    expect(heroProgress(300, 600)).toBe(0.5)
    expect(heroProgress(600, 600)).toBe(1)
    expect(heroProgress(5000, 600)).toBe(1)
  })

  it('never returns NaN or leaves 0..1', () => {
    expect(heroProgress(-50, 600)).toBe(0)
    expect(heroProgress(10, 0)).toBe(1)
  })
})

describe('activeSection', () => {
  it('is the first section at the top', () => {
    expect(activeSection(0, 600, TOPS)).toBe(0)
  })

  it('switches when a section crosses 40% of the viewport', () => {
    expect(activeSection(800 - 240 - 1, 600, TOPS)).toBe(0)
    expect(activeSection(800 - 240, 600, TOPS)).toBe(1)
  })

  it('reaches the last section at the end', () => {
    expect(activeSection(2400, 600, TOPS)).toBe(3)
    expect(activeSection(99999, 600, TOPS)).toBe(3)
  })

  it('handles sections that are not in order of height', () => {
    expect(activeSection(1000, 600, [0, 500, 3000])).toBe(1)
  })

  it('returns 0 for an empty list', () => {
    expect(activeSection(500, 600, [])).toBe(0)
  })
})

describe('progressThrough', () => {
  const top = 800
  const height = 800

  it('is 0 while the section is still below the viewport', () => {
    expect(progressThrough(0, 600, top, height)).toBe(0)
    expect(progressThrough(200, 600, top, height)).toBe(0)
  })

  it('starts the moment its top enters the viewport', () => {
    expect(progressThrough(200, 600, top, height)).toBe(0)
    expect(progressThrough(300, 600, top, height)).toBeCloseTo(100 / 1400)
  })

  it('is 0.5 when the section is centred in the viewport', () => {
    const centred = top + height / 2 - 300
    expect(progressThrough(centred, 600, top, height)).toBeCloseTo(0.5)
  })

  it('is 1 once the section has scrolled completely past', () => {
    expect(progressThrough(1600, 600, top, height)).toBe(1)
    expect(progressThrough(9999, 600, top, height)).toBe(1)
  })

  it('is monotonic as the page scrolls down', () => {
    let last = -1
    for (let y = 0; y <= 2400; y += 100) {
      const p = progressThrough(y, 600, top, height)
      expect(p).toBeGreaterThanOrEqual(last)
      last = p
    }
  })

  it('does not divide by zero for an empty section in an empty viewport', () => {
    expect(Number.isFinite(progressThrough(0, 0, 0, 0))).toBe(true)
  })
})
