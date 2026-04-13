import { useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'

// Local storage service
import {
  getMovies,
  addMovie as localAdd,
  removeMovie as localRemove,
  updateRating as localUpdateRating,
} from '@/services/storage/localStorage'

// Supabase service
import {
  saveMovie,
  getUserMovies,
  updateMovie,
  deleteMovie,
} from '@/services/backend/supabase'

import { RATINGS } from '@/lib/enums'

// ─────────────────────────────────────────
// useMovies
//
// Unified movie interaction hook.
// Routes to localStorage (anonymous) or
// Supabase (authenticated) automatically.
//
// Usage:
//   const { movies, addMovie, removeMovie, updateRating } = useMovies()
// ─────────────────────────────────────────
export const useMovies = () => {
  const { user, profile } = useContext(AuthContext)

  const isAuthenticated = Boolean(user && profile)

  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // ─────────────────────────────────────────
  // Load movies on mount + auth change
  // ─────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (isAuthenticated) {
          const data = await getUserMovies(user.id)
          setMovies(data)
        } else {
          setMovies(getMovies())
        }
      } catch (err) {
        setError(err.message ?? 'Failed to load movies')
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [isAuthenticated, user])

  // ─────────────────────────────────────────
  // Add Movie
  // ─────────────────────────────────────────
  const addMovie = useCallback(async (tmdbMovie, category) => {
    try {
      if (isAuthenticated) {
        const saved = await saveMovie(user.id, {
          movieId: tmdbMovie.id ?? tmdbMovie.movieId,
          title: tmdbMovie.title ?? tmdbMovie.name,
          posterPath: tmdbMovie.posterPath ?? tmdbMovie.poster_path ?? null,
          releaseYear: tmdbMovie.releaseYear ?? null,
          mediaType: tmdbMovie.mediaType ?? tmdbMovie.media_type ?? 'movie',
          category,
        })
        setMovies((prev) => {
          const idx = prev.findIndex((m) => m.movie_id === saved.movie_id)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = saved
            return updated
          }
          return [...prev, saved]
        })
      } else {
        const saved = localAdd(tmdbMovie, category)
        setMovies((prev) => {
          const idx = prev.findIndex((m) => m.movieId === saved.movieId)
          if (idx !== -1) {
            const updated = [...prev]
            updated[idx] = saved
            return updated
          }
          return [...prev, saved]
        })
      }
    } catch (err) {
      setError(err.message ?? 'Failed to add movie')
    }
  }, [isAuthenticated, user])

  // ─────────────────────────────────────────
  // Remove Movie
  // ─────────────────────────────────────────
  const removeMovie = useCallback(async (movieId) => {
    try {
      if (isAuthenticated) {
        const doc = movies.find((m) => m.movie_id === movieId)
        if (doc?.id) await deleteMovie(doc.id)
      } else {
        localRemove(movieId)
      }
      setMovies((prev) => prev.filter((m) =>
        isAuthenticated ? m.movie_id !== movieId : m.movieId !== movieId
      ))
    } catch (err) {
      setError(err.message ?? 'Failed to remove movie')
    }
  }, [isAuthenticated, movies])

  // ─────────────────────────────────────────
  // Update Rating
  // ─────────────────────────────────────────
  const updateRating = useCallback(async (movieId, ratingKey) => {
    const rating = RATINGS[ratingKey]
    if (!rating) return

    try {
      if (isAuthenticated) {
        const doc = movies.find((m) => m.movie_id === movieId)
        if (!doc?.id) return
        const updated = await updateMovie(doc.id, doc.category, rating)
        setMovies((prev) =>
          prev.map((m) => (m.movie_id === movieId ? { ...m, ...updated } : m))
        )
      } else {
        const updated = localUpdateRating(movieId, rating)
        if (updated) {
          setMovies((prev) =>
            prev.map((m) => (m.movieId === movieId ? updated : m))
          )
        }
      }
    } catch (err) {
      setError(err.message ?? 'Failed to update rating')
    }
  }, [isAuthenticated, movies])

  // ─────────────────────────────────────────
  // Derived helpers
  // Supabase uses snake_case (movie_id), local uses camelCase (movieId)
  // ─────────────────────────────────────────
  const getMovieRecord = useCallback(
    (movieId) => movies.find((m) =>
      isAuthenticated ? m.movie_id === movieId : m.movieId === movieId
    ),
    [movies, isAuthenticated]
  )

  const isInList = useCallback(
    (movieId) => Boolean(getMovieRecord(movieId)),
    [getMovieRecord]
  )

  return {
    movies,
    isLoading,
    error,
    addMovie,
    removeMovie,
    updateRating,
    getMovieRecord,
    isInList,
  }
}