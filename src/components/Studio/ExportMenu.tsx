import { useState, useRef, useEffect } from 'react'
import { ArrowUpRight, Circle } from 'lucide-react'
import { computeExportSize, exportImage, getCanvas, type ExportFormat, type ExportScale } from '../../utils/exportPng'
import { toast } from '../../store/uiStore'
import { useGradientStore } from '../../store/gradientStore'
import { toCss } from '../../utils/css'
import { canRecordVideo } from '../../utils/recorder'
import { recordLoop } from '../../utils/recordLoop'
import { t as translate, useT } from '../../i18n'
import { Button } from '../../ui/Button'
import { Cut } from '../../ui/Cut'

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' }, { id: 'jpg', label: 'JPG' }, { id: 'webp', label: 'WebP' },
]

function Choice<T extends string>({ name, options, value, onChange }: {
  name: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-3 gap-1 rounded-[11px] bg-sunken p-1">
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

export function ExportMenu() {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<ExportScale>('current')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const duration = useGradientStore(s => s.duration)
  const ref = useRef<HTMLDivElement>(null)

  const scales: { id: ExportScale; label: string }[] = [
    { id: 'current', label: t('export.current') }, { id: '2x', label: '2×' }, { id: '4k', label: '4K' },
  ]

  useEffect(() => () => abortRef.current?.abort(), [])

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

  const canvas = getCanvas()
  const size = computeExportSize(canvas?.width ?? 0, canvas?.height ?? 0, scale)

  async function run() {
    setBusy(true)
    const ok = await exportImage(format, scale)
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
    const result = await recordLoop(setProgress, controller.signal)
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
          style={{ width: 268 }}
          fillClassName="flex flex-col gap-4 p-4"
        >
          <div className="flex flex-col gap-2">
            <span className="micro">{t('export.format')}</span>
            <Choice name={t('export.format')} options={FORMATS} value={format} onChange={setFormat} />
          </div>

          <div className="flex flex-col gap-2">
            <span className="micro">{t('export.size')}</span>
            <Choice name={t('export.size')} options={scales} value={scale} onChange={setScale} />
            <span className="num text-[11px] text-ink-3">{translate('readout.canvas', { w: size.w, h: size.h })}</span>
          </div>

          <div className="flex flex-col gap-2">
            <span className="micro">{t('export.code')}</span>
            <div className="grid grid-cols-2 gap-1.5">
              <Button variant="outline" size="sm" aria-label={t('export.copyLinear')} onClick={() => copyCss('linear')}>
                {t('export.cssLinear')}
              </Button>
              <Button variant="outline" size="sm" aria-label={t('export.copyMesh')} onClick={() => copyCss('mesh')}>
                {t('export.cssMesh')}
              </Button>
            </div>
          </div>

          {canRecordVideo() && (
            <div className="flex flex-col gap-2">
              <span className="micro">{t('export.videoLabel')}</span>
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
            </div>
          )}

          <Button variant="primary" onClick={run} disabled={busy || !canvas || progress !== null} className="w-full">
            {busy ? t('export.exporting') : t('export.download')}
          </Button>
        </Cut>
      )}
    </div>
  )
}
