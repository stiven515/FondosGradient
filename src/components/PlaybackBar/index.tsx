// src/components/PlaybackBar/index.tsx
import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Repeat2, ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { AspectRatioType } from '../../types/gradient'

const ASPECT_OPTIONS: AspectRatioType[] = ['free', '16:9', '4:3', '1:1', '9:16']
const ASPECT_LABELS: Record<AspectRatioType, string> = {
  'free': 'Free', '16:9': '16:9', '4:3': '4:3', '1:1': '1:1', '9:16': '9:16'
}

export function PlaybackBar() {
  const { isPlaying, setPlaying, aspectRatio, setAspectRatio, isLooping, setLooping } = useGradientStore()
  const [arOpen, setArOpen] = useState(false)
  const arRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!arOpen) return
    function handler(e: MouseEvent) {
      if (arRef.current && !arRef.current.contains(e.target as Node)) setArOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [arOpen])

  return (
    <div
      className="flex items-center gap-3 px-4 rounded-xl"
      style={{
        height: 40,
        background: 'rgba(10, 12, 18, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* Play / Pause */}
      <button
        onClick={() => setPlaying(!isPlaying)}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="flex items-center justify-center rounded-md transition-all"
        style={{ width: 28, height: 28, color: 'var(--text-secondary)' }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'var(--text-primary)'
          e.currentTarget.style.background = 'var(--bg-panel)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'var(--text-secondary)'
          e.currentTarget.style.background = 'transparent'
        }}
      >
        {isPlaying
          ? <Pause size={13} strokeWidth={2} />
          : <Play  size={13} strokeWidth={2} />
        }
      </button>

      {/* Loop toggle */}
      <button
        onClick={() => setLooping(!isLooping)}
        aria-label={isLooping ? 'Disable loop' : 'Enable loop'}
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all select-none"
        style={{
          color: isLooping ? 'var(--accent)' : 'var(--text-muted)',
          background: isLooping ? 'var(--accent-glow)' : 'transparent',
          border: `1px solid ${isLooping ? 'var(--accent-dim)' : 'transparent'}`,
          fontWeight: 500,
        }}
      >
        <Repeat2 size={11} strokeWidth={2} />
        <span>Loop</span>
      </button>

      {/* Duration label */}
      <span
        className="text-[11px]"
        style={{ color: 'var(--text-muted)', fontWeight: 500 }}
      >
        10s
      </span>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Aspect ratio */}
      <div ref={arRef} className="relative">
        <button
          onClick={() => setArOpen(!arOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-all"
          style={{
            color: 'var(--text-secondary)',
            background: arOpen ? 'var(--bg-panel)' : 'transparent',
            border: `1px solid ${arOpen ? 'var(--border)' : 'transparent'}`,
            fontWeight: 500,
          }}
        >
          {ASPECT_LABELS[aspectRatio]}
          <ChevronDown size={10} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
        </button>

        {arOpen && (
          <div
            className="absolute bottom-full right-0 mb-1 rounded-md py-1 z-10"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              minWidth: 80,
            }}
          >
            {ASPECT_OPTIONS.map(ar => (
              <button
                key={ar}
                onClick={() => { setAspectRatio(ar); setArOpen(false) }}
                className="w-full text-left px-3 py-1.5 text-[11px] transition-colors"
                style={{
                  color: ar === aspectRatio ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: ar === aspectRatio ? 'var(--accent-dim)' : 'transparent',
                  fontWeight: ar === aspectRatio ? 600 : 400,
                }}
                onMouseEnter={e => {
                  if (ar !== aspectRatio) e.currentTarget.style.background = 'var(--bg-panel)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = ar === aspectRatio ? 'var(--accent-dim)' : 'transparent'
                }}
              >
                {ASPECT_LABELS[ar]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
