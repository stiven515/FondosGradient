// src/components/TopBar/index.tsx
import { Undo2, Redo2, Share2, Download, Maximize2, ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { ShaderType } from '../../types/gradient'

const STYLE_LABELS: Record<ShaderType, string> = {
  flow: 'Soft Grain Mesh', beam: 'Beam', mesh: 'Mesh', liquid: 'Liquid',
  wave: 'Wave', silk: 'Silk', stripe: 'Stripe',
}

export function TopBar() {
  const { shader, undo, redo } = useGradientStore()

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
          style={{
            background: 'linear-gradient(135deg, #F9C5D1, #C5AEF0, #A8D8EA)',
          }}
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

      {/* Style pill — center-left */}
      <button
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D3544')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        aria-label="Style selector"
      >
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>
          {STYLE_LABELS[shader]}
        </span>
        <ChevronDown size={11} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        <TopBarBtn onClick={undo} label="Undo" icon={<Undo2 size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={redo} label="Redo" icon={<Redo2 size={14} strokeWidth={1.75} />} />
        <div className="w-px h-4 mx-1.5" style={{ background: 'var(--border)' }} />
        <TopBarBtn onClick={() => {}} label="Share" icon={<Share2 size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={() => {}} label="Export" icon={<Download size={14} strokeWidth={1.75} />} />
        <TopBarBtn onClick={() => {}} label="Fullscreen" icon={<Maximize2 size={14} strokeWidth={1.75} />} />
      </div>
    </div>
  )
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
        e.currentTarget.style.color = 'var(--text-primary)'
        e.currentTarget.style.background = 'var(--bg-panel)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.background = 'transparent'
      }}
    >
      {icon}
    </button>
  )
}
