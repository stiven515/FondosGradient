import { expect, type Page } from '@playwright/test'

export interface Frame { data: number[]; width: number; height: number }

// Static scene (no animation, no grain) so frames are comparable between runs.
export const STATIC_SCENE = 'shader=wave&colors=0B1026,F72585,4CC9F0,FFD60A,FFFFFF&speed=0&grain=0'

export function trackProblems(page: Page): string[] {
  const problems: string[] = []
  page.on('pageerror', e => problems.push(`pageerror: ${e.message}`))
  page.on('console', m => { if (m.type() === 'error') problems.push(`console: ${m.text()}`) })
  return problems
}

export async function openApp(page: Page, query: string) {
  await page.goto(`/?${query}`)
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas')
    return !!c && c.width > 1
  })
  await page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))))
}

export async function expectNoProblems(page: Page, problems: string[]) {
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(problems).toEqual([])
}

// Downsampled copy of the canvas, for comparing whole frames.
export async function readFrame(page: Page, size = 160): Promise<Frame> {
  return page.evaluate(s => {
    const canvas = document.querySelector('canvas')!
    const tmp = document.createElement('canvas')
    tmp.width = s
    tmp.height = s
    const ctx = tmp.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(canvas, 0, 0, s, s)
    return { data: Array.from(ctx.getImageData(0, 0, s, s).data), width: s, height: s }
  }, size)
}

// Native-resolution strip from the middle of the canvas, for judging pixel-level noise.
export async function readStrip(page: Page, width = 240, height = 4): Promise<Frame> {
  return page.evaluate(([w, h]) => {
    const canvas = document.querySelector('canvas')!
    const tmp = document.createElement('canvas')
    tmp.width = w
    tmp.height = h
    const ctx = tmp.getContext('2d', { willReadFrequently: true })!
    ctx.drawImage(canvas, Math.floor(canvas.width / 2 - w / 2), Math.floor(canvas.height / 2), w, h, 0, 0, w, h)
    return { data: Array.from(ctx.getImageData(0, 0, w, h).data), width: w, height: h }
  }, [width, height] as const)
}

export function meanAbsDiff(a: Frame, b: Frame): number {
  let sum = 0
  for (let i = 0; i < a.data.length; i += 4) {
    sum += (Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2])) / 3
  }
  return sum / (a.data.length / 4)
}

export function luminanceSpread(f: Frame): number {
  const lum: number[] = []
  for (let i = 0; i < f.data.length; i += 4) lum.push(0.299 * f.data[i] + 0.587 * f.data[i + 1] + 0.114 * f.data[i + 2])
  const mean = lum.reduce((s, v) => s + v, 0) / lum.length
  return Math.sqrt(lum.reduce((s, v) => s + (v - mean) ** 2, 0) / lum.length)
}

// Share of horizontally adjacent pixels that are identical: ~0 for per-pixel noise, ~1 - 1/cell for blocky noise.
export function equalNeighbourShare(f: Frame): number {
  let equal = 0
  let total = 0
  for (let y = 0; y < f.height; y++) {
    for (let x = 0; x < f.width - 1; x++) {
      const i = (y * f.width + x) * 4
      const j = i + 4
      if (f.data[i] === f.data[j] && f.data[i + 1] === f.data[j + 1] && f.data[i + 2] === f.data[j + 2]) equal++
      total++
    }
  }
  return equal / total
}
