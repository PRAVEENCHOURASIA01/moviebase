import { Link } from 'react-router-dom'
import { ROUTES } from '@/lib/routes'

// ─────────────────────────────────────────
// 404 Not Found — catch-all route
// ─────────────────────────────────────────
const NotFound = () => (
  <main className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-center px-4 animate-fade-in">
      <span className="text-7xl">🎬</span>
      <h1
        className="text-6xl font-bold text-text-primary"
        style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.05em' }}
      >
        404
      </h1>
      <p className="text-text-secondary text-sm max-w-xs">
        This page doesn't exist. Maybe it was never released.
      </p>
      <Link
        to={ROUTES.HOME}
        className="mt-2 px-5 py-2.5 rounded-xl bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors"
      >
        Back to home
      </Link>
    </div>
  </main>
)

export default NotFound