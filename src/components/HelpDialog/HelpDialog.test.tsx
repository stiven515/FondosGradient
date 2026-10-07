import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { HelpDialog } from './index'
import { useUiStore } from '../../store/uiStore'

beforeEach(() => useUiStore.setState({ helpOpen: false }))

describe('HelpDialog', () => {
  it('renders nothing while closed', () => {
    render(<HelpDialog />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens as a labelled modal dialog and moves focus to the close button', () => {
    useUiStore.setState({ helpOpen: true })
    render(<HelpDialog />)
    expect(screen.getByRole('dialog', { name: /keyboard shortcuts/i })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('button', { name: /close help/i })).toHaveFocus()
  })

  it('closes from the close button and from the backdrop', () => {
    useUiStore.setState({ helpOpen: true })
    const { container } = render(<HelpDialog />)
    fireEvent.click(screen.getByRole('button', { name: /close help/i }))
    expect(useUiStore.getState().helpOpen).toBe(false)

    act(() => useUiStore.setState({ helpOpen: true }))
    fireEvent.mouseDown(container.firstElementChild!)
    expect(useUiStore.getState().helpOpen).toBe(false)
  })
})
