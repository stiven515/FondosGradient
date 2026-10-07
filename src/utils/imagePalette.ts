type RGB = [number, number, number]

const MAX_SAMPLES = 4000
const ITERATIONS = 12

const dist2 = (a: RGB, b: RGB) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
const luminance = (c: RGB) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]
const hex = (c: RGB) => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase()

export function extractPalette(data: Uint8ClampedArray, count: number): string[] {
  const total = data.length / 4
  const step = Math.max(1, Math.ceil(total / MAX_SAMPLES))
  const px: RGB[] = []
  for (let i = 0; i < total; i += step) {
    if (data[i * 4 + 3] >= 128) px.push([data[i * 4], data[i * 4 + 1], data[i * 4 + 2]])
  }
  if (px.length === 0 || count < 1) return []

  // Farthest-point seeding is deterministic and stops once every distinct colour has a seed.
  let centers: RGB[] = [px[0]]
  while (centers.length < count) {
    let best = -1
    let bestDist = 0
    px.forEach((p, i) => {
      const d = Math.min(...centers.map(c => dist2(p, c)))
      if (d > bestDist) { bestDist = d; best = i }
    })
    if (best < 0) break
    centers.push(px[best])
  }

  for (let it = 0; it < ITERATIONS; it++) {
    const sums = centers.map(() => [0, 0, 0, 0])
    for (const p of px) {
      let k = 0
      let kd = Infinity
      centers.forEach((c, i) => { const d = dist2(p, c); if (d < kd) { kd = d; k = i } })
      sums[k][0] += p[0]; sums[k][1] += p[1]; sums[k][2] += p[2]; sums[k][3]++
    }
    centers = centers.flatMap((_c, i): RGB[] =>
      sums[i][3] === 0 ? [] : [[sums[i][0] / sums[i][3], sums[i][1] / sums[i][3], sums[i][2] / sums[i][3]]],
    )
  }

  return centers.sort((a, b) => luminance(a) - luminance(b)).map(hex)
}
