import { useGradientStore } from '../store/gradientStore'
import { clock } from './timeline'
import { getCanvas, downloadBlob, afterRedraw, clampSize, evenSize, renderOverride, type ExportSize } from './exportPng'
import {
  pickMimeFor, pickVideoMime, recordCanvas, videoBitrate, videoExtension, warmUpRecorder,
  type VideoFormat, type VideoQuality,
} from './recorder'

export type RecordResult = 'saved' | 'cancelled' | 'failed'

export interface RecordOptions {
  /** Picture size; omit to record at the on-screen size. */
  size?:    ExportSize
  fps?:     number
  format?:  VideoFormat
  quality?: VideoQuality
}

// Video is capped lower than stills: the browser records in real time, so the GPU has to keep up.
const MAX_VIDEO_EDGE = 3840

export async function recordLoop(
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
  { size, fps = 60, format, quality = 'high' }: RecordOptions = {},
): Promise<RecordResult> {
  const canvas = getCanvas()
  if (typeof MediaRecorder === 'undefined') return 'failed'
  const supported = (m: string) => MediaRecorder.isTypeSupported(m)
  const mime = (format ? pickMimeFor(format, supported) : null) ?? pickVideoMime(supported)
  if (!canvas || !mime) return 'failed'
  await warmUpRecorder(mime)

  const store = useGradientStore.getState()
  const { isPlaying, isLooping, duration } = store

  if (size) {
    renderOverride.size = evenSize(clampSize(size, MAX_VIDEO_EDGE))
    await afterRedraw()
  }
  store.setLooping(true)
  store.setPlaying(true)
  clock.seekTo = 0
  try {
    const bitsPerSecond = videoBitrate(canvas.width, canvas.height, fps, quality)
    const blob = await recordCanvas({ canvas, seconds: duration, mime, fps, bitsPerSecond, onProgress, signal })
    downloadBlob(blob, `gradient-studio-${Date.now()}.${videoExtension(mime)}`)
    return 'saved'
  } catch {
    return signal?.aborted ? 'cancelled' : 'failed'
  } finally {
    renderOverride.size = null
    store.setPlaying(isPlaying)
    store.setLooping(isLooping)
  }
}
