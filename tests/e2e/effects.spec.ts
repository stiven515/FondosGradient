import { test, expect } from '@playwright/test'
import {
  STATIC_SCENE, trackProblems, openApp, expectNoProblems, readFrame, readStrip,
  meanAbsDiff, luminanceSpread, equalNeighbourShare,
} from './helpers'

const STYLES = ['flow', 'beam', 'mesh', 'liquid', 'wave', 'silk', 'stripe', 'ribbon']
const POST_EFFECTS = ['glow', 'chromatic', 'glass', 'dither', 'halftone']

test.describe('styles', () => {
  for (const style of STYLES) {
    test(`${style} compiles on the GPU and renders a real image`, async ({ page }) => {
      const problems = trackProblems(page)
      await openApp(page, `shader=${style}&effect=none&grain=0&speed=0`)
      await expectNoProblems(page, problems)
      expect(luminanceSpread(await readFrame(page))).toBeGreaterThan(4)
    })
  }
})

test.describe('post-processing effects', () => {
  for (const effect of POST_EFFECTS) {
    test(`${effect} compiles, renders and visibly changes the image`, async ({ page }) => {
      const problems = trackProblems(page)
      await openApp(page, `${STATIC_SCENE}&effect=none`)
      const base = await readFrame(page)

      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=0.7`)
      await expectNoProblems(page, problems)
      const withEffect = await readFrame(page)

      expect(luminanceSpread(withEffect)).toBeGreaterThan(4)
      expect(meanAbsDiff(base, withEffect)).toBeGreaterThan(3)
    })

    test(`${effect} grows stronger with the intensity slider`, async ({ page }) => {
      await openApp(page, `${STATIC_SCENE}&effect=none`)
      const base = await readFrame(page)
      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=0.15`)
      const weak = meanAbsDiff(base, await readFrame(page))
      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=1`)
      const strong = meanAbsDiff(base, await readFrame(page))
      expect(strong).toBeGreaterThan(weak)
    })

    test(`${effect} keeps highlights from clipping to white`, async ({ page }) => {
      await openApp(page, `${STATIC_SCENE}&effect=none`)
      const base = await readFrame(page)
      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=1`)
      const frame = await readFrame(page)
      const mean = (f: typeof base) => f.data.reduce((s, v, i) => (i % 4 === 3 ? s : s + v), 0) / ((f.data.length / 4) * 3)
      expect(mean(frame)).toBeLessThan(mean(base) + 70)
    })
  }

  test('every effect works with the shaders that have their own grain code', async ({ page }) => {
    test.setTimeout(240_000)
    const problems = trackProblems(page)
    for (const style of ['flow', 'mesh', 'stripe']) {
      for (const effect of POST_EFFECTS) {
        await openApp(page, `shader=${style}&colors=0B1026,F72585,4CC9F0,FFD60A,FFFFFF&effect=${effect}&fx=0.6&speed=0&grain=0`)
        expect(luminanceSpread(await readFrame(page)), `${style} + ${effect}`).toBeGreaterThan(3)
      }
    }
    await expectNoProblems(page, problems)
  })

  test('switching effects in the UI never leaves a broken frame', async ({ page }) => {
    const problems = trackProblems(page)
    await openApp(page, `${STATIC_SCENE}&effect=none`)
    for (const name of ['Glow', 'Chroma', 'Glass', 'Dither', 'Halftone', 'Grain', 'None']) {
      await page.getByRole('button', { name, exact: true }).click()
      await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
      expect(luminanceSpread(await readFrame(page)), name).toBeGreaterThan(3)
    }
    await expectNoProblems(page, problems)
  })
})

test.describe('grain', () => {
  const FLAT = 'shader=mesh&colors=808080,808080&speed=0&effect=grain&grain=0.5'

  test('is fine-grained at normal sizes', async ({ page }) => {
    await page.setViewportSize({ width: 1100, height: 760 })
    await openApp(page, FLAT)
    expect(equalNeighbourShare(await readStrip(page))).toBeLessThan(0.3)
  })

  test('scales up with the canvas so large exports keep the same look', async ({ page }) => {
    await page.setViewportSize({ width: 1700, height: 1900 })
    await openApp(page, FLAT)
    const canvasHeight = await page.evaluate(() => document.querySelector('canvas')!.height)
    expect(canvasHeight).toBeGreaterThan(1300)
    expect(equalNeighbourShare(await readStrip(page))).toBeGreaterThan(0.35)
  })
})
