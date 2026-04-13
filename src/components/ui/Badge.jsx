// ─────────────────────────────────────────
// Badge — pill labels for categories + ratings
// ─────────────────────────────────────────

const RATING_COLORS = {
  great: 'bg-rating-great/15 text-rating-great border-rating-great/30',
  good: 'bg-rating-good/15  text-rating-good  border-rating-good/30',
  bad: 'bg-rating-bad/15   text-rating-bad   border-rating-bad/30',
  worst: 'bg-rating-worst/15 text-rating-worst border-rating-worst/30',
}

const CATEGORY_COLORS = {
  watched: 'bg-blue-500/15   text-blue-400   border-blue-500/30',
  watchlist: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  favorites: 'bg-pink-500/15   text-pink-400   border-pink-500/30',
}

/**
 * @param {'rating'|'category'|'default'} type
 * @param {string} value  - ratingLabel or category string
 */
export const Badge = ({ type = 'default', value, className = '', children }) => {
  let colorClass = 'bg-surface-hover text-text-secondary border-surface-border'

  if (type === 'rating' && RATING_COLORS[value]) colorClass = RATING_COLORS[value]
  if (type === 'category' && CATEGORY_COLORS[value]) colorClass = CATEGORY_COLORS[value]

  return (
    <span
      className={[
        'inline-flex items-center px-2.5 py-0.5',
        'text-xs font-medium tracking-wide uppercase',
        'rounded-full border',
        colorClass,
        className,
      ].join(' ')}
    >
      {children ?? value}
    </span>
  )
}

export default Badge