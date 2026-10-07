import type { EffectType } from '../types/gradient'

export interface EffectMeta {
  label:   string
  icon:    string
  /** none: nothing · scene: applied inside each style shader · post: separate full-screen pass */
  stage:   'none' | 'scene' | 'post'
  /** Identifier the post-processing shader switches on. Present only for post effects. */
  glslId?: number
}

const TABLE: Record<EffectType, EffectMeta> = {
  none:      { label: 'None',     icon: '○', stage: 'none' },
  grain:     { label: 'Grain',    icon: '⁘', stage: 'scene' },
  glow:      { label: 'Glow',     icon: '◎', stage: 'post', glslId: 1 },
  chromatic: { label: 'Chroma',   icon: '◈', stage: 'post', glslId: 2 },
  glass:     { label: 'Glass',    icon: '◻', stage: 'post', glslId: 3 },
  dither:    { label: 'Dither',   icon: '▦', stage: 'post', glslId: 4 },
  halftone:  { label: 'Halftone', icon: '⊹', stage: 'post', glslId: 5 },
}

export const EFFECT_IDS = Object.keys(TABLE) as EffectType[]

export const EFFECTS: (EffectMeta & { id: EffectType })[] = EFFECT_IDS.map(id => ({ id, ...TABLE[id] }))

export function isPostEffect(effect: EffectType): boolean {
  return TABLE[effect].stage === 'post'
}

export function postEffectId(effect: EffectType): number | undefined {
  return TABLE[effect].glslId
}

export function hasIntensity(effect: EffectType): boolean {
  return isPostEffect(effect)
}
