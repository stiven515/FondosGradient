import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

function App() {
  return (
    <div className="flex h-full items-center justify-center">
      <h1 className="text-white text-2xl font-semibold">Gradient Studio</h1>
    </div>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
