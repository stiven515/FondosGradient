// src/components/TopBar/index.tsx
import { useState, useRef, useEffect } from 'react'
import { Undo2, Redo2, Share2, Download, Maximize2, ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { encodeStateToUrl } from '../../utils/urlState'
import { SHADER_TYPES, STYLE_LABELS, STYLE_DESCRIPTIONS } from '../../constants/shaders'
import type { ShaderType } from '../../types/gradient'

export function TopBar() {
  const { shader, setShader, undo, redo, colors } = useGradientStore()
  const [open, setOpen] = useState(false)
  const ref  = useRef<HTMLDivElement>(null)

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

  async function handleShare() {
    const s = useGradientStore.getState()
    const query = encodeStateToUrl({
      shader:      s.shader,
      colors:      s.colors,
      parameters:  s.parameters,
      effect:       s.effect,
      effectAmount: s.effectAmount,
      duration:     s.duration,
      aspectRatio:  s.aspectRatio,
    })
    const url = `${window.location.origin}${window.location.pathname}?${query}`
    window.history.replaceState(null, '', `?${query}`)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // clipboard unavailable (non-HTTPS dev) — URL bar still updated
    }
  }

  function handleExport() {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null
    if (!canvas) return
    canvas.toBlob(blob => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gradient-studio-${Date.now()}.png`
      a.click()
      URL.revokeObjectURL(url)
    })
  }

  return (
    <div
      className="flex items-center flex-shrink-0 px-4 gap-3"
      style={{
        height: 52,
        background: 'var(--bg)',
        borderBottom: '1px solid var(--border-soft)',
      }}
    >
      {/* Left — logo */}
      <div className="flex items-center gap-2.5 select-none">
        <div
          className="w-6 h-6 rounded flex-shrink-0"
          style={{ background: gradient }}
        />
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          Gradient Studio
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-4 flex-shrink-0" style={{ background: 'var(--border)' }} />

      {/* Style pill — opens shader picker dropdown */}
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label="Select style"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
          style={{
            background: open ? 'var(--bg-panel)' : 'var(--bg-panel)',
            border: `1px solid ${open ? '#2D3544' : 'var(--border)'}`,
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D3544')}
          onMouseLeave={e => { if (!open) e.currentTarget.style.borderColor = 'var(--border)' }}
        >
          <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
            {STYLE_LABELS[shader]}
          </span>
          <ChevronDown
            size={11}
            strokeWidth={2}
            className="transition-transform"
            style={{
              color: 'var(--text-muted)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Gradient style"
            className="absolute left-0 z-50 rounded-lg overflow-hidden"
            style={{
              top: 'calc(100% + 4px)',
              minWidth: 220,
              background: 'var(--bg-panel)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
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
                    padding: '7px 10px',
                    background: active ? 'var(--accent-glow)' : 'transparent',
                    borderLeft: active ? '2px solid var(--accent-dim)' : '2px solid transparent',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-sidebar)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <div
                    className="rounded flex-shrink-0"
                    style={{ width: 28, height: 22, background: gradient, opacity: active ? 1 : 0.6 }}
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div
                      className="text-[12px] font-medium truncate"
                      style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)' }}
                    >
                      {STYLE_LABELS[type]}
                    </div>
                    <div className="text-[9px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {STYLE_DESCRIPTIONS[type]}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        <TopBarBtn onClick={undo} label="Undo (Ctrl+Z)"      icon={<Undo2     size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={redo} label="Redo (Ctrl+Shift+Z)" icon={<Redo2     size={14} strokeWidth={1.75} />} />
        <div className="w-px h-4 mx-1.5" style={{ background: 'var(--border)' }} />
        <TopBarBtn onClick={handleShare} label="Share"    icon={<Share2    size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={handleExport} label="Export"   icon={<Download  size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={handleFullscreen} label="Fullscreen" icon={<Maximize2 size={14} strokeWidth={1.75} />} />
      </div>
    </div>
  )
}

function handleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

function TopBarBtn({
  onClick, label, icon,
}: { onClick: () => void; label: string; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="w-7 h-7 flex items-center justify-center rounded-md transition-all"
      style={{ color: 'var(--text-muted)' }}
      onMouseEnter={e => {
        e.currentTarget.style.color      = 'var(--text-primary)'
        e.currentTarget.style.background = 'var(--bg-panel)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color      = 'var(--text-muted)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
    </button>
  )
}
