export type ExportFormat = 'png' | 'jpg' | 'webp'
export type ExportScale  = 'current' | '2x' | '4k'

const MIME: Record<ExportFormat, string> = { png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp' }
const EXT:  Record<string, string>        = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }
const MAX_EDGE = 4096
const UHD_EDGE = 3840

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

export function computeExportSize(w: number, h: number, scale: ExportScale): { w: number; h: number } {
  const factor = scale === '2x' ? 2 : scale === '4k' ? UHD_EDGE / Math.max(w, h, 1) : 1
  const fit = Math.min(1, MAX_EDGE / Math.max(w * factor, h * factor, 1))
  return {
    w: Math.max(1, Math.round(w * factor * fit)),
    h: Math.max(1, Math.round(h * factor * fit)),
  }
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
function afterRedraw(): Promise<void> {
  return new Promise(resolve => {
    const fallback = setTimeout(resolve, 1000)
    requestAnimationFrame(() => requestAnimationFrame(() => { clearTimeout(fallback); resolve() }))
  })
}

export async function exportImage(format: ExportFormat, scale: ExportScale): Promise<boolean> {
  const canvas = getCanvas()
  if (!canvas) return false

  renderOverride.size = computeExportSize(canvas.width, canvas.height, scale)
  try {
    await afterRedraw()
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, MIME[format], 0.95))
    if (!blob) return false
    downloadBlob(blob, exportFileName(blob.type, Date.now()))
    return true
  } finally {
    renderOverride.size = null
  }
}
