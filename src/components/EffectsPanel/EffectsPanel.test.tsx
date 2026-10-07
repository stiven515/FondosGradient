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
})
