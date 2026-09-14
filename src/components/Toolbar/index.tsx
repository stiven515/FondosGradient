// src/components/Toolbar/index.tsx
import { Play, Pause, RotateCcw, RotateCw } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'

const SHADER_LABELS: Record<string, string> = {
  flow: 'Flow', beam: 'Beam', mesh: 'Mesh',
  liquid: 'Liquid', wave: 'Wave', silk: 'Silk', stripe: 'Stripe',
}

export function Toolbar() {
  const { shader, isPlaying, setPlaying, undo, redo, history, historyIndex } = useGradientStore()
  const canUndo = historyIndex >= 0
  const canRedo = historyIndex < history.length - 1

  return (
    <header className="flex items-center justify-between px-4 h-11 border-b border-[#141414] flex-shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tracking-tight">Gradient Studio</span>
        <span className="text-xs text-gray-700">·</span>
        <span className="text-xs text-gray-500">{SHADER_LABELS[shader]}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-2 text-gray-500 hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
          aria-label="Undo" title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-2 text-gray-500 hover:text-gray-300 disabled:opacity-25 disabled:cursor-not-allowed rounded transition-colors"
          aria-label="Redo" title="Redo (Ctrl+Shift+Z)"
        >
          <RotateCw size={13} />
        </button>
        <button
          onClick={() => setPlaying(!isPlaying)}
          className="p-2 text-gray-400 hover:text-white rounded transition-colors"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause (P)' : 'Play (P)'}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} />}
        </button>
      </div>
    </header>
  )
}
