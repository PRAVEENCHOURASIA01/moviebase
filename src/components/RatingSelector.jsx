import { RATINGS } from '@/lib/enums'

// ─────────────────────────────────────────
// RatingSelector
// Inline 4-option rating: Great / Good / Bad / Worst
// ─────────────────────────────────────────

const RATING_CONFIG = [
  { key: 'GREAT', emoji: '🔥', color: 'text-rating-great border-rating-great/40 hover:bg-rating-great/10 data-[active=true]:bg-rating-great/20 data-[active=true]:border-rating-great' },
  { key: 'GOOD', emoji: '👍', color: 'text-rating-good  border-rating-good/40  hover:bg-rating-good/10  data-[active=true]:bg-rating-good/20  data-[active=true]:border-rating-good' },
  { key: 'BAD', emoji: '👎', color: 'text-rating-bad   border-rating-bad/40   hover:bg-rating-bad/10   data-[active=true]:bg-rating-bad/20   data-[active=true]:border-rating-bad' },
  { key: 'WORST', emoji: '💀', color: 'text-rating-worst border-rating-worst/40 hover:bg-rating-worst/10 data-[active=true]:bg-rating-worst/20 data-[active=true]:border-rating-worst' },
]

/**
 * @param {string|null}  currentRating  - ratingLabel e.g. 'great'
 * @param {function}     onRate         - (ratingKey: string) => void  e.g. 'GREAT'
 * @param {'sm'|'md'}    size
 */
export const RatingSelector = ({ currentRating = null, onRate, size = 'md' }) => {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Rate this movie">
      {RATING_CONFIG.map(({ key, emoji, color }) => {
        const { label } = RATINGS[key]
        const isActive = currentRating === label

        return (
          <button
            key={key}
            onClick={() => onRate?.(key)}
            data-active={isActive}
            title={label.charAt(0).toUpperCase() + label.slice(1)}
            aria-pressed={isActive}
            className={[
              'flex items-center gap-1 border rounded-lg',
              'font-medium transition-all duration-150 active:scale-95',
              size === 'sm'
                ? 'px-2 py-1 text-xs'
                : 'px-2.5 py-1.5 text-xs',
              color,
            ].join(' ')}
          >
            <span>{emoji}</span>
            <span className="capitalize hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default RatingSelector