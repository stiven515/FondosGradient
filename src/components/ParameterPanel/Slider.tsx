// src/components/ParameterPanel/Slider.tsx
import { useCallback } from 'react'

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

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-gray-500 uppercase tracking-widest select-none">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={formatValue(value)}
            onChange={handleText}
            className="w-11 text-right text-xs bg-transparent text-gray-300
                       border border-transparent hover:border-gray-700
                       focus:border-gray-500 rounded px-1 py-0.5 outline-none"
            aria-label={`${label} numeric value`}
          />
          <button
            onClick={() => onChange(defaultValue)}
            className="text-gray-700 hover:text-gray-400 text-xs w-4 text-center"
            aria-label={`Reset ${label}`}
            title="Reset"
          >
            ↺
          </button>
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleRange}
        aria-label={label}
      />
    </div>
  )
}
