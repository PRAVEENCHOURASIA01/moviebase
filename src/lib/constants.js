// ─────────────────────────────────────────
// TMDB Image CDN
// ─────────────────────────────────────────
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'
export const TMDB_POSTER_SIZE = 'w500'
export const TMDB_BACKDROP_SIZE = 'w1280'

// ─────────────────────────────────────────
// Search
// ─────────────────────────────────────────
export const SEARCH_DEBOUNCE_MS = 300

// ─────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────
export const LOCAL_STORAGE_KEY = 'moviebase_local'
export const SESSION_ID_KEY = 'moviebase_session'

// ─────────────────────────────────────────
// Request Timeout
// ─────────────────────────────────────────
export const FETCH_TIMEOUT_MS = 8000

// ─────────────────────────────────────────
// Reserved Usernames
// These cannot be registered by any user
// ─────────────────────────────────────────
export const RESERVED_USERNAMES = [
  'admin',
  'login',
  'signup',
  'api',
  'profile',
]