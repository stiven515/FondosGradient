// src/components/ColorPalette/ColorSwatch.tsx
import { useRef, useCallback } from 'react'
import { Lock, Unlock, X, Copy } from 'lucide-react'
import type { ColorEntry } from '../../types/gradient'
import { isValidHex } from '../../utils/color'
import { useT } from '../../i18n'

interface ColorSwatchProps {
  color:        ColorEntry
  canRemove:    boolean
  onUpdate:     (id: string, hex: string) => void
  onRemove:     (id: string) => void
  onToggleLock: (id: string) => void
}

const ACTION = 'flex h-6 w-6 items-center justify-center rounded-[6px] text-ink-3 transition-colors hover:bg-teal-soft hover:text-ink'

export function ColorSwatch({ color, canRemove, onUpdate, onRemove, onToggleLock }: ColorSwatchProps) {
  const t = useT()
  const pickerRef = useRef<HTMLInputElement>(null)

  const handlePicker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(color.id, e.target.value),
    [color.id, onUpdate],
  )

  const handleHex = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const hex = raw.startsWith('#') ? raw : `#${raw}`
      if (isValidHex(hex)) onUpdate(color.id, hex.toUpperCase())
    },
    [color.id, onUpdate],
  )

  const handleCopy = useCallback(
    () => { navigator.clipboard.writeText(color.hex).catch(() => {}) },
    [color.hex],
  )

  return (
    <div className="group flex items-center gap-2">
      <div className="relative flex-shrink-0">
        <div
          role="button"
          tabIndex={0}
          aria-label={t('palette.picker', { hex: color.hex })}
          className="h-7 w-7 cursor-pointer rounded-ctl transition-transform duration-150 hover:scale-105"
          style={{ backgroundColor: color.hex, boxShadow: 'inset 0 0 0 1px rgba(18, 52, 59, 0.18)' }}
          onClick={() => pickerRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && pickerRef.current?.click()}
        />
        <input
          ref={pickerRef}
          type="color"
          value={color.hex}
          onChange={handlePicker}
          className="pointer-events-none absolute inset-0 h-full w-full opacity-0"
          tabIndex={-1}
          aria-label={t('palette.pickerInput')}
        />
      </div>

      <input
        type="text"
        value={color.hex}
        onChange={handleHex}
        maxLength={7}
        spellCheck={false}
        aria-label={t('palette.hex')}
        className="num min-w-0 flex-1 rounded-ctl bg-sunken px-2 py-1 font-mono text-[12px] uppercase text-ink-2 outline-none transition-colors focus:bg-raised focus:text-ink focus:shadow-[inset_0_0_0_1px_var(--teal)]"
      />

      <div className="flex items-center opacity-0 transition-opacity duration-150 focus-within:opacity-100 group-hover:opacity-100">
        <button type="button" onClick={handleCopy} className={ACTION} aria-label={t('palette.copy')} title={t('palette.copy')}>
          <Copy size={12} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onToggleLock(color.id)}
          className={`${ACTION} ${color.locked ? 'text-copper-ink' : ''}`}
          aria-label={color.locked ? t('palette.unlockOne') : t('palette.lockOne')}
          aria-pressed={color.locked}
          title={color.locked ? t('palette.unlockOne') : t('palette.lockOne')}
        >
          {color.locked ? <Lock size={12} aria-hidden="true" /> : <Unlock size={12} aria-hidden="true" />}
        </button>
        {canRemove && (
          <button type="button" onClick={() => onRemove(color.id)} className={ACTION} aria-label={t('palette.removeOne')} title={t('palette.removeOne')}>
            <X size={12} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
