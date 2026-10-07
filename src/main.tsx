// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/hanken-grotesk'
import './index.css'
import App from './App'
import { ErrorBoundary } from './components/ErrorBoundary'
import { useGradientStore } from './store/gradientStore'
import { decodeUrlToState } from './utils/urlState'

// Hydrate store from URL params before first render (URL wins over localStorage)
const urlState = decodeUrlToState(window.location.search)
if (urlState.colors)      useGradientStore.getState().setColors(urlState.colors)
if (urlState.shader)      useGradientStore.getState().setShader(urlState.shader)
// effect must come before parameters — setEffect resets grain; parameters overwrite it back
if (urlState.effect)      useGradientStore.getState().setEffect(urlState.effect)
if (urlState.parameters) {
  const params = urlState.parameters
  const keys = Object.keys(params) as (keyof typeof params)[]
  keys.forEach(k => useGradientStore.getState().setParameter(k, params[k]!))
}
if (urlState.effectAmount !== undefined) useGradientStore.getState().setEffectAmount(urlState.effectAmount)
if (urlState.duration)    useGradientStore.getState().setDuration(urlState.duration)
if (urlState.aspectRatio)useGradientStore.getState().setAspectRatio(urlState.aspectRatio)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
