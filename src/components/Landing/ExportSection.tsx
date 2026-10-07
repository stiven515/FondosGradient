import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Reveal } from './Reveal'
import { HERO_PALETTE, REPO_URL } from './landingConfig'
import { Cut } from '../../ui/Cut'
import { Button } from '../../ui/Button'
import { toCss } from '../../utils/css'
import { goTo } from '../../store/viewStore'
import { toast } from '../../store/uiStore'
import { t as translate, useT, type TKey } from '../../i18n'

const WAYS: { title: TKey; desc: TKey }[] = [
  { title: 'export.image.title', desc: 'export.image.desc' },
  { title: 'export.video.title', desc: 'export.video.desc' },
  { title: 'export.css.title',   desc: 'export.css.desc' },
  { title: 'export.link.title',  desc: 'export.link.desc' },
]

function CssBlock() {
  const t = useT()
  const css = useMemo(() => toCss(HERO_PALETTE, 'mesh'), [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(css)
      toast(translate('toast.cssCopied'))
    } catch {
      toast(translate('toast.cssFailed'), 'error')
    }
  }

  return (
    <Reveal as="figure" className="m-0 mt-14 grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
      <figcaption className="pt-3 text-[13px] leading-relaxed text-ink-2">{t('export.cssCaption')}</figcaption>
      <Cut className="bg-ink" style={{ '--cut': '18px' } as CSSProperties}>
        <div className="flex items-center justify-end px-4 pt-3">
          <button
            type="button"
            onClick={copy}
            className="rounded-ctl bg-white/10 px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-on-teal transition-colors duration-150 hover:bg-white/20"
          >
            {t('export.copyCode')}
          </button>
        </div>
        <pre className="m-0 overflow-x-auto px-5 pb-5 pt-2 font-mono text-[12.5px] leading-[1.75] text-on-teal">
          <code>{css}</code>
        </pre>
      </Cut>
    </Reveal>
  )
}

export function ExportSection() {
  const t = useT()

  return (
    <section data-section="export" className="relative px-6 pb-10 pt-24 md:px-12 lg:pt-28">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2 lg:items-end lg:gap-16">
        <Reveal as="h2" className="heading-caps m-0 text-[clamp(2.2rem,5.2vw,4.2rem)] text-ink">
          {t('export.title')}
        </Reveal>
        <Reveal as="p" delay={0.1} className="m-0 max-w-lg text-[15px] leading-relaxed text-ink-2">
          {t('export.body')}
        </Reveal>
      </div>

      <ul className="mx-auto mt-14 grid max-w-6xl list-none grid-cols-1 gap-x-8 gap-y-8 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {WAYS.map((way, i) => (
          <Reveal as="li" key={way.title} delay={0.08 * i} className="border-t border-line-2 pt-5">
            <h3 className="m-0 text-[17px] font-bold tracking-[-0.01em] text-ink">{t(way.title)}</h3>
            <p className="m-0 mt-2 text-[13.5px] leading-relaxed text-ink-3">{t(way.desc)}</p>
          </Reveal>
        ))}
      </ul>

      <div className="mx-auto max-w-6xl">
        <CssBlock />
      </div>

      <div className="mx-auto mt-32 flex max-w-3xl flex-col items-center text-center">
        <Reveal as="h2" className="heading-caps m-0 text-[clamp(2.4rem,6.4vw,5rem)] text-ink">{t('close.title')}</Reveal>
        <Reveal as="p" delay={0.1} className="m-0 mt-6 max-w-md text-[15px] leading-relaxed text-ink-2">{t('close.body')}</Reveal>
        <Reveal delay={0.18} className="mt-9">
          <Button variant="primary" onClick={() => goTo('studio')} trailing={<ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />}>
            {t('cta.open')}
          </Button>
        </Reveal>
      </div>

      <footer className="mx-auto mt-28 flex max-w-6xl items-center justify-between gap-4 border-t border-line pt-6 text-[12.5px] text-ink-3">
        <span>{t('footer.license')}</span>
        <a href={REPO_URL} target="_blank" rel="noreferrer" className="font-semibold text-ink-2 underline underline-offset-4 transition-colors hover:text-ink">
          {t('footer.source')}
        </a>
      </footer>
    </section>
  )
}
