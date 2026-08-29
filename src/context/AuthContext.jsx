import { createContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  getCurrentUser,
  login as supabaseLogin,
  signup as supabaseSignup,
  logout as supabaseLogout,
  createUserProfile,
  upsertUserProfile,
  getUserById,
  onAuthStateChange,
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
  const migratedUserIds = useRef(new Set())

  // ── Ensure Profile Helper ────────────────
  // Retrieves or automatically creates a profile row if missing
  const ensureProfile = useCallback(async (authUser) => {
    if (!authUser) return null
    try {
      let userProfile = await getUserById(authUser.id)
      if (!userProfile) {
        // Derive username from metadata or email
        const metaUsername = authUser.user_metadata?.username
        const fallbackUsername = normalizeUsername(
          metaUsername || authUser.email?.split('@')[0] || `user_${authUser.id.slice(0, 6)}`
        )

        try {
          userProfile = await upsertUserProfile({
            userId: authUser.id,
            username: fallbackUsername,
            email: authUser.email,
          })
        } catch {
          // If insert fails (e.g. username taken or RLS), create local fallback representation
          userProfile = {
            user_id: authUser.id,
            username: fallbackUsername,
            email: authUser.email,
            is_public: true,
          }
        }
      }
      return userProfile
    } catch {
      return {
        user_id: authUser.id,
        username: authUser.user_metadata?.username || authUser.email?.split('@')[0] || 'User',
        email: authUser.email,
        is_public: true,
      }
    }
  }, [])

  // ── Sync user session and profile ────────
  const syncSession = useCallback(async (authUser) => {
    if (!authUser) {
      setUser(null)
      setProfile(null)
      return
    }

    setUser(authUser)
    const userProfile = await ensureProfile(authUser)
    setProfile(userProfile)

    if (authUser.id && !migratedUserIds.current.has(authUser.id)) {
      migratedUserIds.current.add(authUser.id)
      await migrateLocal(authUser.id).catch(() => { })
    }
  }, [ensureProfile])

  // ── Auth Listener & Session Restore ──────
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (isMounted && currentUser) {
          await syncSession(currentUser)
        }
      } catch {
        // No active session — silent
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()

    // Realtime Supabase auth state change subscription
    const { data: authListener } = onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      if (session?.user) {
        await syncSession(session.user)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
      }
      setIsLoading(false)
    })

    return () => {
      isMounted = false
      authListener?.subscription?.unsubscribe?.()
    }
  }, [syncSession])

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
        const msg = 'Please confirm your email before signing in. Check your inbox.'
        setError(msg)
        return { success: false, error: msg }
      }

      await syncSession(currentUser)
      closeAuthModal()
      return { success: true }
    } catch (err) {
      let message = err.message ?? 'Login failed'
      if (message.toLowerCase().includes('invalid login credentials')) {
        message = 'Wrong email or password. Please try again.'
      } else if (message.toLowerCase().includes('email not confirmed')) {
        message = 'Please confirm your email first. Check your inbox.'
      }
      setError(message)
      return { success: false, error: message }
    }
  }, [closeAuthModal, syncSession])

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
      // 1. Create Supabase auth account (passes username in user_metadata)
      const { user: newUser, session } = await supabaseSignup(email, password, normalized)

      if (!newUser) {
        const msg = 'Signup failed. Please try again.'
        setError(msg)
        return { success: false, error: msg }
      }

      // 2. If session exists (email confirmation off) → login immediately
      if (session) {
        const currentUser = await getCurrentUser()
        try {
          await createUserProfile({
            userId: (currentUser || newUser).id,
            username: normalized,
            email,
          })
        } catch {
          // If profile table already has it or fallback needed, ensureProfile handles it
        }

        await syncSession(currentUser || newUser)
        closeAuthModal()
        return { success: true }
      }

      // 3. Email confirmation is ON
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
  }, [closeAuthModal, syncSession])

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
