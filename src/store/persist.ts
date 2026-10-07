import type { AspectRatioType, ColorEntry, EffectType, ShaderParameters, ShaderType } from '../types/gradient'
import { SHADER_TYPES } from '../constants/shaders'
import {
  DEFAULT_PARAMETERS, PARAM_KEYS, PARAM_RANGES, VALID_DURATIONS, VALID_EFFECTS, VALID_RATIOS, MAX_COLORS, MIN_COLORS, clamp,
} from '../constants/parameters'

export interface SanitizedState {
  colors?:       ColorEntry[]
  shader?:       ShaderType
  parameters?:   ShaderParameters
  effect?:       EffectType
  effectAmount?: number
  duration?:     number
  aspectRatio?:  AspectRatioType
}

const HEX = /^#[0-9A-Fa-f]{6}$/

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function sanitizePersisted(raw: unknown): SanitizedState {
  if (!isRecord(raw)) return {}
  const out: SanitizedState = {}

  if (Array.isArray(raw.colors)) {
    const colors = raw.colors
      .filter((c): c is Record<string, unknown> => isRecord(c) && typeof c.hex === 'string' && HEX.test(c.hex))
      .slice(0, MAX_COLORS)
      .map((c, i) => ({
        id:     typeof c.id === 'string' ? c.id : `restored-${i}`,
        hex:    c.hex as string,
        locked: c.locked === true,
      }))
    if (colors.length >= MIN_COLORS && colors.length === Math.min(raw.colors.length, MAX_COLORS)) out.colors = colors
  }

  if (typeof raw.shader === 'string' && (SHADER_TYPES as string[]).includes(raw.shader)) out.shader = raw.shader as ShaderType
  if (typeof raw.effect === 'string' && (VALID_EFFECTS as readonly string[]).includes(raw.effect)) out.effect = raw.effect as EffectType
  if (typeof raw.aspectRatio === 'string' && (VALID_RATIOS as readonly string[]).includes(raw.aspectRatio)) out.aspectRatio = raw.aspectRatio as AspectRatioType
  if (typeof raw.duration === 'number' && VALID_DURATIONS.includes(raw.duration)) out.duration = raw.duration
  if (typeof raw.effectAmount === 'number' && Number.isFinite(raw.effectAmount)) out.effectAmount = clamp(raw.effectAmount, 0, 1)

  if (isRecord(raw.parameters)) {
    const params = { ...DEFAULT_PARAMETERS }
    for (const key of PARAM_KEYS) {
      const v = raw.parameters[key]
      if (typeof v === 'number' && Number.isFinite(v)) params[key] = clamp(v, PARAM_RANGES[key].min, PARAM_RANGES[key].max)
    }
    out.parameters = params
  }

  return out
}
