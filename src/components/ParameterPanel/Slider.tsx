// src/components/ParameterPanel/Slider.tsx
import { useCallback, useId } from 'react'
import { RotateCcw } from 'lucide-react'
import { useT } from '../../i18n'

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
  const t = useT()
  const id = useId()
  const clamp = (v: number) => Math.min(max, Math.max(min, v))
  const fillPct = ((value - min) / (max - min)) * 100
  const isAtDefault = Math.abs(value - defaultValue) < step * 0.5

  const handleRange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value)),
    [onChange],
  )
  const handleText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value)
      if (!isNaN(v)) onChange(clamp(v))
    },
    [onChange, min, max] // eslint-disable-line react-hooks/exhaustive-deps
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="micro select-none">{label}</label>
        <div className="flex items-center gap-0.5">
          <input
            type="text"
            inputMode="decimal"
            value={formatValue(value)}
            onChange={handleText}
            aria-label={t('param.value', { name: label })}
            className="num w-12 rounded-[6px] bg-transparent px-1 py-0.5 text-right text-[12.5px] font-semibold text-ink outline-none transition-colors hover:bg-sunken focus:bg-sunken"
          />
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            disabled={isAtDefault}
            aria-label={t('param.reset', { name: label })}
            title={t('param.reset', { name: label })}
            className="flex h-5 w-5 items-center justify-center rounded-[6px] text-ink-3 transition-opacity hover:text-ink disabled:opacity-25"
          >
            <RotateCcw size={11} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
      <input
        id={id}
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
