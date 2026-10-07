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

async function openExportMenu(page: Page) {
  await page.getByRole('button', { name: 'Export image' }).click()
}

test.describe('export', () => {
  test('downloads a PNG at 2x the on-screen size and restores the preview afterwards', async ({ page }) => {
    const problems = trackProblems(page)
    await openApp(page, `${STATIC_SCENE}&effect=glow&fx=0.5`)
    const before = await canvasSize(page)

    await openExportMenu(page)
    await page.getByRole('radio', { name: '2×' }).check({ force: true })
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download' }).click(),
    ])

    expect(download.suggestedFilename()).toMatch(/^gradient-studio-\d+\.png$/)
    const size = pngSize(await download.path())
    expect(size).toEqual({ w: before.w * 2, h: before.h * 2 })
    await expect(page.getByText('Image exported')).toBeVisible()

    await expect.poll(() => canvasSize(page)).toEqual(before)
    await expectNoProblems(page, problems)
  })

  test('exports every post effect without errors', async ({ page }) => {
    const problems = trackProblems(page)
    for (const effect of ['glow', 'chromatic', 'glass', 'dither', 'halftone']) {
      await openApp(page, `${STATIC_SCENE}&effect=${effect}&fx=0.6`)
      await openExportMenu(page)
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
