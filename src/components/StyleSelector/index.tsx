// src/components/StyleSelector/index.tsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { useSnapshot } from '../../engine/snapshot'
import { useT, type TKey } from '../../i18n'
import type { ShaderType } from '../../types/gradient'
import { SHADER_TYPES } from '../../constants/shaders'

function Thumb({ shader, colors, width, height }: { shader: ShaderType; colors: string[]; width: number; height: number }) {
  const url = useSnapshot({ shader, colors, width: width * 2, height: height * 2 })
  const fallback = `linear-gradient(135deg, ${colors.join(', ')})`
  return (
    <div
      aria-hidden="true"
      className="flex-shrink-0 rounded-[8px]"
      style={{
        width,
        height,
        background: url ? `center / cover no-repeat url(${url})` : fallback,
        boxShadow: 'inset 0 0 0 1px rgba(18, 52, 59, 0.14)',
      }}
    />
  )
}

export function StyleSelector() {
  const t = useT()
  const shader = useGradientStore(s => s.shader)
  const setShader = useGradientStore(s => s.setShader)
  const hexes = useGradientStore(s => s.colors).map(c => c.hex)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    optionRefs.current[SHADER_TYPES.indexOf(shader)]?.focus()
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, shader])

  function pick(type: ShaderType) {
    setShader(type)
    setOpen(false)
    triggerRef.current?.focus()
  }

  function onListKey(e: React.KeyboardEvent) {
    const current = optionRefs.current.findIndex(el => el === document.activeElement)
    const move = (to: number) => { e.preventDefault(); optionRefs.current[(to + SHADER_TYPES.length) % SHADER_TYPES.length]?.focus() }
    if (e.key === 'ArrowDown') move(current + 1)
    else if (e.key === 'ArrowUp') move(current - 1)
    else if (e.key === 'Home') move(0)
    else if (e.key === 'End') move(SHADER_TYPES.length - 1)
    else if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); triggerRef.current?.focus() }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('tool.selectStyle')}
        className={`flex w-full items-center gap-3 rounded-[12px] p-1.5 pr-3 text-left transition-colors duration-150 ${
          open ? 'bg-raised shadow-[inset_0_0_0_1px_var(--teal)]' : 'bg-sunken hover:bg-teal-soft'
        }`}
      >
        <Thumb shader={shader} colors={hexes} width={52} height={40} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13.5px] font-bold leading-tight text-ink">{t(`style.${shader}` as TKey)}</span>
          <span className="mt-0.5 block truncate text-[11px] leading-tight text-ink-3">{t(`style.${shader}.desc` as TKey)}</span>
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2}
          aria-hidden="true"
          className={`flex-shrink-0 text-ink-3 transition-transform duration-200 ease-out ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('panel.style')}
          onKeyDown={onListKey}
          className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-[22rem] overflow-y-auto rounded-[14px] bg-raised p-1 shadow-pop"
          style={{ boxShadow: 'var(--shadow-pop), inset 0 0 0 1px var(--line)' }}
        >
          {SHADER_TYPES.map((type, i) => {
            const active = type === shader
            return (
              <button
                key={type}
                ref={el => { optionRefs.current[i] = el }}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => pick(type)}
                className={`flex w-full items-center gap-3 rounded-[10px] p-1.5 text-left transition-colors duration-150 ${
                  active ? 'bg-teal-soft' : 'hover:bg-sunken'
                }`}
              >
                <Thumb shader={type} colors={hexes} width={44} height={32} />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[12.5px] leading-tight ${active ? 'font-bold text-ink' : 'font-semibold text-ink-2'}`}>
                    {t(`style.${type}` as TKey)}
                  </span>
                  <span className="mt-0.5 block truncate text-[10.5px] leading-tight text-ink-3">{t(`style.${type}.desc` as TKey)}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
