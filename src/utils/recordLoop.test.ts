import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('./recorder', async importOriginal => ({
  ...(await importOriginal<typeof import('./recorder')>()),
  recordCanvas: vi.fn(),
}))

import { recordLoop } from './recordLoop'
import { recordCanvas } from './recorder'
import { registerCanvas, renderOverride } from './exportPng'
import { clock } from './timeline'
import { useGradientStore } from '../store/gradientStore'

const mockedRecord = vi.mocked(recordCanvas)

beforeEach(() => {
  vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m === 'video/webm' })
  URL.createObjectURL = vi.fn(() => 'blob:fake')
  URL.revokeObjectURL = vi.fn()
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  registerCanvas({ width: 10, height: 10 } as HTMLCanvasElement)
  useGradientStore.setState({ duration: 5, isPlaying: false, isLooping: false })
  clock.seekTo = null
  mockedRecord.mockReset()
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })

describe('recordLoop', () => {
  it('records exactly one cycle from the start, playing and looping, then restores playback state', async () => {
    let seen: { playing: boolean; looping: boolean; seekTo: number | null } | null = null
    mockedRecord.mockImplementation(async () => {
      const s = useGradientStore.getState()
      seen = { playing: s.isPlaying, looping: s.isLooping, seekTo: clock.seekTo }
      return new Blob(['v'], { type: 'video/webm' })
    })
    await expect(recordLoop()).resolves.toBe('saved')
    expect(seen).toEqual({ playing: true, looping: true, seekTo: 0 })
    expect(mockedRecord.mock.calls[0][0]).toMatchObject({ seconds: 5, mime: 'video/webm' })
    expect(useGradientStore.getState().isPlaying).toBe(false)
    expect(useGradientStore.getState().isLooping).toBe(false)
  })

  it('downloads the video with the right extension', async () => {
    mockedRecord.mockResolvedValue(new Blob(['v'], { type: 'video/webm' }))
    const a = vi.spyOn(document, 'createElement')
    await recordLoop()
    const link = a.mock.results.map(r => r.value).find(el => el instanceof HTMLAnchorElement) as HTMLAnchorElement
    expect(link.download).toMatch(/^gradient-studio-\d+\.webm$/)
  })

  it('reports a failure and still restores playback state', async () => {
    useGradientStore.setState({ isPlaying: true, isLooping: true })
    mockedRecord.mockRejectedValue(new Error('Recording failed'))
    await expect(recordLoop()).resolves.toBe('failed')
    expect(useGradientStore.getState().isPlaying).toBe(true)
    expect(useGradientStore.getState().isLooping).toBe(true)
  })

  it('reports cancellation when the signal was aborted', async () => {
    const controller = new AbortController()
    mockedRecord.mockImplementation(async () => { controller.abort(); throw new Error('Recording cancelled') })
    await expect(recordLoop(undefined, controller.signal)).resolves.toBe('cancelled')
  })

  describe('options', () => {
    beforeEach(() => {
      vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => setTimeout(() => cb(0), 0))
    })
    afterEach(() => { renderOverride.size = null })

    it('records at the chosen size, even-sided and capped for video, then restores the on-screen size', async () => {
      let during: { w: number; h: number } | null = null
      mockedRecord.mockImplementation(async () => {
        during = renderOverride.size
        return new Blob(['v'], { type: 'video/webm' })
      })
      await recordLoop(undefined, undefined, { size: { w: 7681, h: 4321 } })
      expect(during).toEqual({ w: 3840, h: 2160 })
      expect(renderOverride.size).toBeNull()
    })

    it('restores the on-screen size when the recording fails', async () => {
      mockedRecord.mockRejectedValue(new Error('Recording failed'))
      await recordLoop(undefined, undefined, { size: { w: 1920, h: 1080 } })
      expect(renderOverride.size).toBeNull()
    })

    it('passes the frame rate and a bitrate that follows the picture to the recorder', async () => {
      mockedRecord.mockResolvedValue(new Blob(['v'], { type: 'video/webm' }))
      await recordLoop(undefined, undefined, { fps: 30, quality: 'max' })
      expect(mockedRecord.mock.calls[0][0]).toMatchObject({ fps: 30, bitsPerSecond: 4_000_000 })
      mockedRecord.mockClear()
      await recordLoop(undefined, undefined, { fps: 60, quality: 'normal' })
      expect(mockedRecord.mock.calls[0][0]).toMatchObject({ fps: 60 })
    })

    it('uses the requested container, and falls back to what the browser supports', async () => {
      vi.stubGlobal('MediaRecorder', { isTypeSupported: () => true })
      mockedRecord.mockResolvedValue(new Blob(['v'], { type: 'video/mp4' }))
      await recordLoop(undefined, undefined, { format: 'webm' })
      expect(mockedRecord.mock.calls[0][0].mime).toMatch(/^video\/webm/)
      mockedRecord.mockClear()
      vi.stubGlobal('MediaRecorder', { isTypeSupported: (m: string) => m === 'video/webm' })
      await recordLoop(undefined, undefined, { format: 'mp4' })
      expect(mockedRecord.mock.calls[0][0].mime).toBe('video/webm')
    })
  })

  it('fails without a canvas or without video support', async () => {
    registerCanvas({} as HTMLCanvasElement)()
    await expect(recordLoop()).resolves.toBe('failed')
    registerCanvas({ width: 1, height: 1 } as HTMLCanvasElement)
    vi.stubGlobal('MediaRecorder', { isTypeSupported: () => false })
    await expect(recordLoop()).resolves.toBe('failed')
    expect(mockedRecord).not.toHaveBeenCalled()
  })
})
