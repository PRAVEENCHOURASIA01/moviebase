import { useState, useEffect, useRef } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ENV } from '@/config/env'

// ─────────────────────────────────────────
// AuthModal — Google Sign-in & Profile Identity
// Supports:
// 1. Google OAuth 2.0 Token Client (Popup flow)
// 2. Google Official Render Button (GIS One-Tap & standard button)
// 3. Guest / Offline Profile
// ─────────────────────────────────────────
export const AuthModal = () => {
  const { authModal, closeAuthModal, loginWithGoogle } = useAuth()
  const { success, error: toastError } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)
  const tokenClientRef = useRef(null)

  // Initialize Google Identity Services (GIS)
  useEffect(() => {
    if (!authModal || !ENV.GOOGLE_CLIENT_ID) return

    const loadScript = () => {
      if (!window.google) {
        const script = document.createElement('script')
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = () => initGIS()
        document.body.appendChild(script)
      } else {
        initGIS()
      }
    }

    const initGIS = () => {
      try {
        // 1. Initialize Credential (JWT) flow & Render Button
        window.google.accounts.id.initialize({
          client_id: ENV.GOOGLE_CLIENT_ID,
          callback: async (response) => {
            setIsSigningIn(true)
            try {
              const base64Url = response.credential.split('.')[1]
              const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              )
              const googleUser = JSON.parse(jsonPayload)
              await loginWithGoogle(googleUser)
              success(`Welcome, ${googleUser.name || 'Movie Explorer'}!`)
              closeAuthModal()
            } catch (err) {
              toastError('Google sign in failed')
            } finally {
              setIsSigningIn(false)
            }
          },
        })

        const btnContainer = document.getElementById('google-signin-btn')
        if (btnContainer) {
          window.google.accounts.id.renderButton(btnContainer, {
            theme: 'filled_black',
            size: 'large',
            width: '100%',
            shape: 'pill',
          })
        }

        // 2. Initialize OAuth 2.0 Token Client (for custom button click popup)
        if (window.google.accounts.oauth2) {
          tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
            client_id: ENV.GOOGLE_CLIENT_ID,
            scope: 'email profile openid',
            callback: async (tokenResponse) => {
              if (tokenResponse.error) {
                toastError(`Google sign in cancelled: ${tokenResponse.error}`)
                setIsSigningIn(false)
                return
              }
              try {
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
              } catch (err) {
                toastError('Failed to fetch Google profile')
              } finally {
                setIsSigningIn(false)
              }
            },
          })
        }
      } catch (err) {
        console.warn('[AuthModal] GIS error:', err)
      }
    }

    loadScript()
  }, [authModal, closeAuthModal, loginWithGoogle, success, toastError])

  // Trigger Google OAuth 2.0 Popup
  const handleGoogleSignInClick = () => {
    if (!ENV.GOOGLE_CLIENT_ID) {
      toastError('Google Client ID not configured in Vercel environment variables.')
      return
    }

    setIsSigningIn(true)
    if (tokenClientRef.current) {
      tokenClientRef.current.requestAccessToken({ prompt: 'select_account' })
    } else if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt()
    } else {
      setIsSigningIn(false)
      toastError('Google Sign-in service loading, please try again.')
    }
  }

  // Guest / Demo profile sign-in
  const handleGuestSignIn = async () => {
    setIsSigningIn(true)
    try {
      const demoUser = {
        sub: 'local_curator_1',
        name: 'Film Enthusiast',
        picture: null,
      }
      await loginWithGoogle(demoUser)
      success('Signed in as Guest with local storage!')
      closeAuthModal()
    } finally {
      setIsSigningIn(false)
    }
  }

  return (
    <Modal
      isOpen={authModal}
      onClose={closeAuthModal}
      size="sm"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl mb-4">
          🎬
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Sign In to MovieBase
        </h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Connect your Google account to personalize your profile avatar, display name, and published snapshot settings.
        </p>

        {/* Real Google Sign-in Button */}
        {ENV.GOOGLE_CLIENT_ID ? (
          <div className="w-full space-y-3 mb-4">
            <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]" />

            <Button
              variant="outline"
              size="md"
              fullWidth
              isLoading={isSigningIn}
              onClick={handleGoogleSignInClick}
              className="flex items-center justify-center gap-2 border-surface-border hover:bg-surface-hover"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Sign in with Google</span>
            </Button>
          </div>
        ) : (
          <div className="w-full p-3 rounded-xl bg-surface border border-surface-border text-xs text-text-muted mb-4">
            ⚠️ To enable Google Sign-In, add <code className="text-text-primary">VITE_GOOGLE_CLIENT_ID</code> in Vercel project environment settings.
          </div>
        )}

        <div className="relative w-full my-3 flex items-center justify-center">
          <div className="border-t border-surface-border w-full" />
          <span className="bg-surface-elevated px-2 text-[11px] text-text-muted absolute">OR</span>
        </div>

        {/* Guest Profile Button */}
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleGuestSignIn}
          className="text-text-secondary hover:text-text-primary text-xs"
        >
          👤 Continue as Guest (Offline Mode)
        </Button>

        <p className="text-[11px] text-text-muted mt-5">
          Your collections remain private and local to your device by default.
        </p>
      </div>
    </Modal>
  )
}

export default AuthModal