import { MovieCard } from '@/components/MovieCard'
import { LoadingSkeleton } from '@/components/LoadingSkeleton'

// ─────────────────────────────────────────
// MovieGrid
// Responsive grid of MovieCards
// Handles: loading, empty, results
// ─────────────────────────────────────────

/**
 * @param {Array}    movies       - list of TMDB or user_movie records
 * @param {boolean}  isLoading
 * @param {string}   emptyMessage
 * @param {object}   movieActions - { onAdd, onRemove, onRate, getMovieRecord }
 * @param {boolean}  showRating   - pass-through to MovieCard
 * @param {number}   skeletonCount
 */
export const MovieGrid = ({
  movies = [],
  isLoading = false,
  emptyMessage = 'No movies found.',
  movieActions = {},
  showRating = false,
  skeletonCount = 12,
}) => {
  if (isLoading) {
    return <LoadingSkeleton count={skeletonCount} />
  }

  if (!movies.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 animate-fade-in">
        <span className="text-5xl">🎬</span>
        <p className="text-text-muted text-sm text-center max-w-xs">{emptyMessage}</p>
      </div>
    )
  }

  const { onAdd, onRemove, onRate, getMovieRecord } = movieActions

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
      {movies.map((movie) => {
        const id = movie.id ?? movie.movieId
        const userRecord = getMovieRecord ? getMovieRecord(id) : null

        return (
          <MovieCard
            key={id}
            movie={movie}
            userRecord={userRecord}
            onAdd={onAdd}
            onRemove={onRemove}
            onRate={onRate}
            showRating={showRating}
          />
        )
      })}
    </div>
  )
}

export default MovieGrid