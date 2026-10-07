import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Toaster } from './index'
import { useUiStore, toast } from '../../store/uiStore'

beforeEach(() => { vi.useFakeTimers(); useUiStore.setState({ toasts: [] }) })
afterEach(() => vi.useRealTimers())

describe('Toaster', () => {
  it('shows a toast and removes it after its lifetime', () => {
    render(<Toaster />)
    act(() => { toast('Link copied') })
    expect(screen.getByText('Link copied')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2600) })
    expect(screen.queryByText('Link copied')).toBeNull()
  })

  it('keeps error toasts visible longer than info toasts', () => {
    render(<Toaster />)
    act(() => { toast('Export failed', 'error') })
    act(() => { vi.advanceTimersByTime(2600) })
    expect(screen.getByText('Export failed')).toBeInTheDocument()
    act(() => { vi.advanceTimersByTime(2600) })
    expect(screen.queryByText('Export failed')).toBeNull()
  })

  it('shows at most three toasts at once, dropping the oldest', () => {
    render(<Toaster />)
    act(() => { ['a', 'b', 'c', 'd'].forEach(m => toast(m)) })
    expect(screen.queryByText('a')).toBeNull()
    expect(screen.getByText('d')).toBeInTheDocument()
  })
})
