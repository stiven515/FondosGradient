import { test, expect, type Page } from '@playwright/test'
import { trackProblems, expectNoProblems, luminanceSpread } from './helpers'

async function openLanding(page: Page) {
  await page.goto('/')
  await page.waitForFunction(() => {
    const c = document.querySelector('[data-section="hero"] canvas') as HTMLCanvasElement | null
    return !!c && c.width > 1
  })
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

async function readHero(page: Page, size = 120) {
  return page.evaluate(s => {
    const canvas = document.querySelector('[data-section="hero"] canvas') as HTMLCanvasElement
    const tmp = document.createElement('canvas')
    tmp.width = s
    tmp.height = s
    const ctx = tmp.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(canvas, 0, 0, s, s)
    return { data: Array.from(ctx.getImageData(0, 0, s, s).data), width: s, height: s }
  }, size)
}

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)

test.describe('landing', () => {
  test('renders the live hero with the page title and no errors', async ({ page }) => {
    const problems = trackProblems(page)
    await openLanding(page)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/gradient\s*studio/i)
    expect(luminanceSpread(await readHero(page))).toBeGreaterThan(4)
    await expectNoProblems(page, problems)
  })

  test('opens the studio from the call to action without touching a saved design', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gradient-studio-v1', JSON.stringify({ state: { shader: 'beam' }, version: 1 })))
    await openLanding(page)
    const before = await page.evaluate(() => localStorage.getItem('gradient-studio-v1'))

    await page.getByRole('button', { name: 'Open the studio' }).first().click()
    await expect(page.getByRole('img', { name: 'Animated gradient canvas' })).toBeVisible()
    await expect(page).toHaveURL(/#\/studio$/)
    await expect(page.getByRole('button', { name: 'Select style' })).toContainText('Beam')
    expect(await page.evaluate(() => localStorage.getItem('gradient-studio-v1'))).toContain('"shader":"beam"')
    expect(before).toContain('"shader":"beam"')
  })

  test('uses a view transition when the browser supports it', async ({ page }) => {
    await page.addInitScript(() => {
      const counter = window as unknown as { __vt: number }
      counter.__vt = 0
      const original = (document as unknown as { startViewTransition?: (cb: () => void) => unknown }).startViewTransition?.bind(document)
      if (original) {
        Object.defineProperty(document, 'startViewTransition', { configurable: true, value: (cb: () => void) => { counter.__vt++; return original(cb) } })
      }
    })
    await openLanding(page)
    const supported = await page.evaluate(() => typeof (document as unknown as { startViewTransition?: unknown }).startViewTransition === 'function')
    await page.getByRole('button', { name: 'Open the studio' }).first().click()
    await expect(page.getByRole('img', { name: 'Animated gradient canvas' })).toBeVisible()
    if (supported) expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(1)
  })

  test('skips the transition for people who prefer reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const problems = trackProblems(page)
    await page.addInitScript(() => {
      const counter = window as unknown as { __vt: number }
      counter.__vt = 0
      if ('startViewTransition' in document) {
        Object.defineProperty(document, 'startViewTransition', { configurable: true, value: () => { counter.__vt++ } })
      }
    })
    await openLanding(page)
    expect(luminanceSpread(await readHero(page))).toBeGreaterThan(4)
    await page.getByRole('button', { name: 'Open the studio' }).first().click()
    await expect(page.getByRole('img', { name: 'Animated gradient canvas' })).toBeVisible()
    expect(await page.evaluate(() => (window as unknown as { __vt: number }).__vt)).toBe(0)
    await expectNoProblems(page, problems)
  })

  test('goes back from the studio to the home page', async ({ page }) => {
    await openLanding(page)
    await page.getByRole('button', { name: 'Open the studio' }).first().click()
    await page.getByRole('button', { name: 'Back to the home page' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/gradient\s*studio/i)
  })

  test('remembers the chosen language across reloads', async ({ page }) => {
    await openLanding(page)
    await page.getByRole('button', { name: 'Español' }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Ocho estilos, un solo motor' })).toBeAttached()
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('lang', 'es')
    await expect(page.getByRole('button', { name: 'Abrir el estudio' }).first()).toBeVisible()
  })

  test('translates the studio as well', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('gradient-studio-lang', 'es'))
    await page.goto('/?shader=silk&effect=none&grain=0&speed=0')
    await page.waitForFunction(() => (document.querySelector('canvas')?.width ?? 0) > 1)
    await expect(page.getByRole('button', { name: 'Exportar imagen' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Elegir estilo' })).toContainText('Seda')
  })

  test('tracks the section being read and jumps to a section from the tab', async ({ page }) => {
    await openLanding(page)
    await expect(page.getByRole('img', { name: 'Section 1 of 4' })).toBeVisible()
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Effects' }).click()
    await expect(page.getByRole('img', { name: 'Section 3 of 4' })).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /Six effects/ })).toBeInViewport()
  })

  test('shows the style under the cursor in the central disc', async ({ page }) => {
    await openLanding(page)
    const card = page.getByRole('button', { name: /^Mesh/ })
    await card.scrollIntoViewIfNeeded()
    await card.hover()
    await expect(page.locator('[aria-live="polite"].sr-only')).toHaveText('Mesh')
  })

  test('every landing canvas compiles on the GPU', async ({ page }) => {
    const problems = trackProblems(page)
    await openLanding(page)
    for (const name of [/^Flow/, /^Beam/, /^Liquid/, /^Wave/, /^Silk/, /^Stripe/, /^Ribbon/]) {
      const card = page.getByRole('button', { name })
      await card.scrollIntoViewIfNeeded()
      await card.hover()
      await page.waitForTimeout(250)
    }
    await expectNoProblems(page, problems)
  })

  test('shows the real effect renders', async ({ page }) => {
    await openLanding(page)
    await page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'Effects' }).click()
    await expect(page.getByRole('heading', { level: 2, name: /Six effects/ })).toBeInViewport()
    await page.waitForFunction(() =>
      [...document.querySelectorAll('figure div')].some(el => (el as HTMLElement).style.background.includes('data:image')),
    )
    const rendered = await page.evaluate(() =>
      [...document.querySelectorAll('figure div')].filter(el => (el as HTMLElement).style.background.includes('data:image')).length,
    )
    expect(rendered).toBeGreaterThanOrEqual(1)
  })
})

test.describe('small screens', () => {
  test.use({ viewport: { width: 390, height: 844 } })

  test('the landing fits without sideways scrolling and keeps its action reachable', async ({ page }) => {
    const problems = trackProblems(page)
    await openLanding(page)
    expect(await noHorizontalScroll(page)).toBe(true)
    await expect(page.getByRole('button', { name: 'Open the studio' }).first()).toBeInViewport()
    await expect(page.getByRole('heading', { level: 1 })).toBeInViewport()
    await expectNoProblems(page, problems)
  })

  test('the landing sections stay inside the screen while scrolling', async ({ page }) => {
    await openLanding(page)
    for (const name of ['Styles', 'Effects', 'Export']) {
      const tab = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name })
      if (await tab.isVisible()) await tab.click()
    }
    const overflow = await page.evaluate(() => {
      const scroller = document.querySelector('.overflow-y-auto') as HTMLElement
      scroller.scrollTo({ top: scroller.scrollHeight })
      return scroller.scrollWidth > scroller.clientWidth + 1
    })
    expect(overflow).toBe(false)
  })

  test('the studio fits and starts with the controls collapsed', async ({ page }) => {
    const problems = trackProblems(page)
    await page.goto('/?shader=ribbon&effect=none&grain=0&speed=0')
    await page.waitForFunction(() => (document.querySelector('canvas')?.width ?? 0) > 1)
    expect(await noHorizontalScroll(page)).toBe(true)
    await expect(page.getByRole('button', { name: 'Expand controls' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Export image' })).toBeInViewport()
    await expectNoProblems(page, problems)
  })
})
