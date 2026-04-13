// ─────────────────────────────────────────
// Global Environment Config
// Single source of truth for all env vars.
// Validates at startup — fails loudly in dev
// if any required variable is missing.
// ─────────────────────────────────────────

const require = (key) => {
  const value = import.meta.env[key]
  if (!value) {
    throw new Error(
      `[ENV] Missing required environment variable: ${key}\n` +
      `Check your .env file and ensure it matches .env.example`
    )
  }
  return value
}

export const ENV = {
  // ── Runtime ───────────────────────────
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,

  // ── TMDB ──────────────────────────────
  TMDB_API_KEY: require('VITE_TMDB_API_KEY'),

  // ── Supabase ──────────────────────────
  SUPABASE_URL: require('VITE_SUPABASE_URL'),
  SUPABASE_ANON_KEY: require('VITE_SUPABASE_ANON_KEY'),
}