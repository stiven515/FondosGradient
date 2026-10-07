import { describe, it, expect, afterEach, vi } from 'vitest'

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules() })

async function freshStore(reduce: boolean) {
  vi.resetModules()
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: reduce && q.includes('prefers-reduced-motion') }))
  return (await import('./gradientStore')).useGradientStore
}

describe('initial playback state', () => {
  it('starts paused for users who prefer reduced motion', async () => {
    const store = await freshStore(true)
    expect(store.getState().isPlaying).toBe(false)
  })

  it('starts playing otherwise', async () => {
    const store = await freshStore(false)
    expect(store.getState().isPlaying).toBe(true)
  })
})
