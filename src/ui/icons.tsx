import type { SVGProps } from 'react'
import type { EffectType } from '../types/gradient'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 18, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  )
}

const NoneIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="7.5" /><path d="M6.7 17.3 17.3 6.7" /></Svg>
)

const GrainIcon = (p: IconProps) => (
  <Svg {...p}>
    {[[6, 7], [12, 5.5], [18, 8], [8.5, 12], [15, 12.5], [5.5, 17], [11.5, 17.5], [18, 16.5], [20, 12]].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r={1} fill="currentColor" stroke="none" />
    ))}
  </Svg>
)

const GlowIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="6.4" opacity="0.6" />
    <circle cx="12" cy="12" r="9.4" opacity="0.28" />
  </Svg>
)

const ChromaticIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="9.2" cy="9.6" r="5.2" />
    <circle cx="14.8" cy="9.6" r="5.2" opacity="0.7" />
    <circle cx="12" cy="14.8" r="5.2" opacity="0.45" />
  </Svg>
)

const GlassIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="4" y="4.5" width="16" height="15" rx="2.5" />
    <path d="M8.7 4.5v15M12 4.5v15M15.3 4.5v15" opacity="0.6" />
    <path d="M6.2 8.2c.9-.5 1.2 1.5 2.5.9M13.6 14.5c.9-.5 1.2 1.5 1.7.9" opacity="0.55" />
  </Svg>
)

const DitherIcon = (p: IconProps) => (
  <Svg {...p}>
    {[0, 1, 2].flatMap(r => [0, 1, 2].map(c => (
      (r + c) % 2 === 0
        ? <rect key={`${r}${c}`} x={4.5 + c * 5} y={4.5 + r * 5} width={4.6} height={4.6} rx={0.8} fill="currentColor" stroke="none" />
        : null
    )))}
  </Svg>
)

const HalftoneIcon = (p: IconProps) => (
  <Svg {...p}>
    {[0, 1, 2].flatMap(r => [0, 1, 2].map(c => (
      <circle key={`${r}${c}`} cx={6 + c * 6} cy={6 + r * 6} r={0.6 + (r + c) * 0.55} fill="currentColor" stroke="none" />
    )))}
  </Svg>
)

const EFFECT_ICONS: Record<EffectType, (p: IconProps) => React.ReactElement> = {
  none: NoneIcon,
  grain: GrainIcon,
  glow: GlowIcon,
  chromatic: ChromaticIcon,
  glass: GlassIcon,
  dither: DitherIcon,
  halftone: HalftoneIcon,
}

export function EffectIcon({ effect, ...props }: IconProps & { effect: EffectType }) {
  const Icon = EFFECT_ICONS[effect]
  return <Icon {...props} />
}
