import { tmdbFetch } from '@/config/tmdb'
import { formatYear } from '@/utils/format'

// ─────────────────────────────────────────
// Response Mapper
// Normalizes TMDB results into a consistent
// shape used throughout the app.
// ─────────────────────────────────────────
const mapMovie = (item) => ({
  id: item.id,
  title: item.title ?? item.name ?? 'Untitled',
  overview: item.overview ?? '',
  posterPath: item.poster_path ?? null,
  backdropPath: item.backdrop_path ?? null,
  releaseYear: formatYear(item.release_date ?? item.first_air_date),
  mediaType: item.media_type ?? 'movie',
  rating: item.vote_average ? Number(item.vote_average.toFixed(1)) : null,
})

// ─────────────────────────────────────────
// Get Trending Movies
// ─────────────────────────────────────────
export const getTrending = async () => {
  try {
    const data = await tmdbFetch('/trending/movie/week')
    return (data.results ?? []).map(mapMovie)
  } catch (err) {
    throw {
      ...err,
      message: err.message ?? 'Failed to fetch trending movies',
    }
  }
}

// ─────────────────────────────────────────
// Search Movies + TV
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

    return {
      results: filtered.map(mapMovie),
      totalPages: data.total_pages ?? 1,
      totalResults: data.total_results ?? 0,
    }
  } catch (err) {
    throw {
      ...err,
      message: err.message ?? 'Failed to search movies',
    }
  }
}