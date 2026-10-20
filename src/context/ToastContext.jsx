import { createContext, useState, useCallback } from 'react'

// -----------------------------------------
// ToastContext
// Global toast notification system.
// Supports: success | error | info
// Auto-dismisses after `duration` ms.
// Max 3 toasts visible at once.
// -----------------------------------------

export const ToastContext = createContext(null)

let toastId = 0

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback((message, type = 'success', duration = 3000) => {
    const id = ++toastId
    setToasts((prev) => {
      const next = [...prev.slice(-2), { id, message, type }]
      return next
    })
    setTimeout(() => dismiss(id), duration)
    return id
  }, [dismiss])

  const success = useCallback((msg, dur) => toast(msg, 'success', dur), [toast])
  const error = useCallback((msg, dur) => toast(msg, 'error', dur), [toast])
  const info = useCallback((msg, dur) => toast(msg, 'info', dur), [toast])

  return (
    <ToastContext.Provider value={{ toast, success, error, info, dismiss }}>
      {children}
      <ToastStack toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

const ToastStack = ({ toasts, dismiss }) => {
  if (!toasts.length) return null
  return (
    <div
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 items-end"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </div>
  )
}

const ICONS = {
  success: (
    <svg className="w-5 h-5 text-rating-great" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-rating-worst" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

const STYLES = {
  success: 'bg-surface-elevated border-rating-great/40',
  error:   'bg-surface-elevated border-rating-worst/40',
  info:    'bg-surface-elevated border-brand/40',
}

const ToastItem = ({ toast, onDismiss }) => (
  <div
    className={[
      'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl',
      'text-sm font-medium max-w-xs w-full',
      'animate-scale-in backdrop-blur-sm',
      STYLES[toast.type] ?? STYLES.info,
    ].join(' ')}
    role="alert"
  >
    <span className="shrink-0">{ICONS[toast.type] ?? ICONS.info}</span>
    <span className="text-text-primary flex-1">{toast.message}</span>
    <button
      onClick={onDismiss}
      className="shrink-0 text-text-muted hover:text-text-primary transition-colors p-1"
      aria-label="Dismiss"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
)

export default ToastProvider
