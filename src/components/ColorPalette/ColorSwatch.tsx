// src/components/ColorPalette/ColorSwatch.tsx
import { useRef, useCallback } from 'react'
import { Lock, Unlock, X, Copy } from 'lucide-react'
import type { ColorEntry } from '../../types/gradient'
import { isValidHex } from '../../utils/color'

interface ColorSwatchProps {
  color:        ColorEntry
  canRemove:    boolean
  onUpdate:     (id: string, hex: string) => void
  onRemove:     (id: string) => void
  onToggleLock: (id: string) => void
}

export function ColorSwatch({ color, canRemove, onUpdate, onRemove, onToggleLock }: ColorSwatchProps) {
  const pickerRef = useRef<HTMLInputElement>(null)

  const handlePicker = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onUpdate(color.id, e.target.value),
    [color.id, onUpdate]
  )

  const handleHex = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      const hex = raw.startsWith('#') ? raw : `#${raw}`
      if (isValidHex(hex)) onUpdate(color.id, hex.toUpperCase())
    },
    [color.id, onUpdate]
  )

  const handleCopy = useCallback(
    () => { navigator.clipboard.writeText(color.hex).catch(() => {}) },
    [color.hex]
  )

  return (
    <div className="flex items-center gap-2 group">
      {/* Color swatch / picker trigger */}
      <div className="relative flex-shrink-0">
        <div
          role="button"
          tabIndex={0}
          aria-label={`Open color picker for ${color.hex}`}
          className="w-8 h-8 rounded-md border border-white/10 cursor-pointer transition-transform hover:scale-105"
          style={{ backgroundColor: color.hex }}
          onClick={() => pickerRef.current?.click()}
          onKeyDown={(e) => e.key === 'Enter' && pickerRef.current?.click()}
        />
        <input
          ref={pickerRef}
          type="color"
          value={color.hex}
          onChange={handlePicker}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
          aria-label="Color picker"
        />
      </div>

      {/* Hex input */}
      <input
        type="text"
        value={color.hex}
        onChange={handleHex}
        maxLength={7}
        className="flex-1 text-xs bg-transparent text-gray-300 font-mono uppercase
                   border border-transparent hover:border-gray-700 focus:border-gray-500
                   rounded px-1 py-1 outline-none"
        aria-label="Hex color value"
      />

      {/* Action buttons — appear on hover */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleCopy} className="p-1 text-gray-600 hover:text-gray-300 rounded" aria-label="Copy hex" title="Copy">
          <Copy size={11} />
        </button>
        <button
          onClick={() => onToggleLock(color.id)}
          className={`p-1 rounded ${color.locked ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300'}`}
          aria-label={color.locked ? 'Unlock color' : 'Lock color'}
          title={color.locked ? 'Unlock' : 'Lock'}
        >
          {color.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
        {canRemove && (
          <button onClick={() => onRemove(color.id)} className="p-1 text-gray-600 hover:text-red-400 rounded" aria-label="Remove color" title="Remove">
            <X size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
