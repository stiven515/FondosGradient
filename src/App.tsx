// src/App.tsx
import { Studio } from './components/Studio'
import { Landing } from './components/Landing'
import { Toaster } from './components/Toaster'
import { HelpDialog } from './components/HelpDialog'
import { useView } from './store/viewStore'

export default function App() {
  const view = useView(s => s.view)

  return (
    <>
      {view === 'studio' ? <Studio /> : <Landing />}
      <Toaster />
      <HelpDialog />
    </>
  )
}
