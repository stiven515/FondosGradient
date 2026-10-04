import type { ShaderType, AspectRatioType, EffectType, ColorEntry, ShaderParameters } from '../types/gradient'
import { generateId } from './color'

const VALID_SHADERS: ShaderType[] = ['flow', 'beam', 'mesh', 'liquid', 'wave', 'silk', 'stripe']
const VALID_EFFECTS: EffectType[] = ['none', 'grain', 'glow', 'chromatic', 'glass', 'dither', 'halftone']
const VALID_RATIOS: AspectRatioType[] = ['free', '16:9', '4:3', '1:1', '9:16']
const HEX_RE = /^[0-9A-Fa-f]{6}$/

export interface PersistedState {
  shader:      ShaderType
  colors:      ColorEntry[]
  parameters:  ShaderParameters
  effect:      EffectType
  aspectRatio: AspectRatioType
}

interface DecodedState {
  shader?:      ShaderType
  colors?:      ColorEntry[]
  parameters?:  Partial<ShaderParameters>
  effect?:      EffectType
  aspectRatio?: AspectRatioType
}

export function encodeStateToUrl(state: PersistedState): string {
  const p = new URLSearchParams({
    shader:   state.shader,
    colors:   state.colors.map(c => c.hex.replace('#', '')).join(','),
    scale:    state.parameters.scale.toFixed(2),
    curl:     state.parameters.curl.toFixed(2),
    drift:    state.parameters.drift.toFixed(2),
    openness: state.parameters.openness.toFixed(2),
    seed:     state.parameters.seed.toFixed(0),
    speed:    state.parameters.speed.toFixed(2),
    grain:    state.parameters.grain.toFixed(2),
    effect:   state.effect,
    ar:       state.aspectRatio,
  })
  return p.toString()
}

export function decodeUrlToState(search: string): DecodedState {
  if (!search) return {}
  const p = new URLSearchParams(search)
  const result: DecodedState = {}

  const shader = p.get('shader') as ShaderType | null
  if (shader && VALID_SHADERS.includes(shader)) result.shader = shader

  const colorsRaw = p.get('colors')
  if (colorsRaw) {
    const valid = colorsRaw.split(',').filter(h => HEX_RE.test(h))
    if (valid.length >= 2) {
      result.colors = valid.map(h => ({ id: generateId(), hex: `#${h}`, locked: false }))
    }
  }

  const numericKeys: (keyof ShaderParameters)[] = ['scale', 'curl', 'drift', 'openness', 'seed', 'speed', 'grain']
  const params: Partial<ShaderParameters> = {}
  let hasAnyParam = false
  for (const key of numericKeys) {
    const raw = p.get(key)
    if (raw !== null) {
      const v = parseFloat(raw)
      if (!isNaN(v)) { params[key] = v; hasAnyParam = true }
    }
  }
  // Only return the keys that were actually in the URL — don't merge with defaults
  // so a partial URL like ?speed=2 doesn't reset the user's other saved values
  if (hasAnyParam) result.parameters = params

  const effect = p.get('effect') as EffectType | null
  if (effect && VALID_EFFECTS.includes(effect)) result.effect = effect

  const ar = p.get('ar') as AspectRatioType | null
  if (ar && VALID_RATIOS.includes(ar)) result.aspectRatio = ar

  return result
}
