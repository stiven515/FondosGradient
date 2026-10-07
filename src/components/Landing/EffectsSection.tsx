import type { CSSProperties } from 'react'
import { Reveal } from './Reveal'
import { HERO_PALETTE, HERO_PARAMS } from './landingConfig'
import { Cut } from '../../ui/Cut'
import { useSnapshot } from '../../engine/snapshot'
import { useT, type TKey } from '../../i18n'
import type { EffectType } from '../../types/gradient'

// Tiles of different widths so the grid reads as a composition, not a uniform catalogue.
const TILES: { effect: Exclude<EffectType, 'none'>; span: string }[] = [
  { effect: 'glow',      span: 'lg:col-span-5' },
  { effect: 'glass',     span: 'lg:col-span-4' },
  { effect: 'grain',     span: 'lg:col-span-3' },
  { effect: 'halftone',  span: 'lg:col-span-4' },
  { effect: 'chromatic', span: 'lg:col-span-5' },
  { effect: 'dither',    span: 'lg:col-span-3' },
]

function Tile({ effect, span, index }: { effect: Exclude<EffectType, 'none'>; span: string; index: number }) {
  const t = useT()
  const url = useSnapshot({
    shader: 'ribbon',
    colors: HERO_PALETTE,
    params: { ...HERO_PARAMS, grain: effect === 'grain' ? 0.45 : 0 },
    effect,
    amount: 0.72,
    width: 880,
    height: 560,
  })
  const fallback = `linear-gradient(135deg, ${HERO_PALETTE.join(', ')})`

  return (
    <Reveal as="figure" delay={0.07 * index} className={`group m-0 ${span}`}>
      <Cut
        className="h-[clamp(200px,24vw,320px)] w-full overflow-hidden"
        style={{ '--cut': '16px' } as CSSProperties}
      >
        <div
          className="h-full w-full transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{ background: url ? `center / cover no-repeat url(${url})` : fallback }}
        />
      </Cut>
      <figcaption className="mt-3 flex flex-col gap-1">
        <span className="text-[15px] font-bold tracking-[-0.01em] text-ink">{t(`effect.${effect}` as TKey)}</span>
        <span className="text-[12.5px] leading-snug text-ink-3">{t(`effects.${effect}.desc` as TKey)}</span>
      </figcaption>
    </Reveal>
  )
}

export function EffectsSection() {
  const t = useT()

  return (
    <section data-section="effects" className="relative px-6 py-28 md:px-12 lg:py-36">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-end lg:gap-16">
        <Reveal as="h2" className="heading-caps m-0 text-[clamp(2.2rem,5.2vw,4.2rem)] text-ink">
          {t('effects.title')}
        </Reveal>
        <Reveal as="p" delay={0.1} className="m-0 max-w-lg text-[15px] leading-relaxed text-ink-2">
          {t('effects.body')}
        </Reveal>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-12">
        {TILES.map((tile, i) => <Tile key={tile.effect} {...tile} index={i} />)}
      </div>
    </section>
  )
}
