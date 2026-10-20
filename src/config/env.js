// ─────────────────────────────────────────
// Global Environment Config
// Single source of truth for all env vars.
// Provides safe fallbacks and warnings instead of crashing on load.
// ─────────────────────────────────────────

const getEnv = (key, fallback = '') => {
  const value = import.meta.env[key]
  if (!value && import.meta.env.DEV) {
    console.warn(`[ENV] Warning: Missing environment variable ${key}. Using fallback.`)
  }
  return value || fallback
}

export const ENV = {
  // ── Runtime ───────────────────────────
  IS_PROD: import.meta.env.PROD,
  IS_DEV: import.meta.env.DEV,

  // ── TMDB ──────────────────────────────
  TMDB_API_KEY: getEnv('VITE_TMDB_API_KEY', ''),

  // ── Supabase (Optional / Legacy) ──────
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL', ''),
  SUPABASE_ANON_KEY: getEnv('VITE_SUPABASE_ANON_KEY', ''),

  // ── Google OAuth Client ID ────────────
  GOOGLE_CLIENT_ID: getEnv('VITE_GOOGLE_CLIENT_ID', ''),

  // ── Upstash Redis (Snapshot Cloud Store) ──
  UPSTASH_REDIS_REST_URL: getEnv('VITE_UPSTASH_REDIS_REST_URL', ''),
  UPSTASH_REDIS_REST_TOKEN: getEnv('VITE_UPSTASH_REDIS_REST_TOKEN', ''),
}