import { toPublicProfile } from '@/lib/routes'
import { Button } from '@/components/ui/Button'

// ─────────────────────────────────────────
// ProfileHeader
// Displays user info + stats + share action
// Used on both /profile and /user/:username
// ─────────────────────────────────────────

/**
 * @param {object}  profile   - users collection document
 * @param {object}  stats     - { totalWatched, totalWatchlist, totalFavorites, totalRated }
 * @param {boolean} isOwn     - true on /profile (own page)
 */
export const ProfileHeader = ({ profile, stats = {}, isOwn = false }) => {
  if (!profile) return null

  const initials = profile.username?.slice(0, 2).toUpperCase() ?? '??'

  const handleShare = () => {
    const url = `${window.location.origin}${toPublicProfile(profile.username)}`
    if (navigator.share) {
      navigator.share({ title: `${profile.username} on MovieBase`, url })
    } else {
      navigator.clipboard?.writeText(url)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 pb-8 border-b border-surface-border animate-fade-in">
      {/* ── Avatar ───────────────────────── */}
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand/30 to-brand/10 border border-brand/30 flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.15)]">
          <span
            className="text-2xl font-bold text-brand"
            style={{ fontFamily: "'Bebas Neue', sans-serif" }}
          >
            {initials}
          </span>
        </div>
        {isOwn && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rating-great border-2 border-surface" title="Your profile" />
        )}
      </div>

      {/* ── Info ─────────────────────────── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 flex-wrap">
          <h1
            className="text-3xl font-bold text-text-primary tracking-tight"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
          >
            {profile.username}
          </h1>
          {isOwn && (
            <span className="pill bg-brand/15 text-brand border border-brand/30 text-[10px]">
              You
            </span>
          )}
        </div>

        {profile.bio && (
          <p className="mt-1 text-sm text-text-secondary max-w-md">{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-5 flex-wrap">
          <Stat label="Watched" value={stats.totalWatched ?? 0} />
          <Stat label="Watchlist" value={stats.totalWatchlist ?? 0} />
          <Stat label="Favorites" value={stats.totalFavorites ?? 0} />
          <Stat label="Rated" value={stats.totalRated ?? 0} />
        </div>
      </div>

      {/* ── Actions ──────────────────────── */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          icon={<ShareIcon />}
        >
          Share profile
        </Button>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────
const Stat = ({ label, value }) => (
  <div className="flex flex-col items-start">
    <span className="text-xl font-bold text-text-primary">{value}</span>
    <span className="text-xs text-text-muted">{label}</span>
  </div>
)

const ShareIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
)

export default ProfileHeader