// src/utils/__tests__/color.test.ts
import { describe, it, expect } from 'vitest'
import { hexToRgb, hexToRgbNorm, isValidHex, generateId } from '../color'

describe('hexToRgb', () => {
  it('converts #RRGGBB to [r, g, b] 0-255', () => {
    expect(hexToRgb('#FFE7F0')).toEqual([255, 231, 240])
  })
  it('converts lowercase hex', () => {
    expect(hexToRgb('#ffe7f0')).toEqual([255, 231, 240])
  })
  it('handles hex without #', () => {
    expect(hexToRgb('EAB5E6')).toEqual([234, 181, 230])
  })
})

describe('hexToRgbNorm', () => {
  it('converts #FFFFFF to [1, 1, 1]', () => {
    expect(hexToRgbNorm('#FFFFFF')).toEqual([1, 1, 1])
  })
  it('converts #000000 to [0, 0, 0]', () => {
    expect(hexToRgbNorm('#000000')).toEqual([0, 0, 0])
  })
  it('normalizes mid-range value', () => {
    const [r] = hexToRgbNorm('#800000')
    expect(r).toBeCloseTo(0.502, 2)
  })
})

describe('isValidHex', () => {
  it('accepts valid 6-digit hex with #', () => {
    expect(isValidHex('#EAB5E6')).toBe(true)
  })
  it('rejects short hex', () => {
    expect(isValidHex('#EAB')).toBe(false)
  })
  it('rejects invalid characters', () => {
    expect(isValidHex('#ZZZZZZ')).toBe(false)
  })
  it('rejects empty string', () => {
    expect(isValidHex('')).toBe(false)
  })
})

describe('generateId', () => {
  it('generates unique ids', () => {
    const ids = new Set(Array.from({ length: 100 }, () => generateId()))
    expect(ids.size).toBe(100)
  })
})
