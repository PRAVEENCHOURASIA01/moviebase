import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ENV } from '@/config/env'

// AuthModal — Google Sign-in & Profile Identity
// Uses OAuth2 token client with prompt:'select_account' so the
// account picker ALWAYS shows — users can freely switch accounts.
export const AuthModal = () => {
  const { authModal, closeAuthModal, loginWithGoogle, profile } = useAuth()
  const { success, error: toastError } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const tokenClientRef = useRef(null)

  // Load GIS and init token client (popup flow with forced account picker)
  useEffect(() => {
    if (!authModal || !ENV.GOOGLE_CLIENT_ID) return

    const initTokenClient = () => {
      if (!window.google?.accounts?.oauth2) return
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: ENV.GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        // 'select_account' forces the account picker every single time
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            toastError('Sign-in cancelled or failed.')
            setIsSigningIn(false)
            return
          }
          try {
            // Fetch user profile from Google using the access token
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            })
            const userInfo = await res.json()
            await loginWithGoogle({
              sub: userInfo.sub,
              name: userInfo.name,
              picture: userInfo.picture,
              email: userInfo.email,
            })
            success(`Welcome, ${userInfo.name || 'Movie Explorer'}!`)
            closeAuthModal()
          } catch {
            toastError('Failed to fetch your Google profile. Please try again.')
          } finally {
            setIsSigningIn(false)
          }
        },
      })
    }

    if (window.google?.accounts?.oauth2) {
      initTokenClient()
    } else if (!document.getElementById('gis-script')) {
      const script = document.createElement('script')
      script.id = 'gis-script'
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = initTokenClient
      document.body.appendChild(script)
    } else {
      // Script already loading — wait for it
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval)
          initTokenClient()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [authModal, closeAuthModal, loginWithGoogle, success, toastError])

  // Open the Google account picker popup
  const handleGoogleSignIn = () => {
    if (!ENV.GOOGLE_CLIENT_ID) {
      toastError('Google Client ID not configured.')
      return
    }
    if (!tokenClientRef.current) {
      toastError('Google Sign-In is still loading. Please try again.')
      return
    }
    setIsSigningIn(true)
    // requestAccessToken always shows the account picker due to prompt:'select_account'
    tokenClientRef.current.requestAccessToken()
  }

  const handleGuestSignIn = async () => {
    setIsSigningIn(true)
    try {
      await loginWithGoogle({
        sub: 'guest_' + Date.now(),
        name: 'Film Enthusiast',
        picture: null,
        email: '',
      })
      success('Signed in as Guest. Your collection is saved locally!')
      closeAuthModal()
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <Modal isOpen={authModal} onClose={closeAuthModal} size="sm">
      <div className="flex flex-col items-center text-center p-2">

        {/* Brand icon */}
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl mb-4">
          🎬
        </div>

        <h2 className="text-xl font-bold text-text-primary mb-1">
          Sign In to MovieBase
        </h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Connect your Google account to personalize your profile and share your movie collection.
          {profile && (
            <span className="block mt-1 text-brand">
              Currently signed in as <strong>{profile.username}</strong>. Sign in again to switch accounts.
            </span>
          )}
        </p>

        {/* Single Google Sign-In button (custom, triggers account picker popup) */}
        {ENV.GOOGLE_CLIENT_ID ? (
          <Button
            variant="outline"
            size="md"
            fullWidth
            isLoading={isSigningIn}
            onClick={handleGoogleSignIn}
            className="flex items-center justify-center gap-3 border-surface-border hover:bg-surface-hover mb-4"
          >
            {!isSigningIn && (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{profile ? 'Switch Google Account' : 'Sign in with Google'}</span>
          </Button>
        ) : (
          <div className="w-full p-3 rounded-xl bg-surface border border-surface-border text-xs text-text-muted mb-4 text-left">
            Google Sign-In is not configured. Add <code className="text-text-primary font-mono">VITE_GOOGLE_CLIENT_ID</code> in Vercel environment settings.
          </div>
        )}

        {/* Divider */}
        <div className="relative w-full my-3 flex items-center justify-center">
          <div className="border-t border-surface-border w-full" />
          <span className="bg-surface-elevated px-3 text-[11px] text-text-muted absolute">OR</span>
        </div>

        {/* Guest mode */}
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleGuestSignIn}
          isLoading={isSigningIn}
          className="text-text-secondary hover:text-text-primary text-xs"
        >
          👤 Continue as Guest (Offline Mode)
        </Button>

        <p className="text-[11px] text-text-muted mt-5">
          Your collections are private and stored locally on this device.
        </p>
      </div>
    </Modal>
  )
}

export default AuthModal
