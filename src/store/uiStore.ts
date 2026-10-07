import { create } from 'zustand'

export interface Toast { id: number; message: string; tone: 'info' | 'error' }

interface UiState {
  helpOpen: boolean
  toasts:   Toast[]
  toggleHelp: (open?: boolean) => void
  pushToast:  (message: string, tone?: Toast['tone']) => void
  dismissToast: (id: number) => void
}

let nextId = 1

export const useUiStore = create<UiState>()((set) => ({
  helpOpen: false,
  toasts:   [],
  toggleHelp: (open) => set(s => ({ helpOpen: open ?? !s.helpOpen })),
  pushToast: (message, tone = 'info') =>
    set(s => ({ toasts: [...s.toasts.slice(-2), { id: nextId++, message, tone }] })),
  dismissToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

export const toast = (message: string, tone: Toast['tone'] = 'info') =>
  useUiStore.getState().pushToast(message, tone)
