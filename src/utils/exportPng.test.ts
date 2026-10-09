import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerCanvas, getCanvas, presetSize, clampSize, evenSize, MAX_EDGE, exportFileName, downloadBlob, exportImage, renderOverride,
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

describe('presetSize', () => {
  it('keeps the on-screen size for the screen preset', () => {
    expect(presetSize(800, 600, 'screen')).toEqual({ w: 800, h: 600 })
  })

  it('makes the long edge the preset edge and keeps the shape (landscape, portrait, square)', () => {
    expect(presetSize(1000, 500, 'hd')).toEqual({ w: 1920, h: 960 })
    expect(presetSize(1080, 1920, '4k')).toEqual({ w: 2160, h: 3840 })
    expect(presetSize(500, 500, '2k')).toEqual({ w: 2560, h: 2560 })
  })

  it('also scales down when the screen is already larger than the preset', () => {
    expect(presetSize(5000, 2500, 'hd')).toEqual({ w: 1920, h: 960 })
  })

  it('never returns a zero-sized canvas', () => {
    expect(presetSize(0, 0, 'screen')).toEqual({ w: 1, h: 1 })
  })
})

describe('clampSize', () => {
  it('rounds to whole pixels and keeps at least 1', () => {
    expect(clampSize({ w: 100.6, h: 0.2 })).toEqual({ w: 101, h: 1 })
  })

  it('never exceeds the maximum edge, keeping the shape', () => {
    const size = clampSize({ w: 20000, h: 10000 })
    expect(Math.max(size.w, size.h)).toBe(MAX_EDGE)
    expect(size.w / size.h).toBeCloseTo(2, 2)
  })

  it('accepts a lower limit', () => {
    expect(clampSize({ w: 6000, h: 3000 }, 3840)).toEqual({ w: 3840, h: 1920 })
  })
})

describe('evenSize', () => {
  it('rounds odd sides down so video encoders accept them', () => {
    expect(evenSize({ w: 1921, h: 1081 })).toEqual({ w: 1920, h: 1080 })
    expect(evenSize({ w: 1, h: 1 })).toEqual({ w: 2, h: 2 })
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
    await expect(exportImage('png', { w: 1600, h: 1200 })).resolves.toBe(true)
    expect(seen).toEqual([{ w: 1600, h: 1200 }])
    expect(renderOverride.size).toBeNull()
  })

  it('passes the chosen quality to the encoder', async () => {
    const qualities: unknown[] = []
    const canvas = {
      width: 800, height: 600,
      toBlob: (cb: (b: Blob | null) => void, _type: string, quality: number) => { qualities.push(quality); cb(new Blob(['x'], { type: 'image/jpeg' })) },
    } as unknown as HTMLCanvasElement
    registerCanvas(canvas)
    await exportImage('jpg', { w: 800, h: 600 }, 0.7)
    expect(qualities).toEqual([0.7])
  })

  it('never renders beyond the maximum edge', async () => {
    const seen: ({ w: number; h: number } | null)[] = []
    const canvas = {
      width: 800, height: 600,
      toBlob: (cb: (b: Blob | null) => void) => { seen.push(renderOverride.size); cb(new Blob(['x'], { type: 'image/png' })) },
    } as unknown as HTMLCanvasElement
    registerCanvas(canvas)
    await exportImage('png', { w: 30000, h: 15000 })
    expect(Math.max(seen[0]!.w, seen[0]!.h)).toBe(MAX_EDGE)
  })

  it('restores the on-screen size and reports failure when no image was produced', async () => {
    registerCanvas(fakeCanvas(null))
    await expect(exportImage('jpg', { w: 3840, h: 2160 })).resolves.toBe(false)
    expect(renderOverride.size).toBeNull()
  })

  it('reports failure when there is no canvas', async () => {
    const unregister = registerCanvas(fakeCanvas(null))
    unregister()
    await expect(exportImage('png', { w: 800, h: 600 })).resolves.toBe(false)
  })
})
