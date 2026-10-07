import { useSyncExternalStore } from 'react'

export function matches(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches
}

export function prefersReducedMotion(): boolean {
  return matches('(prefers-reduced-motion: reduce)')
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (notify) => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mql = window.matchMedia(query)
      mql.addEventListener('change', notify)
      return () => mql.removeEventListener('change', notify)
    },
    () => matches(query),
    () => false,
  )
}
