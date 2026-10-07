import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Sidebar } from './index'
import { useGradientStore } from '../../store/gradientStore'
import { useUiStore } from '../../store/uiStore'
import * as paletteFromFile from '../../utils/paletteFromFile'

const COLORS = ['#111111', '#222222', '#333333'].map((hex, i) => ({ id: `c${i}`, hex, locked: false }))

beforeEach(() => {
  useGradientStore.setState({ colors: COLORS, history: [], historyIndex: -1 })
})

const dataTransfer = { effectAllowed: '', setData: () => {} }
const hexes = () => useGradientStore.getState().colors.map(c => c.hex)

describe('Sidebar palette', () => {
  it('reorders colors by dragging a handle onto another row and records history', () => {
    render(<Sidebar />)
    const handles = screen.getAllByTitle('Drag to reorder')
    const targetRow = handles[2].parentElement!
    fireEvent.dragStart(handles[0], { dataTransfer })
    fireEvent.dragOver(targetRow)
    fireEvent.drop(targetRow)
    expect(hexes()).toEqual(['#222222', '#333333', '#111111'])
    expect(useGradientStore.getState().history).toHaveLength(1)
  })

  it('does nothing when dropping a color on itself', () => {
    render(<Sidebar />)
    const handles = screen.getAllByTitle('Drag to reorder')
    fireEvent.dragStart(handles[1], { dataTransfer })
    fireEvent.drop(handles[1].parentElement!)
    expect(hexes()).toEqual(['#111111', '#222222', '#333333'])
    expect(useGradientStore.getState().history).toHaveLength(0)
  })

  it('makes add and remove undoable', () => {
    render(<Sidebar />)
    fireEvent.click(screen.getByRole('button', { name: 'Add color' }))
    expect(useGradientStore.getState().colors).toHaveLength(4)
    useGradientStore.getState().undo()
    expect(useGradientStore.getState().colors).toHaveLength(3)
  })
})

describe('Sidebar palette from image', () => {
  const file = () => new File(['x'], 'photo.png', { type: 'image/png' })
  const choose = (f: File) => fireEvent.change(screen.getByLabelText('Palette image'), { target: { files: [f] } })

  beforeEach(() => useUiStore.setState({ toasts: [] }))

  it('replaces the palette with colors extracted from the chosen image and records history', async () => {
    vi.spyOn(paletteFromFile, 'paletteFromFile').mockResolvedValue(['#101010', '#404040', '#808080'])
    render(<Sidebar />)
    choose(file())
    await waitFor(() => expect(hexes()).toEqual(['#101010', '#404040', '#808080']))
    expect(useGradientStore.getState().history).toHaveLength(1)
    expect(useUiStore.getState().toasts.map(t => t.message)).toContain('Palette extracted from image')
  })

  it('keeps the current palette when the image has too little color variety', async () => {
    vi.spyOn(paletteFromFile, 'paletteFromFile').mockResolvedValue(['#101010'])
    render(<Sidebar />)
    choose(file())
    await waitFor(() => expect(useUiStore.getState().toasts.some(t => t.tone === 'error')).toBe(true))
    expect(hexes()).toEqual(['#111111', '#222222', '#333333'])
    expect(useGradientStore.getState().history).toHaveLength(0)
  })

  it('reports an unreadable image without touching the palette', async () => {
    vi.spyOn(paletteFromFile, 'paletteFromFile').mockRejectedValue(new Error('decode'))
    render(<Sidebar />)
    choose(file())
    await waitFor(() => expect(useUiStore.getState().toasts.some(t => /could not read/i.test(t.message))).toBe(true))
    expect(hexes()).toEqual(['#111111', '#222222', '#333333'])
  })
})
