import { describe, it, expect } from 'vitest'
import { aspectRatioCss } from './aspectRatio'

describe('aspectRatioCss', () => {
  it('returns empty string for "free"', () => {
    expect(aspectRatioCss('free')).toBe('')
  })
  it('returns "16 / 9" for "16:9"', () => {
    expect(aspectRatioCss('16:9')).toBe('16 / 9')
  })
  it('returns "4 / 3" for "4:3"', () => {
    expect(aspectRatioCss('4:3')).toBe('4 / 3')
  })
  it('returns "1 / 1" for "1:1"', () => {
    expect(aspectRatioCss('1:1')).toBe('1 / 1')
  })
  it('returns "9 / 16" for "9:16"', () => {
    expect(aspectRatioCss('9:16')).toBe('9 / 16')
  })
})
