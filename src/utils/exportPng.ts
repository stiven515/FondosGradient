export type ExportFormat = 'png' | 'jpg' | 'webp'
export interface ExportSize { w: number; h: number }
export type SizePreset = 'screen' | 'hd' | '2k' | '4k'

const MIME: Record<ExportFormat, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }
const EXT:  Record<string, string>        = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

/** Longest side, in pixels, of each named size. The shape of the canvas is kept. */
export const PRESET_EDGE: Record<Exclude<SizePreset, 'screen'>, number> = { hd: 1920, '2k': 2560, '4k': 3840 }
export const MAX_EDGE = 7680
export const DEFAULT_QUALITY = 0.95

// While set, the render loop sizes the drawing buffer to this instead of the on-screen size.
export const renderOverride: { size: { w: number; h: number } | null } = { size: null }

let current: HTMLCanvasElement | null = null

export function registerCanvas(canvas: HTMLCanvasElement): () => void {
  current = canvas
  return () => { if (current === canvas) current = null }
}

export function getCanvas(): HTMLCanvasElement | null {
  return current
}

/** Whole pixels, at least 1, and no side beyond `max` (the shape is kept when it has to shrink). */
export function clampSize({ w, h }: ExportSize, max = MAX_EDGE): ExportSize {
  const fit = Math.min(1, max / Math.max(w, h, 1))
  return { w: Math.max(1, Math.round(w * fit)), h: Math.max(1, Math.round(h * fit)) }
}

/** The size a preset gives a canvas of the given shape: its longest side becomes the preset's edge. */
export function presetSize(w: number, h: number, preset: SizePreset): ExportSize {
  if (preset === 'screen') return clampSize({ w, h })
  const factor = PRESET_EDGE[preset] / Math.max(w, h, 1)
  return clampSize({ w: w * factor, h: h * factor })
}

/** Video encoders want even dimensions. */
export function evenSize({ w, h }: ExportSize): ExportSize {
  return { w: Math.max(2, w - (w % 2)), h: Math.max(2, h - (h % 2)) }
}

export function exportFileName(mime: string, stamp: number): string {
  return `gradient-studio-${stamp}.${EXT[mime] ?? 'png'}`
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

// Resolves after the loop had a chance to redraw; falls back after 1 s when frames are paused (hidden tab).
export function afterRedraw(): Promise<void> {
  return new Promise(resolve => {
    const fallback = setTimeout(resolve, 1000)
    requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(fallback); resolve() }))
  })
}

export async function exportImage(format: ExportFormat, size: ExportSize, quality = DEFAULT_QUALITY): Promise<boolean> {
  const canvas = getCanvas()
  if (!canvas) return false

  renderOverride.size = clampSize(size)
  try {
    await afterRedraw()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, MIME[format], quality))
    if (!blob) return false
    downloadBlob(blob, exportFileName(blob.type, Date.now()))
    return true
  } finally {
    renderOverride.size = null
  }
}
