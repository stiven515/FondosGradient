import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Cut } from './Cut'

type Variant = 'primary' | 'outline' | 'quiet'
type Size = 'md' | 'sm'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  icon?:     ReactNode
  trailing?: ReactNode
}

const SIZES: Record<Size, string> = {
  md: 'h-9 px-4 text-[11px] gap-2',
  sm: 'h-8 px-2.5 text-[10.5px] gap-1.5',
}

const LABEL = 'inline-flex items-center justify-center font-bold uppercase tracking-[0.14em] whitespace-nowrap'

export function Button({
  variant = 'quiet', size = 'md', icon, trailing, children, className = '', type = 'button', ...rest
}: ButtonProps) {
  const label = `${LABEL} ${SIZES[size]}`
  const content = (
    <>
      {icon}
      {children}
      {trailing && (
        <span className="inline-flex transition-transform duration-200 ease-out group-hover:-translate-y-px group-hover:translate-x-px">
          {trailing}
        </span>
      )}
    </>
  )

  if (variant === 'primary') {
    return (
      <Cut
        as="button"
        type={type}
        className={`group ${label} bg-teal text-on-teal transition-[background-color,transform] duration-150 hover:bg-teal-hover active:scale-[0.98] disabled:opacity-50 ${className}`}
        {...rest}
      >
        {content}
      </Cut>
    )
  }

  if (variant === 'outline') {
    return (
      <Cut
        as="button"
        type={type}
        line
        className={`group transition-transform duration-150 active:scale-[0.98] disabled:opacity-50 ${className}`}
        fillClassName={`${label} text-ink transition-colors duration-150 hover:bg-wash`}
        {...rest}
      >
        {content}
      </Cut>
    )
  }

  return (
    <button
      type={type}
      className={`group ${label} rounded-ctl text-ink-2 transition-colors duration-150 hover:bg-teal-soft hover:text-ink disabled:opacity-50 ${className}`}
      {...rest}
    >
      {content}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  active?: boolean
  children: ReactNode
}

// Icon-only control: the label is required so it always has an accessible name.
export function IconButton({ label, active = false, children, className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-ctl transition-colors duration-150 disabled:opacity-40 ${
        active ? 'bg-teal-soft text-ink' : 'text-ink-3 hover:bg-teal-soft hover:text-ink'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
