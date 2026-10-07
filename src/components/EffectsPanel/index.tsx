// src/components/EffectsPanel/index.tsx
import { useGradientStore } from '../../store/gradientStore'
import { Slider } from '../ParameterPanel/Slider'
import { EFFECTS, hasIntensity } from '../../constants/effects'
import { EffectIcon } from '../../ui/icons'
import { useT, type TKey } from '../../i18n'

export function EffectsPanel() {
  const t = useT()
  const effect = useGradientStore(s => s.effect)
  const setEffect = useGradientStore(s => s.setEffect)
  const effectAmount = useGradientStore(s => s.effectAmount)
  const setEffectAmount = useGradientStore(s => s.setEffectAmount)

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-1.5">
        {EFFECTS.map(e => {
          const active = effect === e.id
          const label = t(`effect.${e.id}` as TKey)
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setEffect(e.id)}
              aria-label={label}
              aria-pressed={active}
              title={label}
              className={`flex flex-col items-center gap-1.5 rounded-[10px] px-1 py-2 transition-[background-color,color,box-shadow] duration-150 ${
                active
                  ? 'bg-teal-soft text-teal shadow-[inset_0_0_0_1.5px_var(--teal)]'
                  : 'bg-sunken text-ink-3 hover:bg-teal-soft hover:text-ink'
              }`}
            >
              <EffectIcon effect={e.id} size={18} />
              <span className={`w-full truncate text-center text-[10.5px] leading-none ${active ? 'font-bold' : 'font-semibold'}`}>{label}</span>
            </button>
          )
        })}
      </div>
      {hasIntensity(effect) && (
        <Slider
          label={t('effect.intensity')}
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
