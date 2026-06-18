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

// =============================================
// STREAM STORE
// =============================================
import { streamApi } from '../lib/api/index.js'

export const useStreamStore = create((set, get) => ({
  // Feed
  feed: [],
  feedLoading: false,
  feedError: null,
  activeTag: null,
  searchQuery: '',

  // Post detail (nested replies)
  postDetail: null,
  postDetailLoading: false,
  postDetailError: null,

  // DM
  dmThreads: [],
  dmThreadsLoading: false,
  activeThreadId: null,
  dmMessages: [],
  dmMessagesLoading: false,

  // Notifications
  notifs: [],
  notifsLoading: false,
  unreadNotifCount: 0,

  // ───────────── FEED ─────────────
  setActiveTag: (tag) => set({ activeTag: tag }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  loadFeed: async (tokenObj, params = {}) => {
    set({ feedLoading: true, feedError: null })
    try {
      const res = await streamApi.getFeed(tokenObj, params)
      set({ feed: res.data || [], feedLoading: false })
    } catch (err) {
      set({ feedError: err.message, feedLoading: false })
    }
  },

  createPost: async (tokenObj, data) => {
    const res = await streamApi.createPost(tokenObj, data)
    set(s => ({ feed: [res.data, ...s.feed] }))
    return res.data
  },

  // ───────────── DELETE POST ─────────────
  // Hapus post milik toko sendiri (ownership-nya udah dicek di backend/streamApi.deletePost).
  // Setelah berhasil dihapus di server, update state lokal:
  //  - buang post itu dari array `feed`
  //  - kalau post yang dihapus kebetulan sedang dibuka di halaman detail
  //    (`postDetail`), reset `postDetail` jadi null biar UI gak nampilin
  //    detail post yang udah gak ada (StreamPage perlu redirect/back kalau ini terjadi)
  deletePost: async (tokenObj, postId) => {
    await streamApi.deletePost(tokenObj, postId)
    set(s => ({
      feed: s.feed.filter(p => p.id !== postId),
      postDetail: s.postDetail && s.postDetail.id === postId ? null : s.postDetail,
    }))
  },

  // ───────────── POST DETAIL ─────────────
  loadPostDetail: async (tokenObj, postId) => {
    set({ postDetailLoading: true, postDetailError: null })
    try {
      const res = await streamApi.getPostDetail(tokenObj, postId)
      set({ postDetail: res.data, postDetailLoading: false })
    } catch (err) {
      set({ postDetailError: err.message, postDetailLoading: false })
    }
  },

  clearPostDetail: () => set({ postDetail: null, postDetailError: null }),

  addReply: async (tokenObj, { postId, parentReplyId, teks }) => {
    await streamApi.addReply(tokenObj, { postId, parentReplyId, teks })
    // refetch detail biar tree replies konsisten (server source of truth)
    await get().loadPostDetail(tokenObj, postId)
  },

  // ───────────── LIKE / REPOST / BOOKMARK (optimistic) ─────────────
  toggleLike: async (tokenObj, { targetType, targetId, postId }) => {
    const prevFeed = get().feed
    const prevDetail = get().postDetail

    // optimistic update di feed (target post-level)
    if (targetType === 'post') {
      set(s => ({
        feed: s.feed.map(p => p.id === targetId
          ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) }
          : p),
      }))
    }

    // optimistic update di post detail (post atau reply)
    set(s => {
      if (!s.postDetail) return {}
      if (targetType === 'post' && s.postDetail.id === targetId) {
        return { postDetail: { ...s.postDetail, liked: !s.postDetail.liked, likesCount: s.postDetail.likesCount + (s.postDetail.liked ? -1 : 1) } }
      }
      if (targetType === 'reply') {
        const updateTree = (replies) => replies.map(r => {
          if (r.id === targetId) return { ...r, liked: !r.liked, likesCount: r.likesCount + (r.liked ? -1 : 1) }
          return { ...r, replies: updateTree(r.replies || []) }
        })
        return { postDetail: { ...s.postDetail, replies: updateTree(s.postDetail.replies || []) } }
      }
      return {}
    })

    try {
      await streamApi.toggleLike(tokenObj, { targetType, targetId })
    } catch (err) {
      // rollback
      set({ feed: prevFeed, postDetail: prevDetail })
      throw err
    }
  },

  toggleRepost: async (tokenObj, { postId }) => {
    const prevFeed = get().feed
    const prevDetail = get().postDetail

    set(s => ({
      feed: s.feed.map(p => p.id === postId
        ? { ...p, reposted: !p.reposted, repostsCount: p.repostsCount + (p.reposted ? -1 : 1) }
        : p),
      postDetail: s.postDetail && s.postDetail.id === postId
        ? { ...s.postDetail, reposted: !s.postDetail.reposted, repostsCount: s.postDetail.repostsCount + (s.postDetail.reposted ? -1 : 1) }
        : s.postDetail,
    }))

    try {
      await streamApi.toggleRepost(tokenObj, { postId })
    } catch (err) {
      set({ feed: prevFeed, postDetail: prevDetail })
      throw err
    }
  },

  toggleBookmark: async (tokenObj, { postId }) => {
    const prevFeed = get().feed
    const prevDetail = get().postDetail

    set(s => ({
      feed: s.feed.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p),
      postDetail: s.postDetail && s.postDetail.id === postId
        ? { ...s.postDetail, bookmarked: !s.postDetail.bookmarked }
        : s.postDetail,
    }))

    try {
      await streamApi.toggleBookmark(tokenObj, { postId })
    } catch (err) {
      set({ feed: prevFeed, postDetail: prevDetail })
      throw err
    }
  },

  // ───────────── DM ─────────────
  loadDmThreads: async (tokenObj) => {
    set({ dmThreadsLoading: true })
    try {
      const res = await streamApi.getDmThreads(tokenObj)
      set({ dmThreads: res.data || [], dmThreadsLoading: false })
    } catch (err) {
      set({ dmThreadsLoading: false })
    }
  },

  openDmThread: async (tokenObj, { otherTokoId }) => {
    const res = await streamApi.openDmThread(tokenObj, { otherTokoId })
    set({ activeThreadId: res.data.threadId })
    return res.data.threadId
  },

  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

  loadDmMessages: async (tokenObj, threadId) => {
    set({ dmMessagesLoading: true })
    try {
      const res = await streamApi.getDmMessages(tokenObj, threadId)
      set({ dmMessages: res.data || [], dmMessagesLoading: false })
      // thread yg dibuka otomatis kebaca, nolin unread count di list
      set(s => ({
        dmThreads: s.dmThreads.map(t => t.id === threadId ? { ...t, unread: 0 } : t),
      }))
    } catch (err) {
      set({ dmMessagesLoading: false })
    }
  },

  sendDmMessage: async (tokenObj, { threadId, teks }) => {
    const optimisticMsg = { id: `temp-${Date.now()}`, threadId, teks, createdAt: new Date().toISOString(), isMine: true }
    set(s => ({ dmMessages: [...s.dmMessages, optimisticMsg] }))

    try {
      const res = await streamApi.sendDmMessage(tokenObj, { threadId, teks })
      set(s => ({
        dmMessages: s.dmMessages.map(m => m.id === optimisticMsg.id ? res.data : m),
        dmThreads: s.dmThreads.map(t => t.id === threadId ? { ...t, lastMessage: teks, lastMessageAt: res.data.createdAt } : t),
      }))
    } catch (err) {
      set(s => ({ dmMessages: s.dmMessages.filter(m => m.id !== optimisticMsg.id) }))
      throw err
    }
  },

  clearDmThread: () => set({ activeThreadId: null, dmMessages: [] }),

  // ───────────── NOTIFICATIONS ─────────────
  loadNotifs: async (tokenObj) => {
    set({ notifsLoading: true })
    try {
      const res = await streamApi.getNotifications(tokenObj)
      const unread = (res.data || []).filter(n => !n.isRead).length
      set({ notifs: res.data || [], unreadNotifCount: unread, notifsLoading: false })
    } catch (err) {
      set({ notifsLoading: false })
    }
  },

  markNotifsRead: async (tokenObj) => {
    set(s => ({ notifs: s.notifs.map(n => ({ ...n, isRead: true })), unreadNotifCount: 0 }))
    try {
      await streamApi.markNotificationsRead(tokenObj)
    } catch (err) {
      // silent fail, gak rollback — notif read status gak critical
    }
  },

  // ───────────── RESET ─────────────
  clear: () => set({
    feed: [], feedLoading: false, feedError: null, activeTag: null, searchQuery: '',
    postDetail: null, postDetailLoading: false, postDetailError: null,
    dmThreads: [], dmThreadsLoading: false, activeThreadId: null, dmMessages: [], dmMessagesLoading: false,
    notifs: [], notifsLoading: false, unreadNotifCount: 0,
  }),
}))
