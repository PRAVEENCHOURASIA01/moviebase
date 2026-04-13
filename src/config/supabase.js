import { createClient } from '@supabase/supabase-js'
import { ENV } from '@/config/env'

// ─────────────────────────────────────────
// Supabase Client
// Single instance — imported by service layer only.
// Never use this directly in components or hooks.
// ─────────────────────────────────────────
const supabase = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_ANON_KEY,
  {
    auth: {
      // Persist session in localStorage automatically
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
)

export default supabase