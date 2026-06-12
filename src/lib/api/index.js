// ================================================
// API Index — Dual Write + Fallback Read
// Semua WRITE → dua provider sekaligus (Supabase + GAS)
// Semua READ → Supabase dulu, fallback GAS
// ================================================

import * as gas from './gas.js'
import * as supabase from './supabase.js'

// ================================================
// HELPERS
// ================================================

// READ: Supabase dulu, fallback GAS
async function readWith(apiName, method, ...args) {
  try {
    return await supabase[apiName][method](...args)
  } catch (e) {
    console.warn(`[${apiName}.${method}] supabase gagal, fallback GAS:`, e.message)
    return await gas[apiName][method](...args)
  }
}

// WRITE: tulis ke dua-duanya, return Supabase kalau sukses
async function writeWith(apiName, method, ...args) {
  const [sb, g] = await Promise.allSettled([
    supabase[apiName][method](...args),
    gas[apiName][method](...args),
  ])
  if (sb.status === 'fulfilled') return sb.value
  if (g.status === 'fulfilled') return g.value
  throw sb.reason
}

// ================================================
// AUTH
// ================================================
export const authApi = {
  loginWithGoogle: (...args) => writeWith('authApi', 'loginWithGoogle', ...args),
  getMe:           (...args) => readWith('authApi', 'getMe', ...args),
  logout:          (...args) => writeWith('authApi', 'logout', ...args),
}

// ================================================
// TOKO
// ================================================
export const tokoApi = {
  create:         (...args) => writeWith('tokoApi', 'create', ...args),
  update:         (...args) => writeWith('tokoApi', 'update', ...args),
  delete:         (...args) => writeWith('tokoApi', 'delete', ...args),
  getMine:        (...args) => readWith('tokoApi', 'getMine', ...args),
  getBySlug:      (...args) => readWith('tokoApi', 'getBySlug', ...args),
  checkSlug:      (...args) => readWith('tokoApi', 'checkSlug', ...args),
  requestUpgrade: (...args) => writeWith('tokoApi', 'requestUpgrade', ...args),
  confirmUpgrade: (...args) => writeWith('tokoApi', 'confirmUpgrade', ...args),
}

// ================================================
// PRODUK
// ================================================
export const produkApi = {
  create:   (...args) => writeWith('produkApi', 'create', ...args),
  update:   (...args) => writeWith('produkApi', 'update', ...args),
  delete:   (...args) => writeWith('produkApi', 'delete', ...args),
  getMine:  (...args) => readWith('produkApi', 'getMine', ...args),
  getByToko:(...args) => readWith('produkApi', 'getByToko', ...args),
  getById:  (...args) => readWith('produkApi', 'getById', ...args),
}

// ================================================
// PESANAN
// ================================================
export const pesananApi = {
  create:       (...args) => writeWith('pesananApi', 'create', ...args),
  getMine:      (...args) => readWith('pesananApi', 'getMine', ...args),
  updateStatus: (...args) => writeWith('pesananApi', 'updateStatus', ...args),
  getById:      (...args) => readWith('pesananApi', 'getById', ...args),
}

// ================================================
// ANALYTICS
// ================================================
export const analyticsApi = {
  getDashboard: (...args) => readWith('analyticsApi', 'getDashboard', ...args),
}

// ================================================
// TOKO INFO
// ================================================
export const tokoInfoApi = {
  get:    (...args) => readWith('tokoInfoApi', 'get', ...args),
  update: (...args) => writeWith('tokoInfoApi', 'update', ...args),
}

// ================================================
// RATING
// ================================================
export const ratingApi = {
  add: (...args) => writeWith('ratingApi', 'add', ...args),
  get: (...args) => readWith('ratingApi', 'get', ...args),
}
