import type { ShaderType, AspectRatioType, EffectType, ColorEntry, ShaderParameters } from '../types/gradient'
import { generateId } from './color'
import { SHADER_TYPES } from '../constants/shaders'
import {
  PARAM_KEYS, PARAM_RANGES, VALID_DURATIONS, VALID_EFFECTS, VALID_RATIOS, MAX_COLORS, MIN_COLORS, clamp,
} from '../constants/parameters'

const VALID_SHADERS = SHADER_TYPES
const HEX_RE = /^[0-9A-Fa-f]{6}$/

export interface PersistedState {
  shader:      ShaderType
  colors:      ColorEntry[]
  parameters:  ShaderParameters
  effect:       EffectType
  effectAmount: number
  duration:     number
  aspectRatio:  AspectRatioType
}

interface DecodedState {
  shader?:       ShaderType
  colors?:       ColorEntry[]
  parameters?:   Partial<ShaderParameters>
  effect?:       EffectType
  effectAmount?: number
  duration?:     number
  aspectRatio?:  AspectRatioType
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
    fx:       state.effectAmount.toFixed(2),
    dur:      String(state.duration),
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
    const valid = colorsRaw.split(',').filter(h => HEX_RE.test(h)).slice(0, MAX_COLORS)
    if (valid.length >= MIN_COLORS) {
      result.colors = valid.map(h => ({ id: generateId(), hex: `#${h}`, locked: false }))
    }
  }

    const params: Partial<ShaderParameters> = {}
  let hasAnyParam = false
  for (const key of PARAM_KEYS) {
    const raw = p.get(key)
    if (raw !== null) {
      const v = parseFloat(raw)
      if (Number.isFinite(v)) { params[key] = clamp(v, PARAM_RANGES[key].min, PARAM_RANGES[key].max); hasAnyParam = true }
    }
  }
  // Only return the keys that were actually in the URL — don't merge with defaults
  // so a partial URL like ?speed=2 doesn't reset the user's other saved values
  if (hasAnyParam) result.parameters = params

  const effect = p.get('effect') as EffectType | null
  if (effect && (VALID_EFFECTS as readonly string[]).includes(effect)) result.effect = effect

  const fx = parseFloat(p.get('fx') ?? '')
  if (fx >= 0 && fx <= 1) result.effectAmount = fx

  const dur = Number(p.get('dur'))
  if (VALID_DURATIONS.includes(dur)) result.duration = dur

  const ar = p.get('ar') as AspectRatioType | null
  if (ar && (VALID_RATIOS as readonly string[]).includes(ar)) result.aspectRatio = ar

  return result
}
