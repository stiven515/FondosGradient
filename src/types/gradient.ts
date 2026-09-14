// src/types/gradient.ts

export type ShaderType =
  | 'flow'
  | 'beam'
  | 'mesh'
  | 'liquid'
  | 'wave'
  | 'silk'
  | 'stripe'

export interface ShaderParameters {
  scale:    number  // 0.5 – 4.0
  curl:     number  // 0.0 – 3.0
  drift:    number  // 0.0 – 1.0
  openness: number  // 0.0 – 1.0
  seed:     number  // 0 – 100
  speed:    number  // 0.0 – 3.0
  grain:    number  // 0.0 – 0.5
}

export interface ColorEntry {
  id:     string
  hex:    string
  locked: boolean
}

export interface HistoryEntry {
  colors:     ColorEntry[]
  shader:     ShaderType
  parameters: ShaderParameters
}

export interface GradientState {
  colors:       ColorEntry[]
  shader:       ShaderType
  parameters:   ShaderParameters
  isPlaying:    boolean
  history:      HistoryEntry[]
  historyIndex: number
}

export interface GradientActions {
  setColors:    (colors: ColorEntry[]) => void
  updateColor:  (id: string, hex: string) => void
  addColor:     () => void
  removeColor:  (id: string) => void
  toggleLock:   (id: string) => void
  setShader:    (shader: ShaderType) => void
  setParameter: (key: keyof ShaderParameters, value: number) => void
  setPlaying:   (playing: boolean) => void
  pushHistory:  () => void
  undo:         () => void
  redo:         () => void
}
