// src/components/EffectsPanel/index.tsx
import { useGradientStore } from '../../store/gradientStore'
import { Slider } from '../ParameterPanel/Slider'
import { EFFECTS, hasIntensity } from '../../constants/effects'

export function EffectsPanel() {
  const { effect, setEffect, effectAmount, setEffectAmount } = useGradientStore()
  const hasAmount = hasIntensity(effect)

  return (
    <div className="flex flex-col gap-3">
    <div className="grid grid-cols-3 gap-1">
      {EFFECTS.map(e => {
        const active = effect === e.id
        return (
          <button
            key={e.id}
            onClick={() => setEffect(e.id)}
            aria-label={e.label}
            aria-pressed={active}
            title={e.label}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-all"
            style={{
              border: active
                ? '1px solid var(--accent)'
                : '1px solid var(--border-soft)',
              background: active ? 'var(--accent-dim)' : 'var(--bg-panel)',
              color: active ? 'var(--accent)' : 'var(--text-secondary)',
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
    {hasAmount && (
      <Slider
        label="Intensity"
        value={effectAmount}
        min={0}
        max={1}
        step={0.01}
        defaultValue={0.5}
        onChange={setEffectAmount}
      />
    )}
    </div>
  )
}
