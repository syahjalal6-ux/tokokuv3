// ================================================
// API Index — Abstraction Layer with Fallback
// VITE_API_PROVIDER=supabase,gas  → Supabase dulu, fallback ke GAS
// VITE_API_PROVIDER=gas           → GAS only
// VITE_API_PROVIDER=supabase      → Supabase only
// ================================================

import * as gas from './gas.js'
import * as supabase from './supabase.js'

const providers = (import.meta.env.VITE_API_PROVIDER || 'gas')
  .split(',')
  .map(p => p.trim())

function getApi(providerName) {
  return providerName === 'supabase' ? supabase : gas
}

function makeApi(apiName, methods) {
  const obj = {}
  for (const method of methods) {
    obj[method] = async (...args) => {
      let lastError
      for (const p of providers) {
        try {
          return await getApi(p)[apiName][method](...args)
        } catch (e) {
          lastError = e
          if (providers.length > 1) {
            console.warn(`[${apiName}.${method}] ${p} gagal:`, e.message)
          }
        }
      }
      throw lastError
    }
  }
  return obj
}

export const authApi     = makeApi('authApi',     ['loginWithGoogle', 'getMe', 'logout'])
export const tokoApi     = makeApi('tokoApi',     ['create', 'update', 'delete', 'getMine', 'getBySlug', 'checkSlug', 'requestUpgrade', 'confirmUpgrade'])
export const produkApi   = makeApi('produkApi',   ['create', 'update', 'delete', 'getMine', 'getByToko', 'getById'])
export const pesananApi  = makeApi('pesananApi',  ['create', 'getMine', 'updateStatus', 'getById'])
export const analyticsApi = makeApi('analyticsApi', ['getDashboard'])
export const tokoInfoApi = makeApi('tokoInfoApi', ['get', 'update'])
export const ratingApi   = makeApi('ratingApi',   ['add', 'get'])
