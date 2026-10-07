// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useGradientStore } from '../store/gradientStore'
import { useUiStore } from '../store/uiStore'
import { generateHarmoniousPalette } from '../utils/palette'
import { SHADER_TYPES } from '../constants/shaders'

function isTyping(t: HTMLElement | null): boolean {
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)
}

// Space natively activates focused controls; stealing it would break keyboard use.
function isInteractive(t: HTMLElement | null): boolean {
  return !!t && (t.tagName === 'BUTTON' || t.tagName === 'A' || ['button', 'slider', 'option', 'menuitem'].includes(t.getAttribute('role') ?? ''))
}

export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ui = useUiStore.getState()
      if (e.key === 'Escape' && ui.helpOpen) { ui.toggleHelp(false); return }

      const target = e.target instanceof HTMLElement ? e.target : null
      if (isTyping(target)) return

      const s = useGradientStore.getState()
      const ctrl = e.ctrlKey || e.metaKey
      const key = e.key.toLowerCase()

      if (ctrl && !e.altKey) {
        if (key === 'z') { e.preventDefault(); if (e.shiftKey) s.redo(); else s.undo() }
        else if (key === 'y') { e.preventDefault(); s.redo() }
        return
      }
      if (e.altKey) return

      if (e.code === 'Space') {
        if (isInteractive(target)) return
        e.preventDefault()
        s.setPlaying(!s.isPlaying)
        return
      }
      if (e.key === '?') { e.preventDefault(); ui.toggleHelp(); return }
      if (key === 'p') { e.preventDefault(); s.setPlaying(!s.isPlaying); return }
      if (key === 'g') {
        e.preventDefault()
        s.pushHistory()
        s.setColors(generateHarmoniousPalette(s.colors))
        return
      }
      if (key === 's') {
        e.preventDefault()
        s.setShader(SHADER_TYPES[(SHADER_TYPES.indexOf(s.shader) + 1) % SHADER_TYPES.length])
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
