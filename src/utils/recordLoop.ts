import { useGradientStore } from '../store/gradientStore'
import { clock } from './timeline'
import { getCanvas, downloadBlob } from './exportPng'
import { pickVideoMime, recordCanvas, videoExtension } from './recorder'

export type RecordResult = 'saved' | 'cancelled' | 'failed'

export async function recordLoop(
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<RecordResult> {
  const canvas = getCanvas()
  const mime = typeof MediaRecorder !== 'undefined' ? pickVideoMime(m => MediaRecorder.isTypeSupported(m)) : null
  if (!canvas || !mime) return 'failed'

  const store = useGradientStore.getState()
  const { isPlaying, isLooping, duration } = store

  store.setLooping(true)
  store.setPlaying(true)
  clock.seekTo = 0
  try {
    const blob = await recordCanvas({ canvas, seconds: duration, mime, onProgress, signal })
    downloadBlob(blob, `gradient-studio-${Date.now()}.${videoExtension(mime)}`)
    return 'saved'
  } catch {
    return signal?.aborted ? 'cancelled' : 'failed'
  } finally {
    store.setPlaying(isPlaying)
    store.setLooping(isLooping)
  }
}
