import { LOCAL_STORAGE_KEY, SESSION_ID_KEY } from '@/lib/constants'
import { computeInteractionScore } from '@/lib/enums'
import { formatMoviePayload } from '@/utils/format'

// ─────────────────────────────────────────
// Storage Version
// Increment when store shape changes.
// Used for safe future migrations.
// ─────────────────────────────────────────
const STORAGE_VERSION = 1

// ─────────────────────────────────────────
// Internal Helpers
// ─────────────────────────────────────────
const generateUUID = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })

/**
 * Read full store with version awareness.
 * Returns safe default on missing or corrupt data.
 * Handles legacy data (pre-versioning) gracefully.
 */
const readStore = () => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return { version: STORAGE_VERSION, data: { user: null, movies: [] } }

    const parsed = JSON.parse(raw)

    // ── Legacy format (pre-versioning) ────
    // Old store had user + movies at root level
    if (!parsed.version) {
      return {
        version: STORAGE_VERSION,
        data: {
          user: parsed.user ?? null,
          movies: parsed.movies ?? [],
        },
      }
    }

    return parsed
  } catch {
    return { version: STORAGE_VERSION, data: { user: null, movies: [] } }
  }
}

/**
 * Write full versioned store to localStorage.
 */
const writeStore = (data) => {
  localStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify({ version: STORAGE_VERSION, data })
  )
}

// ─────────────────────────────────────────
// Session ID
// UUID generated once per device on first visit.
// Persists across page reloads.
// Attached to all analytics events.
// ─────────────────────────────────────────
export const getSessionId = () => {
  let id = localStorage.getItem(SESSION_ID_KEY)
  if (!id) {
    id = generateUUID()
    localStorage.setItem(SESSION_ID_KEY, id)
  }
  return id
}

// ─────────────────────────────────────────
// User
// ─────────────────────────────────────────

/**
 * Get local anonymous user.
 * Creates one on first call.
 * @returns {{ localId: string, createdAt: string }}
 */
export const getUser = () => {
  const { data } = readStore()

  if (!data.user) {
    const user = {
      localId: generateUUID(),
      createdAt: new Date().toISOString(),
    }
    writeStore({ ...data, user })
    return user
  }

  return data.user
}

/**
 * Merge updates into the local user object.
 * @param {object} updates
 */
export const saveUser = (updates) => {
  const { data } = readStore()
  writeStore({ ...data, user: { ...data.user, ...updates } })
}

// ─────────────────────────────────────────
// Movies
// ─────────────────────────────────────────

/**
 * Get all locally stored movies.
 * @returns {Array}
 */
export const getMovies = () => {
  return readStore().data.movies ?? []
}

/**
 * Add or update a movie in local storage.
 * If movieId already exists → update (migration safety rule).
 * Prevents duplicates on safe re-runs.
 *
 * @param {object} tmdbMovie  - raw TMDB result
 * @param {string} category   - from CATEGORIES enum
 * @returns {object} saved record
 */
export const addMovie = (tmdbMovie, category) => {
  const { data } = readStore()
  const movies = data.movies ?? []
  const payload = formatMoviePayload(tmdbMovie)
  const now = new Date().toISOString()

  const existingIdx = movies.findIndex((m) => m.movieId === payload.movieId)

  if (existingIdx !== -1) {
    // ── UPDATE existing ────────────────────
    const existing = movies[existingIdx]
    const updated = {
      ...existing,
      category,
      interactionScore: computeInteractionScore(category, existing.ratingValue ?? null),
      updatedAt: now,
    }
    movies[existingIdx] = updated
    writeStore({ ...data, movies })
    return updated
  }

  // ── INSERT new ─────────────────────────
  const newRecord = {
    ...payload,
    category,
    ratingLabel: null,
    ratingValue: null,
    interactionScore: computeInteractionScore(category, null),
    addedAt: now,
    updatedAt: now,
  }

  writeStore({ ...data, movies: [...movies, newRecord] })
  return newRecord
}

/**
 * Remove a movie by TMDB movieId.
 * @param {number} movieId
 */
export const removeMovie = (movieId) => {
  const { data } = readStore()
  writeStore({
    ...data,
    movies: (data.movies ?? []).filter((m) => m.movieId !== movieId),
  })
}

/**
 * Update rating for an existing movie.
 * Recomputes interactionScore.
 *
 * @param {number} movieId
 * @param {{ label: string, value: number }} rating
 * @returns {object|null}
 */
export const updateRating = (movieId, rating) => {
  const { data } = readStore()
  const movies = data.movies ?? []
  const idx = movies.findIndex((m) => m.movieId === movieId)

  if (idx === -1) return null

  const updated = {
    ...movies[idx],
    ratingLabel: rating.label,
    ratingValue: rating.value,
    interactionScore: computeInteractionScore(movies[idx].category, rating.value),
    updatedAt: new Date().toISOString(),
  }

  movies[idx] = updated
  writeStore({ ...data, movies })
  return updated
}

/**
 * Clear only movie data after successful migration.
 */
export const clearMovies = () => {
  const { data } = readStore()
  writeStore({ ...data, movies: [] })
}

/**
 * Wipe entire local store on logout.
 */
export const clearAll = () => {
  localStorage.removeItem(LOCAL_STORAGE_KEY)
}