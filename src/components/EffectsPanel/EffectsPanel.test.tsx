import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffectsPanel } from './index'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'

beforeEach(() => {
  useGradientStore.setState({ effect: 'none', effectAmount: 0.5, parameters: { ...DEFAULT_PARAMETERS, grain: 0 } })
})

describe('EffectsPanel', () => {
  it('enables every effect button', () => {
    render(<EffectsPanel />)
    for (const name of ['None', 'Grain', 'Glow', 'Chroma', 'Glass', 'Dither', 'Halftone']) {
      expect(screen.getByRole('button', { name: new RegExp(name, 'i') })).toBeEnabled()
    }
  })

  it('shows the intensity slider only for post-process effects', async () => {
    const user = userEvent.setup()
    render(<EffectsPanel />)
    expect(screen.queryByLabelText('Intensity')).toBeNull()
    await user.click(screen.getByRole('button', { name: /glow/i }))
    expect(useGradientStore.getState().effect).toBe('glow')
    expect(screen.getByLabelText('Intensity')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /grain/i }))
    expect(screen.queryByLabelText('Intensity')).toBeNull()
  })

  it('names each effect button by its label only, so the decorative icon is not read out', () => {
    render(<EffectsPanel />)
    for (const name of ['None', 'Grain', 'Glow', 'Chroma', 'Glass', 'Dither', 'Halftone']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('exposes which effect is active to assistive tech', async () => {
    const user = userEvent.setup()
    render(<EffectsPanel />)
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Glass' }))
    expect(screen.getByRole('button', { name: 'Glass' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'None' })).toHaveAttribute('aria-pressed', 'false')
  })
})
