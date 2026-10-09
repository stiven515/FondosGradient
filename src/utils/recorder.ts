const CANDIDATES = [
  'video/mp4;codecs=avc1',
  'video/mp4',
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
]

export function pickVideoMime(isSupported: (mime: string) => boolean): string | null {
  return CANDIDATES.find(isSupported) ?? null
}

export function videoExtension(mime: string): 'mp4' | 'webm' {
  return mime.startsWith('video/mp4') ? 'mp4' : 'webm'
}

export type VideoFormat = 'mp4' | 'webm'
export type VideoQuality = 'normal' | 'high' | 'max'

/** Bits per pixel per frame; the bitrate follows the picture size so small and large videos both look clean. */
const BITS_PER_PIXEL: Record<VideoQuality, number> = { normal: 0.06, high: 0.1, max: 0.16 }
const MIN_BITRATE = 4_000_000
const MAX_BITRATE = 80_000_000

export function videoBitrate(w: number, h: number, fps: number, quality: VideoQuality): number {
  return Math.round(Math.min(MAX_BITRATE, Math.max(MIN_BITRATE, w * h * fps * BITS_PER_PIXEL[quality])))
}

/** The best supported mime for one container, or null when the browser cannot record it. */
export function pickMimeFor(format: VideoFormat, isSupported: (mime: string) => boolean): string | null {
  return CANDIDATES.filter(m => videoExtension(m) === format).find(isSupported) ?? null
}

export function availableVideoFormats(): VideoFormat[] {
  if (typeof MediaRecorder === 'undefined') return []
  return (['mp4', 'webm'] as const).filter(f => pickMimeFor(f, m => MediaRecorder.isTypeSupported(m)) !== null)
}

// A recording smaller than this holds no frames, only container headers.
const MIN_VIDEO_BYTES = 1024

let warmUp: Promise<void> | null = null

/**
 * The first MediaRecorder of a session can come back with no frames while the browser spins up its encoder
 * (seen with software rendering). Running a tiny throwaway recording once makes the person's own recording reliable.
 * Never rejects: if it cannot run, the real recording simply proceeds.
 */
export function warmUpRecorder(mime: string): Promise<void> {
  if (warmUp) return warmUp
  warmUp = new Promise<void>(resolve => {
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 64
      canvas.height = 64
      const ctx = canvas.getContext('2d')
      const recorder = new MediaRecorder(canvas.captureStream(30), { mimeType: mime })
      let n = 0
      const paint = setInterval(() => { if (ctx) { ctx.fillStyle = `hsl(${(n++ * 30) % 360}, 80%, 50%)`; ctx.fillRect(0, 0, 64, 64) } }, 30)
      const done = () => { clearInterval(paint); resolve() }
      recorder.onstop = done
      recorder.onerror = done
      recorder.start()
      setTimeout(() => { try { recorder.stop() } catch { done() } }, 900)
    } catch {
      resolve()
    }
  })
  return warmUp
}

export function canRecordVideo(): boolean {
  return typeof MediaRecorder !== 'undefined' && pickVideoMime(m => MediaRecorder.isTypeSupported(m)) !== null
}

interface RecordOptions {
  canvas:      HTMLCanvasElement
  seconds:     number
  mime:        string
  fps?:        number
  bitsPerSecond?: number
  onProgress?: (progress: number) => void
  signal?:     AbortSignal
}

export function recordCanvas({ canvas, seconds, mime, fps = 60, bitsPerSecond = 12_000_000, onProgress, signal }: RecordOptions): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const stream = canvas.captureStream(fps)
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitsPerSecond })
    const chunks: Blob[] = []
    const startedAt = Date.now()
    let settled = false

    const stopTimer = setTimeout(() => { if (recorder.state !== 'inactive') recorder.stop() }, seconds * 1000)
    const ticker = setInterval(
      () => onProgress?.(Math.min(0.99, (Date.now() - startedAt) / (seconds * 1000))),
      100,
    )

    function release() {
      clearTimeout(stopTimer)
      clearInterval(ticker)
      signal?.removeEventListener('abort', onAbort)
      stream.getTracks().forEach(t => t.stop())
    }

    function fail(error: Error) {
      if (settled) return
      settled = true
      release()
      if (recorder.state !== 'inactive') {
        try { recorder.stop() } catch { /* already stopped */ }
      }
      reject(error)
    }

    function onAbort() { fail(new Error('Recording cancelled')) }

    recorder.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data) }
    recorder.onerror = () => fail(new Error('Recording failed'))
    recorder.onstop = () => {
      if (settled) return
      settled = true
      release()
      const blob = new Blob(chunks, { type: mime.split(';')[0] })
      // Never hand over an empty video as if it had worked.
      if (blob.size < MIN_VIDEO_BYTES) { reject(new Error('Recording produced no frames')); return }
      onProgress?.(1)
      resolve(blob)
    }

    recorder.start()
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort)
  })
}
