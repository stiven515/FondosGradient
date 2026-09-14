// src/App.tsx
import { GradientCanvas } from './components/GradientCanvas'
import { Toolbar }        from './components/Toolbar'
import { ColorPalette }   from './components/ColorPalette'
import { ParameterPanel } from './components/ParameterPanel'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()

  return (
    <div className="flex flex-col h-screen bg-[#080808] text-white overflow-hidden">
      <Toolbar />

      {/* Canvas — fills remaining space */}
      <div className="flex-1 min-h-0">
        <GradientCanvas />
      </div>

      {/* Bottom panel */}
      <div className="flex h-56 flex-shrink-0 border-t border-[#141414]">
        <div className="w-56 flex-shrink-0 border-r border-[#141414]">
          <ColorPalette />
        </div>
        <div className="flex-1 min-w-0">
          <ParameterPanel />
        </div>
      </div>
    </div>
  )
}
