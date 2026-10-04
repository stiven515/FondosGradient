// Shared playback clock, mutated by the render loop and read by the playback bar
// without going through React state (it changes every frame).
export const clock = {
  elapsed: 0,
  seekTo:  null as number | null,
}

export function advance(
  elapsed: number, dt: number, durationMs: number, looping: boolean,
): { elapsed: number; ended: boolean } {
  const next = elapsed + dt
  if (next < durationMs) return { elapsed: next, ended: false }
  if (looping) return { elapsed: next % durationMs, ended: false }
  return { elapsed: durationMs, ended: true }
}

// Shaders animate via fract(u_time * speed * 0.05); snapping to a whole number of
// phases per cycle makes the loop seamless.
export function shaderTime(elapsedMs: number, durationS: number, speed: number): number {
  if (speed < 1e-3) return elapsedMs * 0.001
  const cycles = Math.max(1, Math.round(speed * durationS * 0.05))
  return (elapsedMs / (durationS * 1000)) * cycles / (speed * 0.05)
}
