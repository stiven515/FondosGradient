import { Component, type ErrorInfo, type ReactNode } from 'react'

const APP_STORAGE_KEYS = ['gradient-studio-v1', 'gradient-studio-saved-v1']

interface State { failed: boolean }

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  private reload = () => window.location.reload()

  private resetAndReload = () => {
    for (const key of APP_STORAGE_KEYS) {
      try { localStorage.removeItem(key) } catch { /* storage blocked: reloading is still worth it */ }
    }
    window.location.reload()
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div
        role="alert"
        className="flex flex-col items-center justify-center gap-4 text-center px-6"
        style={{ height: '100dvh', background: 'var(--bg)', color: 'var(--text-primary)' }}
      >
        <div className="flex flex-col gap-1.5" style={{ maxWidth: 360 }}>
          <h1 className="text-[16px] font-semibold">Something went wrong</h1>
          <p className="text-[12px]" style={{ color: 'var(--text-secondary)' }}>
            Gradient Studio hit an unexpected error. Reloading usually fixes it. If it keeps happening,
            resetting clears your saved settings and designs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={this.reload}
            className="text-[12px] font-medium rounded-md px-4 py-2"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            Reload
          </button>
          <button
            onClick={this.resetAndReload}
            className="text-[12px] font-medium rounded-md px-4 py-2"
            style={{ background: 'var(--bg-panel)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            Reset and reload
          </button>
        </div>
      </div>
    )
  }
}
