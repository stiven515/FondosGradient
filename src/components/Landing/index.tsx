import { useRef } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Frame, Notch, CornerTab } from '../../ui/Frame'
import { Brand } from '../../ui/Brand'
import { Button } from '../../ui/Button'
import { LangToggle } from '../../ui/LangToggle'
import { goTo } from '../../store/viewStore'
import { useT, type TKey } from '../../i18n'
import { Hero } from './Hero'
import { HeroReadout } from './HeroReadout'
import { StylesSection } from './StylesSection'
import { EffectsSection } from './EffectsSection'
import { ExportSection } from './ExportSection'
import { SECTION_IDS } from './landingConfig'
import { useScrollSections } from './useScrollSections'

const NAV: { id: 'styles' | 'effects' | 'export'; label: TKey }[] = [
  { id: 'styles',  label: 'nav.styles' },
  { id: 'effects', label: 'nav.effects' },
  { id: 'export',  label: 'nav.export' },
]

const pad = (n: number) => String(n).padStart(2, '0')

export function Landing() {
  const t = useT()
  const scrollerRef = useRef<HTMLDivElement>(null)
  const { active, scrollTo } = useScrollSections(scrollerRef, SECTION_IDS)
  const total = SECTION_IDS.length

  const footer = (
    <>
      <p
        className="micro m-0 transition-opacity duration-500"
        style={{ opacity: active === 0 ? 1 : 0 }}
        aria-hidden={active !== 0}
      >
        {t('hud.scroll')}
      </p>
      <div className="transition-opacity duration-500" style={{ opacity: active === 0 ? 1 : 0 }} aria-hidden="true">
        <HeroReadout />
      </div>
      <p className="micro num m-0 flex items-center gap-3" role="img" aria-label={t('hud.section', { n: active + 1, total })}>
        <span className="text-ink">{pad(active + 1)}</span>
        <span aria-hidden="true" className="h-px w-10 bg-ink-3 opacity-50" />
        <span>{pad(total)}</span>
      </p>
    </>
  )

  return (
    <Frame footer={footer}>
      <CornerTab>
        <Brand />
      </CornerTab>

      <Notch label={t('nav.label')}>
        <div className="hidden items-center gap-1 md:flex">
          {NAV.map(item => {
            const current = SECTION_IDS[active] === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollTo(item.id)}
                aria-current={current ? 'true' : undefined}
                className={`micro relative h-8 rounded-ctl px-3 transition-colors duration-150 hover:!text-ink ${current ? '!text-ink' : ''}`}
              >
                {t(item.label)}
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0.5 h-0.5 origin-left rounded-full bg-teal transition-transform duration-300 ease-out"
                  style={{ transform: current ? 'scaleX(1)' : 'scaleX(0)' }}
                />
              </button>
            )
          })}
          <span aria-hidden="true" className="mx-2 h-4 w-px bg-line-2" />
        </div>
        <LangToggle />
      </Notch>

      <div className="absolute right-3 top-3.5 z-30 sm:right-4">
        <Button
          variant="primary"
          onClick={() => goTo('studio')}
          aria-label={t('cta.open')}
          trailing={<ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />}
        >
          <span className="hidden sm:inline">{t('cta.open')}</span>
          <span className="sm:hidden">{t('cta.openShort')}</span>
        </Button>
      </div>

      <div
        ref={scrollerRef}
        className="absolute inset-0 overflow-y-auto overflow-x-hidden"
        // The frame is the viewport minus the page margin (10px above, 38px below for the HUD).
        style={{ '--stage-h': 'max(560px, calc(100dvh - 48px))' } as React.CSSProperties}
      >
        <main>
          <Hero />
          <StylesSection />
          <EffectsSection />
          <ExportSection />
        </main>
      </div>

      {/* Content fades out under the header so nothing reads through the gaps between the tabs. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[72px]"
        style={{ background: 'linear-gradient(to bottom, var(--frame) 55%, transparent)', opacity: active === 0 ? 0 : 1, transition: 'opacity 300ms' }}
      />
    </Frame>
  )
}
