// src/components/BottomArea/index.tsx — the dock under the canvas: palettes, looks and saved designs
import { useState } from 'react'
import { X } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { toast } from '../../store/uiStore'
import { LOOKS } from '../../constants/looks'
import { PALETTE_PRESETS } from '../../constants/palettes'
import { generateId } from '../../utils/color'
import { loadSaved, saveDesign, removeDesign, type SavedDesign } from '../../utils/savedDesigns'
import { t as translate, useT, type TKey } from '../../i18n'
import { SnapshotThumb } from '../../ui/SnapshotThumb'
import { Button } from '../../ui/Button'
import type { Design, ShaderType } from '../../types/gradient'

type Tab = 'palettes' | 'looks' | 'saved'
const TABS: { id: Tab; key: TKey }[] = [
  { id: 'palettes', key: 'dock.palettes' },
  { id: 'looks',    key: 'dock.looks' },
  { id: 'saved',    key: 'dock.saved' },
]

export function BottomArea() {
  const t = useT()
  const { colors, setColors, pushHistory, applyDesign } = useGradientStore()
  const shader = useGradientStore(s => s.shader)
  const parameters = useGradientStore(s => s.parameters)
  const [tab, setTab] = useState<Tab>('palettes')
  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [saved, setSaved] = useState<SavedDesign[]>(() => loadSaved())
  const [name, setName] = useState('')

  function applyPreset(id: string, presetColors: string[]) {
    pushHistory()
    const next = presetColors.slice(0, colors.length).map((hex, i) => ({
      id:     colors[i]?.id ?? generateId(),
      hex,
      locked: colors[i]?.locked ?? false,
    }))
    setColors(next)
    setActivePreset(id)
  }

  function currentDesign(): Design {
    const s = useGradientStore.getState()
    return {
      shader: s.shader,
      colors: s.colors.map(c => c.hex),
      parameters: { ...s.parameters },
      effect: s.effect,
      effectAmount: s.effectAmount,
      duration: s.duration,
      aspectRatio: s.aspectRatio,
    }
  }

  function save() {
    saveDesign(name, currentDesign())
    setSaved(loadSaved())
    setName('')
    toast(translate('toast.designSaved'))
  }

  function remove(id: string) {
    removeDesign(id)
    setSaved(loadSaved())
  }

  function onTabKey(e: React.KeyboardEvent) {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = TABS[(TABS.findIndex(x => x.id === tab) + step + TABS.length) % TABS.length]
    setTab(next.id)
    document.getElementById(`tab-${next.id}`)?.focus()
  }

  return (
    <section className="flex flex-shrink-0 flex-col gap-2.5 border-t border-line px-5 pb-2 pt-3" aria-label={t('dock.label')}>
      <div className="flex items-center gap-4">
        <div role="tablist" aria-label={t('dock.label')} className="flex items-center gap-5" onKeyDown={onTabKey}>
          {TABS.map(item => {
            const active = tab === item.id
            return (
              <button
                key={item.id}
                id={`tab-${item.id}`}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls="dock-panel"
                tabIndex={active ? 0 : -1}
                onClick={() => setTab(item.id)}
                className={`micro relative pb-1.5 transition-colors duration-150 ${active ? '!text-ink' : 'hover:!text-ink-2'}`}
              >
                {t(item.key)}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-0.5 origin-left rounded-full bg-teal transition-transform duration-300 ease-out"
                  style={{ transform: active ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </button>
            )
          })}
        </div>

        {tab === 'saved' && (
          <form className="ml-auto flex items-center gap-2" onSubmit={e => { e.preventDefault(); save() }}>
            <input
              id="design-name"
              aria-label={t('dock.name')}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('dock.namePlaceholder')}
              maxLength={32}
              className="h-8 w-44 rounded-ctl bg-sunken px-3 text-[12px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:bg-raised focus:shadow-[inset_0_0_0_1px_var(--teal)]"
            />
            <Button type="submit" variant="primary" size="sm">{t('dock.save')}</Button>
          </form>
        )}
      </div>

      <div
        id="dock-panel"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className="flex items-start gap-3 overflow-x-auto pb-1.5"
        style={{ scrollbarWidth: 'none' }}
      >
        {tab === 'palettes' && PALETTE_PRESETS.map(preset => (
          <Card
            key={preset.id}
            name={t(preset.nameKey)}
            active={activePreset === preset.id}
            onClick={() => applyPreset(preset.id, preset.colors)}
            request={{ shader, colors: preset.colors, params: parameters }}
          />
        ))}

        {tab === 'looks' && LOOKS.map(look => (
          <Card
            key={look.id}
            name={t(look.nameKey)}
            onClick={() => applyDesign(look)}
            request={{ shader: look.shader, colors: look.colors, params: look.parameters, effect: look.effect, amount: look.effectAmount }}
          />
        ))}

        {tab === 'saved' && (saved.length === 0
          ? <p className="py-5 text-[12px] text-ink-3">{t('dock.empty')}</p>
          : saved.map(s => (
            <Card
              key={s.id}
              name={s.name}
              onClick={() => applyDesign(s.design)}
              onRemove={() => remove(s.id)}
              request={{
                shader: s.design.shader as ShaderType,
                colors: s.design.colors,
                params: s.design.parameters,
                effect: s.design.effect,
                amount: s.design.effectAmount,
              }}
            />
          )))}
      </div>
    </section>
  )
}

function Card({ name, active = false, onClick, onRemove, request }: {
  name: string
  active?: boolean
  onClick: () => void
  onRemove?: () => void
  request: Parameters<typeof SnapshotThumb>[0]['request']
}) {
  const t = useT()
  return (
    <div className="group relative flex-shrink-0">
      <button
        type="button"
        onClick={onClick}
        aria-label={name}
        title={name}
        aria-pressed={active}
        className="flex flex-col items-start gap-1.5 rounded-[6px] text-left"
      >
        <span className={`relative block transition-transform duration-200 ease-out group-hover:-translate-y-0.5 ${active ? 'drop-shadow-[0_0_0_var(--teal)]' : ''}`}>
          <SnapshotThumb request={request} width={104} height={64} />
          {active && <span aria-hidden="true" className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-teal" />}
        </span>
        <span className={`max-w-[104px] truncate text-[11px] leading-none ${active ? 'font-bold text-ink' : 'font-semibold text-ink-3'}`}>
          {name}
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={t('dock.delete', { name })}
          title={t('dock.deleteTitle')}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-raised text-ink-2 opacity-0 shadow-raised transition-opacity duration-150 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
        >
          <X size={11} strokeWidth={2.5} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
