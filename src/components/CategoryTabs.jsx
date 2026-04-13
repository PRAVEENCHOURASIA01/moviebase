import { CATEGORIES } from '@/lib/enums'

// ─────────────────────────────────────────
// CategoryTabs
// Filter tabs: All | Watched | Watchlist | Favorites
// ─────────────────────────────────────────

const TABS = [
  { key: null, label: 'All', icon: '📋' },
  { key: CATEGORIES.WATCHED, label: 'Watched', icon: '✅' },
  { key: CATEGORIES.WATCHLIST, label: 'Watchlist', icon: '🕐' },
  { key: CATEGORIES.FAVORITES, label: 'Favorites', icon: '❤️' },
]

/**
 * @param {string|null} active   - current active category key
 * @param {function}    onChange - (key: string|null) => void
 * @param {object}      counts   - { watched: n, watchlist: n, favorites: n }
 */
export const CategoryTabs = ({ active = null, onChange, counts = {} }) => {
  const getCount = (key) => {
    if (!key) return Object.values(counts).reduce((a, b) => a + b, 0)
    return counts[key] ?? 0
  }

  return (
    <div
      className="flex items-center gap-1 p-1 bg-surface-elevated rounded-2xl border border-surface-border overflow-x-auto no-scrollbar"
      role="tablist"
      aria-label="Filter by category"
    >
      {TABS.map(({ key, label, icon }) => {
        const isActive = active === key
        const count = getCount(key)

        return (
          <button
            key={String(key)}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange?.(key)}
            className={[
              'flex items-center gap-1.5 px-3.5 py-2 rounded-xl',
              'text-sm font-medium whitespace-nowrap',
              'transition-all duration-200',
              isActive
                ? 'bg-brand text-white shadow-[0_0_16px_rgba(229,9,20,0.3)]'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover',
            ].join(' ')}
          >
            <span>{icon}</span>
            <span>{label}</span>
            {count > 0 && (
              <span
                className={[
                  'text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-border text-text-muted',
                ].join(' ')}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default CategoryTabs