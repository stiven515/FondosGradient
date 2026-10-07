// src/components/Sidebar/index.tsx
import { useState, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Sparkles, Lock, GripVertical, ImagePlus, Plus, Minus } from 'lucide-react'
import { StyleSelector }  from '../StyleSelector'
import { ParameterPanel } from '../ParameterPanel'
import { EffectsPanel }   from '../EffectsPanel'
import { ColorSwatch }    from '../ColorPalette/ColorSwatch'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import { generateHarmoniousPalette } from '../../utils/palette'
import { useMediaQuery } from '../../utils/media'
import { paletteFromFile } from '../../utils/paletteFromFile'
import { generateId } from '../../utils/color'
import { toast } from '../../store/uiStore'
import { t as translate, useT } from '../../i18n'
import { Cut } from '../../ui/Cut'
import { Button, IconButton } from '../../ui/Button'
import { MAX_COLORS, MIN_COLORS } from '../../constants/parameters'
import type { ShaderParameters } from '../../types/gradient'

function Section({ title, hint, action, children }: {
  title: string
  hint?: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-3.5 border-t border-line px-4 py-4 first:border-t-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h2 className="micro">{title}</h2>
          {hint && <span className="text-[10.5px] text-ink-3">{hint}</span>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

const STEPPER = 'flex h-6 w-6 items-center justify-center rounded-[7px] bg-sunken text-ink-2 transition-colors hover:bg-teal-soft hover:text-ink disabled:opacity-35 disabled:hover:bg-sunken'

export function Sidebar() {
  const t = useT()
  const narrow = useMediaQuery('(max-width: 767px)')
  // Until the person picks, the panel follows the screen width; after that their choice wins.
  const [manual, setManual] = useState<boolean | null>(null)
  const collapsed = manual ?? narrow
  const setCollapsed = setManual
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragFrom, setDragFrom] = useState<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const {
    colors, addColor, removeColor, lockAll, updateColor, toggleLock,
    pushHistory, setColors, setParameter, moveColor,
  } = useGradientStore()

  const handleDrop = useCallback((to: number) => {
    if (dragFrom !== null && dragFrom !== to) {
      pushHistory()
      moveColor(dragFrom, to)
    }
    setDragFrom(null)
    setDragOver(null)
  }, [dragFrom, pushHistory, moveColor])

  const handleGenerate = useCallback(() => {
    pushHistory()
    setColors(generateHarmoniousPalette(useGradientStore.getState().colors))
  }, [pushHistory, setColors])

  const handleImage = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const hexes = await paletteFromFile(file, 5)
      if (hexes.length < 2) {
        toast(translate('toast.imageLowVariety'), 'error')
        return
      }
      const current = useGradientStore.getState().colors
      pushHistory()
      setColors(hexes.map((hex, i) => ({ id: current[i]?.id ?? generateId(), hex, locked: false })))
      toast(translate('toast.paletteFromImage'))
    } catch {
      toast(translate('toast.imageUnreadable'), 'error')
    }
  }, [pushHistory, setColors])

  const handleResetAll = useCallback(() => {
    pushHistory()
    Object.entries(DEFAULT_PARAMETERS).forEach(([k, v]) =>
      setParameter(k as keyof ShaderParameters, v)
    )
  }, [pushHistory, setParameter])

  if (collapsed) {
    return (
      <aside aria-label={t('panel.controls')} className="flex w-11 flex-shrink-0 flex-col items-center pt-1">
        <IconButton label={t('panel.expand')} onClick={() => setCollapsed(false)}>
          <ChevronRight size={16} strokeWidth={1.9} aria-hidden="true" />
        </IconButton>
      </aside>
    )
  }

  return (
    <Cut
      as="aside"
      line
      aria-label={t('panel.controls')}
      className={`flex-shrink-0 ${narrow ? 'absolute inset-y-2 left-2 z-30 shadow-pop' : 'h-full'}`}
      style={{ width: narrow ? 'min(300px, calc(100% - 16px))' : 300 }}
      fillClassName="flex flex-col overflow-hidden"
    >
      <div className="flex h-12 flex-shrink-0 items-center justify-between border-b border-line px-4">
        <span className="micro">{t('panel.controls')}</span>
        <IconButton label={t('panel.collapse')} onClick={() => setCollapsed(true)}>
          <ChevronLeft size={16} strokeWidth={1.9} aria-hidden="true" />
        </IconButton>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <Section title={t('panel.style')} hint={t('panel.styleHint')}>
          <StyleSelector />
        </Section>

        <Section
          title={t('panel.palette')}
          action={
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => { pushHistory(); removeColor(colors[colors.length - 1].id) }}
                disabled={colors.length <= MIN_COLORS}
                aria-label={t('palette.remove')}
                className={STEPPER}
              >
                <Minus size={12} strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span className="num min-w-3 text-center text-[12px] font-semibold text-ink">{colors.length}</span>
              <button
                type="button"
                onClick={() => { pushHistory(); addColor() }}
                disabled={colors.length >= MAX_COLORS}
                aria-label={t('palette.add')}
                className={STEPPER}
              >
                <Plus size={12} strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-1.5">
            {colors.map((color, i) => (
              <div
                key={color.id}
                className="flex items-center gap-1 rounded-ctl transition-[opacity,box-shadow] duration-150"
                style={{
                  opacity: dragFrom === i ? 0.4 : 1,
                  boxShadow: dragOver === i && dragFrom !== i
                    ? `0 ${dragFrom !== null && dragFrom < i ? 2 : -2}px 0 0 var(--teal)`
                    : 'none',
                }}
                onDragOver={e => { e.preventDefault(); setDragOver(i) }}
                onDrop={e => { e.preventDefault(); handleDrop(i) }}
              >
                <span
                  draggable
                  onDragStart={e => {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', String(i))
                    setDragFrom(i)
                  }}
                  onDragEnd={() => { setDragFrom(null); setDragOver(null) }}
                  aria-label={t('palette.drag', { hex: color.hex })}
                  title={t('palette.dragTitle')}
                  className="flex cursor-grab items-center text-ink-3 active:cursor-grabbing"
                >
                  <GripVertical size={14} strokeWidth={1.6} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1" onFocusCapture={pushHistory}>
                  <ColorSwatch
                    color={color}
                    canRemove={colors.length > MIN_COLORS}
                    onUpdate={updateColor}
                    onRemove={id => { pushHistory(); removeColor(id) }}
                    onToggleLock={toggleLock}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Button variant="outline" size="sm" className="col-span-2" onClick={handleGenerate} icon={<Sparkles size={12} strokeWidth={2.2} aria-hidden="true" />}>
              {t('palette.generate')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
              aria-label={t('palette.imageAria')}
              title={t('palette.imageTitle')}
              icon={<ImagePlus size={12} strokeWidth={2.2} aria-hidden="true" />}
            >
              {t('palette.image')}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleImage}
              aria-label={t('palette.imageInput')}
              className="sr-only"
              tabIndex={-1}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={lockAll}
              aria-label={t('palette.lockAll')}
              title={t('palette.lockAll')}
              icon={<Lock size={12} strokeWidth={2.2} aria-hidden="true" />}
            >
              {t('palette.lock')}
            </Button>
          </div>
        </Section>

        <Section
          title={t('panel.parameters')}
          action={
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-semibold text-ink-3 transition-colors hover:text-ink"
            >
              {t('panel.reset')}
            </button>
          }
        >
          <ParameterPanel />
        </Section>

        <Section title={t('panel.effects')}>
          <EffectsPanel />
        </Section>
      </div>
    </Cut>
  )
}
