// src/components/BottomArea/index.tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { toast } from '../../store/uiStore'
import { LOOKS } from '../../constants/looks'
import { generateId } from '../../utils/color'
import { loadSaved, saveDesign, removeDesign, type SavedDesign } from '../../utils/savedDesigns'
import type { Design } from '../../types/gradient'

/* ── Palette presets (colors only) ───────────────────────── */
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

type Tab = 'palettes' | 'looks' | 'saved'
const TABS: { id: Tab; label: string }[] = [
  { id: 'palettes', label: 'Palettes' },
  { id: 'looks',    label: 'Looks' },
  { id: 'saved',    label: 'Saved' },
]

export function BottomArea() {
  const { colors, setColors, pushHistory, applyDesign } = useGradientStore()
  const [tab, setTab] = useState<Tab>('palettes')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedDesign[]>(() => loadSaved())
  const [name, setName] = useState('')

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

  function currentDesign(): Design {
    const s = useGradientStore.getState()
    return {
      shader: s.shader,
      colors: s.colors.map(c => c.hex),
      parameters: { ...s.parameters },
      effect: s.effect,
      effectAmount: s.effectAmount,
      duration: s.duration,
      aspectRatio: s.aspectRatio,
    }
  }

  function save() {
    saveDesign(name, currentDesign())
    setSaved(loadSaved())
    setName('')
    toast('Design saved')
  }

  function remove(id: string) {
    removeDesign(id)
    setSaved(loadSaved())
  }

  function onTabKey(e: React.KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = TABS[(TABS.findIndex(t => t.id === tab) + step + TABS.length) % TABS.length]
    setTab(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <div
      className="flex flex-shrink-0"
      style={{ borderTop: '1px solid var(--border-soft)', background: 'var(--bg)' }}
    >
      <div className="flex flex-col px-4 py-3 gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-4">
          <div role="tablist" aria-label="Presets" className="flex items-center gap-3" onKeyDown={onTabKey}>
            {TABS.map(t => (
              <button
                key={t.id}
                id={`tab-${t.id}`}
                role="tab"
                aria-selected={tab === t.id}
                aria-controls="bottom-panel"
                tabIndex={tab === t.id ? 0 : -1}
                onClick={() => setTab(t.id)}
                className="section-label transition-colors"
                style={{ color: tab === t.id ? 'var(--text-primary)' : undefined }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'saved' && (
            <form
              className="flex items-center gap-1.5 ml-auto"
              onSubmit={e => { e.preventDefault(); save() }}
            >
              <input
                id="design-name"
                aria-label="Design name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Name this design"
                maxLength={32}
                className="text-[11px] rounded px-2 py-1 outline-none"
                style={{ width: 150, background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <button
                type="submit"
                className="text-[11px] font-medium rounded px-2.5 py-1"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Save
              </button>
            </form>
          )}
        </div>

        <div
          id="bottom-panel"
          role="tabpanel"
          aria-labelledby={`tab-${tab}`}
          className="flex items-center gap-2 overflow-x-auto pb-0.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {tab === 'palettes' && PRESETS.map(preset => (
            <PresetCard
              key={preset.name}
              name={preset.name}
              colors={preset.colors}
              active={activePreset === preset.name}
              onClick={() => applyPreset(preset)}
            />
          ))}

          {tab === 'looks' && LOOKS.map(look => (
            <PresetCard
              key={look.name}
              name={look.name}
              colors={look.colors}
              onClick={() => applyDesign(look)}
            />
          ))}

          {tab === 'saved' && (saved.length === 0
            ? <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No saved designs yet. Name the current one and press Save.</span>
            : saved.map(s => (
              <PresetCard
                key={s.id}
                name={s.name}
                colors={s.design.colors}
                onClick={() => applyDesign(s.design)}
                onRemove={() => remove(s.id)}
              />
            )))}
        </div>
      </div>
    </div>
  )
}

/* ── Preset card ─────────────────────────────────────────── */
function PresetCard({ name, colors, active = false, onClick, onRemove }: {
  name: string
  colors: string[]
  active?: boolean
  onClick: () => void
  onRemove?: () => void
}) {
  const gradient = `linear-gradient(135deg, ${colors.join(', ')})`

  return (
    <div className="relative flex-shrink-0 group">
      <button
        onClick={onClick}
        aria-label={name}
        className="flex flex-col items-center gap-1.5 rounded-md transition-all"
        style={{
          padding: '4px 4px 3px',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border-soft)'}`,
          background: active ? 'var(--accent-dim)' : 'var(--bg-panel)',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-soft)' }}
        title={name}
      >
        <div className="w-14 h-7 rounded-sm flex-shrink-0" style={{ background: gradient }} />
        <span
          className="text-[9px] leading-none truncate"
          style={{
            maxWidth: 56,
            color: active ? 'var(--accent)' : 'var(--text-muted)',
            fontWeight: active ? 600 : 400,
            whiteSpace: 'nowrap',
          }}
        >
          {name}
        </span>
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={`Delete ${name}`}
          title="Delete"
          className="absolute -top-1 -right-1 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
          style={{ width: 16, height: 16, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        >
          <X size={9} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}
