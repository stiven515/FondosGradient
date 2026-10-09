import { useState, useRef, useEffect } from 'react'
import type { ReactNode } from 'react'
import { ArrowUpRight, Circle } from 'lucide-react'
import {
  clampSize, evenSize, exportImage, getCanvas, presetSize, DEFAULT_QUALITY, MAX_EDGE,
  type ExportFormat, type ExportSize, type SizePreset,
} from '../../utils/exportPng'
import { toast } from '../../store/uiStore'
import { useGradientStore } from '../../store/gradientStore'
import { toCss } from '../../utils/css'
import { availableVideoFormats, pickMimeFor, warmUpRecorder, type VideoFormat, type VideoQuality } from '../../utils/recorder'
import { recordLoop } from '../../utils/recordLoop'
import { t as translate, useT } from '../../i18n'
import { Button } from '../../ui/Button'
import { Cut } from '../../ui/Cut'

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' }, { id: 'jpg', label: 'JPG' }, { id: 'webp', label: 'WebP' },
]
const FPS_OPTIONS: { id: '30' | '60'; label: string }[] = [{ id: '30', label: '30 fps' }, { id: '60', label: '60 fps' }]
const MAX_VIDEO_EDGE = 3840
const NUMBER_FIELD = 'num h-9 w-full min-w-0 rounded-ctl bg-sunken px-2.5 text-[12.5px] font-semibold text-ink outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal'

type SizeChoice = SizePreset | 'custom'

function Choice<T extends string>({ name, options, value, onChange }: {
  name: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className="grid gap-1 rounded-[11px] bg-sunken p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(o => {
        const active = o.id === value
        return (
          <label
            key={o.id}
            className={`cursor-pointer select-none rounded-[8px] py-1.5 text-center text-[11.5px] font-bold transition-colors duration-150 focus-within:outline focus-within:outline-2 focus-within:outline-teal ${
              active ? 'bg-raised text-ink shadow-[0_1px_2px_rgba(18,52,59,0.2)]' : 'text-ink-3 hover:text-ink'
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={active}
              onChange={() => onChange(o.id)}
              className="sr-only"
              aria-label={o.label}
            />
            {o.label}
          </label>
        )
      })}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="micro m-0">{title}</h3>
      {children}
    </section>
  )
}

export function ExportMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [quality, setQuality] = useState(Math.round(DEFAULT_QUALITY * 100))
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('2k')
  const [custom, setCustom] = useState<ExportSize>({ w: 2560, h: 1440 })
  const [keepRatio, setKeepRatio] = useState(true)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [videoSize, setVideoSize] = useState<SizePreset>('hd')
  const [fps, setFps] = useState<'30' | '60'>('60')
  const [videoFormat, setVideoFormat] = useState<VideoFormat | null>(null)
  const [videoQuality, setVideoQuality] = useState<VideoQuality>('high')
  const abortRef = useRef<AbortController | null>(null)
  const duration = useGradientStore(s => s.duration)
  const ref = useRef<HTMLDivElement>(null)

  const canvas = getCanvas()
  const cw = canvas?.width ?? 0
  const ch = canvas?.height ?? 0
  const ratio = cw > 0 && ch > 0 ? cw / ch : 1

  const videoFormats = availableVideoFormats()
  const chosenVideoFormat = videoFormat && videoFormats.includes(videoFormat) ? videoFormat : videoFormats[0]

  const sizeChoices: { id: SizeChoice; label: string }[] = [
    { id: 'screen', label: t('export.preset.screen') }, { id: 'hd', label: 'HD' },
    { id: '2k', label: '2K' }, { id: '4k', label: '4K' }, { id: 'custom', label: t('export.custom') },
  ]
  const videoSizes: { id: SizePreset; label: string }[] = [
    { id: 'screen', label: t('export.preset.screen') }, { id: 'hd', label: 'HD' }, { id: '2k', label: '2K' }, { id: '4k', label: '4K' },
  ]
  const videoQualities: { id: VideoQuality; label: string }[] = [
    { id: 'normal', label: t('export.q.normal') }, { id: 'high', label: t('export.q.high') }, { id: 'max', label: t('export.q.max') },
  ]

  useEffect(() => () => abortRef.current?.abort(), [])

  // Get the browser's video encoder ready while the person chooses their settings.
  useEffect(() => {
    if (!open || !chosenVideoFormat || typeof MediaRecorder === 'undefined') return
    const mime = pickMimeFor(chosenVideoFormat, m => MediaRecorder.isTypeSupported(m))
    if (mime) void warmUpRecorder(mime)
  }, [open, chosenVideoFormat])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const size: ExportSize = sizeChoice === 'custom' ? clampSize(custom) : presetSize(cw, ch, sizeChoice)
  const videoPixels = evenSize(clampSize(presetSize(cw, ch, videoSize), MAX_VIDEO_EDGE))

  function chooseSize(next: SizeChoice) {
    // Opening the custom fields starts from the size that was selected, so nothing jumps.
    if (next === 'custom' && sizeChoice !== 'custom') setCustom(size)
    setSizeChoice(next)
  }

  function setDimension(axis: 'w' | 'h', raw: string) {
    const value = Math.min(MAX_EDGE, Math.max(0, Math.floor(Number(raw) || 0)))
    setCustom(prev => {
      if (!keepRatio) return { ...prev, [axis]: value }
      return axis === 'w'
        ? { w: value, h: Math.max(1, Math.round(value / ratio)) }
        : { w: Math.max(1, Math.round(value * ratio)), h: value }
    })
  }

  async function run() {
    setBusy(true)
    const ok = await exportImage(format, size, quality / 100)
    setBusy(false)
    setOpen(false)
    if (ok) toast(translate('toast.exported'))
    else toast(translate('toast.exportFailed'), 'error')
  }

  async function copyCss(kind: 'linear' | 'mesh') {
    const hexes = useGradientStore.getState().colors.map(c => c.hex)
    try {
      await navigator.clipboard.writeText(toCss(hexes, kind))
      toast(translate('toast.cssCopied'))
    } catch {
      toast(translate('toast.cssFailed'), 'error')
    }
  }

  async function record() {
    const controller = new AbortController()
    abortRef.current = controller
    setProgress(0)
    const result = await recordLoop(setProgress, controller.signal, {
      size: presetSize(cw, ch, videoSize),
      fps: Number(fps),
      format: chosenVideoFormat,
      quality: videoQuality,
    })
    abortRef.current = null
    setProgress(null)
    if (result === 'saved') toast(translate('toast.videoSaved'))
    else if (result === 'failed') toast(translate('toast.videoFailed'), 'error')
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="primary"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t('export.open')}
        title={t('export.open')}
        className="!px-2.5 sm:!px-4"
        trailing={<ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />}
      >
        <span className="hidden sm:inline">{t('export.cta')}</span>
      </Button>

      {open && (
        <Cut
          line
          className="absolute right-0 top-full z-40 mt-2 shadow-pop"
          style={{ width: 'min(320px, calc(100vw - 24px))', maxHeight: 'calc(100dvh - 84px)' }}
          fillClassName="flex flex-col gap-5 overflow-y-auto p-4"
        >
          <Section title={t('export.imageLabel')}>
            <div className="flex flex-col gap-2">
              <span className="micro">{t('export.format')}</span>
              <Choice name={t('export.format')} options={FORMATS} value={format} onChange={setFormat} />
            </div>

            {format !== 'png' && (
              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between">
                  <span className="micro">{t('export.quality')}</span>
                  <span className="num text-[11.5px] font-semibold text-ink">{quality}%</span>
                </span>
                <input
                  type="range"
                  min={60}
                  max={100}
                  step={1}
                  value={quality}
                  onChange={e => setQuality(Number(e.target.value))}
                  aria-label={t('export.quality')}
                />
              </label>
            )}

            <div className="flex flex-col gap-2">
              <span className="micro">{t('export.size')}</span>
              <Choice name={t('export.size')} options={sizeChoices} value={sizeChoice} onChange={chooseSize} />

              {sizeChoice === 'custom' && (
                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-semibold text-ink-3">{t('export.width')}</span>
                      <input
                        type="number" inputMode="numeric" min={1} max={MAX_EDGE}
                        value={custom.w || ''}
                        onChange={e => setDimension('w', e.target.value)}
                        aria-label={t('export.width')}
                        className={NUMBER_FIELD}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-[10.5px] font-semibold text-ink-3">{t('export.height')}</span>
                      <input
                        type="number" inputMode="numeric" min={1} max={MAX_EDGE}
                        value={custom.h || ''}
                        onChange={e => setDimension('h', e.target.value)}
                        aria-label={t('export.height')}
                        className={NUMBER_FIELD}
                      />
                    </label>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] font-semibold text-ink-2">
                    <input
                      type="checkbox"
                      checked={keepRatio}
                      onChange={e => setKeepRatio(e.target.checked)}
                      className="h-3.5 w-3.5"
                      style={{ accentColor: 'var(--teal)' }}
                    />
                    {t('export.keepRatio')}
                  </label>
                  {!keepRatio && <p className="m-0 text-[11px] leading-snug text-ink-3">{t('export.reframeNote')}</p>}
                </div>
              )}

              <span className="num text-[11px] text-ink-3">{translate('readout.canvas', { w: size.w, h: size.h })}</span>
            </div>

            <Button variant="primary" onClick={run} disabled={busy || !canvas || progress !== null} className="w-full">
              {busy ? t('export.exporting') : t('export.download')}
            </Button>
          </Section>

          {chosenVideoFormat && (
            <Section title={t('export.videoLabel')}>
              <div className="flex flex-col gap-2">
                <span className="micro">{t('export.size')}</span>
                <Choice name={t('export.videoSize')} options={videoSizes} value={videoSize} onChange={setVideoSize} />
                <span className="num text-[11px] text-ink-3">{translate('readout.canvas', { w: videoPixels.w, h: videoPixels.h })}</span>
                {videoSize === '4k' && <p className="m-0 text-[11px] leading-snug text-ink-3">{t('export.videoHeavy')}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <span className="micro">{t('export.fps')}</span>
                  <Choice name={t('export.fps')} options={FPS_OPTIONS} value={fps} onChange={setFps} />
                </div>
                {videoFormats.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <span className="micro">{t('export.videoFormat')}</span>
                    <Choice
                      name={t('export.videoFormat')}
                      options={videoFormats.map(f => ({ id: f, label: f.toUpperCase() }))}
                      value={chosenVideoFormat}
                      onChange={setVideoFormat}
                    />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <span className="micro">{t('export.videoQuality')}</span>
                <Choice name={t('export.videoQuality')} options={videoQualities} value={videoQuality} onChange={setVideoQuality} />
              </div>

              {progress === null ? (
                <Button variant="outline" size="sm" aria-label={t('export.record', { n: duration })} onClick={record}
                  icon={<Circle size={9} fill="currentColor" className="text-copper" aria-hidden="true" />}>
                  {t('export.record', { n: duration })}
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    role="progressbar"
                    aria-label={t('export.recording')}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    className="h-[3px] flex-1 overflow-hidden rounded-full bg-line-2"
                  >
                    <div className="h-full bg-copper" style={{ width: `${progress * 100}%` }} />
                  </div>
                  <Button variant="quiet" size="sm" aria-label={t('export.cancelAria')} onClick={() => abortRef.current?.abort()}>
                    {t('export.cancel')}
                  </Button>
                </div>
              )}
            </Section>
          )}

          <Section title={t('export.code')}>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" aria-label={t('export.copyLinear')} onClick={() => copyCss('linear')}>
                {t('export.cssLinear')}
              </Button>
              <Button variant="outline" size="sm" aria-label={t('export.copyMesh')} onClick={() => copyCss('mesh')}>
                {t('export.cssMesh')}
              </Button>
            </div>
          </Section>
        </Cut>
      )}
    </div>
  )
}
