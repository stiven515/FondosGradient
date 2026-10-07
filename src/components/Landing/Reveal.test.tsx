import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { Reveal } from './Reveal'

type Callback = (entries: Partial<IntersectionObserverEntry>[]) => void
let callbacks: Callback[] = []
let options: IntersectionObserverInit[] = []
const disconnect = vi.fn()

beforeEach(() => {
  callbacks = []
  options = []
  disconnect.mockClear()
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: Callback, opts: IntersectionObserverInit) { callbacks.push(cb); options.push(opts) }
    observe() {}
    unobserve() {}
    disconnect = disconnect
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('Reveal', () => {
  it('shows its content from the start, before anything is observed', () => {
    render(<Reveal>hello</Reveal>)
    const el = screen.getByText('hello')
    expect(el).toBeVisible()
    expect(el.dataset.in).toBeUndefined()
    expect(el.style.opacity).toBe('')
  })

  it('arms the entrance only when the element is about to enter the viewport', () => {
    render(<Reveal>hello</Reveal>)
    const el = screen.getByText('hello')
    act(() => callbacks[0]([{ isIntersecting: false }]))
    expect(el.dataset.in).toBeUndefined()
    act(() => callbacks[0]([{ isIntersecting: true }]))
    expect(el.dataset.in).toBe('true')
  })

  it('starts the entrance slightly before the element is on screen', () => {
    render(<Reveal>hello</Reveal>)
    expect(options[0].rootMargin).toMatch(/^0px 0px \d+% 0px$/)
  })

  it('plays once, then stops observing', () => {
    render(<Reveal>hello</Reveal>)
    act(() => callbacks[0]([{ isIntersecting: true }]))
    expect(disconnect).toHaveBeenCalled()
  })

  it('passes the delay to CSS and forwards attributes and the element type', () => {
    render(<Reveal as="h2" delay={0.25} id="x" className="big">title</Reveal>)
    const el = screen.getByRole('heading', { name: 'title' })
    expect(el.tagName).toBe('H2')
    expect(el.id).toBe('x')
    expect(el.className).toContain('reveal')
    expect(el.className).toContain('big')
    expect(el.style.getPropertyValue('--d')).toBe('0.25s')
  })

  it('stops observing when it unmounts', () => {
    const { unmount } = render(<Reveal>hello</Reveal>)
    unmount()
    expect(disconnect).toHaveBeenCalled()
  })
})
