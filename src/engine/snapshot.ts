import { useEffect, useState } from 'react'
import type { EffectType, ShaderParameters, ShaderType } from '../types/gradient'
import { DEFAULT_PARAMETERS } from '../constants/parameters'
import { GradientRenderer } from './renderer'

export interface SnapshotRequest {
  shader:  ShaderType
  colors:  string[]
  params?: Partial<ShaderParameters>
  effect?: EffectType
  amount?: number
  /** Seconds into the animation; chosen so the frame has a good composition. */
  time?:   number
  width?:  number
  height?: number
}

const DEFAULT_SIZE = { width: 320, height: 200 }
const DEFAULT_TIME = 7
const MAX_ENTRIES = 80

const cache = new Map<string, string>()
let surface: HTMLCanvasElement | null = null

export function snapshotKey(req: SnapshotRequest): string {
  return JSON.stringify([
    req.shader,
    req.colors.map(c => c.toUpperCase()),
    req.params ?? null,
    req.effect ?? 'none',
    req.amount ?? 0.5,
    req.time ?? DEFAULT_TIME,
    req.width ?? DEFAULT_SIZE.width,
    req.height ?? DEFAULT_SIZE.height,
  ])
}

export function clearSnapshotCache() {
  cache.clear()
}

/**
 * Renders one frame with the real engine and returns it as an image URL.
 * Returns null when WebGL or the shader is unavailable; callers fall back to a CSS gradient.
 */
export function renderSnapshot(req: SnapshotRequest): string | null {
  const key = snapshotKey(req)
  const hit = cache.get(key)
  if (hit) return hit

  if (typeof document === 'undefined') return null
  surface ??= document.createElement('canvas')
  const width = req.width ?? DEFAULT_SIZE.width
  const height = req.height ?? DEFAULT_SIZE.height

  let renderer: GradientRenderer | null = null
  try {
    renderer = new GradientRenderer(surface, req.shader)
    renderer.resize({ override: { w: width, h: height } })
    renderer.render({
      params: { ...DEFAULT_PARAMETERS, ...req.params },
      colors: req.colors.map(hex => ({ hex })),
      time: req.time ?? DEFAULT_TIME,
      effect: req.effect ?? 'none',
      amount: req.amount ?? 0.5,
    })
    const url = surface.toDataURL('image/jpeg', 0.86)
    if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value as string)
    cache.set(key, url)
    return url
  } catch {
    return null
  } finally {
    renderer?.dispose()
  }
}

const idle = (fn: () => void): (() => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout: 600 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 30)
  return () => clearTimeout(id)
}

// Renders when the browser is idle so lists of thumbnails never block interaction.
export function useSnapshot(req: SnapshotRequest | null): string | null {
  const key = req ? snapshotKey(req) : null
  const [state, setState] = useState<{ key: string | null; url: string | null }>({ key: null, url: null })

  useEffect(() => {
    if (!req || !key) return
    if (cache.has(key)) return
    return idle(() => setState({ key, url: renderSnapshot(req) }))
    // `req` is represented by `key`; depending on the object itself would re-render every time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  if (!key) return null
  return cache.get(key) ?? (state.key === key ? state.url : null)
}
