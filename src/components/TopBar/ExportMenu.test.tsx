import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExportMenu } from './ExportMenu'
import { useUiStore } from '../../store/uiStore'
import * as exportPng from '../../utils/exportPng'

beforeEach(() => {
  vi.restoreAllMocks()
  useUiStore.setState({ toasts: [] })
  exportPng.registerCanvas({ width: 1000, height: 500 } as HTMLCanvasElement)
})

describe('ExportMenu', () => {
  it('opens a menu with format and size choices and closes on Escape', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    const trigger = screen.getByRole('button', { name: /^export/i })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('radio', { name: 'PNG' })).toBeChecked()
    expect(screen.getByRole('radio', { name: 'Current' })).toBeChecked()
    await user.keyboard('{Escape}')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the output dimensions for the selected size', async () => {
    const user = userEvent.setup()
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    expect(screen.getByText('1000 × 500 px')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '2×' }))
    expect(screen.getByText('2000 × 1000 px')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: '4K' }))
    expect(screen.getByText('3840 × 1920 px')).toBeInTheDocument()
  })

  it('exports with the chosen options and confirms with a toast', async () => {
    const user = userEvent.setup()
    const spy = vi.spyOn(exportPng, 'exportImage').mockResolvedValue(true)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('radio', { name: 'WebP' }))
    await user.click(screen.getByRole('radio', { name: '2×' }))
    await user.click(screen.getByRole('button', { name: 'Download' }))
    expect(spy).toHaveBeenCalledWith('webp', '2x')
    expect(useUiStore.getState().toasts.map(t => t.message)).toEqual(['Image exported'])
  })

  it('reports a failed export with an error toast', async () => {
    const user = userEvent.setup()
    vi.spyOn(exportPng, 'exportImage').mockResolvedValue(false)
    render(<ExportMenu />)
    await user.click(screen.getByRole('button', { name: /^export/i }))
    await user.click(screen.getByRole('button', { name: 'Download' }))
    const [t] = useUiStore.getState().toasts
    expect(t.tone).toBe('error')
    expect(t.message).toMatch(/export failed/i)
  })
})
