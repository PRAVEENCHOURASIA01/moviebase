// ─────────────────────────────────────────
// Shared Format Utilities
// ─────────────────────────────────────────

/**
 * Extract 4-digit year from a TMDB date string
 * @param {string|null} dateStr - e.g. "2023-07-14"
 * @returns {string} - e.g. "2023" or "—"
 */
export const formatYear = (dateStr) => {
  if (!dateStr) return '—'
  return dateStr.slice(0, 4)
}

/**
 * Normalize username: lowercase + trim
 * Applied before every save/lookup
 * @param {string} username
 * @returns {string}
 */
export const normalizeUsername = (username) => {
  return username.trim().toLowerCase()
}

/**
 * Format a TMDB movie result into a flat, DB-ready shape.
 * Used by both localStorage and Supabase service.
 * @param {object} movie - raw TMDB result
 * @returns {object}
 */
export const formatMoviePayload = (movie) => ({
  movieId: movie.id,
  title: movie.title ?? movie.name ?? 'Untitled',
  posterPath: movie.poster_path ?? null,
  releaseYear: formatYear(movie.release_date ?? movie.first_air_date),
  mediaType: movie.media_type ?? 'movie',
})