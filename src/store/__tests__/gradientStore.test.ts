// src/store/__tests__/gradientStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { act } from '@testing-library/react'
import { useGradientStore, DEFAULT_PARAMETERS } from '../gradientStore'

const INITIAL_COLORS = [
  { id: 'c1', hex: '#FFE7F0', locked: false },
  { id: 'c2', hex: '#EAB5E6', locked: false },
  { id: 'c3', hex: '#E2D3E4', locked: false },
  { id: 'c4', hex: '#E0A5DA', locked: false },
  { id: 'c5', hex: '#F6A7D6', locked: false },
]

beforeEach(() => {
  act(() => {
    useGradientStore.setState({
      colors: INITIAL_COLORS,
      shader: 'flow',
      parameters: { ...DEFAULT_PARAMETERS },
      isPlaying: true,
      history: [],
      historyIndex: -1,
    })
  })
})

describe('color management', () => {
  it('updates a color by id', () => {
    act(() => { useGradientStore.getState().updateColor('c1', '#FF0000') })
    expect(useGradientStore.getState().colors.find(c => c.id === 'c1')?.hex).toBe('#FF0000')
  })

  it('adds a color', () => {
    act(() => { useGradientStore.getState().addColor() })
    expect(useGradientStore.getState().colors).toHaveLength(6)
  })

  it('does not exceed 8 colors', () => {
    act(() => {
      for (let i = 0; i < 5; i++) useGradientStore.getState().addColor()
    })
    expect(useGradientStore.getState().colors.length).toBeLessThanOrEqual(8)
  })

  it('removes a color', () => {
    act(() => { useGradientStore.getState().removeColor('c5') })
    expect(useGradientStore.getState().colors).toHaveLength(4)
  })

  it('does not remove below 2 colors', () => {
    act(() => {
      useGradientStore.getState().removeColor('c3')
      useGradientStore.getState().removeColor('c4')
      useGradientStore.getState().removeColor('c5')
      const ids = useGradientStore.getState().colors.map(c => c.id)
      useGradientStore.getState().removeColor(ids[0])
    })
    expect(useGradientStore.getState().colors.length).toBeGreaterThanOrEqual(2)
  })

  it('toggles lock on a color', () => {
    act(() => { useGradientStore.getState().toggleLock('c1') })
    expect(useGradientStore.getState().colors.find(c => c.id === 'c1')?.locked).toBe(true)
  })
})

describe('shader and parameters', () => {
  it('sets shader', () => {
    act(() => { useGradientStore.getState().setShader('mesh') })
    expect(useGradientStore.getState().shader).toBe('mesh')
  })

  it('sets parameter', () => {
    act(() => { useGradientStore.getState().setParameter('scale', 2.5) })
    expect(useGradientStore.getState().parameters.scale).toBe(2.5)
  })
})

describe('undo / redo', () => {
  it('undo restores previous state', () => {
    act(() => {
      useGradientStore.getState().pushHistory()
      useGradientStore.getState().setParameter('scale', 3.0)
    })
    act(() => { useGradientStore.getState().undo() })
    expect(useGradientStore.getState().parameters.scale).toBe(DEFAULT_PARAMETERS.scale)
  })

  it('redo reapplies undone state', () => {
    act(() => {
      useGradientStore.getState().pushHistory()
      useGradientStore.getState().setParameter('scale', 3.0)
    })
    act(() => { useGradientStore.getState().undo() })
    act(() => { useGradientStore.getState().redo() })
    expect(useGradientStore.getState().parameters.scale).toBe(3.0)
  })
})
