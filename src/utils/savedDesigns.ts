import type { Design } from '../types/gradient'
import { sanitizePersisted } from '../store/persist'
import { DEFAULT_PARAMETERS } from '../constants/parameters'

export const SAVED_KEY = 'gradient-studio-saved-v1'
export const MAX_SAVED = 24

export interface SavedDesign {
  id:      string
  name:    string
  savedAt: number
  design:  Design
}

export function parseDesign(raw: unknown): Design | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const colors = Array.isArray(r.colors)
    ? r.colors.map(c => (typeof c === 'string' ? { hex: c } : c))
    : r.colors
  const clean = sanitizePersisted({ ...r, colors })
  if (!clean.colors || !clean.shader) return null
  return {
    shader:       clean.shader,
    colors:       clean.colors.map(c => c.hex),
    parameters:   clean.parameters ?? { ...DEFAULT_PARAMETERS },
    effect:       clean.effect ?? 'none',
    effectAmount: clean.effectAmount ?? 0.5,
    ...(clean.duration !== undefined && { duration: clean.duration }),
    ...(clean.aspectRatio !== undefined && { aspectRatio: clean.aspectRatio }),
  }
}

export function loadSaved(): SavedDesign[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]')
    if (!Array.isArray(raw)) return []
    const out: SavedDesign[] = []
    for (const item of raw) {
      if (typeof item !== 'object' || item === null) continue
      const { id, name, savedAt, design } = item as Record<string, unknown>
      const parsed = parseDesign(design)
      if (typeof id === 'string' && typeof name === 'string' && typeof savedAt === 'number' && parsed) {
        out.push({ id, name, savedAt, design: parsed })
      }
    }
    return out
  } catch {
    return []
  }
}

function persist(list: SavedDesign[]): void {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list))
  } catch {
    // storage full or unavailable: the design just won't persist
  }
}

export function saveDesign(name: string, design: Design, now = Date.now()): SavedDesign {
  const entry: SavedDesign = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim() || 'Untitled',
    savedAt: now,
    design,
  }
  persist([entry, ...loadSaved()].slice(0, MAX_SAVED))
  return entry
}

export function removeDesign(id: string): void {
  persist(loadSaved().filter(s => s.id !== id))
}
