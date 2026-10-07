import { describe, it, expect } from 'vitest'
import { sanitizePersisted } from './persist'
import { DEFAULT_COLORS, DEFAULT_PARAMETERS } from './gradientStore'

describe('sanitizePersisted', () => {
  it('returns an empty object for non-objects', () => {
    expect(sanitizePersisted(null)).toEqual({})
    expect(sanitizePersisted('nope')).toEqual({})
    expect(sanitizePersisted(42)).toEqual({})
  })

  it('keeps valid saved values', () => {
    const colors = [
      { id: 'a', hex: '#112233', locked: true },
      { id: 'b', hex: '#445566', locked: false },
    ]
    const out = sanitizePersisted({
      colors, shader: 'silk', effect: 'glow', effectAmount: 0.8, duration: 20, aspectRatio: '1:1',
      parameters: { ...DEFAULT_PARAMETERS, speed: 2 },
    })
    expect(out.colors).toEqual(colors)
    expect(out.shader).toBe('silk')
    expect(out.effect).toBe('glow')
    expect(out.effectAmount).toBe(0.8)
    expect(out.duration).toBe(20)
    expect(out.aspectRatio).toBe('1:1')
    expect(out.parameters?.speed).toBe(2)
  })

  it('fills missing parameters from defaults instead of dropping the rest', () => {
    const out = sanitizePersisted({ parameters: { speed: 2.5 } })
    expect(out.parameters).toEqual({ ...DEFAULT_PARAMETERS, speed: 2.5 })
  })

  it('drops unknown shader, effect, ratio and duration values', () => {
    const out = sanitizePersisted({ shader: 'bogus', effect: 'bogus', aspectRatio: '2:1', duration: 7 })
    expect(out).toEqual({})
  })

  it('clamps out-of-range numbers', () => {
    const out = sanitizePersisted({
      effectAmount: 9,
      parameters: { ...DEFAULT_PARAMETERS, scale: 99, speed: -3, grain: 4 },
    })
    expect(out.effectAmount).toBe(1)
    expect(out.parameters?.scale).toBe(4)
    expect(out.parameters?.speed).toBe(0)
    expect(out.parameters?.grain).toBe(0.5)
  })

  it('ignores a palette with invalid hex values or fewer than two colors', () => {
    expect(sanitizePersisted({ colors: [{ id: 'a', hex: '#GGGGGG', locked: false }, { id: 'b', hex: '#000000', locked: false }] }).colors).toBeUndefined()
    expect(sanitizePersisted({ colors: [DEFAULT_COLORS[0]] }).colors).toBeUndefined()
  })

  it('caps the palette at eight colors', () => {
    const many = Array.from({ length: 12 }, (_, i) => ({ id: String(i), hex: '#123456', locked: false }))
    expect(sanitizePersisted({ colors: many }).colors).toHaveLength(8)
  })
})
