import { test, expect, type Page } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { STATIC_SCENE, trackProblems, openApp, expectNoProblems } from './helpers'

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

  test('records one loop as a playable video', async ({ page }) => {
    test.setTimeout(60_000)
    const problems = trackProblems(page)
    await openApp(page, `shader=mesh&effect=glass&fx=0.5&dur=5`)
    await openExportMenu(page)
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 30_000 }),
      page.getByRole('button', { name: 'Record loop (5s)' }).click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^gradient-studio-\d+\.(mp4|webm)$/)
    expect(readFileSync(await download.path()).length).toBeGreaterThan(10_000)
    await expect(page.getByText('Video saved')).toBeVisible()
    await expectNoProblems(page, problems)
  })

  test('copies the palette as CSS', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openApp(page, `${STATIC_SCENE}&effect=none`)
    await openExportMenu(page)
    await page.getByRole('button', { name: 'Copy CSS (mesh)' }).click()
    const css = await page.evaluate(() => navigator.clipboard.readText())
    expect(css).toContain('background-color: #0B1026;')
    expect(css.match(/radial-gradient/g)).toHaveLength(5)
  })
})

test.describe('sharing', () => {
  test('a shared link restores the style, effect and intensity', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await openApp(page, `shader=silk&effect=halftone&fx=0.8&speed=0&grain=0`)
    await page.getByRole('button', { name: 'Share' }).click()
    const link = await page.evaluate(() => navigator.clipboard.readText())
    expect(link).toContain('shader=silk')
    expect(link).toContain('effect=halftone')
    expect(link).toContain('fx=0.80')

    await page.evaluate(() => localStorage.clear())
    await page.goto(new URL(link).pathname + new URL(link).search)
    await expect(page.getByRole('button', { name: 'Select style' }).first()).toContainText('Silk')
    await expect(page.getByRole('button', { name: 'Halftone', exact: true })).toBeVisible()
  })
})
