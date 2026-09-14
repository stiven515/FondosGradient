// src/store/gradientStore.ts
import { create } from 'zustand'
import type {
  ColorEntry, ShaderType, ShaderParameters,
  GradientState, GradientActions, HistoryEntry,
} from '../types/gradient'
import { generateId } from '../utils/color'

export const DEFAULT_PARAMETERS: ShaderParameters = {
  scale:    1.7,
  curl:     1.05,
  drift:    0.5,
  openness: 0.28,
  seed:     0,
  speed:    1.0,
  grain:    0.08,
}

export const DEFAULT_COLORS: ColorEntry[] = [
  { id: generateId(), hex: '#FFE7F0', locked: false },
  { id: generateId(), hex: '#EAB5E6', locked: false },
  { id: generateId(), hex: '#E2D3E4', locked: false },
  { id: generateId(), hex: '#E0A5DA', locked: false },
  { id: generateId(), hex: '#F6A7D6', locked: false },
]

function snapshot(state: GradientState): HistoryEntry {
  return {
    colors:     state.colors.map(c => ({ ...c })),
    shader:     state.shader,
    parameters: { ...state.parameters },
  }
}

type Store = GradientState & GradientActions

export const useGradientStore = create<Store>((set, get) => ({
  colors:       [...DEFAULT_COLORS],
  shader:       'flow',
  parameters:   { ...DEFAULT_PARAMETERS },
  isPlaying:    true,
  history:      [],
  historyIndex: -1,

  setColors: (colors) => set({ colors }),

  updateColor: (id, hex) =>
    set(s => ({ colors: s.colors.map(c => c.id === id ? { ...c, hex } : c) })),

  addColor: () =>
    set(s => s.colors.length >= 8 ? s : {
      colors: [...s.colors, { id: generateId(), hex: '#FFFFFF', locked: false }],
    }),

  removeColor: (id) =>
    set(s => s.colors.length <= 2 ? s : { colors: s.colors.filter(c => c.id !== id) }),

  toggleLock: (id) =>
    set(s => ({ colors: s.colors.map(c => c.id === id ? { ...c, locked: !c.locked } : c) })),

  setShader: (shader: ShaderType) => set({ shader }),

  setParameter: (key: keyof ShaderParameters, value: number) =>
    set(s => ({ parameters: { ...s.parameters, [key]: value } })),

  setPlaying: (isPlaying) => set({ isPlaying }),

  pushHistory: () => {
    const s = get()
    const trimmed = s.history.slice(0, s.historyIndex + 1)
    set({ history: [...trimmed, snapshot(s)], historyIndex: trimmed.length })
  },

  undo: () => {
    const s = get()
    const { history, historyIndex } = s
    if (historyIndex < 0) return
    const entry = history[historyIndex]
    // Save current live state at historyIndex+1 for redo, then restore checkpoint
    const newHistory = [...history.slice(0, historyIndex + 1), snapshot(s)]
    set({
      colors:       entry.colors,
      shader:       entry.shader,
      parameters:   { ...entry.parameters },
      history:      newHistory,
      historyIndex: historyIndex,
    })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex + 1 >= history.length) return
    const entry = history[historyIndex + 1]
    set({
      colors:       entry.colors,
      shader:       entry.shader,
      parameters:   { ...entry.parameters },
      historyIndex: historyIndex + 1,
    })
  },
}))
