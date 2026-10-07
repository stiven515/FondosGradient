// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useGradientStore } from '../store/gradientStore'
import { generateHarmoniousPalette } from '../utils/palette'
import { SHADER_TYPES } from '../components/StyleSelector'

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
}

export function useKeyboardShortcuts() {
  const { undo, redo, setPlaying, isPlaying, setColors, pushHistory, shader, setShader } = useGradientStore()

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey

      if (e.code === 'Space' && !isTypingTarget(e)) {
        e.preventDefault()
        pushHistory()
        setColors(generateHarmoniousPalette(useGradientStore.getState().colors))
        return
      }
      if (ctrl && e.key === 'z' && !e.shiftKey && !isTypingTarget(e)) { e.preventDefault(); undo(); return }
      if (ctrl && e.key === 'z' &&  e.shiftKey && !isTypingTarget(e)) { e.preventDefault(); redo(); return }
      if (e.key.toLowerCase() === 'p' && !isTypingTarget(e)) { e.preventDefault(); setPlaying(!isPlaying); return }
      // Tab cycles through shader types
      if (e.key === 'Tab' && !isTypingTarget(e)) {
        e.preventDefault()
        const idx = SHADER_TYPES.indexOf(shader)
        const next = SHADER_TYPES[(idx + 1) % SHADER_TYPES.length]
        setShader(next)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setPlaying, isPlaying, setColors, pushHistory, shader, setShader])
}
