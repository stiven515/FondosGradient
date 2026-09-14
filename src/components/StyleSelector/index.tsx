// src/components/StyleSelector/index.tsx
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
    <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#161616] border border-[#252525] cursor-pointer hover:border-[#333] transition-colors">
      <div
        className="w-11 h-9 rounded flex-shrink-0"
        style={{ background: gradient }}
      />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-white leading-tight">{STYLE_LABELS[shader]}</div>
        <div className="text-[10px] text-[#555] leading-tight mt-0.5">Gradient Studio</div>
      </div>
      <svg className="text-[#555] flex-shrink-0" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
        <path d="M5 7L1 3h8z" />
      </svg>
    </div>
  )
}
