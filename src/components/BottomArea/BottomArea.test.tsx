import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BottomArea } from './index'
import { useGradientStore } from '../../store/gradientStore'
import { useUiStore } from '../../store/uiStore'
import { LOOKS } from '../../constants/looks'
import { en } from '../../i18n/en'
import { loadSaved } from '../../utils/savedDesigns'

beforeEach(() => {
  localStorage.clear()
  useUiStore.setState({ toasts: [] })
  useGradientStore.setState({ shader: 'flow', effect: 'grain', history: [], historyIndex: -1 })
})

async function openTab(user: ReturnType<typeof userEvent.setup>, name: RegExp) {
  await user.click(screen.getByRole('tab', { name }))
}

describe('BottomArea', () => {
  it('shows the palettes tab by default', () => {
    render(<BottomArea />)
    expect(screen.getByRole('tab', { name: /palettes/i })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Sunset' })).toBeInTheDocument()
  })

  it('applies a complete look: style, colors and effect', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    await openTab(user, /looks/i)
    const look = LOOKS.find(l => l.id === 'neon-halftone')!
    await user.click(screen.getByRole('button', { name: en[look.nameKey] }))
    const s = useGradientStore.getState()
    expect(s.shader).toBe(look.shader)
    expect(s.effect).toBe('halftone')
    expect(s.colors.map(c => c.hex)).toEqual(look.colors)
  })

  it('shows an empty state before anything is saved', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    await openTab(user, /saved/i)
    expect(screen.getByText(/no saved designs yet/i)).toBeInTheDocument()
  })

  it('saves the current design with a name, then loads it back', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    await openTab(user, /saved/i)
    useGradientStore.setState({ shader: 'wave', effect: 'glow', effectAmount: 0.9 })

    await user.type(screen.getByLabelText(/design name/i), 'My wave')
    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(loadSaved().map(s => s.name)).toEqual(['My wave'])
    expect(loadSaved()[0].design.shader).toBe('wave')
    expect(useUiStore.getState().toasts.map(t => t.message)).toContain('Design saved')

    useGradientStore.setState({ shader: 'flow', effect: 'none', effectAmount: 0.1 })
    await user.click(screen.getByRole('button', { name: 'My wave' }))
    const s = useGradientStore.getState()
    expect(s.shader).toBe('wave')
    expect(s.effect).toBe('glow')
    expect(s.effectAmount).toBe(0.9)
  })

  it('saves with Enter and clears the name field', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    await openTab(user, /saved/i)
    const input = screen.getByLabelText(/design name/i)
    await user.type(input, 'Quick{Enter}')
    expect(loadSaved().map(s => s.name)).toEqual(['Quick'])
    expect(input).toHaveValue('')
  })

  it('deletes a saved design', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    await openTab(user, /saved/i)
    await user.type(screen.getByLabelText(/design name/i), 'Temp{Enter}')
    await user.click(screen.getByRole('button', { name: /delete temp/i }))
    expect(loadSaved()).toEqual([])
    expect(screen.getByText(/no saved designs yet/i)).toBeInTheDocument()
  })

  it('keeps tab semantics: arrow keys move between tabs', async () => {
    const user = userEvent.setup()
    render(<BottomArea />)
    screen.getByRole('tab', { name: /palettes/i }).focus()
    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('tab', { name: /looks/i })).toHaveAttribute('aria-selected', 'true')
  })
})
