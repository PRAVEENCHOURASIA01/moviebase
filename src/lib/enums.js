// ─────────────────────────────────────────
// Categories
// ─────────────────────────────────────────
export const CATEGORIES = {
  WATCHED: 'watched',
  WATCHLIST: 'watchlist',
  FAVORITES: 'favorites',
}

// ─────────────────────────────────────────
// Ratings
// label → stored in DB as ratingLabel
// value → stored in DB as ratingValue
// ─────────────────────────────────────────
export const RATINGS = {
  GREAT: { label: 'great', value: 4 },
  GOOD: { label: 'good', value: 3 },
  BAD: { label: 'bad', value: 2 },
  WORST: { label: 'worst', value: 1 },
}

// Lookup by label — used in display logic
export const RATING_BY_LABEL = Object.values(RATINGS).reduce((acc, r) => {
  acc[r.label] = r
  return acc
}, {})

// ─────────────────────────────────────────
// Interaction Score
// Used to compute interactionScore on write
// ─────────────────────────────────────────
export const INTERACTION_SCORES = {
  CATEGORY: {
    [CATEGORIES.WATCHLIST]: 1,
    [CATEGORIES.WATCHED]: 2,
    [CATEGORIES.FAVORITES]: 3,
  },
  RATING: {
    4: 4,
    3: 3,
    2: 2,
    1: 1,
  },
}

/**
 * Compute interaction score from category + optional ratingValue
 * @param {string} category
 * @param {number|null} ratingValue
 * @returns {number}
 */
export const computeInteractionScore = (category, ratingValue = null) => {
  const base = INTERACTION_SCORES.CATEGORY[category] ?? 0
  const bonus = ratingValue ? (INTERACTION_SCORES.RATING[ratingValue] ?? 0) : 0
  return base + bonus
}

// ─────────────────────────────────────────
// Media Types
// ─────────────────────────────────────────
export const MEDIA_TYPES = {
  MOVIE: 'movie',
  TV: 'tv',
}

// ─────────────────────────────────────────
// Analytics Events
// ─────────────────────────────────────────
export const ANALYTICS_EVENTS = {
  SEARCH: 'search',
  VIEW_MOVIE: 'view_movie',
  ADD_TO_LIST: 'add_to_list',
  RATE_MOVIE: 'rate_movie',
  SHARE_PROFILE: 'share_profile',
}