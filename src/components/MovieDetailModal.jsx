import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { RatingSelector } from '@/components/RatingSelector'
import { getMovieDetails } from '@/services/api/tmdb'
import { buildImageUrl, IMAGE_SIZES } from '@/config/tmdb'
import { CATEGORIES } from '@/lib/enums'

const CATEGORY_ACTIONS = [
  { key: CATEGORIES.WATCHED, label: 'Watched', icon: '✅' },
  { key: CATEGORIES.WATCHLIST, label: 'Watchlist', icon: '🕐' },
  { key: CATEGORIES.FAVORITES, label: 'Favorites', icon: '❤️' },
]

export const MovieDetailModal = ({
  movie,
  isOpen,
  onClose,
  userRecord = null,
  onAdd,
  onRemove,
  onRate,
}) => {
  const [details, setDetails] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTrailer, setShowTrailer] = useState(false)

  const movieId = movie?.movieId ?? movie?.id ?? movie?.movie_id
  const mediaType = movie?.mediaType ?? movie?.media_type ?? 'movie'

  useEffect(() => {
    if (!isOpen || !movieId) return

    let isMounted = true
    setIsLoading(true)
    setShowTrailer(false)

    getMovieDetails(movieId, mediaType).then((data) => {
      if (isMounted) {
        setDetails(data)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
    }
  }, [isOpen, movieId, mediaType])

  if (!movie) return null

  const title = details?.title || movie.title || movie.name || 'Untitled'
  const releaseYear = details?.releaseYear || movie.releaseYear || (movie.release_date || movie.first_air_date)?.slice(0, 4) || '—'
  const overview = details?.overview || movie.overview || 'No overview available.'
  const rating = details?.rating ?? movie.rating
  const backdropUrl = details?.backdropPath ? buildImageUrl(details.backdropPath, IMAGE_SIZES.BACKDROP.LG) : null
  const posterUrl = (details?.posterPath || movie.posterPath || movie.poster_path)
    ? buildImageUrl(details?.posterPath || movie.posterPath || movie.poster_path, IMAGE_SIZES.POSTER.MD)
    : null

  const recordCategory = userRecord?.category ?? null
  const recordRatingLabel = userRecord?.ratingLabel ?? userRecord?.rating_label ?? null
  const isInList = Boolean(userRecord)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="relative -m-6 rounded-2xl overflow-hidden bg-surface-elevated text-text-primary">
        {/* Backdrop Header */}
        <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-surface">
          {backdropUrl ? (
            <img
              src={backdropUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand/20 via-surface to-surface" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-elevated via-surface-elevated/60 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            ✕
          </button>

          {/* Play Trailer overlay button */}
          {details?.trailerKey && !showTrailer && (
            <button
              onClick={() => setShowTrailer(true)}
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 group cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-brand/90 group-hover:bg-brand text-white flex items-center justify-center shadow-2xl transition-transform duration-300 group-hover:scale-110">
                <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="text-xs uppercase tracking-wider font-semibold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">
                Watch Trailer
              </span>
            </button>
          )}

          {/* Embedded YouTube Player */}
          {showTrailer && details?.trailerKey && (
            <div className="absolute inset-0 bg-black z-20">
              <iframe
                title={details.trailerName || 'Trailer'}
                src={`https://www.youtube-nocookie.com/embed/${details.trailerKey}?autoplay=1&rel=0`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <button
                onClick={() => setShowTrailer(false)}
                className="absolute top-3 right-3 z-30 px-3 py-1 bg-black/80 hover:bg-black text-white text-xs rounded-lg font-medium backdrop-blur-sm"
              >
                Close Trailer
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Poster Thumbnail */}
            {posterUrl && (
              <div className="hidden sm:block w-36 shrink-0 -mt-20 z-10 rounded-xl overflow-hidden shadow-2xl border-2 border-surface-border">
                <img src={posterUrl} alt={title} className="w-full h-auto object-cover" />
              </div>
            )}

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h2
                  className="text-3xl font-bold text-text-primary tracking-tight"
                  style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
                >
                  {title}
                </h2>
                {releaseYear !== '—' && (
                  <span className="text-text-muted text-lg">({releaseYear})</span>
                )}
                <span className="pill bg-surface text-text-secondary border border-surface-border text-xs uppercase">
                  {mediaType}
                </span>
                {details?.runtime && (
                  <span className="text-text-muted text-xs">• {details.runtime}</span>
                )}
              </div>

              {details?.tagline && (
                <p className="text-xs italic text-brand/90 font-medium">"{details.tagline}"</p>
              )}

              {/* Genres */}
              {details?.genres?.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {details.genres.map((g) => (
                    <span
                      key={g}
                      className="px-2.5 py-0.5 rounded-full text-[11px] bg-surface text-text-secondary border border-surface-border"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {/* Rating score */}
              {rating !== null && rating !== undefined && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-yellow-400 text-sm">★</span>
                  <span className="text-sm font-semibold text-text-primary">{rating} / 10</span>
                  {details?.voteCount ? (
                    <span className="text-xs text-text-muted">({details.voteCount.toLocaleString()} votes)</span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {/* Collection Status & Action Buttons */}
          <div className="p-4 rounded-xl bg-surface border border-surface-border flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Collection:
              </span>
              {CATEGORY_ACTIONS.map(({ key, label, icon }) => {
                const isActive = recordCategory === key
                return (
                  <button
                    key={key}
                    onClick={() => onAdd?.(movie, key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-brand text-white shadow-lg shadow-brand/20'
                        : 'bg-surface-elevated hover:bg-surface-hover text-text-secondary border border-surface-border'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </button>
                )
              })}
              {isInList && (
                <button
                  onClick={() => onRemove?.(movieId)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rating-worst/10 hover:bg-rating-worst/20 text-rating-worst border border-rating-worst/20 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Rating Selector */}
            {isInList && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted">Your Rating:</span>
                <RatingSelector
                  currentRating={recordRatingLabel}
                  onRate={(key) => onRate?.(movieId, key)}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Overview */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Overview
            </h3>
            <p className="text-sm text-text-secondary leading-relaxed">{overview}</p>
          </div>

          {/* Cast */}
          {details?.cast?.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Top Cast
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {details.cast.map((actor) => (
                  <div key={actor.id} className="p-2 rounded-lg bg-surface border border-surface-border flex items-center gap-2">
                    {actor.profilePath ? (
                      <img
                        src={buildImageUrl(actor.profilePath, IMAGE_SIZES.POSTER.SM)}
                        alt={actor.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-surface-elevated flex items-center justify-center text-xs">
                        👤
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-text-primary truncate">{actor.name}</p>
                      <p className="text-[10px] text-text-muted truncate">{actor.character}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default MovieDetailModal
