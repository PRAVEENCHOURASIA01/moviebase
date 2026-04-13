// ─────────────────────────────────────────
// Centralized Route Definitions
// Never hardcode paths in components
// ─────────────────────────────────────────
export const ROUTES = {
  HOME: '/',
  PROFILE: '/profile',
  PUBLIC_PROFILE: '/user/:username',   // username — never userId
}

/**
 * Build a public profile URL for a given username
 * @param {string} username
 * @returns {string}
 */
export const toPublicProfile = (username) => `/user/${username}`