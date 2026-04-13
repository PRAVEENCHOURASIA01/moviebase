import { useState } from 'react'
import { buildImageUrl, IMAGE_SIZES } from '@/config/tmdb'
import { Badge } from '@/components/ui/Badge'
import { RatingSelector } from '@/components/RatingSelector'
import { CATEGORIES } from '@/lib/enums'

// ─────────────────────────────────────────
// MovieCard
// Poster-first. Hover reveals full interaction layer.
// Handles both TMDB camelCase and Supabase snake_case
// field shapes transparently.
// ─────────────────────────────────────────

const CATEGORY_ACTIONS = [
  { key: CATEGORIES.WATCHED, label: 'Watched', icon: '✅' },
  { key: CATEGORIES.WATCHLIST, label: 'Watchlist', icon: '🕐' },
  { key: CATEGORIES.FAVORITES, label: 'Favorites', icon: '❤️' },
]

/**
 * @param {object}      movie        - TMDB result or Supabase user_movies row
 * @param {object|null} userRecord   - from useMovies().getMovieRecord(id)
 * @param {function}    onAdd        - (movie, category) => void
 * @param {function}    onRemove     - (movieId) => void
 * @param {function}    onRate       - (movieId, ratingKey) => void
 * @param {boolean}     showRating   - show rating selector (profile view)
 */
export const MovieCard = ({
  movie,
  userRecord = null,
  onAdd,
  onRemove,
  onRate,
  showRating = false,
}) => {
  const [imgError, setImgError] = useState(false)

  // ── Normalize fields (TMDB vs Supabase) ──
  const movieId = movie.id ?? movie.movie_id ?? movie.movieId
  const title = movie.title ?? movie.name ?? 'Untitled'
  const posterPath = movie.posterPath ?? movie.poster_path ?? null
  const releaseYear = movie.releaseYear ?? movie.release_date?.slice(0, 4) ?? '—'
  const mediaType = movie.mediaType ?? movie.media_type ?? 'movie'
  const tmdbRating = movie.rating ?? null

  // ── Normalize userRecord fields ───────────
  const recordCategory = userRecord?.category ?? null
  const recordRatingLabel = userRecord?.ratingLabel ?? userRecord?.rating_label ?? null

  const posterUrl = !imgError && posterPath
    ? buildImageUrl(posterPath, IMAGE_SIZES.POSTER.MD)
    : null

  const isInList = Boolean(userRecord)

  return (
    <div className="group relative flex flex-col gap-2 animate-fade-in">

      {/* ── Poster ─────────────────────────── */}
      <div className="poster-wrap overflow-hidden">
        {posterUrl ? (
          <img
            src={posterUrl}
            alt={title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <PosterFallback title={title} />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Interaction layer */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {!isInList ? (
            <div className="flex flex-col gap-1.5">
              {CATEGORY_ACTIONS.map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => onAdd?.(movie, key)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/90 hover:bg-brand text-text-primary text-xs font-medium transition-colors duration-150 backdrop-blur-sm"
                >
                  <span>{icon}</span>
                  <span>Add to {label}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {CATEGORY_ACTIONS
                .filter((a) => a.key !== recordCategory)
                .map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => onAdd?.(movie, key)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/90 hover:bg-surface-hover text-text-secondary text-xs transition-colors duration-150 backdrop-blur-sm"
                  >
                    <span>{icon}</span>
                    <span>Move to {label}</span>
                  </button>
                ))}
              <button
                onClick={() => onRemove?.(movieId)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/90 hover:bg-rating-worst/20 text-rating-worst text-xs transition-colors duration-150 backdrop-blur-sm"
              >
                <span>✕</span>
                <span>Remove</span>
              </button>
            </div>
          )}
        </div>

        {/* Category badge */}
        {isInList && (
          <div className="absolute top-2 left-2">
            <Badge type="category" value={recordCategory} />
          </div>
        )}

        {/* Rating badge */}
        {recordRatingLabel && (
          <div className="absolute top-2 right-2">
            <Badge type="rating" value={recordRatingLabel} />
          </div>
        )}
      </div>

      {/* ── Meta ───────────────────────────── */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <p className="text-sm font-medium text-text-primary line-clamp-1" title={title}>
          {title}
        </p>
        <p className="text-xs text-text-muted">
          {releaseYear}
          {mediaType === 'tv' && (
            <span className="ml-1.5 text-text-muted/60">TV</span>
          )}
        </p>
      </div>

      {/* ── Rating selector (profile view) ── */}
      {showRating && isInList && (
        <div className="px-0.5">
          <RatingSelector
            currentRating={recordRatingLabel}
            onRate={(key) => onRate?.(movieId, key)}
            size="sm"
          />
        </div>
      )}
    </div>
  )
}

const PosterFallback = ({ title }) => (
  <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-surface-elevated p-3">
    <span className="text-3xl">🎬</span>
    <p className="text-xs text-text-muted text-center line-clamp-3 leading-relaxed">
      {title}
    </p>
  </div>
)

export default MovieCard