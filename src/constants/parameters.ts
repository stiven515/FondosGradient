import type { ShaderParameters } from '../types/gradient'

export const PARAM_RANGES: Record<keyof ShaderParameters, { min: number; max: number; step: number }> = {
  scale:    { min: 0.5, max: 4.0, step: 0.05 },
  curl:     { min: 0.0, max: 3.0, step: 0.05 },
  drift:    { min: 0.0, max: 1.0, step: 0.01 },
  openness: { min: 0.0, max: 1.0, step: 0.01 },
  seed:     { min: 0,   max: 100, step: 1 },
  speed:    { min: 0.0, max: 3.0, step: 0.05 },
  grain:    { min: 0.0, max: 0.5, step: 0.01 },
}

export const PARAM_KEYS = Object.keys(PARAM_RANGES) as (keyof ShaderParameters)[]

export const VALID_DURATIONS = [5, 10, 20, 30]
export const VALID_EFFECTS = ['none', 'grain', 'glow', 'chromatic', 'glass', 'dither', 'halftone'] as const
export const VALID_RATIOS  = ['free', '16:9', '4:3', '1:1', '9:16'] as const
export const MAX_COLORS = 8
export const MIN_COLORS = 2

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}

export const DEFAULT_PARAMETERS: ShaderParameters = {
  scale:    1.6,
  curl:     1.2,
  drift:    0.55,
  openness: 0.0,
  seed:     0,
  speed:    1.0,
  grain:    0.18,
}
