import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { RESERVED_USERNAMES } from '@/lib/constants'
import { normalizeUsername } from '@/utils/format'

// ─────────────────────────────────────────
// AuthModal — Sign in / Create account
// ─────────────────────────────────────────
export const AuthModal = () => {
  const { authModal, closeAuthModal, login, signup, error, isLoading } = useAuth()
  const { success } = useToast()

  const [tab, setTab] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [localErr, setLocalErr] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearForm = () => {
    setEmail('')
    setPassword('')
    setUsername('')
    setLocalErr('')
    setSuccessMsg('')
    setIsSubmitting(false)
  }

  const switchTab = (t) => {
    setTab(t)
    setLocalErr('')
    setSuccessMsg('')
    setIsSubmitting(false)
  }

  const validate = () => {
    if (!email.trim()) return 'Email is required'
    if (password.length < 8) return 'Password must be at least 8 characters'
    if (tab === 'signup') {
      const norm = normalizeUsername(username)
      if (!norm) return 'Username is required'
      if (norm.length < 3) return 'Username must be at least 3 characters'
      if (!/^[a-z0-9_]+$/.test(norm)) return 'Only letters, numbers and underscores allowed'
      if (RESERVED_USERNAMES.includes(norm)) return 'That username is reserved'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalErr('')
    setSuccessMsg('')

    const validationError = validate()
    if (validationError) { setLocalErr(validationError); return }

    setIsSubmitting(true)
    try {
      if (tab === 'login') {
        const res = await login(email, password)
        if (res?.success) {
          success('Welcome back!')
          clearForm()
        }
      } else {
        const result = await signup(email, password, username)
        if (result?.success) {
          success('Account created successfully!')
          clearForm()
        } else if (result?.needsConfirmation) {
          setSuccessMsg(result.error)
          clearForm()
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayError = localErr || error

  return (
    <Modal
      isOpen={authModal}
      onClose={() => { closeAuthModal(); clearForm() }}
      size="sm"
    >
      {/* Tab switcher */}
      <div className="flex gap-1 p-1 bg-surface rounded-xl mb-6">
        {[
          { key: 'login', label: 'Sign in' },
          { key: 'signup', label: 'Create account' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={[
              'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200',
              tab === key
                ? 'bg-brand text-white shadow-sm'
                : 'text-text-secondary hover:text-text-primary',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Success message (email confirmation) */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-rating-great/10 border border-rating-great/30 text-rating-great text-sm text-center">
          ✅ {successMsg}
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
        method="post"
        action="#"
        noValidate
      >

        {tab === 'signup' && (
          <Field
            label="Username"
            type="text"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="yourname"
            autoComplete="username"
            hint="Letters, numbers, underscores — min 3 chars"
          />
        )}

        <Field
          label="Email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="username email"
        />

        <Field
          label="Password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
        />

        {/* Error */}
        {displayError && (
          <p className="text-xs text-rating-worst bg-rating-worst/10 border border-rating-worst/20 rounded-lg px-3 py-2">
            {displayError}
          </p>
        )}

        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          isLoading={isSubmitting}
        >
          {tab === 'login' ? 'Sign in' : 'Create account'}
        </Button>

        {/* Helper hint */}
        {tab === 'login' && (
          <p className="text-xs text-text-muted text-center">
            Your local watchlist will be synced after sign in.
          </p>
        )}
        {tab === 'signup' && (
          <p className="text-xs text-text-muted text-center">
            Track what you watch, rate movies, and share your profile.
          </p>
        )}
      </form>
    </Modal>
  )
}

const Field = ({ label, hint, ...inputProps }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-medium text-text-secondary uppercase tracking-wide">
      {label}
    </label>
    <input
      className={[
        'w-full h-10 px-3.5',
        'bg-surface border border-surface-border rounded-xl',
        'text-sm text-text-primary placeholder-text-muted',
        'transition-all duration-200',
        'focus:outline-none focus:border-brand/60 focus:shadow-[0_0_0_3px_rgba(229,9,20,0.1)]',
      ].join(' ')}
      {...inputProps}
    />
    {hint && <p className="text-[11px] text-text-muted">{hint}</p>}
  </div>
)

export default AuthModal