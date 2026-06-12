import { create } from 'zustand'
import { authApi } from '../lib/api.js'

// =============================================
// AUTH STORE
// =============================================

const TOKEN_KEY = 'tokoku_token'
const USER_KEY = 'tokoku_user'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  // Init: restore session dari localStorage
  init: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)

    if (!token || !userStr) {
      set({ isLoading: false })
      return
    }

    try {
      const user = JSON.parse(userStr)
      // Verify token masih valid
      const res = await authApi.getMe(token)
      set({
        user: res.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      // Token expired/invalid
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      set({ isLoading: false })
    }
  },

  // Login dengan Google credential
  loginWithGoogle: async (googleUser) => {
    const res = await authApi.loginWithGoogle(googleUser)
    const { user, token } = res.data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    set({ user, token, isAuthenticated: true })
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
    const { token } = get()
    try {
      await authApi.logout(token)
    } catch {
      // Silent fail
    }
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null, isAuthenticated: false })
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

  load: async (token) => {
    set({ isLoading: true, error: null })
    try {
      const res = await import('../lib/api/index.js').then(m => m.tokoApi.getMine(token))
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

  load: async (token) => {
    set({ isLoading: true, error: null })
    try {
      const res = await import('../lib/api.js').then(m => m.produkApi.getMine(token))
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
