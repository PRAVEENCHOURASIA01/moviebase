import { useState, useEffect, useRef } from 'react'
import { ProfileHeader } from '@/components/ProfileHeader'
import { CategoryTabs } from '@/components/CategoryTabs'
import { MovieGrid } from '@/components/MovieGrid'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useMovies } from '@/hooks/useMovies'
import { useToast } from '@/hooks/useToast'
import { CATEGORIES } from '@/lib/enums'
import { toShareLink } from '@/lib/routes'
import { publishSnapshot, deleteSnapshot } from '@/services/backend/snapshot'
import {
  dbGetSetting,
  dbSaveSetting,
  exportLocalBackup,
  importLocalBackup,
} from '@/services/storage/indexedDB'

// Generate cryptographic 128-bit unguessable share token
const generateShareToken = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let token = 'mb_'
  const randomValues = new Uint8Array(16)
  window.crypto.getRandomValues(randomValues)
  for (let i = 0; i < 16; i++) {
    token += chars[randomValues[i] % chars.length]
  }
  return token
}

// ─────────────────────────────────────────
// Profile Page — /profile
// Local-First management, private-by-default sharing,
// backup export/import
// ─────────────────────────────────────────
const Profile = () => {
  const { user, profile, isAuthenticated, openAuthModal } = useAuth()
  const { movies, isLoading: moviesLoading, addMovie, removeMovie, updateRating, getMovieRecord } = useMovies()
  const { success, error: toastError, info } = useToast()

  const [activeCategory, setActiveCategory] = useState(null)
  const [shareConfig, setShareConfig] = useState({
    enabled: false,
    token: null,
    includeWatched: true,
    includeWatchlist: true,
    includeFavorites: true,
  })
  const [isPublishing, setIsPublishing] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const fileInputRef = useRef(null)

  // ── Load share settings from IndexedDB ──
  useEffect(() => {
    const loadSettings = async () => {
      const saved = await dbGetSetting('share_config', null)
      if (saved) setShareConfig(saved)
    }
    loadSettings()
  }, [])

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

  const stats = {
    totalWatched: counts[CATEGORIES.WATCHED],
    totalWatchlist: counts[CATEGORIES.WATCHLIST],
    totalFavorites: counts[CATEGORIES.FAVORITES],
    totalRated: movies.filter((m) => (m.ratingLabel ?? m.rating_label) !== null).length,
  }

  // ── Publish / Sync Snapshot ────────────
  const handlePublish = async (newToken = null) => {
    setIsPublishing(true)
    const token = newToken || shareConfig.token || generateShareToken()

    const sanitizedWatched = shareConfig.includeWatched
      ? movies.filter((m) => m.category === CATEGORIES.WATCHED)
      : []
    const sanitizedWatchlist = shareConfig.includeWatchlist
      ? movies.filter((m) => m.category === CATEGORIES.WATCHLIST)
      : []
    const sanitizedFavorites = shareConfig.includeFavorites
      ? movies.filter((m) => m.category === CATEGORIES.FAVORITES)
      : []

    const snapshotPayload = {
      displayName: profile?.username || user?.displayName || 'Film Explorer',
      avatarUrl: profile?.avatarUrl || user?.photoURL || null,
      bio: profile?.bio || '',
      updatedAt: new Date().toISOString(),
      collections: {
        [CATEGORIES.WATCHED]: sanitizedWatched,
        [CATEGORIES.WATCHLIST]: sanitizedWatchlist,
        [CATEGORIES.FAVORITES]: sanitizedFavorites,
      },
    }

    try {
      await publishSnapshot(token, snapshotPayload)
      const nextConfig = { ...shareConfig, enabled: true, token }
      setShareConfig(nextConfig)
      await dbSaveSetting('share_config', nextConfig)
      success('Published! Shared collection is up to date.')
    } catch (err) {
      toastError(err.message ?? 'Failed to publish snapshot')
    } finally {
      setIsPublishing(false)
    }
  }

  // ── Revoke / Unpublish ─────────────────
  const handleUnpublish = async () => {
    if (!shareConfig.token) return
    setIsPublishing(true)
    try {
      await deleteSnapshot(shareConfig.token)
      const nextConfig = { ...shareConfig, enabled: false }
      setShareConfig(nextConfig)
      await dbSaveSetting('share_config', nextConfig)
      success('Profile unpublished. Link is no longer accessible.')
    } catch (err) {
      toastError(err.message ?? 'Failed to unpublish')
    } finally {
      setIsPublishing(false)
    }
  }

  // ── Regenerate Link ────────────────────
  const handleRegenerate = async () => {
    if (shareConfig.token) {
      try {
        await deleteSnapshot(shareConfig.token)
      } catch {}
    }
    const newToken = generateShareToken()
    await handlePublish(newToken)
  }

  // ── Copy Link ──────────────────────────
  const handleCopyLink = () => {
    if (!shareConfig.token) return
    const url = `${window.location.origin}${toShareLink(shareConfig.token)}`
    navigator.clipboard?.writeText(url)
    success('Private share link copied to clipboard!')
  }

  // ── Backup Export / Import ─────────────
  const handleExport = async () => {
    try {
      await exportLocalBackup()
      success('Backup file downloaded!')
    } catch {
      toastError('Failed to generate backup')
    }
  }

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const { count } = await importLocalBackup(event.target.result)
        success(`Successfully restored ${count} movies!`)
        window.location.reload()
      } catch (err) {
        toastError(err.message ?? 'Corrupt backup file')
      }
    }
    reader.readAsText(file)
  }

  const movieActions = {
    onAdd: addMovie,
    onRemove: removeMovie,
    onRate: updateRating,
    getMovieRecord,
  }

  const shareUrl = shareConfig.token
    ? `${window.location.origin}${toShareLink(shareConfig.token)}`
    : ''

  return (
    <main className="min-h-screen pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">

        {/* ── Profile Header ── */}
        <ProfileHeader
          profile={profile || { username: user?.displayName || 'My Collection' }}
          stats={stats}
          isOwn={true}
        />

        {/* ── Toolbar: Share & Data Management ── */}
        <div className="mt-6 p-4 rounded-2xl bg-surface-elevated border border-surface-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-text-primary">
                Local-First & Private Storage
              </p>
              <p className="text-xs text-text-muted">
                Your collection stays on this device. Never affected by database freezes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowShareModal(true)}
            >
              🔗 {shareConfig.enabled ? 'Sharing Settings' : 'Share Collection'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              📥 Export Backup
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📤 Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
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

        {/* ── Movie Grid ── */}
        <MovieGrid
          movies={displayMovies}
          isLoading={moviesLoading}
          emptyMessage="Your collection is empty. Explore and add movies!"
          movieActions={movieActions}
          showRating={true}
          skeletonCount={8}
        />
      </div>

      {/* ── Sharing Settings Modal ── */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-surface-elevated border border-surface-border rounded-2xl p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between pb-4 border-b border-surface-border mb-4">
              <h2 className="text-lg font-bold text-text-primary">
                Private-by-Default Sharing
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-text-muted hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary mb-4 leading-relaxed">
              Your profile is <strong className="text-text-primary">unlisted</strong>. Only people with your unique high-entropy link can view this snapshot. No emails or private identifiers are ever shared.
            </p>

            {/* Sharing link display */}
            {shareConfig.enabled && shareConfig.token && (
              <div className="mb-5 p-3 rounded-xl bg-surface border border-surface-border">
                <p className="text-[11px] text-text-muted uppercase tracking-wide mb-1">
                  Active Share Link
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="w-full bg-transparent text-xs text-text-primary focus:outline-none overflow-ellipsis"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 text-xs bg-brand text-white rounded-lg font-medium hover:bg-brand-hover shrink-0"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            {/* Inclusions */}
            <div className="space-y-3 mb-6">
              <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Include in Shared Snapshot:
              </p>
              {[
                { key: 'includeWatched', label: 'Watched Movies' },
                { key: 'includeWatchlist', label: 'Watchlist' },
                { key: 'includeFavorites', label: 'Favorites' },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center justify-between text-sm text-text-primary cursor-pointer">
                  <span>{label}</span>
                  <input
                    type="checkbox"
                    checked={shareConfig[key]}
                    onChange={(e) =>
                      setShareConfig((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="accent-brand w-4 h-4 rounded"
                  />
                </label>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-border">
              <Button
                variant="primary"
                fullWidth
                isLoading={isPublishing}
                onClick={() => handlePublish()}
              >
                {shareConfig.enabled ? 'Update Published Snapshot' : 'Generate & Publish Link'}
              </Button>

              {shareConfig.enabled && (
                <div className="flex gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={handleRegenerate}
                    isLoading={isPublishing}
                  >
                    🔄 Regenerate Link
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    fullWidth
                    onClick={handleUnpublish}
                    isLoading={isPublishing}
                  >
                    🛑 Unpublish
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Profile