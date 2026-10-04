import { describe, it, expect } from 'vitest'
import { encodeStateToUrl, decodeUrlToState } from './urlState'
import { DEFAULT_COLORS, DEFAULT_PARAMETERS } from '../store/gradientStore'
import type { ShaderParameters } from '../types/gradient'

describe('encodeStateToUrl', () => {
  it('encodes shader and colors', () => {
    const result = encodeStateToUrl({
      shader: 'flow',
      colors: DEFAULT_COLORS,
      parameters: DEFAULT_PARAMETERS,
      effect: 'none', effectAmount: 0.5, duration: 10,
      aspectRatio: 'free',
    })
    expect(result).toContain('shader=flow')
    expect(result).toContain('colors=')
    // colors are hex without #
    expect(result).not.toContain('%23')
    expect(result).not.toContain('#')
  })

  it('encodes numeric params with 2 decimal places', () => {
    const result = encodeStateToUrl({
      shader: 'mesh',
      colors: DEFAULT_COLORS,
      parameters: { ...DEFAULT_PARAMETERS, scale: 1.6 },
      effect: 'none', effectAmount: 0.5, duration: 10,
      aspectRatio: '16:9',
    })
    expect(result).toContain('scale=1.60')
    expect(result).toContain('ar=16%3A9')
  })
})

describe('decodeUrlToState', () => {
  it('returns empty object for empty search', () => {
    expect(decodeUrlToState('')).toEqual({})
  })

  it('decodes shader', () => {
    const result = decodeUrlToState('?shader=beam')
    expect(result.shader).toBe('beam')
  })

  it('rejects invalid shader', () => {
    const result = decodeUrlToState('?shader=invalid')
    expect(result.shader).toBeUndefined()
  })

  it('decodes colors array', () => {
    const result = decodeUrlToState('?colors=FF0000,00FF00,0000FF')
    expect(result.colors).toHaveLength(3)
    expect(result.colors![0].hex).toBe('#FF0000')
  })

  it('handles partial params — only shader present', () => {
    const result = decodeUrlToState('?shader=wave')
    expect(result.shader).toBe('wave')
    expect(result.parameters).toBeUndefined()
    expect(result.colors).toBeUndefined()
  })

  it('partial numeric params contain only decoded keys, not defaults', () => {
    const result = decodeUrlToState('?speed=2.00')
    // Only speed should be present — scale and other keys must NOT appear
    expect(result.parameters).toBeDefined()
    const params = result.parameters as Partial<ShaderParameters>
    expect(params.speed).toBe(2.0)
    expect(params.scale).toBeUndefined()
    expect(params.curl).toBeUndefined()
  })

  it('grain survives a share URL when effect=grain is present', () => {
    const result = decodeUrlToState('?effect=grain&grain=0.40&speed=1.00&scale=1.60&curl=1.20&drift=0.55&openness=0.00&seed=0')
    expect(result.effect).toBe('grain')
    const params = result.parameters as Partial<ShaderParameters>
    expect(params.grain).toBeCloseTo(0.40)
  })

  it('round-trips effect amount and duration', () => {
    const encoded = encodeStateToUrl({
      shader: 'flow', colors: DEFAULT_COLORS, parameters: DEFAULT_PARAMETERS,
      effect: 'glow', effectAmount: 0.75, duration: 20, aspectRatio: 'free',
    })
    const result = decodeUrlToState('?' + encoded)
    expect(result.effectAmount).toBeCloseTo(0.75)
    expect(result.duration).toBe(20)
  })

  it('rejects unsupported durations and out-of-range amounts', () => {
    const result = decodeUrlToState('?dur=7&fx=3')
    expect(result.duration).toBeUndefined()
    expect(result.effectAmount).toBeUndefined()
  })

  it('ignores invalid color hex values', () => {
    const result = decodeUrlToState('?colors=ZZZ,FF0000')
    // Invalid hex filtered, only valid one kept — but < 2 valid so returns undefined
    expect(result.colors).toBeUndefined()
  })
})
