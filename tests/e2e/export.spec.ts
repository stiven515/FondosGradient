import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import {
  STATIC_SCENE, trackProblems, openApp, expectNoProblems, stubClipboard, copiedText, supportsVideoRecording,
} from './helpers'

const canvasSize = (page: Page) =>
  page.evaluate(() => { const c = document.querySelector('canvas')!; return { w: c.width, h: c.height } })

function pngSize(path: string) {
  const bytes = readFileSync(path)
  expect(bytes.subarray(1, 4).toString()).toBe('PNG')
  return { w: bytes.readUInt32BE(16), h: bytes.readUInt32BE(20) }
}

const imageSize = (page: Page, name: string) =>
  page.getByRole('radiogroup', { name: 'Size', exact: true }).getByRole('radio', { name })

async function openExportMenu(page: Page) {
  await page.getByRole('button', { name: 'Export image' }).click()
}

test.describe('export', () => {
  test('downloads a PNG at the on-screen size and restores the preview afterwards', async ({ page }) => {
    const problems = trackProblems(page)
    await openApp(page, `${STATIC_SCENE}&effect=glow&fx=0.5`)
    const before = await canvasSize(page)

    await openExportMenu(page)
    await imageSize(page, 'Screen').check({ force: true })
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^gradient-studio-\d+\.png$/)
    expect(pngSize(await download.path())).toEqual(before)
    await expect(page.getByText('Image exported')).toBeVisible()

    await expect.poll(() => canvasSize(page)).toEqual(before)
    await expectNoProblems(page, problems)
  })

  test('exports at a named size without changing the shape of the canvas', async ({ page }) => {
    const problems = trackProblems(page)
    await openApp(page, `${STATIC_SCENE}&effect=glow&fx=0.5`)
    const before = await canvasSize(page)

    await openExportMenu(page)
    await imageSize(page, 'HD').check({ force: true })
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ])

    const size = pngSize(await download.path())
    expect(Math.max(size.w, size.h)).toBe(1920)
    expect(size.w / size.h).toBeCloseTo(before.w / before.h, 2)
    await expect.poll(() => canvasSize(page)).toEqual(before)
    await expectNoProblems(page, problems)
  })

  test('exports at a size typed by the person, exactly', async ({ page }) => {
    const problems = trackProblems(page)
    await openApp(page, `${STATIC_SCENE}&effect=grain&fx=0.5`)
    const before = await canvasSize(page)

    await openExportMenu(page)
    await page.getByRole('radio', { name: 'Custom' }).check({ force: true })
    await page.getByRole('checkbox', { name: 'Keep ratio' }).uncheck()
    await page.getByRole('spinbutton', { name: 'Width' }).fill('1080')
    await page.getByRole('spinbutton', { name: 'Height' }).fill('1920')
    await expect(page.getByText('1080 × 1920 px')).toBeVisible()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ])

    expect(pngSize(await download.path())).toEqual({ w: 1080, h: 1920 })
    await expect.poll(() => canvasSize(page)).toEqual(before)
    await expectNoProblems(page, problems)
  })

  test('exports every post effect without errors', async ({ page }) => {
    const problems = trackProblems(page)
    for (const effect of ['glow', 'chromatic', 'glass', 'dither', 'halftone']) {
      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=0.6`)
      await openExportMenu(page)
      // On-screen size: the point here is that every effect compiles and exports, not how large the file is.
      await imageSize(page, 'Screen').check({ force: true })
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Download' }).click(),
      ])
      const { w, h } = pngSize(await download.path())
      expect(w, effect).toBeGreaterThan(100)
      expect(h, effect).toBeGreaterThan(100)
    }
    await expectNoProblems(page, problems)
  })

  test('exports a JPG', async ({ page }) => {
    await openApp(page, `${STATIC_SCENE}&effect=none`)
    await openExportMenu(page)
    await page.getByRole('radio', { name: 'JPG' }).check({ force: true })
    await page.getByRole('slider', { name: 'Quality' }).fill('80')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/\.jpg$/)
    expect(readFileSync(await download.path()).subarray(0, 2).toString('hex')).toBe('ffd8')
  })

  test('records one loop as a playable video, or hides the option where the browser cannot', async ({ page }) => {
    test.setTimeout(60_000)
    const problems = trackProblems(page)
    await openApp(page, `shader=mesh&effect=glass&fx=0.5&dur=5`)
    await openExportMenu(page)
    const record = page.getByRole('button', { name: 'Record loop (5s)' })

    if (!(await supportsVideoRecording(page))) {
      await expect(record).toHaveCount(0)
      await expectNoProblems(page, problems)
      return
    }

    // Assert on what the app hands to the browser (blob + file name) rather than on a real download:
    // desktop Chrome can hold large downloads for a safety scan, which makes the saved file unreliable to read.
    await page.evaluate(() => {
      const w = window as unknown as { __saved: { name: string; type: string; size: number }[]; __lastBlob: { type: string; size: number } }
      w.__saved = []
      const create = URL.createObjectURL.bind(URL)
      URL.createObjectURL = (b: Blob | MediaSource) => { w.__lastBlob = { type: (b as Blob).type, size: (b as Blob).size }; return create(b) }
      HTMLAnchorElement.prototype.click = function () { if (this.download) w.__saved.push({ name: this.download, ...w.__lastBlob }) }
    })
    // The on-screen size keeps the real-time recording light for software-rendered CI browsers.
    await page.getByRole('radiogroup', { name: 'Video size' }).getByRole('radio', { name: 'Screen' }).check({ force: true })
    await page.getByRole('radio', { name: '30 fps' }).check({ force: true })
    await record.click()
    await expect.poll(
      () => page.evaluate(() => (window as unknown as { __saved: unknown[] }).__saved.length),
      { timeout: 30_000 },
    ).toBe(1)

    const [saved] = await page.evaluate(() => (window as unknown as { __saved: { name: string; type: string; size: number }[] }).__saved)
    expect(saved.name).toMatch(/^gradient-studio-\d+\.(mp4|webm)$/)
    expect(saved.type).toMatch(/^video\/(mp4|webm)$/)
    expect(saved.size).toBeGreaterThan(10_000)
    await expect(page.getByText('Video saved')).toBeVisible()
    await expectNoProblems(page, problems)
  })

  test('copies the palette as CSS', async ({ page }) => {
    await stubClipboard(page)
    await openApp(page, `${STATIC_SCENE}&effect=none`)
    await openExportMenu(page)
    await page.getByRole('button', { name: 'Copy CSS (mesh)' }).click()
    const css = await copiedText(page)
    expect(css).toContain('background-color: #0B1026;')
    expect(css.match(/radial-gradient/g)).toHaveLength(5)
  })
})

test.describe('sharing', () => {
  test('a shared link restores the style, effect and intensity', async ({ page }) => {
    await stubClipboard(page)
    await openApp(page, `shader=silk&effect=halftone&fx=0.8&speed=0&grain=0`)
    await page.getByRole('button', { name: 'Share' }).click()
    const link = await copiedText(page)
    expect(link).toContain('shader=silk')
    expect(link).toContain('effect=halftone')
    expect(link).toContain('fx=0.80')

    await page.evaluate(() => localStorage.clear())
    await page.goto(new URL(link).pathname + new URL(link).search)
    await expect(page.getByRole('button', { name: 'Select style' }).first()).toContainText('Silk')
    await expect(page.getByRole('button', { name: 'Halftone', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })
})
