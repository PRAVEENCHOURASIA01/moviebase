import { createContext, useState, useEffect, useCallback } from 'react'
import { dbGetSetting, dbSaveSetting } from '@/services/storage/indexedDB'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authModal, setAuthModal] = useState(false)

  // ── Restore saved local profile session ────
  useEffect(() => {
    let isMounted = true
    const restoreSession = async () => {
      try {
        const savedProfile = await dbGetSetting('profile', null)
        if (savedProfile && isMounted) {
          setUser({
            id: savedProfile.sub || savedProfile.id,
            displayName: savedProfile.username || savedProfile.name,
            photoURL: savedProfile.avatarUrl || savedProfile.picture,
          })
          setProfile(savedProfile)
        }
      } catch (err) {
        console.warn('Session restore:', err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    restoreSession()
    return () => { isMounted = false }
  }, [])

  const openAuthModal = useCallback(() => setAuthModal(true), [])
  const closeAuthModal = useCallback(() => setAuthModal(false), [])

  // ── Google OAuth Sign-in Handler ───────────
  const loginWithGoogle = useCallback(async (googleUser) => {
    const profileData = {
      id: googleUser.sub,
      username: googleUser.name || 'Movie Explorer',
      avatarUrl: googleUser.picture || null,
      email: googleUser.email || '',
      updatedAt: new Date().toISOString(),
    }

    await dbSaveSetting('profile', profileData)

    setUser({
      id: googleUser.sub,
      displayName: profileData.username,
      photoURL: profileData.avatarUrl,
    })
    setProfile(profileData)
    return { success: true }
  }, [])

  // ── Update Username ────────────────────────
  const updateUsername = useCallback(async (newName) => {
    const trimmed = String(newName).trim()
    if (!trimmed) return { success: false, error: 'Name cannot be empty' }
    const updatedProfile = { ...profile, username: trimmed, updatedAt: new Date().toISOString() }
    await dbSaveSetting('profile', updatedProfile)
    setProfile(updatedProfile)
    setUser((prev) => prev ? { ...prev, displayName: trimmed } : prev)
    return { success: true }
  }, [profile])

  // ── Logout ─────────────────────────────────
  const logout = useCallback(async (currentUserEmail) => {
    // Clear local storage first
    await dbSaveSetting('profile', null)
    setUser(null)
    setProfile(null)

    // Tell GIS to forget the cached account selection.
    // This forces the full account picker on the next sign-in attempt.
    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.disableAutoSelect()
        // If we have the user's email, also revoke the token so Google
        // completely forgets the session on this origin.
        if (currentUserEmail) {
          window.google.accounts.id.revoke(currentUserEmail, () => {
            console.log('[Auth] Google token revoked for', currentUserEmail)
          })
        }
      }
    } catch (err) {
      console.warn('[Auth] GIS revoke error (non-critical):', err)
    }
  }, [])

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    loginWithGoogle,
    updateUsername,
    logout,
    authModal,
    openAuthModal,
    closeAuthModal,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider

