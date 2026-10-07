// src/components/ParameterPanel/index.tsx
import { useCallback } from 'react'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { Slider } from './Slider'
import { PARAM_RANGES } from '../../constants/parameters'
import { useT, type TKey } from '../../i18n'
import type { ShaderParameters } from '../../types/gradient'

interface ParamDef {
  key:     keyof ShaderParameters
  format?: (v: number) => string
}

const percent = (v: number) => `${Math.round(v * 100)}%`

const PARAMS: ParamDef[] = [
  { key: 'scale' },
  { key: 'curl' },
  { key: 'drift', format: percent },
  { key: 'openness', format: percent },
  { key: 'seed', format: v => v.toFixed(0) },
  { key: 'speed' },
  { key: 'grain', format: percent },
]

export function ParameterPanel() {
  const t = useT()
  const parameters = useGradientStore(s => s.parameters)
  const setParameter = useGradientStore(s => s.setParameter)

  const handleChange = useCallback(
    (key: keyof ShaderParameters, value: number) => setParameter(key, value),
    [setParameter],
  )

  return (
    <div className="flex flex-col gap-4">
      {PARAMS.map(({ key, format }) => {
        const { min, max, step } = PARAM_RANGES[key]
        return (
          <Slider
            key={key}
            label={t(`param.${key}` as TKey)}
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
