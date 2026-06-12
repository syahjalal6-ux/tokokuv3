// ================================================
// API Index — Abstraction Layer
// Ganti VITE_API_PROVIDER=supabase di .env untuk migrasi
// ================================================

import * as gas from './gas.js'
// import * as supabase from './supabase.js' // uncomment saat migrasi

const provider = import.meta.env.VITE_API_PROVIDER || 'gas'

const api = provider === 'supabase'
  ? null // ganti: supabase
  : gas

export const authApi = api.authApi
export const tokoApi = api.tokoApi
export const produkApi = api.produkApi
export const pesananApi = api.pesananApi
export const analyticsApi = api.analyticsApi
export const tokoInfoApi = api.tokoInfoApi
export const ratingApi = api.ratingApi
