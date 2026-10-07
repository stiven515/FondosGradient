import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorBoundary } from './index'

function Boom(): never {
  throw new Error('kaboom')
}

let reload: ReturnType<typeof vi.fn>

beforeEach(() => {
  reload = vi.fn()
  vi.stubGlobal('location', { ...window.location, reload })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  localStorage.clear()
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('ErrorBoundary', () => {
  it('renders its children when nothing fails', () => {
    render(<ErrorBoundary><p>all good</p></ErrorBoundary>)
    expect(screen.getByText('all good')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows a recovery screen instead of a blank page when a child throws', () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong/i)
    expect(screen.getByRole('button', { name: /^reload$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset and reload/i })).toBeInTheDocument()
  })

  it('reloads the page without touching saved data', async () => {
    localStorage.setItem('gradient-studio-v1', '{"keep":true}')
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    await userEvent.setup().click(screen.getByRole('button', { name: /^reload$/i }))
    expect(reload).toHaveBeenCalledTimes(1)
    expect(localStorage.getItem('gradient-studio-v1')).toBe('{"keep":true}')
  })

  it('can reset the app state and reload when saved data keeps crashing it', async () => {
    localStorage.setItem('gradient-studio-v1', '{"bad":true}')
    localStorage.setItem('gradient-studio-saved-v1', '[]')
    localStorage.setItem('unrelated-key', 'stay')
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    await userEvent.setup().click(screen.getByRole('button', { name: /reset and reload/i }))
    expect(localStorage.getItem('gradient-studio-v1')).toBeNull()
    expect(localStorage.getItem('gradient-studio-saved-v1')).toBeNull()
    expect(localStorage.getItem('unrelated-key')).toBe('stay')
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('still reloads if storage is unavailable while resetting', async () => {
    render(<ErrorBoundary><Boom /></ErrorBoundary>)
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked') })
    await userEvent.setup().click(screen.getByRole('button', { name: /reset and reload/i }))
    expect(reload).toHaveBeenCalledTimes(1)
  })
})
