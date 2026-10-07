import { GradientCanvas } from '../GradientCanvas'
import { Sidebar } from '../Sidebar'
import { PlaybackBar } from '../PlaybackBar'
import { BottomArea } from '../BottomArea'
import { Frame } from '../../ui/Frame'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { Header } from './Header'
import { Readout } from './Readout'

// The workbench: the canvas is the artwork, the panel and dock are quiet instruments around it.
export function Studio() {
  useKeyboardShortcuts()

  return (
    <Frame>
      <div className="flex h-full flex-col">
        <Header />
        <div className="relative flex min-h-0 flex-1 gap-3 px-3 pb-3">
          <Sidebar />
          <main className="relative min-w-0 flex-1">
            <GradientCanvas />
            <div className="pointer-events-none absolute inset-x-3 bottom-4 flex justify-center">
              <PlaybackBar />
            </div>
          </main>
        </div>
        <BottomArea />
        <Readout />
      </div>
    </Frame>
  )
}
