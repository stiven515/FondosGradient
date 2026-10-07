import { Component, type ErrorInfo, type ReactNode } from 'react'
import { t } from '../../i18n'
import { Frame } from '../../ui/Frame'
import { Button } from '../../ui/Button'

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
      <Frame>
        <div role="alert" className="flex h-full flex-col items-center justify-center gap-6 px-6 text-center">
          <div className="flex max-w-sm flex-col gap-2">
            <h1 className="m-0 text-[22px] font-bold tracking-[-0.02em] text-ink">{t('error.title')}</h1>
            <p className="m-0 text-[13.5px] leading-relaxed text-ink-2">{t('error.body')}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button variant="primary" onClick={this.reload}>{t('error.reload')}</Button>
            <Button variant="outline" onClick={this.resetAndReload}>{t('error.reset')}</Button>
          </div>
        </div>
      </Frame>
    )
  }
}
