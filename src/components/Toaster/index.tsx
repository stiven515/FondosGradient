import { useEffect } from 'react'
import { useUiStore, type Toast } from '../../store/uiStore'

const LIFETIME = { info: 2500, error: 5000 }

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore(s => s.dismissToast)

  useEffect(() => {
    const t = setTimeout(() => dismiss(toast.id), LIFETIME[toast.tone])
    return () => clearTimeout(t)
  }, [toast.id, toast.tone, dismiss])

  return (
    <div
      className="px-3 py-2 rounded-md text-[12px] pointer-events-auto"
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${toast.tone === 'error' ? '#7F2D2D' : 'var(--border)'}`,
        color: toast.tone === 'error' ? '#F2A5A5' : 'var(--text-primary)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
      }}
    >
      {toast.message}
    </div>
  )
}

export function Toaster() {
  const toasts = useUiStore(s => s.toasts)
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 right-4 flex flex-col gap-2 items-end pointer-events-none"
      style={{ zIndex: 60 }}
    >
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
