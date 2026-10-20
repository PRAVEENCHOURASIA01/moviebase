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

  // ── Logout ─────────────────────────────────
  const logout = useCallback(async () => {
    await dbSaveSetting('profile', null)
    setUser(null)
    setProfile(null)
  }, [])

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(user),
    loginWithGoogle,
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

