import { useEffect } from 'react'
import { useUiStore, type Toast } from '../../store/uiStore'

const LIFETIME = { info: 2500, error: 5000 }

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUiStore(s => s.dismissToast)

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), LIFETIME[toast.tone])
    return () => clearTimeout(timer)
  }, [toast.id, toast.tone, dismiss])

  return (
    <div
      className={`pointer-events-auto rounded-[12px] px-3.5 py-2.5 text-[12.5px] font-semibold shadow-pop ${
        toast.tone === 'error' ? 'bg-danger text-on-teal' : 'bg-ink text-on-teal'
      }`}
      style={{ animation: 'rise 0.3s var(--ease-out)' }}
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
      className="pointer-events-none fixed right-6 top-[72px] flex flex-col items-end gap-2"
      style={{ zIndex: 60 }}
    >
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  )
}
