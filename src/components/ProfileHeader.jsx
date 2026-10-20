import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'

// ProfileHeader
// Shows avatar, editable username, email, stats, and share button.
// isOwn=true enables the inline edit pencil icon.
export const ProfileHeader = ({ profile, stats = {}, isOwn = false }) => {
  const { updateUsername } = useAuth()
  const { success, error: toastError } = useToast()

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [saving, setSaving] = useState(false)
  const inputRef = useRef(null)

  if (!profile) return null

  const initials = profile.username?.slice(0, 2).toUpperCase() ?? '??'

  // Focus the input when editing starts
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const startEdit = () => {
    setDraftName(profile.username || '')
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setDraftName('')
  }

  const saveEdit = async () => {
    if (!draftName.trim()) {
      toastError('Username cannot be empty')
      return
    }
    setSaving(true)
    const result = await updateUsername(draftName)
    setSaving(false)
    if (result?.success) {
      success('Username updated!')
      setEditing(false)
    } else {
      toastError(result?.error || 'Failed to update username')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') saveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 pb-8 border-b border-surface-border animate-fade-in">

      {/* Avatar */}
      <div className="relative">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.username}
            className="w-20 h-20 rounded-2xl object-cover border-2 border-brand/30 shadow-[0_0_30px_rgba(229,9,20,0.15)]"
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand/30 to-brand/10 border border-brand/30 flex items-center justify-center shadow-[0_0_30px_rgba(229,9,20,0.15)]">
            <span
              className="text-2xl font-bold text-brand"
              style={{ fontFamily: "'Bebas Neue', sans-serif" }}
            >
              {initials}
            </span>
          </div>
        )}
        {isOwn && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rating-great border-2 border-surface" title="Your profile" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">

        {/* Username row — editable when isOwn */}
        <div className="flex items-center gap-2 flex-wrap">
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={40}
                className="text-2xl font-bold bg-surface border border-brand/50 rounded-lg px-3 py-1 text-text-primary focus:outline-none focus:ring-2 focus:ring-brand/40 w-48 sm:w-64"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
                placeholder="Your name"
              />
              <button
                onClick={saveEdit}
                disabled={saving}
                className="px-3 py-1.5 bg-brand text-white text-xs font-semibold rounded-lg hover:bg-brand-hover transition-colors disabled:opacity-50"
              >
                {saving ? '...' : 'Save'}
              </button>
              <button
                onClick={cancelEdit}
                className="px-3 py-1.5 bg-surface-hover text-text-secondary text-xs rounded-lg hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <>
              <h1
                className="text-3xl font-bold text-text-primary tracking-tight"
                style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.03em' }}
              >
                {profile.username}
              </h1>

              {isOwn && (
                <>
                  <span className="pill bg-brand/15 text-brand border border-brand/30 text-[10px]">You</span>
                  {/* Pencil edit button */}
                  <button
                    onClick={startEdit}
                    title="Edit username"
                    className="w-7 h-7 rounded-lg bg-surface-hover hover:bg-surface-border flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
                  >
                    <PencilIcon />
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* Email below name */}
        {profile.email && (
          <p className="mt-0.5 text-xs text-text-muted font-mono tracking-wide">
            {profile.email}
          </p>
        )}

        {profile.bio && (
          <p className="mt-1.5 text-sm text-text-secondary max-w-md">{profile.bio}</p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-5 flex-wrap">
          <Stat label="Watched" value={stats.totalWatched ?? 0} />
          <Stat label="Watchlist" value={stats.totalWatchlist ?? 0} />
          <Stat label="Favorites" value={stats.totalFavorites ?? 0} />
          <Stat label="Rated" value={stats.totalRated ?? 0} />
        </div>
      </div>
    </div>
  )
}

// Sub-components
const Stat = ({ label, value }) => (
  <div className="flex flex-col items-start">
    <span className="text-xl font-bold text-text-primary">{value}</span>
    <span className="text-xs text-text-muted">{label}</span>
  </div>
)

const PencilIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a2 2 0 01-1.414.586H8v-2.414a2 2 0 01.586-1.414z" />
  </svg>
)

export default ProfileHeader
