// src/components/Sidebar/index.tsx
import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Lock } from 'lucide-react'
import { StyleSelector }  from '../StyleSelector'
import { ParameterPanel } from '../ParameterPanel'
import { EffectsPanel }   from '../EffectsPanel'
import { ColorSwatch }    from '../ColorPalette/ColorSwatch'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { generateHarmoniousPalette } from '../../utils/palette'
import type { ShaderParameters } from '../../types/gradient'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)

  const {
    colors, addColor, removeColor, lockAll, updateColor, toggleLock,
    pushHistory, setColors, setParameter,
  } = useGradientStore()

  const handleGenerate = useCallback(() => {
    pushHistory()
    setColors(generateHarmoniousPalette(useGradientStore.getState().colors))
  }, [pushHistory, setColors])

  const handleResetAll = useCallback(() => {
    pushHistory()
    Object.entries(DEFAULT_PARAMETERS).forEach(([k, v]) =>
      setParameter(k as keyof ShaderParameters, v)
    )
  }, [pushHistory, setParameter])

  /* ── Collapsed state ─────────────────────────────────── */
  if (collapsed) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center pt-3"
        style={{
          width: 36,
          background: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-soft)',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand controls"
          className="flex items-center justify-center rounded-md transition-colors"
          style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ChevronRight size={14} strokeWidth={1.75} />
        </button>
      </div>
    )
  }

  /* ── Expanded ─────────────────────────────────────────── */
  return (
    <aside
      className="flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        width: 300,
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border-soft)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0 px-4"
        style={{
          height: 40,
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <span className="section-label">Controls</span>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse controls"
          className="flex items-center justify-center rounded-md transition-colors"
          style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto">

        {/* STYLE */}
        <Section>
          <SectionHeader label="Style" hint="Tab to cycle" />
          <StyleSelector />
        </Section>

        {/* PALETTE */}
        <Section>
          <SectionHeader label="Palette">
            <div className="flex items-center gap-1">
              <button
                onClick={() => removeColor(colors[colors.length - 1].id)}
                disabled={colors.length <= 2}
                aria-label="Remove color"
                className="flex items-center justify-center rounded transition-all text-sm"
                style={{
                  width: 20, height: 20,
                  color: colors.length <= 2 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  cursor: colors.length <= 2 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (colors.length > 2) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                −
              </button>
              <span
                className="text-[11px] tabular-nums"
                style={{ color: 'var(--text-muted)', minWidth: 12, textAlign: 'center' }}
              >
                {colors.length}
              </span>
              <button
                onClick={() => addColor()}
                disabled={colors.length >= 8}
                aria-label="Add color"
                className="flex items-center justify-center rounded transition-all text-sm"
                style={{
                  width: 20, height: 20,
                  color: colors.length >= 8 ? 'var(--text-muted)' : 'var(--text-secondary)',
                  background: 'var(--bg-panel)',
                  border: '1px solid var(--border)',
                  cursor: colors.length >= 8 ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={e => {
                  if (colors.length < 8) e.currentTarget.style.color = 'var(--text-primary)'
                }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)' }}
              >
                +
              </button>
            </div>
          </SectionHeader>

          {/* Individual color rows — swatch + hex input + lock/copy/remove */}
          <div className="flex flex-col gap-1">
            {colors.map(color => (
              <ColorSwatch
                key={color.id}
                color={color}
                canRemove={colors.length > 2}
                onUpdate={updateColor}
                onRemove={removeColor}
                onToggleLock={toggleLock}
              />
            ))}
          </div>

          {/* Generate + Lock All */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleGenerate}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md transition-all text-[12px] font-medium"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--accent-dim)'
                e.currentTarget.style.background = 'var(--accent-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.background = 'var(--bg-panel)'
              }}
            >
              <Sparkles size={11} strokeWidth={2} />
              Generate
            </button>
            <button
              onClick={lockAll}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[12px] font-medium"
              style={{
                background: 'var(--bg-panel)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#2D3544'
                e.currentTarget.style.color = 'var(--text-primary)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.color = 'var(--text-secondary)'
              }}
              aria-label="Lock all colors"
              title="Lock all colors"
            >
              <Lock size={11} strokeWidth={2} />
              Lock
            </button>
          </div>
        </Section>

        {/* PARAMETERS */}
        <Section>
          <SectionHeader label="Parameters">
            <button
              onClick={handleResetAll}
              className="text-[10px] transition-colors"
              style={{ color: 'var(--text-muted)', fontWeight: 500 }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Reset all
            </button>
          </SectionHeader>
          <ParameterPanel />
        </Section>

        {/* EFFECTS */}
        <Section>
          <SectionHeader label="Effects" />
          <EffectsPanel />
        </Section>

      </div>
    </aside>
  )
}

/* ── Section wrapper ──────────────────────────────────────── */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex flex-col gap-3 px-4 py-3"
      style={{ borderBottom: '1px solid var(--border-soft)' }}
    >
      {children}
    </div>
  )
}

/* ── Section header ───────────────────────────────────────── */
function SectionHeader({
  label, hint, children,
}: { label: string; hint?: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="section-label">{label}</span>
        {hint && (
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{hint}</span>
        )}
      </div>
      {children}
    </div>
  )
}
