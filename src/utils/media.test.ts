import { describe, it, expect, afterEach, vi } from 'vitest'
import { matches, prefersReducedMotion } from './media'

afterEach(() => vi.unstubAllGlobals())

function stubMatchMedia(result: boolean) {
  const fn = vi.fn(() => ({ matches: result }))
  vi.stubGlobal('matchMedia', fn)
  return fn
}

describe('matches', () => {
  it('returns false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(matches('(max-width: 767px)')).toBe(false)
  })

  it('returns what matchMedia reports for the given query', () => {
    const fn = stubMatchMedia(true)
    expect(matches('(max-width: 767px)')).toBe(true)
    expect(fn).toHaveBeenCalledWith('(max-width: 767px)')
  })
})

describe('prefersReducedMotion', () => {
  it('queries prefers-reduced-motion', () => {
    const fn = stubMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
    expect(fn).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)')
  })

  it('is false when the user has no preference', () => {
    stubMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })
})
