import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ROUTES, toPublicProfile } from '@/lib/routes'
import { Button } from '@/components/ui/Button'

// ─────────────────────────────────────────
// Navbar
// Sticky top bar with logo, profile CTA
// Auth trigger happens here on "Profile" click
// ─────────────────────────────────────────
export const Navbar = () => {
  const { user, profile, isAuthenticated, logout, openAuthModal } = useAuth()
  const { success, error: toastError } = useToast()
  const navigate = useNavigate()

  const handleProfileClick = () => {
    if (isAuthenticated) {
      navigate(ROUTES.PROFILE)
    } else {
      openAuthModal()
    }
  }

  const handleLogout = async () => {
    await logout()
    success('Signed out successfully')
    navigate(ROUTES.HOME)
  }

  const handleShare = async () => {
    if (!profile?.username) return
    const url = `${window.location.origin}${toPublicProfile(profile.username)}`
    
    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.username} on MovieBase`, url })
        success('Profile shared!')
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
      } else {
        const input = document.createElement('input')
        input.value = url
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      success('Profile link copied to clipboard!')
    } catch {
      toastError('Could not copy link. URL: ' + url)
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16">
      {/* Glass strip */}
      <div className="absolute inset-0 bg-surface/80 backdrop-blur-md border-b border-surface-border/60" />

      <nav className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* ── Logo ─────────────────────────────── */}
        <Link
          to={ROUTES.HOME}
          className="flex items-center gap-2 group"
          aria-label="MovieBase home"
        >
          <FilmIcon className="w-7 h-7 text-brand group-hover:scale-110 transition-transform duration-200" />
          <span
            className="text-xl font-bold tracking-tight text-text-primary"
            style={{ fontFamily: "'Bebas Neue', 'Impact', sans-serif", letterSpacing: '0.04em' }}
          >
            MOVIEBASE
          </span>
        </Link>

        {/* ── Right actions ─────────────────────── */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              {/* Avatar + username */}
              <button
                onClick={() => navigate(ROUTES.PROFILE)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-colors"
              >
                <Avatar username={profile?.username} />
                <span className="hidden sm:block text-sm font-medium text-text-primary">
                  {profile?.username}
                </span>
              </button>

              {/* Share profile */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                icon={<ShareIcon />}
              >
                <span className="hidden sm:block">Share</span>
              </Button>

              {/* Logout */}
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={openAuthModal}>
                Sign in
              </Button>
              <Button variant="primary" size="sm" onClick={handleProfileClick}>
                Create Profile
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}

// ── Sub-components ────────────────────────

const Avatar = ({ username }) => {
  const initials = username ? username.slice(0, 2).toUpperCase() : '?'
  return (
    <div className="w-8 h-8 rounded-full bg-brand/20 border border-brand/40 flex items-center justify-center">
      <span className="text-xs font-bold text-brand">{initials}</span>
    </div>
  )
}

const FilmIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
    />
  </svg>
)

const ShareIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
    />
  </svg>
)

export default Navbar