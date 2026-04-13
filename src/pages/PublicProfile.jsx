import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ProfileHeader } from '@/components/ProfileHeader'
import { CategoryTabs } from '@/components/CategoryTabs'
import { MovieGrid } from '@/components/MovieGrid'
import { useProfile } from '@/hooks/useProfile'
import { CATEGORIES } from '@/lib/enums'
import { ROUTES } from '@/lib/routes'

// ─────────────────────────────────────────
// PublicProfile Page — /user/:username
// Read-only. No auth required.
// Anyone can view any public profile.
// ─────────────────────────────────────────
const PublicProfile = () => {
  const { username } = useParams()
  const { profile, collections, stats, isLoading, notFound } = useProfile(username)

  const [activeCategory, setActiveCategory] = useState(null)

  // ── 404 state ─────────────────────────
  if (notFound) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4 animate-fade-in">
          <span className="text-6xl">🎬</span>
          <h1
            className="text-4xl font-bold text-text-primary"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Profile Not Found
          </h1>
          <p className="text-text-secondary text-sm max-w-xs">
            The user <span className="text-brand font-medium">@{username}</span> doesn't exist or has a private profile.
          </p>
          <Link
            to={ROUTES.HOME}
            className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Back to home
          </Link>
        </div>
      </main>
    )
  }

  // ── Loading state ──────────────────────
  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading profile…</p>
        </div>
      </main>
    )
  }

  // ── Derive display movies from active tab ──
  const allMovies = Object.values(collections).flat()
  const displayMovies = activeCategory
    ? (collections[activeCategory] ?? [])
    : allMovies

  const counts = {
    [CATEGORIES.WATCHED]: collections[CATEGORIES.WATCHED].length,
    [CATEGORIES.WATCHLIST]: collections[CATEGORIES.WATCHLIST].length,
    [CATEGORIES.FAVORITES]: collections[CATEGORIES.FAVORITES].length,
  }

  return (
    <main className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20">

        {/* Profile header — read-only, no isOwn */}
        <ProfileHeader profile={profile} stats={stats} isOwn={false} />

        {/* Category tabs */}
        <div className="mt-8 mb-6">
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
          />
        </div>

        {/* Read-only movie grid — no actions, no rating selector */}
        <MovieGrid
          movies={displayMovies}
          isLoading={false}
          emptyMessage={
            activeCategory
              ? `${username} hasn't added anything to ${activeCategory} yet.`
              : `${username} hasn't added any movies yet.`
          }
          movieActions={{}}      // no interactions on public view
          showRating={false}
          skeletonCount={8}
        />
      </div>
    </main>
  )
}

export default PublicProfile