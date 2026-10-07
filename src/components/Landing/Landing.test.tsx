import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Landing } from './index'
import { useView } from '../../store/viewStore'
import { useGradientStore } from '../../store/gradientStore'
import { useUiStore } from '../../store/uiStore'
import { useLang } from '../../i18n'
import { en } from '../../i18n/en'
import { es } from '../../i18n/es'
import { SHADER_TYPES } from '../../constants/shaders'
import { REPO_URL } from './landingConfig'

const TOPS: Record<string, number> = { hero: 0, styles: 700, effects: 1500, export: 2400 }

beforeEach(() => {
  localStorage.clear()
  window.history.replaceState(null, '', '/')
  useView.setState({ view: 'landing' })
  useLang.setState({ lang: 'en' })
  useUiStore.setState({ toasts: [] })
  Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo
})
afterEach(() => vi.restoreAllMocks())

describe('Landing content', () => {
  it('opens with the product name as the page title and the tagline under it', () => {
    render(<Landing />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/gradient\s*studio/i)
    expect(screen.getByText(en['hero.tagline'])).toBeInTheDocument()
  })

  it('presents each part of the pitch under its own heading', () => {
    render(<Landing />)
    for (const key of ['styles.title', 'effects.title', 'export.title', 'close.title'] as const) {
      expect(screen.getByRole('heading', { level: 2, name: en[key] })).toBeInTheDocument()
    }
  })

  it('lists every style with its description', () => {
    render(<Landing />)
    for (const type of SHADER_TYPES) {
      expect(screen.getByRole('button', { name: new RegExp(`^${en[`style.${type}`]}`) })).toBeInTheDocument()
    }
  })

  it('shows the real CSS the studio generates, with the hero palette', () => {
    render(<Landing />)
    const code = screen.getByText(/background-color: #0E2A33;/)
    expect(code.textContent?.match(/radial-gradient/g)).toHaveLength(6)
  })

  it('names the four ways out without inventing numbers or customers', () => {
    render(<Landing />)
    for (const key of ['export.image.title', 'export.video.title', 'export.css.title', 'export.link.title'] as const) {
      expect(screen.getByRole('heading', { level: 3, name: en[key] })).toBeInTheDocument()
    }
    expect(document.body.textContent).not.toMatch(/\d+\s*(users|customers|downloads|usuarios|clientes)/i)
  })

  it('links to the source repository safely', () => {
    render(<Landing />)
    const link = screen.getByRole('link', { name: en['footer.source'] })
    expect(link).toHaveAttribute('href', REPO_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toContain('noreferrer')
  })
})

describe('Landing actions', () => {
  it('opens the studio from the top-right action', async () => {
    render(<Landing />)
    await userEvent.setup().click(screen.getAllByRole('button', { name: en['cta.open'] })[0])
    expect(useView.getState().view).toBe('studio')
    expect(window.location.hash).toBe('#/studio')
  })

  it('opens the studio from the closing action too', async () => {
    render(<Landing />)
    const buttons = screen.getAllByRole('button', { name: en['cta.open'] })
    expect(buttons.length).toBeGreaterThanOrEqual(2)
    await userEvent.setup().click(buttons[buttons.length - 1])
    expect(useView.getState().view).toBe('studio')
  })

  it('scrolls to a section from the navigation tab', async () => {
    render(<Landing />)
    const nav = screen.getByRole('navigation', { name: en['nav.label'] })
    await userEvent.setup().click(within(nav).getByRole('button', { name: en['nav.effects'] }))
    expect(Element.prototype.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number) }))
  })

  it('copies the CSS and confirms with a toast', async () => {
    const user = userEvent.setup() // installs its own clipboard, so the stub goes in afterwards
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    render(<Landing />)
    await user.click(screen.getByRole('button', { name: en['export.copyCode'] }))
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('background-color: #0E2A33;'))
    expect(useUiStore.getState().toasts.map(t => t.message)).toContain(en['toast.cssCopied'])
  })

  it('reports a clipboard that is not available', async () => {
    const user = userEvent.setup()
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockRejectedValue(new Error('no')) }, configurable: true })
    render(<Landing />)
    await user.click(screen.getByRole('button', { name: en['export.copyCode'] }))
    expect(useUiStore.getState().toasts.some(t => t.tone === 'error')).toBe(true)
  })

  it('shows which style the disc is rendering when one is hovered', async () => {
    render(<Landing />)
    const user = userEvent.setup()
    const live = document.querySelector('[aria-live="polite"].sr-only')!
    expect(live).toHaveTextContent(en['style.ribbon'])
    await user.hover(screen.getByRole('button', { name: new RegExp(`^${en['style.mesh']}`) }))
    expect(live).toHaveTextContent(en['style.mesh'])
  })
})

describe('Landing language', () => {
  it('switches the whole page between English and Spanish', async () => {
    render(<Landing />)
    const user = userEvent.setup()
    expect(screen.getByText(en['hero.tagline'])).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: es['lang.name'] }))
    expect(screen.getByText(es['hero.tagline'])).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: es['styles.title'] })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('es')

    await user.click(screen.getByRole('button', { name: en['lang.name'] }))
    expect(screen.getByText(en['hero.tagline'])).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('marks the active language for assistive tech', async () => {
    render(<Landing />)
    expect(screen.getByRole('button', { name: en['lang.name'] })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: es['lang.name'] })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('Landing never touches the visitor’s design', () => {
  it('leaves the saved design and storage untouched through a full visit', async () => {
    const before = JSON.stringify(useGradientStore.getState().colors) + useGradientStore.getState().shader
    const stored = localStorage.getItem('gradient-studio-v1')
    render(<Landing />)
    const user = userEvent.setup()
    await user.hover(screen.getByRole('button', { name: new RegExp(`^${en['style.liquid']}`) }))
    await user.click(screen.getByRole('button', { name: new RegExp(`^${en['style.wave']}`) }))
    expect(JSON.stringify(useGradientStore.getState().colors) + useGradientStore.getState().shader).toBe(before)
    expect(localStorage.getItem('gradient-studio-v1')).toBe(stored)
  })
})

describe('Landing scroll tracking', () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
      configurable: true,
      get(this: HTMLElement) { return TOPS[this.dataset.section ?? ''] ?? 0 },
    })
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return 800 } })
    Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get() { return 600 } })
  })
  afterEach(() => {
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetTop
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).offsetHeight
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).clientHeight
  })

  it('starts on section 1 of 4', () => {
    render(<Landing />)
    expect(screen.getByRole('img', { name: 'Section 1 of 4' })).toBeInTheDocument()
  })

  it('moves the counter and the active tab as the page scrolls, and writes progress for the layers', async () => {
    render(<Landing />)
    const scroller = document.querySelector('.overflow-y-auto') as HTMLElement
    scroller.scrollTop = 1400
    act(() => { fireEvent.scroll(scroller) })

    await waitFor(() => expect(screen.getByRole('img', { name: 'Section 3 of 4' })).toBeInTheDocument())
    const nav = screen.getByRole('navigation', { name: en['nav.label'] })
    expect(within(nav).getByRole('button', { name: en['nav.effects'] })).toHaveAttribute('aria-current', 'true')
    expect(within(nav).getByRole('button', { name: en['nav.styles'] })).not.toHaveAttribute('aria-current')
    expect(scroller.style.getPropertyValue('--hero-p')).toBe('1.0000')
    expect(Number(scroller.style.getPropertyValue('--p-effects'))).toBeGreaterThan(0)
  })

  it('hides the "scroll to discover" hint once the visitor has left the first screen', async () => {
    render(<Landing />)
    const hint = screen.getByText(en['hud.scroll'])
    expect(hint).toHaveStyle({ opacity: '1' })
    const scroller = document.querySelector('.overflow-y-auto') as HTMLElement
    scroller.scrollTop = 900
    act(() => { fireEvent.scroll(scroller) })
    await waitFor(() => expect(hint).toHaveStyle({ opacity: '0' }))
  })
})
