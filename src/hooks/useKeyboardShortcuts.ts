// src/hooks/useKeyboardShortcuts.ts
import { useEffect } from 'react'
import { useGradientStore } from '../store/gradientStore'
import { generateHarmoniousPalette } from '../utils/palette'

function isTypingTarget(e: KeyboardEvent): boolean {
  const t = e.target as HTMLElement
  return t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable
}

export function useKeyboardShortcuts() {
  const { undo, redo, setPlaying, isPlaying, colors, setColors, pushHistory } = useGradientStore()

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
      if (e.key.toLowerCase() === 'p' && !isTypingTarget(e))  { e.preventDefault(); setPlaying(!isPlaying) }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, setPlaying, isPlaying, setColors, pushHistory])
}
