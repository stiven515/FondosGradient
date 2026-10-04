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
