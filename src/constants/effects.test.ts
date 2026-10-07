import { describe, it, expect } from 'vitest'
import { EFFECTS, EFFECT_IDS, isPostEffect, postEffectId, hasIntensity } from './effects'
import { VALID_EFFECTS } from './parameters'
import { sanitizePersisted } from '../store/persist'
import { decodeUrlToState } from '../utils/urlState'

describe('effect registry', () => {
  it('lists none and grain first, in a stable order', () => {
    expect(EFFECT_IDS.slice(0, 2)).toEqual(['none', 'grain'])
    expect(EFFECTS.map(e => e.id)).toEqual(EFFECT_IDS)
  })

  it('has unique ids and unique, positive, whole GLSL ids for post effects', () => {
    expect(new Set(EFFECT_IDS).size).toBe(EFFECT_IDS.length)
    const glsl = EFFECT_IDS.map(postEffectId).filter((v): v is number => v !== undefined)
    expect(new Set(glsl).size).toBe(glsl.length)
    glsl.forEach(id => { expect(Number.isInteger(id)).toBe(true); expect(id).toBeGreaterThan(0) })
  })

  it('gives a GLSL id to exactly the post-processing effects', () => {
    for (const e of EFFECTS) {
      expect(postEffectId(e.id) !== undefined).toBe(e.stage === 'post')
      expect(isPostEffect(e.id)).toBe(e.stage === 'post')
    }
    expect(EFFECTS.filter(e => e.stage === 'post').map(e => e.id)).toEqual(['glow', 'chromatic', 'glass', 'dither', 'halftone'])
  })

  it('only offers an intensity slider for effects that use it', () => {
    expect(hasIntensity('none')).toBe(false)
    expect(hasIntensity('grain')).toBe(false)
    expect(hasIntensity('glow')).toBe(true)
  })

  it('gives every effect a label and an icon for the UI', () => {
    for (const e of EFFECTS) {
      expect(e.label.length).toBeGreaterThan(0)
      expect(e.icon.length).toBeGreaterThan(0)
    }
  })

  it('is the single source for the accepted effect names', () => {
    expect([...VALID_EFFECTS]).toEqual(EFFECT_IDS)
  })

  it.each(EFFECT_IDS)('accepts "%s" from saved state and from a shared URL', id => {
    expect(sanitizePersisted({ effect: id }).effect).toBe(id)
    expect(decodeUrlToState(`?effect=${id}`).effect).toBe(id)
  })

  it('rejects unknown effect names', () => {
    expect(sanitizePersisted({ effect: 'sepia' }).effect).toBeUndefined()
    expect(decodeUrlToState('?effect=sepia').effect).toBeUndefined()
  })
})
