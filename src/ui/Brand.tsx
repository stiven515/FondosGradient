import { useT } from '../i18n'

// Logo mark: a rounded tile holding two glass ribbons crossing, drawn rather than a stock glyph.
export function BrandMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" role="img" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="brand-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0E2A33" />
          <stop offset="0.55" stopColor="#1D6670" />
          <stop offset="1" stopColor="#6FA3B5" />
        </linearGradient>
        <linearGradient id="brand-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E4EAEE" />
          <stop offset="0.6" stopColor="#B8643F" />
          <stop offset="1" stopColor="#7A3A22" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#E8EDF0" />
      <path d="M-2 21 C 8 24, 11 6, 22 9 S 31 16, 36 8 L 36 18 C 30 26, 24 18, 19 17 S 8 33, -2 31 Z" fill="url(#brand-a)" />
      <path d="M-2 8 C 6 4, 12 18, 21 17 S 29 7, 36 12 L 36 20 C 29 15, 24 27, 17 26 S 6 14, -2 18 Z" fill="url(#brand-b)" opacity="0.92" />
    </svg>
  )
}

export function Brand() {
  const t = useT()
  return (
    <div className="flex items-center gap-2.5 select-none">
      <BrandMark />
      <span className="hidden text-[14px] font-bold leading-none tracking-[-0.01em] text-ink sm:inline">{t('app.name')}</span>
    </div>
  )
}
