// src/components/StyleSelector/index.tsx
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { ShaderType } from '../../types/gradient'

export const SHADER_TYPES: ShaderType[] = [
  'flow', 'beam', 'mesh', 'liquid', 'wave', 'silk', 'stripe',
]

export const STYLE_LABELS: Record<ShaderType, string> = {
  flow:   'Flow',
  beam:   'Beam',
  mesh:   'Mesh',
  liquid: 'Liquid',
  wave:   'Wave',
  silk:   'Silk',
  stripe: 'Stripe',
}

export const STYLE_DESCRIPTIONS: Record<ShaderType, string> = {
  flow:   'Organic colour blobs with curl-noise warp',
  beam:   'Radial rays from an animated focal point',
  mesh:   'Smooth gradient mesh with grid nodes',
  liquid: 'Deep turbulent warp — marble & tie-dye',
  wave:   'Sine-wave interference moiré patterns',
  silk:   'Smooth horizontal bands that ripple',
  stripe: 'Organic stripes with curl-noise edges',
}

export function StyleSelector() {
  const { shader, setShader, colors } = useGradientStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const gradient = `linear-gradient(135deg, ${colors.map(c => c.hex).join(', ')})`

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function pickShader(type: ShaderType) {
    setShader(type)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        className="flex items-center gap-2.5 w-full rounded-lg transition-colors"
        style={{
          padding:    '6px 8px',
          background: 'var(--bg-panel)',
          border:     `1px solid ${open ? '#2D3544' : 'var(--border)'}`,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D3544')}
        onMouseLeave={e => {
          if (!open) e.currentTarget.style.borderColor = 'var(--border)'
        }}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Select style"
      >
        {/* Gradient thumbnail */}
        <div
          className="rounded flex-shrink-0"
          style={{ width: 40, height: 32, background: gradient }}
        />
        {/* Labels */}
        <div className="flex-1 min-w-0 text-left">
          <div
            className="text-[13px] font-medium leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {STYLE_LABELS[shader]}
          </div>
          <div
            className="text-[10px] leading-tight mt-0.5 truncate"
            style={{ color: 'var(--text-muted)' }}
          >
            {STYLE_DESCRIPTIONS[shader]}
          </div>
        </div>
        <ChevronDown
          size={11}
          strokeWidth={2}
          className="flex-shrink-0 transition-transform"
          style={{
            color:     'var(--text-muted)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="listbox"
          aria-label="Gradient style"
          className="absolute left-0 right-0 z-50 rounded-lg overflow-hidden"
          style={{
            top:       'calc(100% + 4px)',
            background: 'var(--bg-panel)',
            border:     '1px solid var(--border)',
            boxShadow:  '0 8px 24px rgba(0,0,0,0.4)',
          }}
        >
          {SHADER_TYPES.map(type => {
            const active = type === shader
            return (
              <button
                key={type}
                role="option"
                aria-selected={active}
                onClick={() => pickShader(type)}
                className="flex items-center gap-2.5 w-full transition-colors"
                style={{
                  padding:    '7px 8px',
                  background: active ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: active ? '2px solid var(--accent-dim)' : '2px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'var(--bg-sidebar)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                {/* Colour swatch */}
                <div
                  className="rounded flex-shrink-0"
                  style={{
                    width:      28,
                    height:     22,
                    background: gradient,
                    opacity:    active ? 1 : 0.6,
                  }}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div
                    className="text-[12px] font-medium truncate"
                    style={{
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {STYLE_LABELS[type]}
                  </div>
                  <div
                    className="text-[9px] truncate mt-0.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {STYLE_DESCRIPTIONS[type]}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
