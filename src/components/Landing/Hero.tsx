import { LiveCanvas } from './LiveCanvas'
import { HERO_PALETTE, HERO_PARAMS } from './landingConfig'
import { useT } from '../../i18n'

// First viewport: the engine itself is the only image. As the page scrolls the artwork drifts and swells
// while the title rises faster than the page, which is what separates the layers.
export function Hero() {
  const t = useT()

  return (
    <section data-section="hero" className="relative overflow-hidden" style={{ height: 'var(--stage-h)' }}>
      <div
        className="absolute inset-0"
        style={{
          transform: 'scale(calc(1 + var(--hero-p, 0) * 0.1))',
          transformOrigin: '50% 40%',
          viewTransitionName: 'stage',
        } as React.CSSProperties}
      >
        <LiveCanvas shader="ribbon" colors={HERO_PALETTE} params={HERO_PARAMS} />
      </div>

      {/* A soft veil keeps the title legible whichever part of the artwork is behind it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 40% 34% at 50% 47%, rgba(243, 246, 248, 0.6), rgba(243, 246, 248, 0) 100%)' }}
      />

      <div
        className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center"
        style={{
          transform: 'translateY(calc(var(--hero-p, 0) * -110px))',
          opacity: 'calc(1 - var(--hero-p, 0) * 0.9)',
        } as React.CSSProperties}
      >
        <h1
          className="m-0 text-[clamp(3.4rem,11vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.04em] text-ink"
          style={{ animation: 'rise 1s var(--ease-out) 0.08s both' }}
        >
          gradient
          <br />
          studio
        </h1>
        <p
          className="m-0 mt-7 max-w-[26rem] text-[12.5px] font-bold uppercase leading-[1.7] tracking-[0.2em] text-ink"
          style={{ animation: 'rise 1s var(--ease-out) 0.24s both' }}
        >
          {t('hero.tagline')}
        </p>
      </div>
    </section>
  )
}
