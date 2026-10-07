import { describe, it, expect } from 'vitest'
import { toCss } from './css'

const COLORS = ['#112233', '#445566', '#778899', '#AABBCC']

describe('toCss', () => {
  it('builds a linear gradient with every color in order', () => {
    const css = toCss(COLORS, 'linear')
    expect(css).toContain('linear-gradient(135deg, #112233, #445566, #778899, #AABBCC)')
    expect(css.trim().endsWith(';')).toBe(true)
  })

  it('builds a layered mesh with one radial layer per color over a linear base', () => {
    const css = toCss(COLORS, 'mesh')
    expect(css.match(/radial-gradient/g)).toHaveLength(COLORS.length)
    expect(css).toContain('linear-gradient(135deg, #112233')
    COLORS.forEach(c => expect(css).toContain(c))
  })

  it('always includes a solid fallback color first', () => {
    expect(toCss(COLORS, 'mesh').split('\n')[0]).toBe('background-color: #112233;')
  })

  it('spreads radial layers to different positions', () => {
    const positions = toCss(COLORS, 'mesh').match(/at \d+% \d+%/g)!
    expect(new Set(positions).size).toBe(COLORS.length)
  })

  it('handles a single color without breaking the syntax', () => {
    const css = toCss(['#123456'], 'linear')
    expect(css).toContain('linear-gradient(135deg, #123456, #123456)')
  })

  it('returns an empty string for no colors', () => {
    expect(toCss([], 'linear')).toBe('')
  })
})
