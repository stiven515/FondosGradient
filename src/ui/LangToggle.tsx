import { LANGS, useLang, translate, useT, type Lang } from '../i18n'

const SHORT: Record<Lang, string> = { es: 'ES', en: 'EN' }

export function LangToggle({ className = '' }: { className?: string }) {
  const t = useT()
  const lang = useLang(s => s.lang)
  const setLang = useLang(s => s.setLang)

  return (
    <div role="group" aria-label={t('lang.switch')} className={`inline-flex items-center rounded-ctl bg-sunken p-0.5 ${className}`}>
      {LANGS.map(code => {
        const active = code === lang
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-pressed={active}
            aria-label={translate(code, 'lang.name')}
            title={translate(code, 'lang.name')}
            onClick={() => setLang(code)}
            className={`h-6 min-w-8 rounded-[8px] px-2 text-[10.5px] font-bold tracking-[0.12em] transition-colors duration-150 ${
              active ? 'bg-raised text-ink shadow-[0_1px_2px_rgba(18,52,59,0.18)]' : 'text-ink-3 hover:text-ink'
            }`}
          >
            {SHORT[code]}
          </button>
        )
      })}
    </div>
  )
}
