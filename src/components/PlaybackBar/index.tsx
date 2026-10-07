// src/components/PlaybackBar/index.tsx
import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Repeat2, ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { AspectRatioType } from '../../types/gradient'
import { clock } from '../../utils/timeline'
import { VALID_DURATIONS } from '../../constants/parameters'

const ASPECT_OPTIONS: AspectRatioType[] = ['free', '16:9', '4:3', '1:1', '9:16']
const ASPECT_LABELS: Record<AspectRatioType, string> = {
  'free': 'Free', '16:9': '16:9', '4:3': '4:3', '1:1': '1:1', '9:16': '9:16'
}

export function PlaybackBar() {
  const {
    isPlaying, setPlaying, aspectRatio, setAspectRatio,
    isLooping, setLooping, duration, setDuration,
  } = useGradientStore()
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
      className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 rounded-xl pointer-events-auto"
      style={{
        height: 40,
        maxWidth: '100%',
        background: 'rgba(10, 12, 18, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.07)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.45)',
      }}
    >
      {/* Play / Pause */}
      <button
        onClick={() => {
          if (!isPlaying && clock.elapsed >= duration * 1000) clock.seekTo = 0
          setPlaying(!isPlaying)
        }}
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

      <Scrubber duration={duration} />

      <button
        onClick={() => {
          const next = VALID_DURATIONS[(VALID_DURATIONS.indexOf(duration) + 1) % VALID_DURATIONS.length]
          clock.seekTo = Math.min(clock.elapsed, next * 1000)
          setDuration(next)
        }}
        aria-label={`Cycle duration, currently ${duration} seconds`}
        title="Cycle duration"
        className="px-2 py-1 rounded-md text-[11px] tabular-nums transition-colors"
        style={{ color: 'var(--text-secondary)', fontWeight: 500, minWidth: 34 }}
        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-panel)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        {duration}s
      </button>

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

function Scrubber({ duration }: { duration: number }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const fillRef  = useRef<HTMLDivElement>(null)
  const timeRef  = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    let raf = 0
    function paint() {
      const seconds = clock.elapsed / 1000
      const pct = Math.min(1, clock.elapsed / (duration * 1000))
      const label = seconds.toFixed(1)
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${pct})`
      if (timeRef.current) timeRef.current.textContent = label + 's'
      if (trackRef.current) {
        trackRef.current.setAttribute('aria-valuenow', label)
        trackRef.current.setAttribute('aria-valuetext', `${label} of ${duration} seconds`)
      }
    }
    function tick() {
      paint()
      raf = requestAnimationFrame(tick)
    }
    paint()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration])

  function seekFromPointer(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    clock.seekTo = pct * duration * 1000
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={duration}
        className="relative cursor-pointer py-2"
        style={{ width: 'clamp(72px, 20vw, 160px)', touchAction: 'none' }}
        onPointerDown={e => {
          seekFromPointer(e.clientX)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={e => {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFromPointer(e.clientX)
        }}
        onKeyDown={e => {
          if (e.key === 'Home') { e.preventDefault(); clock.seekTo = 0; return }
          if (e.key === 'End')  { e.preventDefault(); clock.seekTo = duration * 1000; return }
          const step = e.key === 'ArrowRight' ? 500 : e.key === 'ArrowLeft' ? -500 : 0
          if (step) { e.preventDefault(); clock.seekTo = clock.elapsed + step }
        }}
      >
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.10)' }}>
          <div
            ref={fillRef}
            className="h-full origin-left"
            style={{ background: 'var(--accent)', transform: 'scaleX(0)' }}
          />
        </div>
      </div>
      <span
        ref={timeRef}
        className="text-[11px] tabular-nums"
        style={{ color: 'var(--text-muted)', fontWeight: 500, minWidth: 30, textAlign: 'right' }}
      />
    </div>
  )
}
