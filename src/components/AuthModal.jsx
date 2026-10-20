import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { ENV } from '@/config/env'

// AuthModal — Google Sign-in & Profile Identity
// ONE official GIS-rendered button only. No duplicates.
export const AuthModal = () => {
  const { authModal, closeAuthModal, loginWithGoogle } = useAuth()
  const { success, error: toastError } = useToast()
  const [isSigningIn, setIsSigningIn] = useState(false)

  useEffect(() => {
    if (!authModal || !ENV.GOOGLE_CLIENT_ID) return

    const initGIS = () => {
      try {
        window.google.accounts.id.initialize({
          client_id: ENV.GOOGLE_CLIENT_ID,
          callback: async (response) => {
            setIsSigningIn(true)
            try {
              const [, payloadB64] = response.credential.split('.')
              const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/')
              const json = decodeURIComponent(
                atob(padded)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              )
              const googleUser = JSON.parse(json)
              await loginWithGoogle(googleUser)
              success(`Welcome, ${googleUser.name || 'Movie Explorer'}!`)
              closeAuthModal()
            } catch {
              toastError('Google sign in failed. Please try again.')
            } finally {
              setIsSigningIn(false)
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        })

        const container = document.getElementById('google-signin-btn')
        if (container) {
          container.innerHTML = ''
          window.google.accounts.id.renderButton(container, {
            theme: 'filled_black',
            size: 'large',
            shape: 'pill',
            text: 'signin_with',
            logo_alignment: 'left',
            width: 280,
          })
        }
      } catch (err) {
        console.warn('[AuthModal] GIS init error:', err)
      }
    }

    if (window.google?.accounts?.id) {
      initGIS()
    } else {
      if (!document.getElementById('gis-script')) {
        const script = document.createElement('script')
        script.id = 'gis-script'
        script.src = 'https://accounts.google.com/gsi/client'
        script.async = true
        script.defer = true
        script.onload = initGIS
        document.body.appendChild(script)
      }
    }
  }, [authModal, closeAuthModal, loginWithGoogle, success, toastError])

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
        <div className="w-14 h-14 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl mb-4">
          🎬
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-1">
          Sign In to MovieBase
        </h2>
        <p className="text-xs text-text-secondary max-w-xs mb-6">
          Connect your Google account to personalize your profile and share your movie collection.
        </p>

        {ENV.GOOGLE_CLIENT_ID ? (
          <div className="w-full flex flex-col items-center gap-2 mb-4">
            <div id="google-signin-btn" className="w-full flex justify-center min-h-[44px]" />
            {isSigningIn && (
              <p className="text-xs text-text-muted animate-pulse">Signing in...</p>
            )}
          </div>
        ) : (
          <div className="w-full p-3 rounded-xl bg-surface border border-surface-border text-xs text-text-muted mb-4 text-left">
            Google Sign-In is not configured. Add VITE_GOOGLE_CLIENT_ID in Vercel environment settings.
          </div>
        )}

        <div className="relative w-full my-3 flex items-center justify-center">
          <div className="border-t border-surface-border w-full" />
          <span className="bg-surface-elevated px-3 text-[11px] text-text-muted absolute">OR</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleGuestSignIn}
          isLoading={isSigningIn}
          className="text-text-secondary hover:text-text-primary text-xs"
        >
          Continue as Guest (Offline Mode)
        </Button>

        <p className="text-[11px] text-text-muted mt-5">
          Your collections are private and stored locally on this device.
        </p>
      </div>
    </Modal>
  )
}

export default AuthModal
