// src/App.tsx
import { GradientCanvas }          from './components/GradientCanvas'
import { TopBar }                  from './components/TopBar'
import { Sidebar }                 from './components/Sidebar'
import { PlaybackBar }             from './components/PlaybackBar'
import { BottomArea }              from './components/BottomArea'
import { useKeyboardShortcuts }    from './hooks/useKeyboardShortcuts'

export default function App() {
  useKeyboardShortcuts()

  return (
    <div
      className="flex flex-col overflow-hidden"
      style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)' }}
    >
      {/* Top navigation bar */}
      <TopBar />

      {/* Middle: sidebar + canvas + playback */}
      <div className="flex flex-1 min-h-0">
        <Sidebar />

        {/* Canvas column */}
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex-1 min-h-0">
            <GradientCanvas />
          </div>
          <PlaybackBar />
        </div>
      </div>

      {/* Bottom: palette circles + presets */}
      <BottomArea />
    </div>
  )
}
