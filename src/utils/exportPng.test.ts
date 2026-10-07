import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { downloadCanvasPng, registerCanvas, getCanvas } from './exportPng'

function fakeCanvas(blob: Blob | null) {
  return { toBlob: (cb: (b: Blob | null) => void) => cb(blob) } as unknown as HTMLCanvasElement
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

describe('downloadCanvasPng', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
  })
  afterEach(() => vi.useRealTimers())

  it('triggers a PNG download and revokes the URL only after the click has been handled', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    downloadCanvasPng(fakeCanvas(new Blob(['x'], { type: 'image/png' })))
    expect(click).toHaveBeenCalledTimes(1)
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    vi.runAllTimers()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake')
  })

  it('does nothing when the canvas produced no blob', () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    click.mockClear()
    downloadCanvasPng(fakeCanvas(null))
    expect(click).not.toHaveBeenCalled()
  })
})
