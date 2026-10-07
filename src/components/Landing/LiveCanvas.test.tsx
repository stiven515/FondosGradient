import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { LiveCanvas } from './LiveCanvas'

const COLORS = ['#112233', '#445566', '#778899']

describe('LiveCanvas without WebGL', () => {
  it('falls back to a gradient of the palette instead of an empty box', async () => {
    const { container } = render(<LiveCanvas shader="ribbon" colors={COLORS} />)
    const canvas = container.querySelector('canvas')!
    await waitFor(() => expect(canvas.style.background).toContain('linear-gradient'))
    for (const hex of COLORS) expect(canvas.style.background).toContain(hex)
  })

  it('is decorative unless it is given a label', () => {
    const { container, rerender } = render(<LiveCanvas shader="flow" colors={COLORS} />)
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('canvas')).not.toHaveAttribute('role')

    rerender(<LiveCanvas shader="flow" colors={COLORS} label="Live preview" />)
    expect(screen.getByRole('img', { name: 'Live preview' })).toBeInTheDocument()
    expect(container.querySelector('canvas')).not.toHaveAttribute('aria-hidden')
  })

  it('survives a style change and unmounting without throwing', () => {
    const { rerender, unmount } = render(<LiveCanvas shader="flow" colors={COLORS} />)
    expect(() => rerender(<LiveCanvas shader="mesh" colors={COLORS} effect="glow" />)).not.toThrow()
    expect(() => unmount()).not.toThrow()
  })

  it('fills its container', () => {
    const { container } = render(<LiveCanvas shader="flow" colors={COLORS} className="rounded" />)
    const canvas = container.querySelector('canvas')!
    expect(canvas.className).toContain('h-full')
    expect(canvas.className).toContain('w-full')
    expect(canvas.className).toContain('rounded')
  })
})
