import { useRef, useEffect } from 'react'

// ─────────────────────────────────────────
// SearchBar
// Controlled input — debounce handled by useSearch
// Prominent, centered, poster-UI first
// ─────────────────────────────────────────

/**
 * @param {string}   query       - current search string
 * @param {function} onQuery     - setter (value: string) => void
 * @param {function} onClear     - reset handler
 * @param {boolean}  isLoading
 * @param {boolean}  autoFocus
 * @param {string}   placeholder
 */
export const SearchBar = ({
  query = '',
  onQuery,
  onClear,
  isLoading = false,
  autoFocus = false,
  placeholder = 'Search movies, shows…',
  className = '',
}) => {
  const inputRef = useRef(null)

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  const hasQuery = query.trim().length > 0

  return (
    <div className={`relative group ${className}`}>
      {/* Search icon / spinner */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted group-focus-within:text-brand transition-colors duration-200">
        {isLoading ? <SpinnerIcon /> : <SearchIcon />}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => onQuery?.(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck="false"
        className={[
          'w-full h-14 pl-12 pr-12',
          'bg-surface-elevated border border-surface-border',
          'rounded-2xl text-base text-text-primary placeholder-text-muted',
          'transition-all duration-200',
          'focus:outline-none focus:border-brand/60 focus:bg-surface-hover',
          'focus:shadow-[0_0_0_3px_rgba(229,9,20,0.1)]',
          'hover:border-text-muted/30',
          // Hide browser's native clear button — we use our own
          '[&::-webkit-search-cancel-button]:hidden',
        ].join(' ')}
        aria-label="Search movies and TV shows"
      />

      {/* Clear button */}
      {hasQuery && (
        <button
          onClick={() => {
            onClear?.()
            inputRef.current?.focus()
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
          aria-label="Clear search"
        >
          <XIcon />
        </button>
      )}
    </div>
  )
}

// ── Icons ─────────────────────────────────
const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const SpinnerIcon = () => (
  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

export default SearchBar