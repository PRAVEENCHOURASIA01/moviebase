import { useState, useEffect, useCallback, useContext } from 'react'
import { AuthContext } from '@/context/AuthContext'
import { useToast } from '@/hooks/useToast'

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
  const { success, error: toastError } = useToast()

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
    const title = tmdbMovie.title ?? tmdbMovie.name ?? 'Movie'
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1)
    try {
      if (isAuthenticated) {
        const saved = await saveMovie(user.id, {
          movieId: tmdbMovie.id ?? tmdbMovie.movieId ?? tmdbMovie.movie_id,
          title,
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
        success(`Added "${title}" to ${categoryName}`)
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
        success(`Added "${title}" to ${categoryName}`)
      }
    } catch (err) {
      const errMsg = err.message ?? 'Failed to add movie'
      setError(errMsg)
      toastError(errMsg)
    }
  }, [isAuthenticated, user, success, toastError])

  // ─────────────────────────────────────────
  // Remove Movie
  // ─────────────────────────────────────────
  const removeMovie = useCallback(async (movieId) => {
    try {
      const numericId = Number(movieId)
      if (isAuthenticated) {
        const doc = movies.find((m) => (m.movie_id === numericId || m.movieId === numericId || m.movie_id === movieId || m.movieId === movieId))
        if (doc?.id) await deleteMovie(doc.id)
      } else {
        localRemove(numericId)
      }
      setMovies((prev) => prev.filter((m) => {
        const mId = m.movie_id ?? m.movieId
        return mId !== numericId && mId !== movieId
      }))
      success('Removed from collection')
    } catch (err) {
      const errMsg = err.message ?? 'Failed to remove movie'
      setError(errMsg)
      toastError(errMsg)
    }
  }, [isAuthenticated, movies, success, toastError])

  // ─────────────────────────────────────────
  // Update Rating
  // ─────────────────────────────────────────
  const updateRating = useCallback(async (movieId, ratingKey) => {
    const rating = RATINGS[ratingKey]
    if (!rating) return

    try {
      const numericId = Number(movieId)
      if (isAuthenticated) {
        const doc = movies.find((m) => (m.movie_id === numericId || m.movieId === numericId || m.movie_id === movieId || m.movieId === movieId))
        if (!doc?.id) return
        const updated = await updateMovie(doc.id, doc.category, rating)
        setMovies((prev) =>
          prev.map((m) => ((m.movie_id === numericId || m.movie_id === movieId) ? { ...m, ...updated } : m))
        )
        success(`Rated as ${rating.label}`)
      } else {
        const updated = localUpdateRating(numericId, rating)
        if (updated) {
          setMovies((prev) =>
            prev.map((m) => ((m.movieId === numericId || m.movieId === movieId) ? updated : m))
          )
          success(`Rated as ${rating.label}`)
        }
      }
    } catch (err) {
      const errMsg = err.message ?? 'Failed to update rating'
      setError(errMsg)
      toastError(errMsg)
    }
  }, [isAuthenticated, movies, success, toastError])

  // ─────────────────────────────────────────
  // Derived helpers
  // Supabase uses snake_case (movie_id), local uses camelCase (movieId)
  // ─────────────────────────────────────────
  const getMovieRecord = useCallback(
    (movieId) => {
      const numericId = Number(movieId)
      return movies.find((m) => {
        const mId = m.movie_id ?? m.movieId
        return mId === numericId || mId === movieId
      })
    },
    [movies]
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