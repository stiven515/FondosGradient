import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { pickVideoMime, pickMimeFor, recordCanvas, videoBitrate, videoExtension, warmUpRecorder } from './recorder'

describe('pickVideoMime', () => {
  it('prefers MP4 when supported, then VP9 WebM', () => {
    expect(pickVideoMime(() => true)).toMatch(/^video\/mp4/)
    expect(pickVideoMime(m => m.includes('webm'))).toMatch(/^video\/webm/)
  })

  it('returns null when nothing is supported', () => {
    expect(pickVideoMime(() => false)).toBeNull()
  })
})

describe('pickMimeFor', () => {
  it('returns a supported mime of the requested container', () => {
    expect(pickMimeFor('mp4', () => true)).toMatch(/^video\/mp4/)
    expect(pickMimeFor('webm', () => true)).toMatch(/^video\/webm/)
  })

  it('returns null when that container is not supported', () => {
    expect(pickMimeFor('mp4', m => m.includes('webm'))).toBeNull()
    expect(pickMimeFor('webm', m => m.includes('mp4'))).toBeNull()
  })
})

describe('videoBitrate', () => {
  it('grows with picture size, frame rate and quality', () => {
    const base = videoBitrate(1920, 1080, 30, 'normal')
    expect(videoBitrate(3840, 2160, 30, 'normal')).toBeGreaterThan(base)
    expect(videoBitrate(1920, 1080, 60, 'normal')).toBeGreaterThan(base)
    expect(videoBitrate(1920, 1080, 30, 'max')).toBeGreaterThan(base)
  })

  it('stays inside a sane range for tiny and huge pictures', () => {
    expect(videoBitrate(100, 100, 30, 'normal')).toBe(4_000_000)
    expect(videoBitrate(7680, 4320, 60, 'max')).toBe(80_000_000)
  })
})

describe('videoExtension', () => {
  it('maps mime types to file extensions', () => {
    expect(videoExtension('video/mp4;codecs=avc1')).toBe('mp4')
    expect(videoExtension('video/webm;codecs=vp9')).toBe('webm')
    expect(videoExtension('video/webm')).toBe('webm')
  })
})

class FakeRecorder {
  static last: FakeRecorder
  static payload = 'x'.repeat(4096)
  ondataavailable: ((e: { data: Blob }) => void) | null = null
  onstop: (() => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  state = 'inactive'
  started = false
  constructor(public stream: unknown, public options: { mimeType: string }) { FakeRecorder.last = this }
  start() { this.state = 'recording'; this.started = true }
  stop() {
    this.state = 'inactive'
    this.ondataavailable?.({ data: new Blob([FakeRecorder.payload], { type: this.options.mimeType }) })
    this.onstop?.()
  }
}

describe('recordCanvas', () => {
  const stopTrack = vi.fn()
  const canvas = { captureStream: vi.fn(() => ({ getTracks: () => [{ stop: stopTrack }] })) } as unknown as HTMLCanvasElement

  beforeEach(() => {
    vi.useFakeTimers()
    stopTrack.mockClear()
    vi.stubGlobal('MediaRecorder', FakeRecorder)
  })
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })

  it('records for the requested duration and resolves with the video blob', async () => {
    const promise = recordCanvas({ canvas, seconds: 5, mime: 'video/webm' })
    expect(FakeRecorder.last.started).toBe(true)
    expect(FakeRecorder.last.state).toBe('recording')
    await vi.advanceTimersByTimeAsync(4900)
    expect(FakeRecorder.last.state).toBe('recording')
    await vi.advanceTimersByTimeAsync(200)
    const blob = await promise
    expect(blob.type).toBe('video/webm')
    expect(blob.size).toBeGreaterThan(0)
    expect(stopTrack).toHaveBeenCalled()
  })

  it('reports progress from 0 to 1', async () => {
    const progress: number[] = []
    const promise = recordCanvas({ canvas, seconds: 2, mime: 'video/webm', onProgress: p => progress.push(p) })
    await vi.advanceTimersByTimeAsync(2100)
    await promise
    expect(progress[0]).toBeLessThan(0.5)
    expect(progress[progress.length - 1]).toBe(1)
    expect([...progress].sort((a, b) => a - b)).toEqual(progress)
  })

  it('can be cancelled, rejecting and releasing the stream', async () => {
    const controller = new AbortController()
    const promise = recordCanvas({ canvas, seconds: 10, mime: 'video/webm', signal: controller.signal })
    const assertion = expect(promise).rejects.toThrow(/cancel/i)
    await vi.advanceTimersByTimeAsync(1000)
    controller.abort()
    await assertion
    expect(stopTrack).toHaveBeenCalled()
  })

  it('rejects instead of delivering a video that holds no frames', async () => {
    FakeRecorder.payload = 'h'.repeat(110)
    try {
      const promise = recordCanvas({ canvas, seconds: 1, mime: 'video/webm' })
      const assertion = expect(promise).rejects.toThrow(/no frames/i)
      await vi.advanceTimersByTimeAsync(1100)
      await assertion
      expect(stopTrack).toHaveBeenCalled()
    } finally {
      FakeRecorder.payload = 'x'.repeat(4096)
    }
  })

  it('rejects when the recorder reports an error', async () => {
    const promise = recordCanvas({ canvas, seconds: 5, mime: 'video/webm' })
    const assertion = expect(promise).rejects.toThrow(/recording failed/i)
    FakeRecorder.last.onerror?.({})
    await assertion
    expect(stopTrack).toHaveBeenCalled()
  })
})

describe('warmUpRecorder', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('never rejects, even when the browser cannot record from a canvas', async () => {
    vi.stubGlobal('MediaRecorder', FakeRecorder)
    await expect(warmUpRecorder('video/webm')).resolves.toBeUndefined()
  })

  it('runs only once per session', () => {
    expect(warmUpRecorder('video/webm')).toBe(warmUpRecorder('video/mp4'))
  })
})
