import { create } from 'zustand'
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../utils/media'

export type View = 'landing' | 'studio'

// Query keys a shared design link carries; any of them means "open the editor".
const DESIGN_KEYS = ['shader', 'colors', 'effect', 'fx', 'dur', 'ar', 'scale', 'curl', 'drift', 'openness', 'seed', 'speed', 'grain']

export function initialView(search: string, hash: string): View {
  if (hash === '#/studio') return 'studio'
  const params = new URLSearchParams(search)
  return DESIGN_KEYS.some(key => params.has(key)) ? 'studio' : 'landing'
}

interface ViewState { view: View }

export const useView = create<ViewState>()(() => ({
  view: typeof window === 'undefined' ? 'landing' : initialView(window.location.search, window.location.hash),
}))

function readHash(): View {
  return window.location.hash === '#/studio' ? 'studio' : 'landing'
}

// Moves between views. The hero frame and the studio canvas share a view-transition name, so where the browser
// supports it the change is a continuous morph rather than a cut.
export function goTo(view: View) {
  const hash = view === 'studio' ? '#/studio' : ''
  const url = `${window.location.pathname}${window.location.search}${hash}`
  const apply = () => {
    window.history.pushState(null, '', url)
    flushSync(() => useView.setState({ view }))
  }

  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (doc.startViewTransition && !prefersReducedMotion()) doc.startViewTransition(apply)
  else apply()
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => useView.setState({ view: readHash() }))
  window.addEventListener('popstate', () => useView.setState({ view: readHash() }))
}
