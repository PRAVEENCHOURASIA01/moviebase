import { useEffect, useCallback } from 'react'

// ─────────────────────────────────────────
// Modal — accessible, animated overlay
// Closes on backdrop click + Escape key
// ─────────────────────────────────────────

/**
 * @param {boolean}          isOpen
 * @param {function}         onClose
 * @param {string}           title
 * @param {'sm'|'md'|'lg'}   size
 * @param {React.ReactNode}  children
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  className = '',
  children,
}) => {
  // Close on Escape
  const handleKey = useCallback(
    (e) => { if (e.key === 'Escape') onClose() },
    [onClose]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKey])

  if (!isOpen) return null

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      aria-modal="true"
      role="dialog"
    >
      {/* Dim layer */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          'relative w-full z-10 my-auto',
          'glass rounded-2xl shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          'animate-scale-in',
          widths[size] ?? widths.md,
          className,
        ].join(' ')}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-border">
            <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
              aria-label="Close modal"
            >
              <XIcon />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default Modal