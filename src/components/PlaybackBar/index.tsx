// src/components/PlaybackBar/index.tsx
import { useRef, useEffect, useState } from 'react'
import { Play, Pause, Repeat2, ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { AspectRatioType } from '../../types/gradient'
import { clock } from '../../utils/timeline'
import { VALID_DURATIONS } from '../../constants/parameters'
import { useT, type TKey } from '../../i18n'

const ASPECT_OPTIONS: AspectRatioType[] = ['free', '16:9', '4:3', '1:1', '9:16']

const PILL = 'flex w-full items-center gap-1.5 rounded-[16px] bg-raised px-2 py-1.5 shadow-raised pointer-events-auto sm:w-auto sm:gap-2.5 sm:px-2.5'
const SMALL_BTN = 'flex h-8 flex-shrink-0 items-center gap-1.5 rounded-ctl px-2 text-[11.5px] font-bold transition-colors duration-150 hover:bg-teal-soft'

export function PlaybackBar() {
  const t = useT()
  const {
    isPlaying, setPlaying, aspectRatio, setAspectRatio,
    isLooping, setLooping, duration, setDuration,
  } = useGradientStore()
  const [arOpen, setArOpen] = useState(false)
  const arRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!arOpen) return
    function onDown(e: MouseEvent) {
      if (arRef.current && !arRef.current.contains(e.target as Node)) setArOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setArOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [arOpen])

  return (
    <div className={PILL} style={{ maxWidth: '100%' }}>
      <button
        type="button"
        onClick={() => {
          if (!isPlaying && clock.elapsed >= duration * 1000) clock.seekTo = 0
          setPlaying(!isPlaying)
        }}
        aria-label={isPlaying ? t('play.pause') : t('play.play')}
        className="flex h-8 w-8 items-center justify-center rounded-ctl bg-teal text-on-teal transition-colors duration-150 hover:bg-teal-hover"
      >
        {isPlaying
          ? <Pause size={14} strokeWidth={2.2} aria-hidden="true" />
          : <Play size={14} strokeWidth={2.2} aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={() => setLooping(!isLooping)}
        aria-label={isLooping ? t('play.loopOff') : t('play.loopOn')}
        aria-pressed={isLooping}
        className={`${SMALL_BTN} ${isLooping ? 'bg-teal-soft text-teal' : 'text-ink-3'}`}
      >
        <Repeat2 size={14} strokeWidth={2} aria-hidden="true" />
        <span className="hidden sm:inline">{t('play.loop')}</span>
      </button>

      <Scrubber duration={duration} />

      <button
        type="button"
        onClick={() => {
          const next = VALID_DURATIONS[(VALID_DURATIONS.indexOf(duration) + 1) % VALID_DURATIONS.length]
          clock.seekTo = Math.min(clock.elapsed, next * 1000)
          setDuration(next)
        }}
        aria-label={t('play.cycle', { n: duration })}
        title={t('play.cycleTitle')}
        className={`${SMALL_BTN} num min-w-[2.6rem] justify-center text-ink-2`}
      >
        {duration}s
      </button>

      <div ref={arRef} className="relative">
        <button
          type="button"
          onClick={() => setArOpen(o => !o)}
          aria-expanded={arOpen}
          aria-haspopup="true"
          className={`${SMALL_BTN} ${arOpen ? 'bg-teal-soft' : ''} text-ink-2`}
        >
          {t(`ar.${aspectRatio}` as TKey)}
          <ChevronDown size={12} strokeWidth={2.2} aria-hidden="true" className={`transition-transform duration-200 ${arOpen ? 'rotate-180' : ''}`} />
        </button>

        {arOpen && (
          <div
            className="absolute bottom-full right-0 z-10 mb-2 min-w-[5.5rem] rounded-[12px] bg-raised p-1 shadow-pop"
            style={{ boxShadow: 'var(--shadow-pop), inset 0 0 0 1px var(--line)' }}
          >
            {ASPECT_OPTIONS.map(ar => {
              const active = ar === aspectRatio
              return (
                <button
                  key={ar}
                  type="button"
                  aria-pressed={active}
                  onClick={() => { setAspectRatio(ar); setArOpen(false) }}
                  className={`block w-full rounded-[8px] px-3 py-1.5 text-left text-[12px] transition-colors duration-150 ${
                    active ? 'bg-teal-soft font-bold text-ink' : 'font-semibold text-ink-2 hover:bg-sunken'
                  }`}
                >
                  {t(`ar.${ar}` as TKey)}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function Scrubber({ duration }: { duration: number }) {
  const t = useT()
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
        trackRef.current.setAttribute('aria-valuetext', t('play.positionText', { now: label, total: duration }))
      }
    }
    function tick() {
      paint()
      raf = requestAnimationFrame(tick)
    }
    paint()
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, t])

  function seekFromPointer(clientX: number) {
    const rect = trackRef.current!.getBoundingClientRect()
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    clock.seekTo = pct * duration * 1000
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={t('play.position')}
        aria-valuemin={0}
        aria-valuemax={duration}
        className="relative min-w-10 flex-1 cursor-pointer py-3 sm:flex-none"
        style={{ width: 'clamp(64px, 18vw, 170px)', touchAction: 'none' }}
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
        <div className="h-[3px] overflow-hidden rounded-full bg-line-2">
          <div ref={fillRef} className="h-full origin-left bg-copper" style={{ transform: 'scaleX(0)' }} />
        </div>
      </div>
      <span ref={timeRef} className="num hidden min-w-[2.2rem] text-right text-[11.5px] font-semibold text-ink-2 sm:inline" />
    </div>
  )
}
