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

export function canRecordVideo(): boolean {
  return typeof MediaRecorder !== 'undefined' && pickVideoMime(m => MediaRecorder.isTypeSupported(m)) !== null
}

interface RecordOptions {
  canvas:      HTMLCanvasElement
  seconds:     number
  mime:        string
  fps?:        number
  onProgress?: (progress: number) => void
  signal?:     AbortSignal
}

export function recordCanvas({ canvas, seconds, mime, fps = 60, onProgress, signal }: RecordOptions): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    const stream = canvas.captureStream(fps)
    const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12_000_000 })
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
      onProgress?.(1)
      resolve(new Blob(chunks, { type: mime.split(';')[0] }))
    }

    recorder.start()
    if (signal?.aborted) onAbort()
    else signal?.addEventListener('abort', onAbort)
  })
}
