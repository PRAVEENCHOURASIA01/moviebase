import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CategoryTabs } from '@/components/CategoryTabs'
import { MovieGrid } from '@/components/MovieGrid'
import { getSnapshot } from '@/services/backend/snapshot'
import { CATEGORIES } from '@/lib/enums'
import { ROUTES } from '@/lib/routes'

// ─────────────────────────────────────────
// SharedProfile Page — /share/:token
// High-entropy, unlisted, read-only view.
// Accessible even when owner is offline.
// ─────────────────────────────────────────
const SharedProfile = () => {
  const { token } = useParams()
  const [snapshot, setSnapshot] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)

  useEffect(() => {
    if (!token) return

    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getSnapshot(token)
        if (!data) {
          setError('This shared profile does not exist or has been unpublished by its owner.')
        } else {
          setSnapshot(data)
        }
      } catch (err) {
        setError(err.message ?? 'Failed to load shared profile')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [token])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Loading collection…</p>
        </div>
      </main>
    )
  }

  if (error || !snapshot) {
    return (
      <main className="min-h-screen flex items-center justify-center pt-16">
        <div className="flex flex-col items-center gap-4 text-center px-4 animate-fade-in max-w-md">
          <span className="text-6xl">🔒</span>
          <h1
            className="text-4xl font-bold text-text-primary"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            Profile Unavailable
          </h1>
          <p className="text-text-secondary text-sm">
            {error || 'This link may have expired, been revoked, or typed incorrectly.'}
          </p>
          <Link
            to={ROUTES.HOME}
            className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
          >
            Explore Movies
          </Link>
        </div>
      </main>
    )
  }

  const {
    displayName = 'Anonymous Curator',
    avatarUrl = null,
    bio = '',
    collections = {},
    updatedAt = null,
  } = snapshot

  const watched = collections[CATEGORIES.WATCHED] || []
  const watchlist = collections[CATEGORIES.WATCHLIST] || []
  const favorites = collections[CATEGORIES.FAVORITES] || []

  const counts = {
    [CATEGORIES.WATCHED]: watched.length,
    [CATEGORIES.WATCHLIST]: watchlist.length,
    [CATEGORIES.FAVORITES]: favorites.length,
  }

  const displayMovies = activeCategory
    ? collections[activeCategory] || []
    : [...watched, ...watchlist, ...favorites]

  const formattedDate = updatedAt
    ? new Date(updatedAt).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <main className="min-h-screen pt-20 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Profile Header ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 pb-8 border-b border-surface-border animate-fade-in">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand/30 to-brand/10 border border-brand/30 flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.15)] overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span
                className="text-2xl font-bold text-brand"
                style={{ fontFamily: "'Bebas Neue', sans-serif" }}
              >
                {displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h1
                className="text-3xl font-bold text-text-primary tracking-tight"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
              >
                {displayName}
              </h1>
              <span className="pill bg-surface-elevated text-text-secondary border border-surface-border text-[10px]">
                Shared Collection
              </span>
            </div>

            {bio && <p className="mt-1 text-sm text-text-secondary max-w-md">{bio}</p>}

            <div className="mt-3 flex items-center gap-5 flex-wrap">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-text-primary">{watched.length}</span>
                <span className="text-xs text-text-muted">Watched</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-text-primary">{watchlist.length}</span>
                <span className="text-xs text-text-muted">Watchlist</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-text-primary">{favorites.length}</span>
                <span className="text-xs text-text-muted">Favorites</span>
              </div>
              {formattedDate && (
                <div className="flex flex-col border-l border-surface-border pl-4">
                  <span className="text-xs text-text-muted">Last updated</span>
                  <span className="text-xs text-text-secondary font-medium">{formattedDate}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div className="mt-8 mb-6">
          <CategoryTabs
            active={activeCategory}
            onChange={setActiveCategory}
            counts={counts}
          />
        </div>

        {/* ── Read-Only Movie Grid ── */}
        <MovieGrid
          movies={displayMovies}
          isLoading={false}
          emptyMessage="No titles in this section."
          movieActions={{}}
          showRating={false}
          skeletonCount={8}
        />
      </div>
    </main>
  )
}

export default SharedProfile
