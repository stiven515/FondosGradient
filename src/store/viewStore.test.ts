import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { initialView, useView, goTo } from './viewStore'

describe('initialView', () => {
  it('opens the landing page on a bare URL', () => {
    expect(initialView('', '')).toBe('landing')
    expect(initialView('?utm_source=news', '')).toBe('landing')
  })

  it('opens the studio for the studio hash', () => {
    expect(initialView('', '#/studio')).toBe('studio')
  })

  it.each(['shader', 'colors', 'effect', 'scale', 'speed', 'fx', 'dur', 'ar', 'grain', 'seed'])(
    'opens the studio when a shared design carries "%s"',
    key => { expect(initialView(`?${key}=1`, '')).toBe('studio') },
  )

  it('treats an unknown hash as the landing page', () => {
    expect(initialView('', '#/nope')).toBe('landing')
    expect(initialView('', '#about')).toBe('landing')
  })
})

describe('goTo', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/')
    useView.setState({ view: 'landing' })
  })
  afterEach(() => vi.unstubAllGlobals())

  it('updates the view and the URL hash', () => {
    goTo('studio')
    expect(useView.getState().view).toBe('studio')
    expect(window.location.hash).toBe('#/studio')
    goTo('landing')
    expect(useView.getState().view).toBe('landing')
    expect(window.location.hash).toBe('')
  })

  it('keeps the design in the query string when moving between views', () => {
    window.history.replaceState(null, '', '/?shader=silk')
    goTo('landing')
    expect(window.location.search).toBe('?shader=silk')
  })

  it('wraps the change in a view transition when the browser supports it', () => {
    const start = vi.fn((cb: () => void) => { cb() })
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q }))
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = start
    goTo('studio')
    expect(start).toHaveBeenCalledTimes(1)
    expect(useView.getState().view).toBe('studio')
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })

  it('skips the transition for people who prefer reduced motion', () => {
    const start = vi.fn((cb: () => void) => { cb() })
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), media: q }))
    ;(document as unknown as { startViewTransition: unknown }).startViewTransition = start
    goTo('studio')
    expect(start).not.toHaveBeenCalled()
    expect(useView.getState().view).toBe('studio')
    delete (document as unknown as { startViewTransition?: unknown }).startViewTransition
  })

  it('follows the browser back button', () => {
    goTo('studio')
    window.location.hash = ''
    window.dispatchEvent(new HashChangeEvent('hashchange'))
    expect(useView.getState().view).toBe('landing')
  })
})
