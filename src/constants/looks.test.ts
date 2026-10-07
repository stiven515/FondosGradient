import { describe, it, expect, beforeEach } from 'vitest'
import { LOOKS } from './looks'
import { SHADER_TYPES } from './shaders'
import { VALID_EFFECTS, PARAM_KEYS, PARAM_RANGES } from './parameters'
import { useGradientStore } from '../store/gradientStore'

describe('LOOKS', () => {
  it('ships a varied set of looks with unique names', () => {
    expect(LOOKS.length).toBeGreaterThanOrEqual(8)
    expect(new Set(LOOKS.map(l => l.name)).size).toBe(LOOKS.length)
    expect(new Set(LOOKS.map(l => l.shader)).size).toBeGreaterThanOrEqual(5)
  })

  it.each(LOOKS.map(l => [l.name, l] as const))('%s is a valid design', (_name, look) => {
    expect(SHADER_TYPES).toContain(look.shader)
    expect(VALID_EFFECTS).toContain(look.effect)
    expect(look.colors.length).toBeGreaterThanOrEqual(2)
    expect(look.colors.length).toBeLessThanOrEqual(8)
    look.colors.forEach(hex => expect(hex).toMatch(/^#[0-9A-Fa-f]{6}$/))
    for (const key of PARAM_KEYS) {
      expect(look.parameters[key]).toBeGreaterThanOrEqual(PARAM_RANGES[key].min)
      expect(look.parameters[key]).toBeLessThanOrEqual(PARAM_RANGES[key].max)
    }
    expect(look.effectAmount).toBeGreaterThanOrEqual(0)
    expect(look.effectAmount).toBeLessThanOrEqual(1)
  })
})

describe('applyDesign', () => {
  beforeEach(() => {
    useGradientStore.setState({ aspectRatio: '16:9', duration: 20 })
  })

  it('applies a look and keeps the current aspect ratio and duration', () => {
    const look = LOOKS[1]
    useGradientStore.getState().applyDesign(look)
    const s = useGradientStore.getState()
    expect(s.shader).toBe(look.shader)
    expect(s.colors.map(c => c.hex)).toEqual(look.colors)
    expect(s.effect).toBe(look.effect)
    expect(s.effectAmount).toBe(look.effectAmount)
    expect(s.parameters).toEqual(look.parameters)
    expect(s.aspectRatio).toBe('16:9')
    expect(s.duration).toBe(20)
  })

  it('applies aspect ratio and duration when the design carries them', () => {
    useGradientStore.getState().applyDesign({ ...LOOKS[0], aspectRatio: '1:1', duration: 5 })
    const s = useGradientStore.getState()
    expect(s.aspectRatio).toBe('1:1')
    expect(s.duration).toBe(5)
  })

  it('unlocks colors and reuses existing ids so the palette does not remount', () => {
    const before = useGradientStore.getState().colors.map(c => c.id)
    useGradientStore.getState().applyDesign(LOOKS[0])
    const after = useGradientStore.getState().colors
    expect(after.slice(0, before.length).map(c => c.id)).toEqual(before.slice(0, after.length))
    expect(after.every(c => !c.locked)).toBe(true)
  })

  it('records history so a look can be undone', () => {
    const original = useGradientStore.getState().colors.map(c => c.hex)
    useGradientStore.getState().applyDesign(LOOKS[2])
    useGradientStore.getState().undo()
    expect(useGradientStore.getState().colors.map(c => c.hex)).toEqual(original)
  })
})
