// src/components/EffectsPanel/index.tsx
import { useGradientStore } from '../../store/gradientStore'
import type { EffectType } from '../../types/gradient'

interface EffectDef {
  id:       EffectType
  label:    string
  icon:     string
  ready:    boolean
}

const EFFECTS: EffectDef[] = [
  { id: 'none',      label: 'None',     icon: '○', ready: true  },
  { id: 'grain',     label: 'Grain',    icon: '⁘', ready: true  },
  { id: 'glow',      label: 'Glow',     icon: '◎', ready: false },
  { id: 'chromatic', label: 'Chroma',   icon: '◈', ready: false },
  { id: 'glass',     label: 'Glass',    icon: '◻', ready: false },
  { id: 'dither',    label: 'Dither',   icon: '▦', ready: false },
  { id: 'halftone',  label: 'Halftone', icon: '⊹', ready: false },
]

export function EffectsPanel() {
  const { effect, setEffect } = useGradientStore()

  return (
    <div className="grid grid-cols-3 gap-1">
      {EFFECTS.map(e => {
        const active = effect === e.id
        return (
          <button
            key={e.id}
            onClick={() => e.ready && setEffect(e.id)}
            disabled={!e.ready}
            title={e.ready ? e.label : `${e.label} (coming soon)`}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-all"
            style={{
              border: active
                ? '1px solid var(--accent)'
                : '1px solid var(--border-soft)',
              background: active ? 'var(--accent-dim)' : 'var(--bg-panel)',
              color: !e.ready
                ? 'var(--text-muted)'
                : active
                ? 'var(--accent)'
                : 'var(--text-secondary)',
              opacity: !e.ready ? 0.45 : 1,
              cursor: !e.ready ? 'default' : 'pointer',
            }}
          >
            <span className="text-[14px] leading-none select-none">{e.icon}</span>
            <span
              className="text-[9px] leading-none select-none"
              style={{
                fontWeight: 500,
                letterSpacing: '0.04em',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {e.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
