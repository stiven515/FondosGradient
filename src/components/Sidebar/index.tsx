// src/components/Sidebar/index.tsx
import { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { StyleSelector } from '../StyleSelector'
import { ParameterPanel } from '../ParameterPanel'
import { useGradientStore, DEFAULT_PARAMETERS } from '../../store/gradientStore'
import type { ShaderParameters } from '../../types/gradient'

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { colors, addColor, removeColor, pushHistory, setParameter } = useGradientStore()

  const handleResetAll = useCallback(() => {
    pushHistory()
    Object.entries(DEFAULT_PARAMETERS).forEach(([k, v]) =>
      setParameter(k as keyof ShaderParameters, v)
    )
  }, [pushHistory, setParameter])

  if (collapsed) {
    return (
      <div className="w-8 flex-shrink-0 bg-[#0e0e0e] border-r border-[#1e1e1e] flex flex-col items-center pt-3">
        <button
          onClick={() => setCollapsed(false)}
          aria-label="Expand controls"
          className="text-[#555] hover:text-white transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    )
  }

  return (
    <aside className="w-[260px] flex-shrink-0 bg-[#0e0e0e] border-r border-[#1e1e1e] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e1e1e] flex-shrink-0">
        <span className="text-[10px] font-semibold tracking-[0.18em] text-[#555]">CONTROLS</span>
        <button
          onClick={() => setCollapsed(true)}
          aria-label="Collapse controls"
          className="text-[#555] hover:text-white transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* STYLE section */}
        <div className="border-b border-[#1e1e1e] px-3 pb-3">
          <div className="flex items-center justify-between py-2.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[#555]">STYLE</span>
            <span className="text-[9px] text-[#3a3a3a]">tab → to cycle</span>
          </div>
          <StyleSelector />
        </div>

        {/* PARAMETERS section */}
        <div className="border-b border-[#1e1e1e]">
          <div className="flex items-center justify-between px-3 py-2.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[#555]">PARAMETERS</span>
            <button
              onClick={handleResetAll}
              className="text-[9px] text-[#3a3a3a] hover:text-[#888] transition-colors"
            >
              Reset all
            </button>
          </div>
          <ParameterPanel />
        </div>

        {/* PALETTE SIZE section */}
        <div className="px-3 py-3 border-b border-[#1e1e1e]">
          <div className="mb-2.5">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[#555]">PALETTE SIZE</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => removeColor(colors[colors.length - 1].id)}
              disabled={colors.length <= 2}
              className="w-6 h-6 flex items-center justify-center rounded border border-[#2a2a2a] text-[#888]
                         hover:text-white hover:border-[#444] disabled:opacity-25 disabled:cursor-not-allowed
                         transition-colors text-sm leading-none"
              aria-label="Remove last color"
            >
              −
            </button>
            <span className="text-sm text-white tabular-nums w-4 text-center">{colors.length}</span>
            <button
              onClick={() => addColor()}
              disabled={colors.length >= 8}
              className="w-6 h-6 flex items-center justify-center rounded border border-[#2a2a2a] text-[#888]
                         hover:text-white hover:border-[#444] disabled:opacity-25 disabled:cursor-not-allowed
                         transition-colors text-sm leading-none"
              aria-label="Add color"
            >
              +
            </button>
          </div>
        </div>

      </div>
    </aside>
  )
}
