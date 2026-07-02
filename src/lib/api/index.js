// ================================================
// src/lib/api/index.js — VERSI BARU
// Sebelumnya file ini import dari './supabase.js' (yang berisi supabaseAdmin).
// Sekarang import dari './adminClient.js' (yang cuma fetch ke server, AMAN).
//
// chatApi dan showcaseChatApi (Groq) belum termasuk di sini —
// itu langkah berikutnya, terpisah dari Supabase admin.
// ================================================
export {
  authApi,
  tokoApi,
  produkApi,
  pesananApi,
  analyticsApi,
  tokoInfoApi,
  ratingApi,
  adminApi,
  streamApi,
  trafficApi,
  bundleApi,
  flashSaleApi,
  voucherApi,
} from './adminClient.js'

// liveApi (LiveKit) masih sementara di supabase.js — akan dipindah di tahap berikutnya
export { liveApi } from './adminClient.js'
