// src/components/ParameterPanel/index.tsx
import { useCallback } from 'react'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { Slider } from './Slider'
import { PARAM_RANGES } from '../../constants/parameters'
import type { ShaderParameters } from '../../types/gradient'

interface ParamDef {
  key:    keyof ShaderParameters
  label:  string
  format?: (v: number) => string
}

const PARAMS: ParamDef[] = [
  { key: 'scale', label: 'Scale' },
  { key: 'curl', label: 'Curl' },
  { key: 'drift', label: 'Drift', format: v => `${Math.round(v * 100)}%` },
  { key: 'openness', label: 'Openness', format: v => `${Math.round(v * 100)}%` },
  { key: 'seed', label: 'Seed', format: v => v.toFixed(0) },
  { key: 'speed', label: 'Speed' },
  { key: 'grain', label: 'Grain', format: v => `${Math.round(v * 100)}%` },
]

export function ParameterPanel() {
  const { parameters, setParameter } = useGradientStore()

  const handleChange = useCallback(
    (key: keyof ShaderParameters, value: number) => setParameter(key, value),
    [setParameter]
  )

  return (
    <div className="flex flex-col gap-4">
      {PARAMS.map(({ key, label, format }) => {
        const { min, max, step } = PARAM_RANGES[key]
        return (
        <Slider
          key={key}
          label={label}
          value={parameters[key]}
          min={min}
          max={max}
          step={step}
          defaultValue={DEFAULT_PARAMETERS[key]}
          formatValue={format}
          onChange={v => handleChange(key, v)}
        />
        )
      })}
    </div>
  )
}
