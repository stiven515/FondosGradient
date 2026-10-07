import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerCanvas, getCanvas, computeExportSize, exportFileName, downloadBlob, exportImage, renderOverride,
} from './exportPng'

function fakeCanvas(blob: Blob | null, w = 800, h = 600) {
  return { width: w, height: h, toBlob: (cb: (b: Blob | null) => void) => cb(blob) } as unknown as HTMLCanvasElement
}

describe('canvas registry', () => {
  it('returns the registered canvas and clears it on unregister', () => {
    const c = fakeCanvas(null)
    const unregister = registerCanvas(c)
    expect(getCanvas()).toBe(c)
    unregister()
    expect(getCanvas()).toBeNull()
  })

  it('does not clear a newer canvas when an older one unregisters', () => {
    const a = fakeCanvas(null)
    const b = fakeCanvas(null)
    const unregisterA = registerCanvas(a)
    registerCanvas(b)
    unregisterA()
    expect(getCanvas()).toBe(b)
  })
})

describe('computeExportSize', () => {
  it('keeps the current size', () => {
    expect(computeExportSize(800, 600, 'current')).toEqual({ w: 800, h: 600 })
  })

  it('doubles both sides for 2x', () => {
    expect(computeExportSize(800, 600, '2x')).toEqual({ w: 1600, h: 1200 })
  })

  it('scales the long edge to 3840 for 4K, preserving aspect ratio (landscape and portrait)', () => {
    expect(computeExportSize(1920, 1080, '4k')).toEqual({ w: 3840, h: 2160 })
    expect(computeExportSize(1080, 1920, '4k')).toEqual({ w: 2160, h: 3840 })
    expect(computeExportSize(500, 500, '4k')).toEqual({ w: 3840, h: 3840 })
  })

  it('never exceeds 4096 on the long edge', () => {
    const size = computeExportSize(3000, 2000, '2x')
    expect(Math.max(size.w, size.h)).toBe(4096)
    expect(size.w / size.h).toBeCloseTo(1.5, 1)
  })

  it('never returns a zero-sized canvas', () => {
    expect(computeExportSize(0, 0, 'current')).toEqual({ w: 1, h: 1 })
  })
})

describe('exportFileName', () => {
  it('uses the extension that matches the blob that was actually produced', () => {
    expect(exportFileName('image/png', 1)).toBe('gradient-studio-1.png')
    expect(exportFileName('image/jpeg', 1)).toBe('gradient-studio-1.jpg')
    expect(exportFileName('image/webp', 1)).toBe('gradient-studio-1.webp')
    expect(exportFileName('application/octet-stream', 1)).toBe('gradient-studio-1.png')
  })
})

describe('downloadBlob', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks() })

  it('clicks a download link and revokes the URL only after a delay', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadBlob(new Blob(['x'], { type: 'image/png' }), 'a.png')
    expect(click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })
})

describe('exportImage', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
  })
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); renderOverride.size = null })

  it('renders at the requested size, then restores the on-screen size', async () => {
    const seen: ({ w: number; h: number } | null)[] = []
    const canvas = {
      width: 800, height: 600,
      toBlob: (cb: (b: Blob | null) => void) => { seen.push(renderOverride.size); cb(new Blob(['x'], { type: 'image/png' })) },
    } as unknown as HTMLCanvasElement
    registerCanvas(canvas)
    await expect(exportImage('png', '2x')).resolves.toBe(true)
    expect(seen).toEqual([{ w: 1600, h: 1200 }])
    expect(renderOverride.size).toBeNull()
  })

  it('restores the on-screen size and reports failure when no image was produced', async () => {
    registerCanvas(fakeCanvas(null))
    await expect(exportImage('jpg', '4k')).resolves.toBe(false)
    expect(renderOverride.size).toBeNull()
  })

  it('reports failure when there is no canvas', async () => {
    const unregister = registerCanvas(fakeCanvas(null))
    unregister()
    await expect(exportImage('png', 'current')).resolves.toBe(false)
  })
})
