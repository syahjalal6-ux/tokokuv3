import { create } from 'zustand'
import { authApi } from '../lib/api/index.js'

// =============================================
// AUTH STORE
// =============================================
const TOKEN_SB_KEY = 'tokoku_token_sb'
const TOKEN_GAS_KEY = 'tokoku_token_gas'
const USER_KEY = 'tokoku_user'

export const useAuthStore = create((set, get) => ({
  user: null,
  tokenSupabase: null,
  tokenGas: null,
  isLoading: true,
  isAuthenticated: false,

  // Init: restore session dari localStorage
  init: async () => {
    const tokenSupabase = localStorage.getItem(TOKEN_SB_KEY)
    const tokenGas = localStorage.getItem(TOKEN_GAS_KEY)
    const userStr = localStorage.getItem(USER_KEY)

    if ((!tokenSupabase && !tokenGas) || !userStr) {
      set({ isLoading: false })
      return
    }

    try {
      const user = JSON.parse(userStr)
      // Verify token masih valid (cek salah satu provider)
      const res = await authApi.getMe({ tokenSupabase, tokenGas })
      set({
        user: res.data,
        tokenSupabase,
        tokenGas,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // Token expired/invalid
      localStorage.removeItem(TOKEN_SB_KEY)
      localStorage.removeItem(TOKEN_GAS_KEY)
      localStorage.removeItem(USER_KEY)
      set({ isLoading: false })
    }
  },

  // Login dengan Google credential
  loginWithGoogle: async (googleUser) => {
    const res = await authApi.loginWithGoogle(googleUser)
    const { user, tokenSupabase, tokenGas } = res.data

    if (tokenSupabase) localStorage.setItem(TOKEN_SB_KEY, tokenSupabase)
    if (tokenGas) localStorage.setItem(TOKEN_GAS_KEY, tokenGas)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    set({ user, tokenSupabase, tokenGas, isAuthenticated: true })
    return user
  },

  // Update user data (setelah upgrade dll)
  updateUser: (updates) => {
    const user = { ...get().user, ...updates }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },

  // Logout
  logout: async () => {
    const { tokenSupabase, tokenGas } = get()
    try {
      await authApi.logout({ tokenSupabase, tokenGas })
    } catch {
      // Silent fail
    }
    localStorage.removeItem(TOKEN_SB_KEY)
    localStorage.removeItem(TOKEN_GAS_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, tokenSupabase: null, tokenGas: null, isAuthenticated: false })
  },
}))

// =============================================
// TOKO STORE
// =============================================
export const useTokoStore = create((set, get) => ({
  toko: null,
  isLoading: false,
  error: null,
  setToko: (toko) => set({ toko }),
  load: async (tokenObj) => {
    set({ isLoading: true, error: null })
    try {
      const res = await import('../lib/api/index.js').then(m => m.tokoApi.getMine(tokenObj))
      set({ toko: res.data, isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },
  clear: () => set({ toko: null }),
}))

// =============================================
// PRODUK STORE
// =============================================
export const useProdukStore = create((set, get) => ({
  produk: [],
  isLoading: false,
  error: null,
  load: async (tokenObj) => {
    set({ isLoading: true, error: null })
    try {
      const res = await import('../lib/api/index.js').then(m => m.produkApi.getMine(tokenObj))
      set({ produk: res.data || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },
  add: (item) => set(s => ({ produk: [item, ...s.produk] })),
  update: (id, updates) => set(s => ({
    produk: s.produk.map(p => p.id === id ? { ...p, ...updates } : p)
  })),
  remove: (id) => set(s => ({
    produk: s.produk.filter(p => p.id !== id)
  })),
  clear: () => set({ produk: [] }),
}))
