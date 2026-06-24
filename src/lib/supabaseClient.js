// src/lib/supabaseClient.js
// Supabase client khusus browser — pakai ANON key, AMAN di frontend.
// Dipakai HANYA untuk Realtime subscription (WebSocket).
// Untuk operasi data (CRUD), tetap pakai adminClient.js lewat /api/admin.

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
