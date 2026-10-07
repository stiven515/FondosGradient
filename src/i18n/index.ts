import { useCallback } from 'react'
import { create } from 'zustand'
import { en, type Dictionary, type TKey } from './en'
import { es } from './es'

export type Lang = 'es' | 'en'
export type { TKey }

export const LANGS: readonly Lang[] = ['es', 'en']
export const LANG_STORAGE_KEY = 'gradient-studio-lang'

const dictionaries: Record<Lang, Dictionary> = { en, es }

type Vars = Record<string, string | number>

export function translate(lang: Lang, key: TKey, vars?: Vars): string {
  const raw = dictionaries[lang][key] ?? en[key] ?? key
  if (!vars) return raw
  return raw.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match))
}

const isLang = (value: unknown): value is Lang => value === 'es' || value === 'en'

// A remembered choice wins; otherwise the browser's first preferred language decides.
export function detectLang(preferred: readonly string[] | undefined, stored: string | null): Lang {
  if (isLang(stored)) return stored
  return preferred?.[0]?.toLowerCase().startsWith('es') ? 'es' : 'en'
}

function readStored(): string | null {
  try { return localStorage.getItem(LANG_STORAGE_KEY) } catch { return null }
}

function reflect(lang: Lang) {
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

interface LangState {
  lang:    Lang
  setLang: (lang: Lang) => void
}

export const useLang = create<LangState>()(set => {
  const initial = detectLang(typeof navigator !== 'undefined' ? navigator.languages : undefined, readStored())
  reflect(initial)
  return {
    lang: initial,
    setLang: lang => {
      try { localStorage.setItem(LANG_STORAGE_KEY, lang) } catch { /* choice just won't persist */ }
      reflect(lang)
      set({ lang })
    },
  }
})

export function useT() {
  const lang = useLang(s => s.lang)
  return useCallback((key: TKey, vars?: Vars) => translate(lang, key, vars), [lang])
}

// For code that runs outside React (toasts, export helpers): uses the language at call time.
export function t(key: TKey, vars?: Vars): string {
  return translate(useLang.getState().lang, key, vars)
}
