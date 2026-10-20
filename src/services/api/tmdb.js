import { tmdbFetch } from '@/config/tmdb'
import { formatYear } from '@/utils/format'

// ── In-Memory Cache (P2 Performance) ──────
const cache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

const getCached = (key) => {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return null
  }
  return entry.data
}

const setCached = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() })
}

// ─────────────────────────────────────────
// Response Mapper
// Normalizes TMDB results into a consistent
// shape used throughout the app.
// ─────────────────────────────────────────
const mapMovie = (item) => ({
  id: item.id,
  movieId: item.id,
  title: item.title ?? item.name ?? 'Untitled',
  overview: item.overview ?? '',
  posterPath: item.poster_path ?? null,
  backdropPath: item.backdrop_path ?? null,
  releaseYear: formatYear(item.release_date ?? item.first_air_date),
  mediaType: item.media_type ?? (item.first_air_date ? 'tv' : 'movie'),
  rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
})

// ─────────────────────────────────────────
// Get Trending Movies (with In-Memory Caching)
// ─────────────────────────────────────────
export const getTrending = async () => {
  const cacheKey = 'trending:movie:week'
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const data = await tmdbFetch('/trending/movie/week')
    const mapped = (data.results ?? []).map(mapMovie)
    setCached(cacheKey, mapped)
    return mapped
  } catch (err) {
    throw {
      ...err,
      message: err.message ?? 'Failed to fetch trending movies',
    }
  }
}

// ─────────────────────────────────────────
// Search Movies + TV (with In-Memory Caching)
// Uses TMDB /search/multi for combined results
// ─────────────────────────────────────────

/**
 * @param {string} query
 * @param {number} page - default 1
 * @returns {Promise<{ results: Array, totalPages: number, totalResults: number }>}
 */
export const searchMovies = async (query, page = 1) => {
  // ── Empty query guard — no API call made ──
  if (!query || query.trim().length === 0) {
    return { results: [], totalPages: 0, totalResults: 0 }
  }

  const cleanQuery = query.trim().toLowerCase()
  const cacheKey = `search:${cleanQuery}:${page}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const data = await tmdbFetch('/search/multi', {
      query: query.trim(),
      page,
      include_adult: false,
    })

    // Filter to movie + tv only — exclude people
    const filtered = (data.results ?? []).filter(
      (item) => item.media_type === 'movie' || item.media_type === 'tv'
    )

    const result = {
      results: filtered.map(mapMovie),
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
    }

    setCached(cacheKey, result)
    return result
  } catch (err) {
    throw {
      ...err,
      message: err.message ?? 'Failed to search movies',
    }
  }
}

// ─────────────────────────────────────────
// Get Detailed Movie / TV Info
// ─────────────────────────────────────────
export const getMovieDetails = async (movieId, mediaType = 'movie') => {
  const type = mediaType === 'tv' ? 'tv' : 'movie'
  const cacheKey = `details:${type}:${movieId}`
  const cached = getCached(cacheKey)
  if (cached) return cached

  try {
    const data = await tmdbFetch(`/${type}/${movieId}`, {
      append_to_response: 'credits,videos',
    })

    const trailer = data.videos?.results?.find(
      (v) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    )

    const details = {
      id: data.id,
      movieId: data.id,
      title: data.title ?? data.name ?? 'Untitled',
      tagline: data.tagline ?? '',
      overview: data.overview ?? '',
      posterPath: data.poster_path ?? null,
      backdropPath: data.backdrop_path ?? null,
      releaseYear: formatYear(data.release_date ?? data.first_air_date),
      runtime: data.runtime ? `${data.runtime} min` : (data.episode_run_time?.[0] ? `${data.episode_run_time[0]} min` : null),
      genres: (data.genres ?? []).map((g) => g.name),
      rating: data.vote_average ? Number(data.vote_average.toFixed(1)) : null,
      voteCount: data.vote_count ?? 0,
      trailerKey: trailer?.key ?? null,
      trailerName: trailer?.name ?? null,
      cast: (data.credits?.cast ?? []).slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        character: c.character,
        profilePath: c.profile_path,
      })),
      director: data.credits?.crew?.find((c) => c.job === 'Director')?.name ?? null,
    }

    setCached(cacheKey, details)
    return details
  } catch (err) {
    console.warn(`[TMDB] Failed to load details for ${movieId}:`, err)
    return null
  }
}