import { describe, it, expect } from 'vitest'
import { renderSnapshot, snapshotKey, clearSnapshotCache, type SnapshotRequest } from './snapshot'

const BASE: SnapshotRequest = { shader: 'flow', colors: ['#112233', '#445566'] }

describe('snapshotKey', () => {
  it('is stable for equal requests', () => {
    expect(snapshotKey(BASE)).toBe(snapshotKey({ ...BASE, colors: [...BASE.colors] }))
  })

  it.each([
    ['style', { shader: 'mesh' }],
    ['palette', { colors: ['#112233', '#445567'] }],
    ['palette length', { colors: ['#112233', '#445566', '#778899'] }],
    ['effect', { effect: 'glow' }],
    ['intensity', { amount: 0.9 }],
    ['size', { width: 321 }],
    ['time', { time: 9 }],
    ['parameters', { params: { scale: 3 } }],
  ] as [string, Partial<SnapshotRequest>][])('changes when the %s changes', (_name, change) => {
    expect(snapshotKey({ ...BASE, ...change })).not.toBe(snapshotKey(BASE))
  })

  it('ignores the case of hex colors', () => {
    expect(snapshotKey({ ...BASE, colors: ['#AABBCC', '#445566'] })).toBe(snapshotKey({ ...BASE, colors: ['#aabbcc', '#445566'] }))
  })
})

describe('renderSnapshot', () => {
  it('returns null instead of throwing when WebGL is unavailable', () => {
    clearSnapshotCache()
    expect(renderSnapshot(BASE)).toBeNull()
  })

  it('does not keep failures in the cache, so a later success can still happen', () => {
    clearSnapshotCache()
    expect(renderSnapshot(BASE)).toBeNull()
    expect(renderSnapshot(BASE)).toBeNull()
  })
})
