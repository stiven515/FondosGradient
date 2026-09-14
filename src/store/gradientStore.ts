// src/store/gradientStore.ts
import { create } from 'zustand'
import type {
  ColorEntry, ShaderType, ShaderParameters,
  GradientState, GradientActions, HistoryEntry,
} from '../types/gradient'
import { generateId } from '../utils/color'

export const DEFAULT_PARAMETERS: ShaderParameters = {
  scale:    1.6,
  curl:     1.2,
  drift:    0.55,
  openness: 0.0,
  seed:     0,
  speed:    1.0,
  grain:    0.18,
}

export const DEFAULT_COLORS: ColorEntry[] = [
  { id: generateId(), hex: '#F9C5D1', locked: false }, // soft rose
  { id: generateId(), hex: '#C5AEF0', locked: false }, // lavender
  { id: generateId(), hex: '#A8D8EA', locked: false }, // sky
  { id: generateId(), hex: '#B5EAD7', locked: false }, // mint
  { id: generateId(), hex: '#FFDAC1', locked: false }, // peach
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
