import { useState, useEffect, useRef } from 'react'
import { searchMovies } from '@/services/api/tmdb'
import { SEARCH_DEBOUNCE_MS } from '@/lib/constants'

// ─────────────────────────────────────────
// useSearch
//
// Debounced TMDB search hook.
// Respects empty query guard — no API call
// is made for empty or whitespace input.
//
// Usage:
//   const { results, isLoading, error, query, setQuery } = useSearch()
// ─────────────────────────────────────────
export const useSearch = () => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Track latest request to avoid stale results
  const requestIdRef = useRef(0)

  useEffect(() => {
    // ── Empty query guard ──────────────────
    if (!query || query.trim().length === 0) {
      setResults([])
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    // ── Debounce ───────────────────────────
    const currentId = ++requestIdRef.current

    const timer = setTimeout(async () => {
      try {
        const data = await searchMovies(query)

        // Discard stale responses
        if (currentId !== requestIdRef.current) return

        setResults(data.results)
      } catch (err) {
        if (currentId !== requestIdRef.current) return
        setError(err.message ?? 'Search failed')
        setResults([])
      } finally {
        if (currentId === requestIdRef.current) {
          setIsLoading(false)
        }
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query])

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setError(null)
  }

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    clearSearch,
    hasResults: results.length > 0,
    isSearching: query.trim().length > 0,
  }
}