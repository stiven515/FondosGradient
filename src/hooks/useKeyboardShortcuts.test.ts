import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { fireEvent } from '@testing-library/react'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'
import { useGradientStore } from '../store/gradientStore'
import { useUiStore } from '../store/uiStore'
import { SHADER_TYPES } from '../constants/shaders'

const hexes = () => useGradientStore.getState().colors.map(c => c.hex).join()

beforeEach(() => {
  useGradientStore.setState({ isPlaying: true, shader: 'flow', history: [], historyIndex: -1 })
  useUiStore.setState({ helpOpen: false, toasts: [] })
})

function setup() { return renderHook(() => useKeyboardShortcuts()) }

describe('useKeyboardShortcuts', () => {
  it('Space toggles play/pause instead of regenerating the palette', () => {
    setup()
    const before = hexes()
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(useGradientStore.getState().isPlaying).toBe(false)
    expect(hexes()).toBe(before)
    fireEvent.keyDown(window, { code: 'Space', key: ' ' })
    expect(useGradientStore.getState().isPlaying).toBe(true)
  })

  it('G generates a new palette and records history', () => {
    setup()
    const before = hexes()
    fireEvent.keyDown(window, { key: 'g' })
    expect(hexes()).not.toBe(before)
    expect(useGradientStore.getState().history).toHaveLength(1)
  })

  it('S cycles to the next style and wraps around', () => {
    setup()
    fireEvent.keyDown(window, { key: 's' })
    expect(useGradientStore.getState().shader).toBe(SHADER_TYPES[1])
    useGradientStore.setState({ shader: SHADER_TYPES[SHADER_TYPES.length - 1] })
    fireEvent.keyDown(window, { key: 's' })
    expect(useGradientStore.getState().shader).toBe(SHADER_TYPES[0])
  })

  it('does not hijack Tab so keyboard navigation keeps working', () => {
    setup()
    const notPrevented = fireEvent.keyDown(window, { key: 'Tab' })
    expect(notPrevented).toBe(true)
    expect(useGradientStore.getState().shader).toBe('flow')
  })

  it('? opens the help dialog and Escape closes it', () => {
    setup()
    fireEvent.keyDown(window, { key: '?' })
    expect(useUiStore.getState().helpOpen).toBe(true)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(useUiStore.getState().helpOpen).toBe(false)
  })

  it('ignores shortcuts while typing in an input', () => {
    setup()
    const input = document.createElement('input')
    document.body.appendChild(input)
    fireEvent.keyDown(input, { key: 'g' })
    fireEvent.keyDown(input, { code: 'Space', key: ' ' })
    expect(useGradientStore.getState().history).toHaveLength(0)
    expect(useGradientStore.getState().isPlaying).toBe(true)
    input.remove()
  })

  it('Space on a focused button is left to activate the button', () => {
    setup()
    const button = document.createElement('button')
    document.body.appendChild(button)
    const notPrevented = fireEvent.keyDown(button, { code: 'Space', key: ' ' })
    expect(notPrevented).toBe(true)
    expect(useGradientStore.getState().isPlaying).toBe(true)
    button.remove()
  })

  it('ignores plain-letter shortcuts when Ctrl or Meta is held', () => {
    setup()
    fireEvent.keyDown(window, { key: 'g', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'p', metaKey: true })
    expect(useGradientStore.getState().history).toHaveLength(0)
    expect(useGradientStore.getState().isPlaying).toBe(true)
  })

  it('Ctrl+Z undoes and Ctrl+Shift+Z / Ctrl+Y redo', () => {
    setup()
    const original = hexes()
    useGradientStore.getState().pushHistory()
    useGradientStore.getState().setColors(useGradientStore.getState().colors.map(c => ({ ...c, hex: '#000000' })))
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(hexes()).toBe(original)
    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true })
    expect(hexes()).toContain('#000000')
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(hexes()).toContain('#000000')
  })
})
