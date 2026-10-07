import { useState } from 'react'
import type { CSSProperties } from 'react'
import { LiveCanvas } from './LiveCanvas'
import { Reveal } from './Reveal'
import { HERO_PALETTE, HERO_PARAMS } from './landingConfig'
import { Cut } from '../../ui/Cut'
import { SHADER_TYPES } from '../../constants/shaders'
import { useT, type TKey } from '../../i18n'
import type { ShaderType } from '../../types/gradient'

const LEFT = SHADER_TYPES.slice(0, 4)
const RIGHT = SHADER_TYPES.slice(4)

function StyleCard({ type, active, onSelect, index }: { type: ShaderType; active: boolean; onSelect: (t: ShaderType) => void; index: number }) {
  const t = useT()
  return (
    <Reveal delay={0.08 * index}>
      <Cut
        as="button"
        type="button"
        line
        aria-pressed={active}
        onMouseEnter={() => onSelect(type)}
        onFocus={() => onSelect(type)}
        onClick={() => onSelect(type)}
        className="block w-full text-left transition-transform duration-300 ease-out hover:-translate-y-0.5"
        style={{ '--line-2': active ? 'var(--teal)' : undefined } as CSSProperties}
        fillClassName={`px-5 py-4 transition-colors duration-200 ${active ? '!bg-wash' : ''}`}
      >
        <span className="block text-[16px] font-bold leading-tight tracking-[-0.01em] text-ink">{t(`style.${type}` as TKey)}</span>
        <span className="mt-1 block text-[12.5px] leading-snug text-ink-3">{t(`style.${type}.desc` as TKey)}</span>
      </Cut>
    </Reveal>
  )
}

export function StylesSection() {
  const t = useT()
  const [active, setActive] = useState<ShaderType>('ribbon')

  return (
    <section data-section="styles" className="relative px-6 py-28 md:px-12 lg:py-36">
      <Reveal as="h2" className="heading-caps m-0 text-center text-[clamp(2.2rem,5.2vw,4.2rem)] text-ink">
        {t('styles.title')}
      </Reveal>
      <Reveal as="p" delay={0.1} className="mx-auto mb-0 mt-5 max-w-md text-center text-[14px] leading-relaxed text-ink-2">
        {t('styles.hint')}
      </Reveal>

      <div className="mx-auto mt-16 grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_minmax(280px,380px)_1fr] lg:gap-12">
        <div
          className="order-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:order-1 lg:grid-cols-1 lg:gap-4"
          style={{ transform: 'translateY(calc((var(--p-styles, 0.5) - 0.5) * -56px))' } as CSSProperties}
        >
          {LEFT.map((type, i) => <StyleCard key={type} type={type} active={active === type} onSelect={setActive} index={i} />)}
        </div>

        <div className="order-1 lg:order-2">
          <div
            className="relative mx-auto aspect-square w-full max-w-[380px]"
            style={{ transform: 'scale(calc(0.84 + var(--p-styles, 0.5) * 0.26))' } as CSSProperties}
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 p-[9px]"
              style={{
                background: 'conic-gradient(from calc(var(--p-styles, 0) * 160deg), #F7F9FA, #8DB3C2, #1D4A57, #B8643F, #E4EAEE, #F7F9FA)',
                animation: 'blob 14s ease-in-out infinite alternate',
                boxShadow: 'var(--shadow-pop)',
              } as CSSProperties}
            >
              <div className="h-full w-full overflow-hidden" style={{ borderRadius: 'inherit' }}>
                <LiveCanvas shader={active} colors={HERO_PALETTE} params={HERO_PARAMS} maxDpr={1.25} />
              </div>
            </div>
          </div>
          <p className="sr-only" aria-live="polite">{t(`style.${active}` as TKey)}</p>
        </div>

        <div
          className="order-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 lg:gap-4"
          style={{ transform: 'translateY(calc((var(--p-styles, 0.5) - 0.5) * 56px))' } as CSSProperties}
        >
          {RIGHT.map((type, i) => <StyleCard key={type} type={type} active={active === type} onSelect={setActive} index={i + 4} />)}
        </div>
      </div>
    </section>
  )
}
