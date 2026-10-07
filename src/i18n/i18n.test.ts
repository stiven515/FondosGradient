import { describe, it, expect, beforeEach, vi } from 'vitest'
import { en } from './en'
import { es } from './es'
import { translate, detectLang, useLang, LANG_STORAGE_KEY } from './index'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('dictionaries', () => {
  it('define exactly the same keys in both languages', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })

  it.each(Object.keys(en))('"%s" is filled in both languages', key => {
    expect((en as Record<string, string>)[key].trim().length).toBeGreaterThan(0)
    expect((es as Record<string, string>)[key].trim().length).toBeGreaterThan(0)
  })

  it('use the same {placeholders} in both languages', () => {
    for (const key of Object.keys(en)) {
      const a = placeholders((en as Record<string, string>)[key])
      const b = placeholders((es as Record<string, string>)[key])
      expect(b, key).toEqual(a)
    }
  })

  it('actually translate the interface instead of copying English', () => {
    const same = Object.keys(en).filter(k => (en as Record<string, string>)[k] === (es as Record<string, string>)[k])
    // Brand names, units and technical terms legitimately match; most of the interface must differ.
    expect(same.length / Object.keys(en).length).toBeLessThan(0.35)
  })
})

describe('translate', () => {
  it('returns the text for the requested language', () => {
    expect(translate('en', 'lang.name')).toBe(en['lang.name'])
    expect(translate('es', 'lang.name')).toBe(es['lang.name'])
  })

  it('fills {placeholders}', () => {
    const key = (Object.keys(en) as (keyof typeof en)[]).find(k => placeholders(en[k]).length > 0)!
    const [name] = placeholders(en[key])
    expect(translate('en', key, { [name]: 'X7' })).toContain('X7')
    expect(translate('es', key, { [name]: 'X7' })).toContain('X7')
  })

  it('leaves a placeholder untouched when no value is given', () => {
    const key = (Object.keys(en) as (keyof typeof en)[]).find(k => placeholders(en[k]).length > 0)!
    expect(translate('en', key)).toMatch(/\{\w+\}/)
  })

  it('never throws and falls back to the key for an unknown key', () => {
    expect(translate('es', 'does.not.exist' as keyof typeof en)).toBe('does.not.exist')
  })
})

describe('detectLang', () => {
  it('uses a stored valid choice first', () => {
    expect(detectLang(['en-US'], 'es')).toBe('es')
    expect(detectLang(['es-CO'], 'en')).toBe('en')
  })

  it('ignores an invalid stored value', () => {
    expect(detectLang(['es-MX'], 'fr')).toBe('es')
    expect(detectLang(['de-DE'], 'fr')).toBe('en')
  })

  it('picks Spanish for any Spanish locale and English otherwise', () => {
    expect(detectLang(['es'], null)).toBe('es')
    expect(detectLang(['es-AR', 'en'], null)).toBe('es')
    expect(detectLang(['en-GB'], null)).toBe('en')
    expect(detectLang(['pt-BR'], null)).toBe('en')
  })

  it('uses the first preferred language, not any later one', () => {
    expect(detectLang(['en-US', 'es-ES'], null)).toBe('en')
  })

  it('defaults to English without information', () => {
    expect(detectLang(undefined, null)).toBe('en')
    expect(detectLang([], null)).toBe('en')
  })
})

describe('language store', () => {
  beforeEach(() => {
    localStorage.clear()
    useLang.setState({ lang: 'en' })
  })

  it('switches language, remembers it and updates <html lang>', () => {
    useLang.getState().setLang('es')
    expect(useLang.getState().lang).toBe('es')
    expect(localStorage.getItem(LANG_STORAGE_KEY)).toBe('es')
    expect(document.documentElement.lang).toBe('es')
    useLang.getState().setLang('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('does not throw when storage is unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => useLang.getState().setLang('es')).not.toThrow()
    expect(useLang.getState().lang).toBe('es')
    spy.mockRestore()
  })
})
