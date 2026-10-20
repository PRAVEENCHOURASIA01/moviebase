import { createClient } from '@supabase/supabase-js'
import { ENV } from '@/config/env'

// ─────────────────────────────────────────
// Supabase Client (Optional / Decoupled)
// When Supabase keys are not provided, provide a graceful
// mock proxy to prevent boot crashes.
// ─────────────────────────────────────────
const isConfigured = Boolean(ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY)

let supabase = null

if (isConfigured) {
  try {
    supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  } catch (err) {
    console.warn('[Supabase] Failed to initialize client:', err)
  }
}

if (!supabase) {
  const dummyQuery = () => ({
    select: dummyQuery,
    insert: dummyQuery,
    upsert: dummyQuery,
    update: dummyQuery,
    delete: dummyQuery,
    eq: dummyQuery,
    order: dummyQuery,
    limit: dummyQuery,
    single: () => Promise.resolve({ data: null, error: { message: 'Supabase unconfigured' } }),
    then: (resolve) => resolve({ data: [], error: null }),
  })

  supabase = {
    auth: {
      signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    from: () => dummyQuery(),
  }
}

export default supabase