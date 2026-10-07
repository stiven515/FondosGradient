import { describe, it, expect, beforeEach } from 'vitest'
import { loadSaved, saveDesign, removeDesign, parseDesign, MAX_SAVED, SAVED_KEY } from './savedDesigns'
import { DEFAULT_PARAMETERS } from '../constants/parameters'
import type { Design } from '../types/gradient'

const design = (hex = '#112233'): Design => ({
  shader: 'silk',
  colors: [hex, '#445566', '#778899'],
  parameters: { ...DEFAULT_PARAMETERS, speed: 2 },
  effect: 'glow',
  effectAmount: 0.7,
  duration: 20,
  aspectRatio: '1:1',
})

beforeEach(() => localStorage.clear())

describe('saved designs', () => {
  it('starts empty', () => {
    expect(loadSaved()).toEqual([])
  })

  it('saves a design and loads it back intact, newest first', () => {
    saveDesign('First', design('#111111'), 1000)
    saveDesign('Second', design('#222222'), 2000)
    const saved = loadSaved()
    expect(saved.map(s => s.name)).toEqual(['Second', 'First'])
    expect(saved[1].design).toEqual(design('#111111'))
    expect(saved[0].savedAt).toBe(2000)
  })

  it('gives every saved design a unique id', () => {
    const a = saveDesign('A', design(), 1)
    const b = saveDesign('B', design(), 1)
    expect(a.id).not.toBe(b.id)
  })

  it('names blank designs "Untitled"', () => {
    expect(saveDesign('   ', design(), 1).name).toBe('Untitled')
  })

  it('removes a design by id', () => {
    const a = saveDesign('A', design(), 1)
    saveDesign('B', design(), 2)
    removeDesign(a.id)
    expect(loadSaved().map(s => s.name)).toEqual(['B'])
  })

  it('keeps at most MAX_SAVED designs, dropping the oldest', () => {
    for (let i = 0; i < MAX_SAVED + 3; i++) saveDesign(`D${i}`, design(), i)
    const saved = loadSaved()
    expect(saved).toHaveLength(MAX_SAVED)
    expect(saved[0].name).toBe(`D${MAX_SAVED + 2}`)
    expect(saved.some(s => s.name === 'D0')).toBe(false)
  })

  it('survives corrupt storage', () => {
    localStorage.setItem(SAVED_KEY, '{not json')
    expect(loadSaved()).toEqual([])
    localStorage.setItem(SAVED_KEY, JSON.stringify({ nope: true }))
    expect(loadSaved()).toEqual([])
  })

  it('skips individual entries that are invalid and keeps the good ones', () => {
    const good = saveDesign('Good', design(), 5)
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY)!)
    raw.push({ id: 'bad', name: 'Bad', savedAt: 1, design: { shader: 'bogus' } }, 'junk', null)
    localStorage.setItem(SAVED_KEY, JSON.stringify(raw))
    expect(loadSaved().map(s => s.id)).toEqual([good.id])
  })

  it('does not throw when storage is unavailable', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = () => { throw new Error('quota') }
    try {
      expect(() => saveDesign('X', design(), 1)).not.toThrow()
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('parseDesign', () => {
  it('fills defaults for optional fields and clamps values', () => {
    const d = parseDesign({
      shader: 'wave', colors: [{ hex: '#000000' }, { hex: '#FFFFFF' }], effect: 'none',
      parameters: { scale: 99 },
    })
    expect(d?.parameters.scale).toBe(4)
    expect(d?.effectAmount).toBe(0.5)
  })

  it('rejects designs missing essentials', () => {
    expect(parseDesign({ shader: 'wave' })).toBeNull()
    expect(parseDesign(null)).toBeNull()
  })
})
