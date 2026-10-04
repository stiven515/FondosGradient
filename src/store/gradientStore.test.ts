import { describe, it, expect, beforeEach } from 'vitest'
import { useGradientStore } from './gradientStore'

// Reset store between tests
beforeEach(() => {
  useGradientStore.setState({
    isLooping: true,
  })
})

describe('isLooping', () => {
  it('starts as true', () => {
    expect(useGradientStore.getState().isLooping).toBe(true)
  })

  it('setLooping(false) sets it to false', () => {
    useGradientStore.getState().setLooping(false)
    expect(useGradientStore.getState().isLooping).toBe(false)
  })

  it('setLooping(true) sets it back to true', () => {
    useGradientStore.getState().setLooping(false)
    useGradientStore.getState().setLooping(true)
    expect(useGradientStore.getState().isLooping).toBe(true)
  })
})

describe('moveColor', () => {
  it('moves a color to a new index', () => {
    const colors = ['#111111', '#222222', '#333333'].map((hex, i) => ({ id: String(i), hex, locked: false }))
    useGradientStore.setState({ colors })
    useGradientStore.getState().moveColor(0, 2)
    expect(useGradientStore.getState().colors.map(c => c.id)).toEqual(['1', '2', '0'])
  })

  it('ignores out-of-range indices', () => {
    const colors = ['#111111', '#222222'].map((hex, i) => ({ id: String(i), hex, locked: false }))
    useGradientStore.setState({ colors })
    useGradientStore.getState().moveColor(0, 5)
    expect(useGradientStore.getState().colors.map(c => c.id)).toEqual(['0', '1'])
  })
})

describe('effectAmount and duration', () => {
  it('clamps effect amount to 0..1', () => {
    useGradientStore.getState().setEffectAmount(1.7)
    expect(useGradientStore.getState().effectAmount).toBe(1)
  })

  it('sets duration', () => {
    useGradientStore.getState().setDuration(20)
    expect(useGradientStore.getState().duration).toBe(20)
  })
})

describe('persist partialize', () => {
  it('partialize excludes history, historyIndex, isPlaying, isLooping', () => {
    const state = useGradientStore.getState()
    expect(state.colors).toBeDefined()
    expect(state.shader).toBeDefined()
    expect(state.parameters).toBeDefined()
    expect(state.effect).toBeDefined()
    expect(state.aspectRatio).toBeDefined()
  })
})
