// ─────────────────────────────────────────
// Centralized Route Definitions
// Never hardcode paths in components
// ─────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  SHARE: '/share/:token',              // Private-by-default unlisted share URL
  PUBLIC_PROFILE: '/user/:username',   // Legacy compatibility
}

/**
 * Build a private-by-default share URL
 * @param {string} token
 * @returns {string}
 */
export const toShareLink = (token) => `/share/${token}`

/**
 * Build a public profile URL for a given username (legacy compatibility)
 * @param {string} username
 * @returns {string}
 */
export const toPublicProfile = (username) => `/user/${username}`