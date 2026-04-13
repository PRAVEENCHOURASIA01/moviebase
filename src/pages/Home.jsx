import { useState, useEffect } from 'react'
import { SearchBar } from '@/components/SearchBar'
import { MovieGrid } from '@/components/MovieGrid'
import { getTrending } from '@/services/api/tmdb'
import { useSearch } from '@/hooks/useSearch'
import { useMovies } from '@/hooks/useMovies'
import { trackEvent } from '@/services/backend/supabase'
import { ANALYTICS_EVENTS } from '@/lib/enums'

// ─────────────────────────────────────────
// Home Page
// Explore-first — no auth required
// Shows: trending on load, search results on query
// ─────────────────────────────────────────
const Home = () => {
  const [trending, setTrending] = useState([])
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [trendingError, setTrendingError] = useState(null)

  const { query, setQuery, results, isLoading: searchLoading, clearSearch, isSearching } = useSearch()
  const { addMovie, removeMovie, updateRating, getMovieRecord, isLoading: moviesLoading } = useMovies()

  // ── Fetch trending on mount ────────────
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTrending()
        setTrending(data)
      } catch (err) {
        setTrendingError(err.message ?? 'Failed to load trending movies')
      } finally {
        setTrendingLoading(false)
      }
    }
    load()
  }, [])

  // ── Track search queries ───────────────
  useEffect(() => {
    if (!query || query.trim().length < 2) return
    const timer = setTimeout(() => {
      trackEvent(ANALYTICS_EVENTS.SEARCH, query.trim(), {
        metadata: { pageSource: 'home' },
      })
    }, 1000) // track after 1s of stable query
    return () => clearTimeout(timer)
  }, [query])

  // ── Shared movie action props ──────────
  const movieActions = {
    onAdd: addMovie,
    onRemove: removeMovie,
    onRate: updateRating,
    getMovieRecord,
  }

  const showSearch = isSearching
  const displayMovies = showSearch ? results : trending
  const isLoading = showSearch ? searchLoading : trendingLoading

  return (
    <main className="min-h-screen pt-16">

      {/* ── Hero + Search ───────────────── */}
      <section className="relative overflow-hidden">
        {/* Atmospheric background */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand/5 via-surface to-surface pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
          {/* Headline */}
          {!isSearching && (
            <div className="text-center mb-10 animate-fade-in">
              <h1
                className="text-5xl sm:text-7xl font-bold text-text-primary mb-3 tracking-tight"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em' }}
              >
                YOUR MOVIE UNIVERSE
              </h1>
              <p className="text-text-secondary text-base sm:text-lg max-w-xl mx-auto">
                Track everything you watch. Rate it. Share it.
              </p>
            </div>
          )}

          {/* Search bar */}
          <div className="max-w-2xl mx-auto">
            <SearchBar
              query={query}
              onQuery={setQuery}
              onClear={clearSearch}
              isLoading={searchLoading}
              autoFocus={false}
              placeholder="Search movies, TV shows…"
            />
          </div>
        </div>
      </section>

      {/* ── Content ─────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-20">

        {/* Section label */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {showSearch ? (
              <>
                <h2 className="section-title">
                  Results for <span className="text-brand">"{query}"</span>
                </h2>
                {!searchLoading && (
                  <span className="text-sm text-text-muted">
                    {results.length} found
                  </span>
                )}
              </>
            ) : (
              <>
                <span className="text-brand text-xl">🔥</span>
                <h2 className="section-title">Trending This Week</h2>
              </>
            )}
          </div>

          {showSearch && (
            <button
              onClick={clearSearch}
              className="text-xs text-text-muted hover:text-text-primary transition-colors"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Error state */}
        {trendingError && !isSearching && (
          <ErrorBanner message={trendingError} />
        )}

        {/* Grid */}
        <MovieGrid
          movies={displayMovies}
          isLoading={isLoading}
          emptyMessage={
            isSearching
              ? `No results for "${query}". Try a different title.`
              : 'Could not load trending movies. Check your connection.'
          }
          movieActions={movieActions}
          skeletonCount={12}
        />
      </section>
    </main>
  )
}

const ErrorBanner = ({ message }) => (
  <div className="mb-6 px-4 py-3 rounded-xl bg-rating-worst/10 border border-rating-worst/20 text-rating-worst text-sm">
    {message}
  </div>
)

export default Home