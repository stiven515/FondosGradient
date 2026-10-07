import type { ReactNode } from 'react'

// The page margin and the rounded frame every screen sits in. Content scrolls or lays out inside the frame.
export function Frame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="fixed inset-0 bg-page p-[10px]" style={{ paddingBottom: footer ? 38 : 10 }}>
      <div className="relative h-full w-full overflow-hidden rounded-frame bg-frame">
        {children}
      </div>
      {footer && (
        <div className="absolute inset-x-0 bottom-0 flex h-[38px] items-center justify-between gap-4 px-7">
          {footer}
        </div>
      )}
    </div>
  )
}

// A tab in the frame's top-left corner, in the page's colour, for content that must stay legible over imagery.
export function CornerTab({ children }: { children: ReactNode }) {
  return <div className="tab-left"><div className="flex h-[52px] items-center pl-5 pr-4">{children}</div></div>
}

// The tab set into the frame's top edge. Its colour is the page's, so it reads as a bite out of the frame.
export function Notch({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <nav aria-label={label} className={`notch ${className}`}>
      <div className="flex h-[52px] items-center gap-0.5 px-3 sm:gap-1 sm:px-5">{children}</div>
    </nav>
  )
}
