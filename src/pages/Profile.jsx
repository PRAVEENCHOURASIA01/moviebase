import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { ProfileHeader } from '@/components/ProfileHeader'
import { CategoryTabs } from '@/components/CategoryTabs'
import { MovieGrid } from '@/components/MovieGrid'
import { useAuth } from '@/hooks/useAuth'
import { useMovies } from '@/hooks/useMovies'
import { CATEGORIES } from '@/lib/enums'

// ─────────────────────────────────────────
// Profile Page — /profile
// Authenticated users only.
// Shows own collection with category filter + ratings.
// ─────────────────────────────────────────
const Profile = () => {
  const { isAuthenticated, isLoading: authLoading, profile, openAuthModal } = useAuth()
  const { movies, isLoading: moviesLoading, addMovie, removeMovie, updateRating, getMovieRecord } = useMovies()

  const [activeCategory, setActiveCategory] = useState(null) // null = all

  // Redirect anonymous users → trigger modal instead
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      openAuthModal()
    }
  }, [authLoading, isAuthenticated, openAuthModal])

  // If still checking auth, show nothing (avoids flash)
  if (authLoading) return <PageShell><LoadingState /></PageShell>

  // If not authenticated, redirect home (modal already opened)
  if (!isAuthenticated) return <Navigate to="/" replace />

  // ── Compute counts per category ────────
  const counts = {
    [CATEGORIES.WATCHED]: movies.filter((m) => m.category === CATEGORIES.WATCHED).length,
    [CATEGORIES.WATCHLIST]: movies.filter((m) => m.category === CATEGORIES.WATCHLIST).length,
    [CATEGORIES.FAVORITES]: movies.filter((m) => m.category === CATEGORIES.FAVORITES).length,
  }

  // ── Filter movies by active tab ────────
  const displayMovies = activeCategory
    ? movies.filter((m) => m.category === activeCategory)
    : movies

  // ── Stats for ProfileHeader ────────────
  const stats = {
    totalWatched: counts[CATEGORIES.WATCHED],
    totalWatchlist: counts[CATEGORIES.WATCHLIST],
    totalFavorites: counts[CATEGORIES.FAVORITES],
    totalRated: movies.filter((m) => (m.rating_label ?? m.ratingLabel) !== null).length,
  }

  const movieActions = {
    onAdd: addMovie,
    onRemove: removeMovie,
    onRate: updateRating,
    getMovieRecord,
  }

  const emptyMessages = {
    null: "You haven't added any movies yet. Start exploring!",
    [CATEGORIES.WATCHED]: "No watched movies yet.",
    [CATEGORIES.WATCHLIST]: "Your watchlist is empty. Add movies to watch later.",
    [CATEGORIES.FAVORITES]: "No favorites yet. Heart the movies you love.",
  }

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-20">

        {/* Profile header */}
        <ProfileHeader profile={profile} stats={stats} isOwn={true} />

        {/* Category filter */}
        <div className="mt-8 mb-6">
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
          />
        </div>

        {/* Movie grid — show rating selectors on own profile */}
        <MovieGrid
          movies={displayMovies}
          isLoading={moviesLoading}
          emptyMessage={emptyMessages[activeCategory] ?? emptyMessages[null]}
          movieActions={movieActions}
          showRating={true}
          skeletonCount={8}
        />
      </div>
    </PageShell>
  )
}

// ── Shared wrappers ───────────────────────
const PageShell = ({ children }) => (
  <main className="min-h-screen">{children}</main>
)

const LoadingState = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      <p className="text-text-muted text-sm">Loading your profile…</p>
    </div>
  </div>
)

export default Profile