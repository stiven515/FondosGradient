// src/components/ControlsBar/index.tsx
import { Play, Pause, RotateCcw, Undo2, Redo2, Sparkles } from 'lucide-react'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { generateHarmoniousPalette } from '../../utils/palette'
import type { ShaderParameters } from '../../types/gradient'

export function ControlsBar() {
  const { isPlaying, setPlaying, undo, redo, pushHistory, setColors, setParameter } = useGradientStore()

  function handleGenerate() {
    pushHistory()
    setColors(generateHarmoniousPalette(useGradientStore.getState().colors))
  }

  function handleResetParams() {
    pushHistory()
    Object.entries(DEFAULT_PARAMETERS).forEach(([k, v]) =>
      setParameter(k as keyof ShaderParameters, v)
    )
  }

  return (
    <div className="flex items-center h-11 flex-shrink-0 bg-[#080808] border-t border-[#1a1a1a] px-4 gap-2">
      {/* Left: undo / redo */}
      <div className="flex items-center gap-0.5 mr-auto">
        <IconBtn onClick={undo} label="Undo">
          <Undo2 size={14} />
        </IconBtn>
        <IconBtn onClick={redo} label="Redo">
          <Redo2 size={14} />
        </IconBtn>
      </div>

      {/* Center: generate */}
      <button
        onClick={handleGenerate}
        className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-[#111] rounded-full font-semibold text-[12px] hover:bg-[#e8e8e8] transition-colors"
      >
        <Sparkles size={12} />
        Generate
      </button>

      {/* Right: play/pause + reset */}
      <div className="flex items-center gap-0.5 ml-auto">
        <IconBtn onClick={() => setPlaying(!isPlaying)} label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
        </IconBtn>
        <IconBtn onClick={handleResetParams} label="Reset parameters">
          <RotateCcw size={14} />
        </IconBtn>
      </div>
    </div>
  )
}

function IconBtn({ onClick, label, children }: {
  onClick: () => void
  label:   string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-7 h-7 flex items-center justify-center text-[#666] hover:text-white rounded transition-colors"
    >
      {children}
    </button>
  )
}
