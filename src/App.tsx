// src/App.tsx
import { GradientCanvas } from './components/GradientCanvas'
import { Sidebar }        from './components/Sidebar'
import { ControlsBar }   from './components/ControlsBar'
import { PaletteStrip }  from './components/PaletteStrip'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden">
      <Sidebar />

      {/* Main area: canvas + controls + palette */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 min-h-0">
          <GradientCanvas />
        </div>
        <ControlsBar />
        <PaletteStrip />
      </div>
    </div>
  )
}
