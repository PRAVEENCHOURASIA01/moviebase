import { getMovies, clearMovies } from '@/services/storage/localStorage'
import { saveMovie } from '@/services/backend/supabase'

// ─────────────────────────────────────────
// Local → Supabase Migration
//
// Called once after login / signup.
// saveMovie() uses Supabase upsert internally —
// (user_id + movie_id) conflict → UPDATE, never duplicate INSERT.
// Safe to re-run — fully idempotent.
// ─────────────────────────────────────────

/**
 * Migrate all locally stored movies to Supabase.
 *
 * @param {string} userId - Supabase Auth UID
 * @returns {Promise<{ migrated: number, failed: number }>}
 */
export const migrateLocalToSupabase = async (userId) => {
  const localMovies = getMovies()

  if (!localMovies.length) {
    return { migrated: 0, failed: 0 }
  }

  let migrated = 0
  let failed = 0

  for (const movie of localMovies) {
    try {
      await saveMovie(userId, {
        movieId: movie.movieId,
        title: movie.title,
        posterPath: movie.posterPath ?? null,
        releaseYear: movie.releaseYear ?? null,
        mediaType: movie.mediaType ?? 'movie',
        category: movie.category,
        ratingLabel: movie.ratingLabel ?? null,
        ratingValue: movie.ratingValue ?? null,
      })
      migrated++
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[migrate] Failed for movieId:', movie.movieId, err)
      }
      failed++
    }
  }

  // Only clear local data if at least one succeeded
  if (migrated > 0) {
    clearMovies()
  }

  if (import.meta.env.DEV) {
    console.info(`[migrate] migrated: ${migrated} | failed: ${failed}`)
  }

  return { migrated, failed }
}