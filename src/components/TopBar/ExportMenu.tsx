import { useState, useRef, useEffect } from 'react'
import { Download } from 'lucide-react'
import { computeExportSize, exportImage, getCanvas, type ExportFormat, type ExportScale } from '../../utils/exportPng'
import { toast } from '../../store/uiStore'

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
  const ref = useRef<HTMLDivElement>(null)

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
          <button
            onClick={run}
            disabled={busy || !canvas}
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
