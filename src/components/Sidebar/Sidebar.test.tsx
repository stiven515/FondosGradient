import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Sidebar } from './index'
import { useGradientStore } from '../../store/gradientStore'

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
