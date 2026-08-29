import supabase from '@/config/supabase'
import { computeInteractionScore } from '@/lib/enums'
import { normalizeUsername } from '@/utils/format'
import { getSessionId } from '@/services/storage/localStorage'

// ─────────────────────────────────────────
// Internal Error Handler
// ─────────────────────────────────────────
const handleError = (error, context) => {
  let message = error?.message ?? `Supabase error in ${context}`
  if (message.includes('Failed to fetch') || message.includes('fetch failed')) {
    message = 'Unable to connect to Supabase. Please check your internet connection and verify your Supabase environment variables.'
  }
  throw {
    message,
    code: error?.code ?? 0,
    context,
  }
}

// ─────────────────────────────────────────
// Retry Wrapper
// ─────────────────────────────────────────
const retry = async (fn, retries = 1) => {
  try {
    return await fn()
  } catch (err) {
    if (retries > 0) return retry(fn, retries - 1)
    throw err
  }
}

// ─────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────

/**
 * Sign up with email + password + optional username metadata.
 * Returns { user, session } — session is null if email confirmation is ON.
 */
export const signup = async (email, password, username = '') => {
  const normalized = username ? normalizeUsername(username) : undefined
  const options = normalized ? { data: { username: normalized } } : undefined
  const { data, error } = await supabase.auth.signUp({ email, password, options })
  if (error) handleError(error, 'signup')
  return data   // { user, session }
}

/**
 * Login with email + password.
 */
export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) handleError(error, 'login')
  return data.session
}

/**
 * Logout current session.
 */
export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) handleError(error, 'logout')
}

/**
 * Get current authenticated user.
 * Returns null if unauthenticated — never throws.
 */
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser()
  return data?.user ?? null
}

/**
 * Subscribe to Supabase auth state changes.
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

// ─────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────

export const createUserProfile = async ({ userId, username, email, bio = null }) => {
  const { data, error } = await supabase
    .from('users')
    .insert({
      user_id: userId,
      username: normalizeUsername(username),
      email,
      bio,
      avatar_url: null,
      is_public: true,
    })
    .select()
    .single()

  if (error) handleError(error, 'createUserProfile')
  return data
}

export const upsertUserProfile = async ({ userId, username, email, bio = null }) => {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      user_id: userId,
      username: normalizeUsername(username),
      email,
      bio,
      avatar_url: null,
      is_public: true,
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) handleError(error, 'upsertUserProfile')
  return data
}

export const getUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', normalizeUsername(username))
    .eq('is_public', true)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) handleError(error, 'getUserByUsername')
  return data
}

export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error?.code === 'PGRST116') return null
  if (error) handleError(error, 'getUserById')
  return data
}

// ─────────────────────────────────────────
// USER MOVIES
// ─────────────────────────────────────────

export const saveMovie = async (userId, movieData) => {
  return retry(async () => {
    const payload = {
      user_id: userId,
      movie_id: movieData.movieId,
      title: movieData.title,
      poster_path: movieData.posterPath ?? null,
      release_year: movieData.releaseYear ?? null,
      media_type: movieData.mediaType ?? 'movie',
      category: movieData.category,
      rating_label: movieData.ratingLabel ?? null,
      rating_value: movieData.ratingValue ?? null,
      interaction_score: computeInteractionScore(
        movieData.category,
        movieData.ratingValue ?? null
      ),
    }

    const { data, error } = await supabase
      .from('user_movies')
      .upsert(payload, {
        onConflict: 'user_id,movie_id',
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) handleError(error, 'saveMovie')
    return data
  })
}

export const getUserMovies = async (userId, category = null) => {
  let query = supabase
    .from('user_movies')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(200)

  if (category) query = query.eq('category', category)

  const { data, error } = await query
  if (error) handleError(error, 'getUserMovies')
  return data ?? []
}

export const updateMovie = async (rowId, category, rating) => {
  const { data, error } = await supabase
    .from('user_movies')
    .update({
      rating_label: rating.label,
      rating_value: rating.value,
      interaction_score: computeInteractionScore(category, rating.value),
    })
    .eq('id', rowId)
    .select()
    .single()

  if (error) handleError(error, 'updateMovie')
  return data
}

export const deleteMovie = async (rowId) => {
  const { error } = await supabase
    .from('user_movies')
    .delete()
    .eq('id', rowId)

  if (error) handleError(error, 'deleteMovie')
}

// ─────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────

export const trackEvent = async (event, value, options = {}) => {
  const { movieId = null, userId = null, metadata = {} } = options
  try {
    await retry(() =>
      supabase.from('analytics').insert({
        event,
        value: String(value),
        movie_id: movieId,
        user_id: userId,
        session_id: getSessionId(),
        metadata,
      })
    )
  } catch {
    // Intentionally silent
  }
}