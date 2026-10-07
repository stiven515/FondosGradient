import { describe, it, expect } from 'vitest'
import { extractPalette } from './imagePalette'

function pixels(spec: [number, number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(spec.flat())
}
const repeat = (rgba: [number, number, number, number], n: number) => Array.from({ length: n }, () => rgba)

function channelDistance(hex: string, rgb: [number, number, number]) {
  const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16))
  return Math.max(...v.map((c, i) => Math.abs(c - rgb[i])))
}

describe('extractPalette', () => {
  it('returns an empty palette for an empty image', () => {
    expect(extractPalette(new Uint8ClampedArray(0), 5)).toEqual([])
  })

  it('finds the dominant colors of a two-tone image', () => {
    const data = pixels([...repeat([255, 0, 0, 255], 50), ...repeat([0, 0, 255, 255], 50)])
    const palette = extractPalette(data, 2)
    expect(palette).toHaveLength(2)
    expect(palette.some(h => channelDistance(h, [255, 0, 0]) < 10)).toBe(true)
    expect(palette.some(h => channelDistance(h, [0, 0, 255]) < 10)).toBe(true)
  })

  it('ignores transparent pixels', () => {
    const data = pixels([...repeat([0, 255, 0, 0], 80), ...repeat([255, 0, 0, 255], 20)])
    const palette = extractPalette(data, 2)
    expect(palette).toHaveLength(1)
    expect(channelDistance(palette[0], [255, 0, 0])).toBeLessThan(10)
  })

  it('does not return more colors than there are distinct colors', () => {
    const data = pixels(repeat([10, 200, 30, 255], 40))
    expect(extractPalette(data, 5)).toHaveLength(1)
  })

  it('returns the requested number of colors for a rich image', () => {
    const spec: [number, number, number, number][] = []
    for (let i = 0; i < 400; i++) spec.push([(i * 7) % 256, (i * 13) % 256, (i * 29) % 256, 255])
    expect(extractPalette(pixels(spec), 5)).toHaveLength(5)
  })

  it('orders colors from dark to light so the gradient reads smoothly', () => {
    const data = pixels([
      ...repeat([240, 240, 240, 255], 30), ...repeat([10, 10, 10, 255], 30), ...repeat([128, 128, 128, 255], 30),
    ])
    const lum = extractPalette(data, 3).map(h => parseInt(h.slice(1, 3), 16))
    expect(lum).toEqual([...lum].sort((a, b) => a - b))
  })

  it('is deterministic', () => {
    const spec: [number, number, number, number][] = []
    for (let i = 0; i < 300; i++) spec.push([(i * 11) % 256, (i * 17) % 256, (i * 5) % 256, 255])
    const data = pixels(spec)
    expect(extractPalette(data, 4)).toEqual(extractPalette(data, 4))
  })

  it('returns uppercase #RRGGBB values', () => {
    const palette = extractPalette(pixels(repeat([171, 205, 239, 255], 10)), 1)
    expect(palette[0]).toMatch(/^#[0-9A-F]{6}$/)
  })
})
