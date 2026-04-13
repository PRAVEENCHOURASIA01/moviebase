import { useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

// ─────────────────────────────────────────
// useAuth
//
// Thin consumer hook for AuthContext.
// All components use this — never import
// AuthContext directly outside of providers.
//
// Usage:
//   const { user, login, logout, openAuthModal } = useAuth()
// ─────────────────────────────────────────
export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within <AuthProvider>')
  }

  return context
}