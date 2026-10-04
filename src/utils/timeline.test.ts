import { describe, it, expect } from 'vitest'
import { advance, shaderTime } from './timeline'

describe('advance', () => {
  it('adds delta while inside the cycle', () => {
    expect(advance(1000, 16, 10000, true)).toEqual({ elapsed: 1016, ended: false })
  })

  it('wraps to the start when looping', () => {
    expect(advance(9990, 20, 10000, true)).toEqual({ elapsed: 10, ended: false })
  })

  it('clamps to the end and reports ended when not looping', () => {
    expect(advance(9990, 20, 10000, false)).toEqual({ elapsed: 10000, ended: true })
  })
})

describe('shaderTime', () => {
  it('starts at zero', () => {
    expect(shaderTime(0, 10, 1)).toBe(0)
  })

  it('completes a whole number of shader phases at the end of the cycle', () => {
    for (const [dur, speed] of [[10, 1], [5, 0.7], [30, 2.3], [20, 0.1]]) {
      const phase = shaderTime(dur * 1000, dur, speed) * speed * 0.05
      expect(Math.abs(phase - Math.round(phase))).toBeLessThan(1e-9)
      expect(Math.round(phase)).toBeGreaterThanOrEqual(1)
    }
  })

  it('stays finite when speed is zero', () => {
    expect(Number.isFinite(shaderTime(5000, 10, 0))).toBe(true)
  })
})
