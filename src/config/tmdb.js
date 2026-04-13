import { ENV } from '@/config/env'
import { FETCH_TIMEOUT_MS } from '@/lib/constants'

// ─────────────────────────────────────────
// TMDB Base — hardcoded, not from .env
// ─────────────────────────────────────────
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const IMAGE_BASE = 'https://image.tmdb.org/t/p'

// ─────────────────────────────────────────
// Image Size Presets
// ─────────────────────────────────────────
export const IMAGE_SIZES = {
  POSTER: {
    SM: `${IMAGE_BASE}/w185`,
    MD: `${IMAGE_BASE}/w342`,
    LG: `${IMAGE_BASE}/w500`,
    ORIG: `${IMAGE_BASE}/original`,
  },
  BACKDROP: {
    SM: `${IMAGE_BASE}/w300`,
    MD: `${IMAGE_BASE}/w780`,
    LG: `${IMAGE_BASE}/w1280`,
    ORIG: `${IMAGE_BASE}/original`,
  },
}

/**
 * Build a full TMDB image URL.
 * Returns null if path is missing — let components handle fallback.
 *
 * @param {string|null} path
 * @param {string} size — from IMAGE_SIZES
 * @returns {string|null}
 */
export const buildImageUrl = (path, size = IMAGE_SIZES.POSTER.LG) => {
  if (!path) return null
  return `${size}${path}`
}

// ─────────────────────────────────────────
// Core Fetch Wrapper
// All TMDB service calls go through this.
// Handles: timeout, auth, error shape.
// ─────────────────────────────────────────

/**
 * @param {string} endpoint  - e.g. '/trending/movie/week'
 * @param {object} params    - additional query params
 * @returns {Promise<object>}
 */
export const tmdbFetch = async (endpoint, params = {}) => {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`)

  // API key always injected here — never in service files
  url.searchParams.set('api_key', ENV.TMDB_API_KEY)
  url.searchParams.set('language', 'en-US')

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value))
  })

  // ── Timeout via AbortController ────────
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!response.ok) {
      throw {
        message: `Failed to fetch from TMDB`,
        status: response.status,
        endpoint,
      }
    }

    return await response.json()

  } catch (err) {
    clearTimeout(timeout)

    // Distinguish timeout from other errors
    if (err.name === 'AbortError') {
      throw {
        message: 'TMDB request timed out',
        status: 408,
        endpoint,
      }
    }

    // Re-throw structured errors as-is
    if (err.status) throw err

    // Unknown fetch error
    throw {
      message: 'Network error while contacting TMDB',
      status: 0,
      endpoint,
    }
  }
}

export default tmdbFetch