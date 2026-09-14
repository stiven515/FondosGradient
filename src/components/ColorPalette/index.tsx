// src/components/ColorPalette/index.tsx
import { useCallback } from 'react'
import { Plus, Shuffle } from 'lucide-react'
import { useGradientStore } from '../../store/gradientStore'
import { ColorSwatch } from './ColorSwatch'
import { generateHarmoniousPalette } from '../../utils/palette'

export function ColorPalette() {
  const {
    colors, updateColor, addColor, removeColor, toggleLock, setColors, pushHistory,
  } = useGradientStore()

  const handleGenerate = useCallback(() => {
    pushHistory()
    setColors(generateHarmoniousPalette(colors))
  }, [colors, pushHistory, setColors])

  return (
    <div className="flex flex-col gap-2 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-[11px] font-semibold text-gray-600 uppercase tracking-widest">
          Palette
        </h2>
        <div className="flex items-center gap-0.5">
          {colors.length < 8 && (
            <button onClick={addColor} className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors" aria-label="Add color" title="Add color">
              <Plus size={13} />
            </button>
          )}
          <button onClick={handleGenerate} className="p-1 text-gray-600 hover:text-gray-300 rounded transition-colors" aria-label="Generate palette (Space)" title="Generate (Space)">
            <Shuffle size={13} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {colors.map((color) => (
          <ColorSwatch
            key={color.id}
            color={color}
            canRemove={colors.length > 2}
            onUpdate={updateColor}
            onRemove={removeColor}
            onToggleLock={toggleLock}
          />
        ))}
      </div>
    </div>
  )
}
