import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useUiStore } from '../../store/uiStore'
import { useT, type TKey } from '../../i18n'
import { Cut } from '../../ui/Cut'

// Each row: the keys that trigger it (alternatives separated by "/"), and what it does.
const SHORTCUTS: { keys: string[][]; label: TKey }[] = [
  { keys: [['Space'], ['P']],                          label: 'help.play' },
  { keys: [['G']],                                      label: 'help.generate' },
  { keys: [['S']],                                      label: 'help.nextStyle' },
  { keys: [['Ctrl / Cmd', 'Z']],                        label: 'help.undo' },
  { keys: [['Ctrl / Cmd', 'Shift', 'Z'], ['Ctrl', 'Y']], label: 'help.redo' },
  { keys: [['←'], ['→']],                     label: 'help.seek' },
  { keys: [['?']],                                      label: 'help.toggle' },
  { keys: [['Esc']],                                    label: 'help.esc' },
]

function Keys({ combo }: { combo: string[] }) {
  return (
    <span className="inline-flex items-center gap-1">
      {combo.map((k, i) => (
        <kbd key={`${k}-${i}`} className="rounded-[6px] bg-sunken px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-[inset_0_-1px_0_var(--line-2)]">
          {k}
        </kbd>
      ))}
    </span>
  )
}

export function HelpDialog() {
  const t = useT()
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
      style={{ zIndex: 70, background: 'rgba(18, 52, 59, 0.38)', animation: 'fade 0.2s var(--ease-out)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) toggle(false) }}
    >
      <Cut
        line
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="w-full shadow-pop"
        style={{ maxWidth: 460, '--cut': '16px', animation: 'rise 0.32s var(--ease-out)' } as React.CSSProperties}
        fillClassName="p-6"
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id="help-title" className="text-[16px] font-bold tracking-[-0.01em] text-ink">{t('help.title')}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => toggle(false)}
            aria-label={t('help.close')}
            className="flex h-8 w-8 items-center justify-center rounded-ctl text-ink-3 transition-colors hover:bg-teal-soft hover:text-ink"
          >
            <X size={16} strokeWidth={1.9} aria-hidden="true" />
          </button>
        </div>
        <dl className="flex flex-col gap-3">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="text-[13px] text-ink-2">{t(label)}</dt>
              <dd className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                {keys.map((combo, i) => (
                  <span key={combo.join('+')} className="inline-flex items-center gap-2">
                    {i > 0 && <span className="text-[11px] text-ink-3" aria-hidden="true">/</span>}
                    <Keys combo={combo} />
                  </span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </Cut>
    </div>
  )
}
