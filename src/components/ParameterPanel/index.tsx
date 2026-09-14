// src/components/ParameterPanel/index.tsx
import { useCallback } from 'react'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { Slider } from './Slider'
import type { ShaderParameters } from '../../types/gradient'

interface ParamDef {
  key:    keyof ShaderParameters
  label:  string
  min:    number
  max:    number
  step:   number
  format?: (v: number) => string
}

const PARAMS: ParamDef[] = [
  { key: 'scale',    label: 'Scale',    min: 0.5, max: 4.0, step: 0.05 },
  { key: 'curl',     label: 'Curl',     min: 0.0, max: 3.0, step: 0.05 },
  { key: 'drift',    label: 'Drift',    min: 0.0, max: 1.0, step: 0.01, format: v => `${Math.round(v * 100)}%` },
  { key: 'openness', label: 'Openness', min: 0.0, max: 1.0, step: 0.01, format: v => `${Math.round(v * 100)}%` },
  { key: 'seed',     label: 'Seed',     min: 0,   max: 100, step: 1,    format: v => v.toFixed(0) },
  { key: 'speed',    label: 'Speed',    min: 0.0, max: 3.0, step: 0.05 },
  { key: 'grain',    label: 'Grain',    min: 0.0, max: 0.5, step: 0.01, format: v => `${Math.round(v * 100)}%` },
]

export function ParameterPanel() {
  const { parameters, setParameter } = useGradientStore()

  const handleChange = useCallback(
    (key: keyof ShaderParameters, value: number) => setParameter(key, value),
    [setParameter]
  )

  return (
    <div className="flex flex-col gap-4 px-3 pb-3">
      {PARAMS.map(({ key, label, min, max, step, format }) => (
        <Slider
          key={key}
          label={label}
          value={parameters[key]}
          min={min}
          max={max}
          step={step}
          defaultValue={DEFAULT_PARAMETERS[key]}
          formatValue={format}
          onChange={(v) => handleChange(key, v)}
        />
      ))}
    </div>
  )
}
