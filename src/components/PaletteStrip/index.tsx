// src/components/PaletteStrip/index.tsx
import { useRef } from 'react'
import { Lock, Unlock, X } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { isValidHex } from '../../utils/color'
import type { ColorEntry } from '../../types/gradient'

export function PaletteStrip() {
  const { colors, updateColor, toggleLock, removeColor } = useGradientStore()

  return (
    <div className="flex h-[68px] flex-shrink-0 border-t border-[#1a1a1a]">
      {colors.map((color) => (
        <SwatchSlot
          key={color.id}
          color={color}
          canRemove={colors.length > 2}
          onUpdate={(hex) => updateColor(color.id, hex)}
          onToggleLock={() => toggleLock(color.id)}
          onRemove={() => removeColor(color.id)}
        />
      ))}
    </div>
  )
}

interface SwatchSlotProps {
  color:        ColorEntry
  canRemove:    boolean
  onUpdate:     (hex: string) => void
  onToggleLock: () => void
  onRemove:     () => void
}

function SwatchSlot({ color, canRemove, onUpdate, onToggleLock, onRemove }: SwatchSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  function handleNativeChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (isValidHex(e.target.value)) onUpdate(e.target.value)
  }

  return (
    <div
      className="flex-1 relative group cursor-pointer overflow-hidden"
      style={{ background: color.hex }}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="color"
        value={color.hex}
        onChange={handleNativeChange}
        className="sr-only"
        aria-label={`Color ${color.hex}`}
      />

      {/* Hex label — always visible */}
      <div className="absolute bottom-0 inset-x-0 h-[22px] flex items-center justify-center bg-black/30 backdrop-blur-sm">
        <span className="text-[9px] font-mono text-white/90 uppercase tracking-wide select-none">
          {color.hex.toUpperCase()}
        </span>
      </div>

      {/* Hover actions */}
      <div className="absolute top-1 right-1 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock() }}
          className="w-5 h-5 flex items-center justify-center bg-black/50 rounded text-white/80 hover:text-white"
          aria-label={color.locked ? 'Unlock color' : 'Lock color'}
        >
          {color.locked ? <Lock size={9} /> : <Unlock size={9} />}
        </button>
        {canRemove && !color.locked && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            className="w-5 h-5 flex items-center justify-center bg-black/50 rounded text-white/80 hover:text-white"
            aria-label="Remove color"
          >
            <X size={9} />
          </button>
        )}
      </div>

      {/* Locked indicator */}
      {color.locked && (
        <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-0">
          <Lock size={8} className="text-white/60" />
        </div>
      )}
    </div>
  )
}
