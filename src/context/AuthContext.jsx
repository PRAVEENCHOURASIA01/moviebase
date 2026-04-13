import { createContext, useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  login as supabaseLogin,
  signup as supabaseSignup,
  logout as supabaseLogout,
  createUserProfile,
  getUserById,
} from '@/services/backend/supabase'
import { migrateLocalToSupabase as migrateLocal } from '@/utils/migrate'
import { RESERVED_USERNAMES } from '@/lib/constants'
import { normalizeUsername } from '@/utils/format'

export const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authModal, setAuthModal] = useState(false)
  const [error, setError] = useState(null)

  // ── Restore session on mount ─────────────
  useEffect(() => {
    const restore = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          const userProfile = await getUserById(currentUser.id)
          setUser(currentUser)
          setProfile(userProfile)
        }
      } catch {
        // No active session — silent
      } finally {
        setIsLoading(false)
      }
    }
    restore()
  }, [])

  const openAuthModal = useCallback(() => setAuthModal(true), [])
  const closeAuthModal = useCallback(() => {
    setAuthModal(false)
    setError(null)
  }, [])

  // ── Login ────────────────────────────────
  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      await supabaseLogin(email, password)
      const currentUser = await getCurrentUser()

      if (!currentUser) {
        // Email confirmation is still required
        const msg = 'Please confirm your email before signing in. Check your inbox.'
        setError(msg)
        return { success: false, error: msg }
      }

      const userProfile = await getUserById(currentUser.id)
      setUser(currentUser)
      setProfile(userProfile)
      await migrateLocal(currentUser.id)
      closeAuthModal()
      return { success: true }
    } catch (err) {
      // Make Supabase error messages user-friendly
      let message = err.message ?? 'Login failed'
      if (message.toLowerCase().includes('invalid login credentials')) {
        message = 'Wrong email or password. Please try again.'
      } else if (message.toLowerCase().includes('email not confirmed')) {
        message = 'Please confirm your email first. Check your inbox.'
      }
      setError(message)
      return { success: false, error: message }
    }
  }, [closeAuthModal])

  // ── Signup ───────────────────────────────
  const signup = useCallback(async (email, password, username) => {
    setError(null)

    const normalized = normalizeUsername(username)

    if (!normalized) {
      const msg = 'Username is required'
      setError(msg)
      return { success: false, error: msg }
    }
    if (RESERVED_USERNAMES.includes(normalized)) {
      const msg = 'That username is reserved. Please choose another.'
      setError(msg)
      return { success: false, error: msg }
    }

    try {
      // 1. Create Supabase auth account
      // signUp returns { user, session }
      // session is null if email confirmation is ON
      const { user: newUser, session } = await supabaseSignup(email, password)

      if (!newUser) {
        const msg = 'Signup failed. Please try again.'
        setError(msg)
        return { success: false, error: msg }
      }

      // 2. If email confirmation is OFF → session exists, log in immediately
      if (session) {
        const currentUser = await getCurrentUser()

        // 3. Create profile row
        const userProfile = await createUserProfile({
          userId: currentUser.id,
          username: normalized,
          email,
        })

        setUser(currentUser)
        setProfile(userProfile)
        await migrateLocal(currentUser.id)
        closeAuthModal()
        return { success: true }
      }

      // 4. Email confirmation is ON — tell user to check inbox
      closeAuthModal()
      setError(null)
      return {
        success: false,
        needsConfirmation: true,
        error: 'Account created! Check your email to confirm your account, then sign in.',
      }

    } catch (err) {
      let message = err.message ?? 'Signup failed'
      if (message.toLowerCase().includes('already registered')) {
        message = 'An account with this email already exists. Try signing in.'
      }
      setError(message)
      return { success: false, error: message }
    }
  }, [closeAuthModal])

  // ── Logout ───────────────────────────────
  const logout = useCallback(async () => {
    try {
      await supabaseLogout()
    } catch {
      // Session may already be expired
    } finally {
      setUser(null)
      setProfile(null)
      setError(null)
    }
  }, [])

  const value = {
    user,
    profile,
    isLoading,
    isAuthenticated: Boolean(user && profile),
    error,
    login,
    signup,
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