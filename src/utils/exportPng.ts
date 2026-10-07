let current: HTMLCanvasElement | null = null

export function registerCanvas(canvas: HTMLCanvasElement): () => void {
  current = canvas
  return () => { if (current === canvas) current = null }
}

export function getCanvas(): HTMLCanvasElement | null {
  return current
}

export function downloadCanvasPng(canvas: HTMLCanvasElement): void {
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradient-studio-${Date.now()}.png`
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }, 'image/png')
}
