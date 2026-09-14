// src/components/BottomArea/index.tsx
import { useRef, useState } from 'react'
import { Lock, Unlock, X } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { isValidHex } from '../../utils/color'
import type { ColorEntry } from '../../types/gradient'

/* ── Preset definitions ─────────────────────────────────── */
interface Preset { name: string; colors: string[] }

const PRESETS: Preset[] = [
  { name: 'Soft Pink',    colors: ['#FFB3BA', '#FFCCC9', '#FFDDD2', '#FFE8D6', '#FFF0E0'] },
  { name: 'Lavender',     colors: ['#C5AEF0', '#D4B8F7', '#E0C8FB', '#EDD8FF', '#F7E8FF'] },
  { name: 'Sky',          colors: ['#A8D8EA', '#B8E2F4', '#C8ECFE', '#D8F4FF', '#E8F9FF'] },
  { name: 'Mint',         colors: ['#B5EAD7', '#C5F0E3', '#D5F7EE', '#E0FBF3', '#F0FFF9'] },
  { name: 'Cream',        colors: ['#FFDAC1', '#FFE6CE', '#FFEEDD', '#FFF5EA', '#FFFAF5'] },
  { name: 'Sunset',       colors: ['#FF9999', '#FFB380', '#FFD166', '#FF8566', '#FF6B6B'] },
  { name: 'Deep Purple',  colors: ['#6B21A8', '#7E22CE', '#9333EA', '#A855F7', '#C084FC'] },
  { name: 'Ocean',        colors: ['#0EA5E9', '#06B6D4', '#14B8A6', '#10B981', '#22D3EE'] },
  { name: 'Gold',         colors: ['#F59E0B', '#FBBF24', '#FCD34D', '#FDE68A', '#FEF3C7'] },
]

/* ── Helper: generateId (mirror from color utils) ───────── */
import { generateId } from '../../utils/color'

export function BottomArea() {
  const { colors, updateColor, toggleLock, removeColor, setColors, pushHistory } = useGradientStore()
  const [activePreset, setActivePreset] = useState<string | null>(null)

  function applyPreset(preset: Preset) {
    pushHistory()
    const newColors = preset.colors.slice(0, colors.length).map((hex, i) => ({
      id:     colors[i]?.id ?? generateId(),
      hex,
      locked: colors[i]?.locked ?? false,
    }))
    setColors(newColors)
    setActivePreset(preset.name)
  }

  return (
    <div
      className="flex flex-shrink-0"
      style={{
        height: 96,
        borderTop: '1px solid var(--border-soft)',
        background: 'var(--bg)',
      }}
    >
      {/* Left — PALETTE */}
      <div
        className="flex flex-col px-4 py-3 gap-2 flex-shrink-0"
        style={{
          width: 320,
          borderRight: '1px solid var(--border-soft)',
        }}
      >
        <span className="section-label">Palette</span>
        <div className="flex items-center gap-2.5">
          {colors.map(color => (
            <SwatchCircle
              key={color.id}
              color={color}
              canRemove={colors.length > 2}
              onUpdate={hex => updateColor(color.id, hex)}
              onToggleLock={() => toggleLock(color.id)}
              onRemove={() => removeColor(color.id)}
            />
          ))}
        </div>
      </div>

      {/* Right — PRESETS */}
      <div className="flex flex-col px-4 py-3 gap-2 flex-1 min-w-0">
        <span className="section-label">Presets</span>
        <div className="flex items-center gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {PRESETS.map(preset => (
            <PresetCard
              key={preset.name}
              preset={preset}
              active={activePreset === preset.name}
              onClick={() => applyPreset(preset)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/* ── Circular swatch ─────────────────────────────────────── */
interface SwatchCircleProps {
  color:        ColorEntry
  canRemove:    boolean
  onUpdate:     (hex: string) => void
  onToggleLock: () => void
  onRemove:     () => void
}

function SwatchCircle({ color, canRemove, onUpdate, onToggleLock, onRemove }: SwatchCircleProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative group flex-shrink-0"
      style={{ width: 40, height: 40 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full h-full rounded-full transition-transform"
        style={{
          background: color.hex,
          border: `2px solid rgba(255,255,255,${hovered ? 0.25 : 0.12})`,
          transform: hovered ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.15s cubic-bezier(0.16,1,0.3,1), border-color 0.15s',
        }}
        aria-label={`Color ${color.hex}`}
        title={color.hex.toUpperCase()}
      />
      <input
        ref={inputRef}
        type="color"
        value={color.hex}
        onChange={e => isValidHex(e.target.value) && onUpdate(e.target.value)}
        className="sr-only"
        aria-label={`Pick color ${color.hex}`}
      />

      {/* Lock / remove overlay */}
      {hovered && (
        <div className="absolute -top-1 -right-1 flex flex-col gap-0.5">
          <button
            onClick={e => { e.stopPropagation(); onToggleLock() }}
            className="w-4 h-4 flex items-center justify-center rounded-full"
            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            aria-label={color.locked ? 'Unlock' : 'Lock'}
          >
            {color.locked
              ? <Lock size={7} style={{ color: 'var(--accent)' }} />
              : <Unlock size={7} style={{ color: 'var(--text-muted)' }} />
            }
          </button>
          {canRemove && !color.locked && (
            <button
              onClick={e => { e.stopPropagation(); onRemove() }}
              className="w-4 h-4 flex items-center justify-center rounded-full"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
              aria-label="Remove color"
            >
              <X size={7} style={{ color: 'var(--text-muted)' }} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Preset card ─────────────────────────────────────────── */
function PresetCard({ preset, active, onClick }: { preset: Preset; active: boolean; onClick: () => void }) {
  const gradient = `linear-gradient(135deg, ${preset.colors.join(', ')})`

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 flex-shrink-0 rounded-md transition-all"
      style={{
        padding: '4px 4px 3px',
        border: `1px solid ${active ? 'var(--accent)' : 'var(--border-soft)'}`,
        background: active ? 'var(--accent-dim)' : 'var(--bg-panel)',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.borderColor = 'var(--border)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.borderColor = 'var(--border-soft)'
      }}
      title={preset.name}
    >
      <div
        className="w-14 h-7 rounded-sm flex-shrink-0"
        style={{ background: gradient }}
      />
      <span
        className="text-[9px] leading-none"
        style={{
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: active ? 600 : 400,
          whiteSpace: 'nowrap',
        }}
      >
        {preset.name}
      </span>
    </button>
  )
}
