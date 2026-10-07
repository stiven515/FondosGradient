// src/store/gradientStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ColorEntry, ShaderType, ShaderParameters,
  GradientState, GradientActions, HistoryEntry,
  EffectType, AspectRatioType,
} from '../types/gradient'
import { generateId } from '../utils/color'
import { DEFAULT_PARAMETERS } from '../constants/parameters'
import { sanitizePersisted } from './persist'

export { DEFAULT_PARAMETERS }

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

export const useGradientStore = create<Store>()(
  persist(
    (set, get) => ({
      colors:       [...DEFAULT_COLORS],
      shader:       'flow',
      parameters:   { ...DEFAULT_PARAMETERS },
      isPlaying:    true,
      isLooping:    true,
      history:      [],
      historyIndex: -1,
      effect:       'grain' as EffectType,
      effectAmount: 0.5,
      duration:     10,
      aspectRatio:  'free' as AspectRatioType,

      moveColor: (from, to) =>
        set(s => {
          if (from === to || from < 0 || to < 0 || from >= s.colors.length || to >= s.colors.length) return s
          const colors = [...s.colors]
          const [moved] = colors.splice(from, 1)
          colors.splice(to, 0, moved)
          return { colors }
        }),

      setEffectAmount: (amount) => set({ effectAmount: Math.min(1, Math.max(0, amount)) }),

      setDuration: (duration) => set({ duration }),

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

      lockAll: () =>
        set(s => ({ colors: s.colors.map(c => ({ ...c, locked: true })) })),

      setShader: (shader: ShaderType) => set({ shader }),

      setParameter: (key: keyof ShaderParameters, value: number) =>
        set(s => ({ parameters: { ...s.parameters, [key]: value } })),

      setPlaying: (isPlaying) => set({ isPlaying }),

      setLooping: (isLooping) => set({ isLooping }),

      setEffect: (effect: EffectType) => {
        set(s => {
          const grain = effect === 'none' ? 0 : effect === 'grain' ? DEFAULT_PARAMETERS.grain : s.parameters.grain
          return { effect, parameters: { ...s.parameters, grain } }
        })
      },

      setAspectRatio: (aspectRatio: AspectRatioType) => set({ aspectRatio }),

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
    }),
    {
      name: 'gradient-studio-v1',
      version: 1,
      partialize: (s) => ({
        colors:      s.colors,
        shader:      s.shader,
        parameters:  s.parameters,
        effect:       s.effect,
        effectAmount: s.effectAmount,
        duration:     s.duration,
        aspectRatio:  s.aspectRatio,
      }),
      migrate: (persisted) => sanitizePersisted(persisted) as Store,
      merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
    }
  )
)
