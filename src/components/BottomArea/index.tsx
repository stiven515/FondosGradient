// src/components/BottomArea/index.tsx
import { useState } from 'react'
import { useGradientStore } from '../../store/gradientStore'

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

import { generateId } from '../../utils/color'

export function BottomArea() {
  const { colors, setColors, pushHistory } = useGradientStore()
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
        borderTop: '1px solid var(--border-soft)',
        background: 'var(--bg)',
      }}
    >
      {/* PRESETS — full width */}
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
