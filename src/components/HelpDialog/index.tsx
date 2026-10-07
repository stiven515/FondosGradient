import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'

const SHORTCUTS: [string, string][] = [
  ['Space  /  P', 'Play / pause'],
  ['G', 'Generate a new palette'],
  ['S', 'Next style'],
  ['Ctrl / Cmd + Z', 'Undo'],
  ['Ctrl / Cmd + Shift + Z  /  Ctrl + Y', 'Redo'],
  ['← →  on the timeline', 'Seek 0.5 s'],
  ['?', 'Show or hide this help'],
  ['Esc', 'Close this help'],
]

export function HelpDialog() {
  const open = useUiStore(s => s.helpOpen)
  const toggle = useUiStore(s => s.toggleHelp)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    return () => previous?.focus?.()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 70, background: 'rgba(0,0,0,0.6)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) toggle(false) }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="w-full rounded-xl p-5"
        style={{ maxWidth: 420, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 id="help-title" className="text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Keyboard shortcuts
          </h2>
          <button
            ref={closeRef}
            onClick={() => toggle(false)}
            aria-label="Close help"
            className="flex items-center justify-center rounded-md"
            style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
          >
            <X size={14} strokeWidth={1.75} />
          </button>
        </div>
        <dl className="flex flex-col gap-2.5">
          {SHORTCUTS.map(([keys, action]) => (
            <div key={keys} className="flex items-baseline justify-between gap-4">
              <dt className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>{action}</dt>
              <dd className="text-[11px] font-mono text-right" style={{ color: 'var(--text-primary)' }}>{keys}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
