import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { computeExportSize, exportImage, getCanvas, type ExportFormat, type ExportScale } from '../../utils/exportPng'
import { toast } from '../../store/uiStore'
import { useGradientStore } from '../../store/gradientStore'
import { toCss } from '../../utils/css'
import { canRecordVideo } from '../../utils/recorder'
import { recordLoop } from '../../utils/recordLoop'

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' }, { id: 'jpg', label: 'JPG' }, { id: 'webp', label: 'WebP' },
]
const SCALES: { id: ExportScale; label: string }[] = [
  { id: 'current', label: 'Current' }, { id: '2x', label: '2×' }, { id: '4k', label: '4K' },
]

function Choice<T extends string>({ name, options, value, onChange }: {
  name: string
  options: { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={name} className="grid grid-cols-3 gap-1">
      {options.map(o => {
        const active = o.id === value
        return (
          <label
            key={o.id}
            className="text-center text-[11px] py-1.5 rounded-md cursor-pointer select-none focus-within:outline focus-within:outline-2"
            style={{
              outlineColor: 'var(--accent)',
              border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              background: active ? 'var(--accent-dim)' : 'var(--bg-panel)',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
              fontWeight: 500,
            }}
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
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<ExportFormat>('png')
  const [scale, setScale] = useState<ExportScale>('current')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const duration = useGradientStore(s => s.duration)
  const ref = useRef<HTMLDivElement>(null)

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
    if (ok) toast('Image exported')
    else toast('Export failed — try a smaller size', 'error')
  }

  async function copyCss(kind: 'linear' | 'mesh') {
    const hexes = useGradientStore.getState().colors.map(c => c.hex)
    try {
      await navigator.clipboard.writeText(toCss(hexes, kind))
      toast('CSS copied')
    } catch {
      toast('Could not copy the CSS', 'error')
    }
  }

  async function record() {
    const controller = new AbortController()
    abortRef.current = controller
    setProgress(0)
    const result = await recordLoop(setProgress, controller.signal)
    abortRef.current = null
    setProgress(null)
    if (result === 'saved') toast('Video saved')
    else if (result === 'failed') toast('Recording failed — try again', 'error')
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Export image"
        title="Export image"
        className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
        style={{ color: open ? 'var(--text-primary)' : 'var(--text-muted)', background: open ? 'var(--bg-panel)' : 'transparent' }}
      >
        <Download size={14} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 p-3 rounded-lg flex flex-col gap-3"
          style={{ width: 232, zIndex: 40, background: 'var(--bg-elevated)', border: '1px solid var(--border)', boxShadow: '0 12px 32px rgba(0,0,0,0.5)' }}
        >
          <div className="flex flex-col gap-1.5">
            <span className="section-label">Format</span>
            <Choice name="Format" options={FORMATS} value={format} onChange={setFormat} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="section-label">Size</span>
            <Choice name="Size" options={SCALES} value={scale} onChange={setScale} />
            <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {size.w} × {size.h} px
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="section-label">Code</span>
            <div className="grid grid-cols-2 gap-1">
              {(['linear', 'mesh'] as const).map(kind => (
                <button
                  key={kind}
                  onClick={() => copyCss(kind)}
                  aria-label={`Copy CSS (${kind})`}
                  className="text-[11px] py-1.5 rounded-md"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-secondary)', fontWeight: 500 }}
                >
                  CSS {kind}
                </button>
              ))}
            </div>
          </div>
          {canRecordVideo() && (
            <div className="flex flex-col gap-1.5">
              <span className="section-label">Video</span>
              {progress === null ? (
                <button
                  onClick={record}
                  aria-label={`Record loop (${duration}s)`}
                  className="text-[11px] py-1.5 rounded-md"
                  style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)', color: 'var(--text-secondary)', fontWeight: 500 }}
                >
                  Record loop ({duration}s)
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    role="progressbar"
                    aria-label="Recording progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress * 100)}
                    className="flex-1 h-[3px] rounded-full overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.10)' }}
                  >
                    <div className="h-full" style={{ width: `${progress * 100}%`, background: 'var(--accent)' }} />
                  </div>
                  <button
                    onClick={() => abortRef.current?.abort()}
                    aria-label="Cancel recording"
                    className="text-[11px] px-2 py-1 rounded-md"
                    style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            onClick={run}
            disabled={busy || !canvas || progress !== null}
            className="py-1.5 rounded-md text-[12px] font-medium transition-opacity"
            style={{ background: 'var(--accent)', color: '#fff', opacity: busy ? 0.6 : 1 }}
          >
            {busy ? 'Exporting…' : 'Download'}
          </button>
        </div>
      )}
    </div>
  )
}
