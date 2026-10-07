import { useEffect, useRef } from 'react'
import type { CSSProperties, ElementType, ReactNode } from 'react'

interface RevealProps {
  as?:        ElementType
  /** Seconds to wait before this element's entrance, for siblings that arrive together. */
  delay?:     number
  className?: string
  style?:     CSSProperties
  children?:  ReactNode
  [attr: string]: unknown
}

// Content is visible by default. The entrance animation is armed just before the element scrolls into view,
// so it starts off-screen and a missing observer can never leave anything hidden.
export function Reveal({ as: Tag = 'div', delay = 0, className = '', style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(e => e.isIntersecting)) return
        el.dataset.in = 'true'
        observer.disconnect()
      },
      { rootMargin: '0px 0px 14% 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={{ ...style, '--d': `${delay}s` } as CSSProperties}
      {...rest}
    >
      {children}
    </Tag>
  )
}
