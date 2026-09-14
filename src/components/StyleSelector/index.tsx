// src/components/StyleSelector/index.tsx
import { ChevronDown } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import type { ShaderType } from '../../types/gradient'

const STYLE_LABELS: Record<ShaderType, string> = {
  flow: 'Flow', beam: 'Beam', mesh: 'Mesh', liquid: 'Liquid',
  wave: 'Wave', silk: 'Silk', stripe: 'Stripe',
}

export function StyleSelector() {
  const { shader, colors } = useGradientStore()
  const gradient = `linear-gradient(135deg, ${colors.map(c => c.hex).join(', ')})`

  return (
    <button
      className="flex items-center gap-2.5 w-full rounded-lg transition-colors"
      style={{
        padding: '6px 8px',
        background: 'var(--bg-panel)',
        border: '1px solid var(--border)',
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#2D3544')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      aria-label="Select style"
    >
      {/* Gradient thumbnail */}
      <div
        className="rounded flex-shrink-0"
        style={{
          width: 40, height: 32,
          background: gradient,
        }}
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
          Gradient Studio
        </div>
      </div>

      <ChevronDown
        size={11}
        strokeWidth={2}
        className="flex-shrink-0"
        style={{ color: 'var(--text-muted)' }}
      />
    </button>
  )
}
