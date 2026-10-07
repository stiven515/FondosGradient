import { useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { GradientRenderer, EngineError } from '../../engine/renderer'
import { DEFAULT_PARAMETERS } from '../../constants/parameters'
import { prefersReducedMotion } from '../../utils/media'
import type { EffectType, ShaderParameters, ShaderType } from '../../types/gradient'

interface LiveCanvasProps {
  shader:     ShaderType
  colors:     string[]
  params?:    Partial<ShaderParameters>
  effect?:    EffectType
  amount?:    number
  /** Upper bound for devicePixelRatio; the landing favours smoothness over sharpness. */
  maxDpr?:    number
  className?: string
  style?:     CSSProperties
  /** Omit for decorative canvases. */
  label?:     string
}

const STILL_TIME = 7
const SLOW_FRAME_MS = 30
const MIN_QUALITY = 0.5

// A self-contained engine canvas. It never reads or writes the studio's store, so the landing can show
// any style without touching the visitor's saved design.
export function LiveCanvas({ shader, colors, params, effect = 'none', amount = 0.5, maxDpr = 1.5, className = '', style, label }: LiveCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [failed, setFailed] = useState(false)
  const [epoch, setEpoch] = useState(0)

  // Props that change often live in a ref so they never rebuild the GL program.
  const frameRef = useRef({ colors, params, effect, amount, maxDpr })
  useEffect(() => {
    frameRef.current = { colors, params, effect, amount, maxDpr }
  })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: GradientRenderer
    try {
      renderer = new GradientRenderer(canvas, shader)
    } catch (error) {
      if (!(error instanceof EngineError)) console.error(error)
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reports the result of initialising an external system (WebGL)
      setFailed(true)
      return
    }
    setFailed(false)

    const still = prefersReducedMotion()
    let quality = 1
    let visible = true
    let raf = 0
    let last = 0
    let slowFrames = 0
    const startedAt = performance.now()

    const draw = (now: number) => {
      const f = frameRef.current
      renderer.resize({ maxDpr: f.maxDpr * quality })
      renderer.render({
        params: { ...DEFAULT_PARAMETERS, ...f.params },
        colors: f.colors.map(hex => ({ hex })),
        time: still ? STILL_TIME : (now - startedAt) / 1000,
        effect: f.effect,
        amount: f.amount,
      })
    }

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop)
      if (!visible || document.hidden) { last = 0; return }
      // If the GPU cannot keep up, trade resolution for smoothness instead of stuttering.
      if (last && now - last > SLOW_FRAME_MS) {
        if (++slowFrames >= 20 && quality > MIN_QUALITY) { quality = Math.max(MIN_QUALITY, quality * 0.8); slowFrames = 0 }
      } else slowFrames = Math.max(0, slowFrames - 1)
      last = now
      draw(now)
    }

    const observer = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting) })
    observer.observe(canvas)

    let resizeObserver: ResizeObserver | null = null
    if (still) {
      draw(performance.now())
      resizeObserver = new ResizeObserver(() => draw(performance.now()))
      resizeObserver.observe(canvas)
    } else {
      raf = requestAnimationFrame(loop)
    }

    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf) }
    const onRestored = () => setEpoch(n => n + 1)
    canvas.addEventListener('webglcontextlost', onLost)
    canvas.addEventListener('webglcontextrestored', onRestored)

    return () => {
      cancelAnimationFrame(raf)
      observer.disconnect()
      resizeObserver?.disconnect()
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.removeEventListener('webglcontextrestored', onRestored)
      renderer.dispose()
    }
  }, [shader, epoch])

  const fallback = `linear-gradient(135deg, ${colors.join(', ')})`

  return (
    <canvas
      ref={canvasRef}
      className={`block h-full w-full ${className}`}
      style={{ ...style, background: failed ? fallback : undefined }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}
