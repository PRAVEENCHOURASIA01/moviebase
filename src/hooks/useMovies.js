import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/hooks/useToast'
import {
  dbGetMovies,
  dbSaveMovie,
  dbRemoveMovie,
  dbGetMovie,
} from '@/services/storage/indexedDB'
import { getMovies as getLegacyMovies } from '@/services/storage/localStorage'
import { RATINGS, computeInteractionScore } from '@/lib/enums'

// ─────────────────────────────────────────
// useMovies
// Local-First movie hook powered by IndexedDB.
// High speed, non-blocking, works offline 100% of the time.
// Eliminates remote database pause bottlenecks.
// ─────────────────────────────────────────
export const useMovies = () => {
  const { success, error: toastError } = useToast()

  const [movies, setMovies] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // ─────────────────────────────────────────
  // Initial load + automatic legacy migration
  // ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true

    const init = async () => {
      try {
        let loaded = await dbGetMovies()

        // If IndexedDB is empty, check and import legacy localStorage
        if (loaded.length === 0) {
          const legacy = getLegacyMovies()
          if (legacy && legacy.length > 0) {
            for (const item of legacy) {
              await dbSaveMovie(item)
            }
            loaded = await dbGetMovies()
          }
        }

        if (isMounted) {
          setMovies(loaded)
        }
      } catch (err) {
        if (isMounted) setError(err.message ?? 'Failed to load movies')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()
    return () => { isMounted = false }
  }, [])

  // ─────────────────────────────────────────
  // Add or Move Movie
  // ─────────────────────────────────────────
  const addMovie = useCallback(async (tmdbMovie, category) => {
    const rawId = tmdbMovie.movieId || tmdbMovie.id || tmdbMovie.movie_id
    const movieId = Number(rawId)
    const title = tmdbMovie.title ?? tmdbMovie.name ?? 'Movie'
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1)

    try {
      const existing = await dbGetMovie(movieId)
      const now = new Date().toISOString()

      const record = {
        movieId,
        title,
        posterPath: tmdbMovie.posterPath ?? tmdbMovie.poster_path ?? null,
        releaseYear: tmdbMovie.releaseYear ?? (tmdbMovie.release_date || tmdbMovie.first_air_date)?.slice(0, 4) ?? '—',
        mediaType: tmdbMovie.mediaType ?? tmdbMovie.media_type ?? 'movie',
        category,
        ratingLabel: existing?.ratingLabel ?? null,
        ratingValue: existing?.ratingValue ?? null,
        interactionScore: computeInteractionScore(category, existing?.ratingValue ?? null),
        addedAt: existing?.addedAt ?? now,
        updatedAt: now,
      }

      await dbSaveMovie(record)

      setMovies((prev) => {
        const idx = prev.findIndex((m) => m.movieId === movieId)
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = record
          return next
        }
        return [...prev, record]
      })

      success(`Added "${title}" to ${categoryName}`)
    } catch (err) {
      const msg = err.message ?? 'Failed to save movie'
      setError(msg)
      toastError(msg)
    }
  }, [success, toastError])

  // ─────────────────────────────────────────
  // Remove Movie
  // ─────────────────────────────────────────
  const removeMovie = useCallback(async (movieId) => {
    const numericId = Number(movieId)
    try {
      await dbRemoveMovie(numericId)
      setMovies((prev) => prev.filter((m) => m.movieId !== numericId))
      success('Removed from collection')
    } catch (err) {
      const msg = err.message ?? 'Failed to remove movie'
      setError(msg)
      toastError(msg)
    }
  }, [success, toastError])

  // ─────────────────────────────────────────
  // Update Rating
  // ─────────────────────────────────────────
  const updateRating = useCallback(async (movieId, ratingKey) => {
    const rating = RATINGS[ratingKey]
    if (!rating) return

    const numericId = Number(movieId)
    try {
      const existing = await dbGetMovie(numericId)
      if (!existing) return

      const updated = {
        ...existing,
        ratingLabel: rating.label,
        ratingValue: rating.value,
        interactionScore: computeInteractionScore(existing.category, rating.value),
        updatedAt: new Date().toISOString(),
      }

      await dbSaveMovie(updated)
      setMovies((prev) => prev.map((m) => (m.movieId === numericId ? updated : m)))
      success(`Rated as ${rating.label}`)
    } catch (err) {
      const msg = err.message ?? 'Failed to update rating'
      setError(msg)
      toastError(msg)
    }
  }, [success, toastError])

  // ─────────────────────────────────────────
  // Derived Helpers
  // ─────────────────────────────────────────
  const getMovieRecord = useCallback(
    (movieId) => {
      const numericId = Number(movieId)
      return movies.find((m) => m.movieId === numericId)
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