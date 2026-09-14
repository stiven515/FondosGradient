// src/components/ParameterPanel/Slider.tsx
import { useCallback } from 'react'
import { RotateCcw } from 'lucide-react'

interface SliderProps {
  label:        string
  value:        number
  min:          number
  max:          number
  step:         number
  defaultValue: number
  formatValue?: (v: number) => string
  onChange:     (value: number) => void
}

export function Slider({
  label, value, min, max, step, defaultValue,
  formatValue = (v) => v.toFixed(2),
  onChange,
}: SliderProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v))

  const fillPct = ((value - min) / (max - min)) * 100

  const handleRange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value)),
    [onChange]
  )
  const handleText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value)
      if (!isNaN(v)) onChange(clamp(v))
    },
    [onChange, min, max] // eslint-disable-line react-hooks/exhaustive-deps
  )
  const isAtDefault = Math.abs(value - defaultValue) < step * 0.5

  return (
    <div className="flex flex-col gap-1.5 group/slider">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label
          className="text-[10.5px] font-semibold select-none"
          style={{
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={formatValue(value)}
            onChange={handleText}
            className="w-10 text-right text-[12px] rounded-sm outline-none transition-colors"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid transparent',
              padding: '1px 3px',
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'transparent')}
            aria-label={`${label} value`}
          />
          <button
            onClick={() => onChange(defaultValue)}
            aria-label={`Reset ${label}`}
            title="Reset to default"
            className="flex items-center justify-center rounded transition-all"
            style={{
              width: 18, height: 18,
              color: isAtDefault ? 'var(--border)' : 'var(--text-muted)',
              opacity: isAtDefault ? 0.4 : 1,
            }}
            onMouseEnter={e => {
              if (!isAtDefault) e.currentTarget.style.color = 'var(--text-secondary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = isAtDefault ? 'var(--border)' : 'var(--text-muted)'
            }}
          >
            <RotateCcw size={10} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Track */}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleRange}
        aria-label={label}
        style={{ '--fill': `${fillPct}%` } as React.CSSProperties}
      />
    </div>
  )
}
