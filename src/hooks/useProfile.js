import { useState, useEffect } from 'react'
import { getUserByUsername, getUserMovies } from '@/services/backend/supabase'
import { CATEGORIES } from '@/lib/enums'

// ─────────────────────────────────────────
// useProfile
//
// Fetches a public user profile + their movies
// by username. Used on /user/:username pages
// and /profile (own profile).
//
// Supabase returns snake_case columns:
//   user_id, movie_id, rating_label, etc.
//
// Usage:
//   const { profile, collections, stats, isLoading, error } = useProfile(username)
// ─────────────────────────────────────────
export const useProfile = (username) => {
  const [profile, setProfile] = useState(null)
  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!username) return

    const load = async () => {
      setIsLoading(true)
      setError(null)
      setProfile(null)
      setMovies([])

      try {
        // 1. Resolve username → profile row
        const userProfile = await getUserByUsername(username)

        if (!userProfile) {
          setError('User not found')
          return
        }

        // 2. Fetch their movies using user_id (internal)
        const userMovies = await getUserMovies(userProfile.user_id)

        setProfile(userProfile)
        setMovies(userMovies)
      } catch (err) {
        setError(err.message ?? 'Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [username])

  // ─────────────────────────────────────────
  // Split movies into collections
  // Supabase returns category as snake_case value
  // matching our CATEGORIES enum values exactly
  // ─────────────────────────────────────────
  const collections = {
    [CATEGORIES.WATCHED]: movies.filter((m) => m.category === CATEGORIES.WATCHED),
    [CATEGORIES.WATCHLIST]: movies.filter((m) => m.category === CATEGORIES.WATCHLIST),
    [CATEGORIES.FAVORITES]: movies.filter((m) => m.category === CATEGORIES.FAVORITES),
  }

  const stats = {
    totalWatched: collections[CATEGORIES.WATCHED].length,
    totalWatchlist: collections[CATEGORIES.WATCHLIST].length,
    totalFavorites: collections[CATEGORIES.FAVORITES].length,
    totalRated: movies.filter((m) => m.rating_label !== null).length,
  }

  return {
    profile,
    movies,
    collections,
    stats,
    isLoading,
    error,
    notFound: !isLoading && !profile && Boolean(error),
  }
}