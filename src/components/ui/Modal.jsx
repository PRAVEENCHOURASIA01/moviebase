import { useEffect, useCallback } from 'react'

// Modal — accessible, animated overlay
// Closes on backdrop click + Escape key
// Sizes: sm | md | lg | xl | 2xl
export const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  className = '',
  noPadding = false,
  children,
}) => {
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
    // Full-screen scrollable backdrop — this scrolls if content is tall
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto"
      style={{ padding: '24px 16px' }}
      aria-modal="true"
      role="dialog"
    >
      {/* Dim layer */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — auto height, never taller than viewport, inner content scrolls */}
      <div
        className={[
          'relative w-full z-10 my-auto',
          'glass rounded-2xl shadow-2xl',
          'flex flex-col',
          'max-h-[calc(100vh-48px)]',
          'animate-scale-in',
          widths[size] ?? widths.md,
          className,
        ].join(' ')}
      >
        {/* Optional header */}
        {title && (
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-surface-border shrink-0">
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

        {/* Scrollable body */}
        <div className={['flex-1 overflow-y-auto', noPadding ? '' : 'px-6 py-5'].join(' ')}>
          {children}
        </div>
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
