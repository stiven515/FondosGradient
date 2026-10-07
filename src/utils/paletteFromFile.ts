import { extractPalette } from './imagePalette'

const SAMPLE_SIZE = 64

export async function paletteFromFile(file: File, count = 5): Promise<string[]> {
  const bitmap = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = SAMPLE_SIZE
    canvas.height = SAMPLE_SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('2D canvas unavailable')
    ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
    return extractPalette(ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data, count)
  } finally {
    bitmap.close()
  }
}
