// ─────────────────────────────────────────
// Button — base UI primitive
// Variants: primary | ghost | danger | outline
// Sizes:    sm | md | lg
// ─────────────────────────────────────────

const VARIANTS = {
  primary: [
    'bg-brand text-white',
    'hover:bg-brand-hover active:scale-[0.97]',
    'shadow-[0_0_20px_rgba(229,9,20,0.25)] hover:shadow-[0_0_28px_rgba(229,9,20,0.4)]',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary',
    'hover:bg-surface-hover hover:text-text-primary',
  ].join(' '),

  outline: [
    'bg-transparent border border-surface-border text-text-primary',
    'hover:border-text-muted hover:bg-surface-hover',
  ].join(' '),

  danger: [
    'bg-transparent text-rating-worst',
    'hover:bg-rating-worst/10',
  ].join(' '),
}

const SIZES = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2   text-sm gap-2',
  lg: 'px-6 py-3   text-base gap-2.5',
}

/**
 * @param {object}  props
 * @param {'primary'|'ghost'|'outline'|'danger'} props.variant
 * @param {'sm'|'md'|'lg'} props.size
 * @param {boolean} props.isLoading
 * @param {boolean} props.fullWidth
 * @param {React.ReactNode} props.icon
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon = null,
  className = '',
  disabled,
  ...props
}) => {
  const base = [
    'inline-flex items-center justify-center',
    'font-medium rounded-xl',
    'transition-all duration-200 ease-out',
    'focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
    'disabled:opacity-40 disabled:pointer-events-none',
    fullWidth ? 'w-full' : '',
    VARIANTS[variant] ?? VARIANTS.primary,
    SIZES[size] ?? SIZES.md,
    className,
  ].join(' ')

  return (
    <button
      className={base}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size} />
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  )
}

// Inline spinner — no extra dep
const Spinner = ({ size }) => {
  const dim = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <svg
      className={`${dim} animate-spin`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12" cy="12" r="10"
        stroke="currentColor" strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  )
}

export default Button