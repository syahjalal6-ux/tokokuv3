import { create } from 'zustand'
import { authApi, tokoApi, produkApi, streamApi } from '../lib/api/adminClient.js'

const TOKEN_KEY = 'tokoku_token'
const USER_KEY = 'tokoku_user'

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  init: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    const userStr = localStorage.getItem(USER_KEY)
    if (!token || !userStr) { set({ isLoading: false }); return }
    try {
      const res = await authApi.getMe(token)
      set({ user: res.data, token, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      set({ isLoading: false })
    }
  },

  loginWithGoogle: async (googleUser) => {
    const res = await authApi.loginWithGoogle(googleUser)
    const { user, token } = res.data
    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
    return user
  },

  updateUser: (updates) => {
    const user = { ...get().user, ...updates }
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    set({ user })
  },

  logout: async () => {
    const { token } = get()
    try { await authApi.logout(token) } catch {}
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    set({ user: null, token: null, isAuthenticated: false })
  },
}))

export const useTokoStore = create((set) => ({
  toko: null, isLoading: false, error: null,
  setToko: (toko) => set({ toko }),
  load: async (token) => {
    set({ isLoading: true, error: null })
    try {
      const res = await tokoApi.getMine(token)
      set({ toko: res.data, isLoading: false })
    } catch (err) { set({ error: err.message, isLoading: false }) }
  },
  clear: () => set({ toko: null }),
}))

export const useProdukStore = create((set) => ({
  produk: [], isLoading: false, error: null,
  load: async (token) => {
    set({ isLoading: true, error: null })
    try {
      const res = await produkApi.getMine(token)
      set({ produk: res.data || [], isLoading: false })
    } catch (err) { set({ error: err.message, isLoading: false }) }
  },
  add: (item) => set(s => ({ produk: [item, ...s.produk] })),
  update: (id, updates) => set(s => ({ produk: s.produk.map(p => p.id === id ? { ...p, ...updates } : p) })),
  remove: (id) => set(s => ({ produk: s.produk.filter(p => p.id !== id) })),
  clear: () => set({ produk: [] }),
}))

export const useStreamStore = create((set, get) => ({
  feed: [], feedLoading: false, feedError: null, activeTag: null, searchQuery: '',
  showcase: [], showcaseLoading: false,
  postDetail: null, postDetailLoading: false, postDetailError: null,
  dmThreads: [], dmThreadsLoading: false, activeThreadId: null,
  dmMessages: [], dmMessagesLoading: false,
  notifs: [], notifsLoading: false, unreadNotifCount: 0,

  setActiveTag: (tag) => set({ activeTag: tag }),
  setSearchQuery: (q) => set({ searchQuery: q }),

  loadFeed: async (token, params = {}) => {
    set({ feedLoading: true, feedError: null })
    try {
      const res = await streamApi.getFeed(token, params)
      set({ feed: res.data || [], feedLoading: false })
    } catch (err) { set({ feedError: err.message, feedLoading: false }) }
  },

  createPost: async (token, data) => {
    const res = await streamApi.createPost(token, data)
    set(s => ({ feed: [res.data, ...s.feed] }))
    return res.data
  },

  loadShowcase: async (params = {}) => {
    set({ showcaseLoading: true })
    try {
      const res = await streamApi.getPublicShowcase(params)
      set({ showcase: res.data || [], showcaseLoading: false })
    } catch { set({ showcaseLoading: false }) }
  },

  deletePost: async (token, postId) => {
    await streamApi.deletePost(token, postId)
    set(s => ({ feed: s.feed.filter(p => p.id !== postId), postDetail: s.postDetail?.id === postId ? null : s.postDetail }))
  },

  loadPostDetail: async (token, postId) => {
    set({ postDetailLoading: true, postDetailError: null })
    try {
      const res = await streamApi.getPostDetail(token, postId)
      set({ postDetail: res.data, postDetailLoading: false })
    } catch (err) {
      set({ postDetailError: err.message, postDetailLoading: false })
    }
  },

  clearPostDetail: () => set({ postDetail: null, postDetailError: null }),

  addReply: async (token, { postId, parentReplyId, teks }) => {
    let res
    try {
      res = await streamApi.addReply(token, { postId, parentReplyId, teks })
    } catch (err) {
      throw err
    }

    const newReply = res?.data
    if (!newReply?.id) {
      // Fallback: backend tidak return reply lengkap
      await get().loadPostDetail(token, postId)
      return
    }

    const normalized = { replies: [], liked: false, likesCount: 0, ...newReply }

    set(s => {
      const isInDetail = s.postDetail && String(s.postDetail.id) === String(postId)

      // ── Update postDetail (kalau user lagi di detail view) ──
      let nextDetail = s.postDetail
      if (isInDetail) {
        if (!parentReplyId) {
          nextDetail = { ...s.postDetail, replies: [...(s.postDetail.replies || []), normalized] }
        } else {
          function insertNested(nodes) {
            return nodes.map(node => {
              if (String(node.id) === String(parentReplyId)) {
                return { ...node, replies: [...(node.replies || []), normalized] }
              }
              if (node.replies?.length) {
                return { ...node, replies: insertNested(node.replies) }
              }
              return node
            })
          }
          nextDetail = { ...s.postDetail, replies: insertNested(s.postDetail.replies || []) }
        }
      }

      // ── Update feed (optimistic insert ke previewReplies) ──
      const nextFeed = s.feed.map(p => {
        if (String(p.id) !== String(postId)) return p
        if (!parentReplyId) {
          return {
            ...p,
            previewReplies: [...(p.previewReplies || []), normalized],
            repliesCount: (p.repliesCount || 0) + 1,
          }
        }
        return { ...p, repliesCount: (p.repliesCount || 0) + 1 }
      })

      return { postDetail: nextDetail, feed: nextFeed }
    })

    return newReply
  },

  toggleLike: async (token, { targetType, targetId }) => {
    const prevFeed = get().feed; const prevDetail = get().postDetail
    if (targetType === 'post') set(s => ({ feed: s.feed.map(p => p.id === targetId ? { ...p, liked: !p.liked, likesCount: p.likesCount + (p.liked ? -1 : 1) } : p) }))
    set(s => {
      if (!s.postDetail) return {}
      if (targetType === 'post' && s.postDetail.id === targetId) return { postDetail: { ...s.postDetail, liked: !s.postDetail.liked, likesCount: s.postDetail.likesCount + (s.postDetail.liked ? -1 : 1) } }
      if (targetType === 'reply') {
        const updateTree = (replies) => replies.map(r => r.id === targetId ? { ...r, liked: !r.liked, likesCount: r.likesCount + (r.liked ? -1 : 1) } : { ...r, replies: updateTree(r.replies || []) })
        return { postDetail: { ...s.postDetail, replies: updateTree(s.postDetail.replies || []) } }
      }
      return {}
    })
    try { await streamApi.toggleLike(token, { targetType, targetId }) }
    catch (err) { set({ feed: prevFeed, postDetail: prevDetail }); throw err }
  },

  toggleRepost: async (token, { postId }) => {
    const prevFeed = get().feed; const prevDetail = get().postDetail
    set(s => ({ feed: s.feed.map(p => p.id === postId ? { ...p, reposted: !p.reposted, repostsCount: p.repostsCount + (p.reposted ? -1 : 1) } : p), postDetail: s.postDetail?.id === postId ? { ...s.postDetail, reposted: !s.postDetail.reposted, repostsCount: s.postDetail.repostsCount + (s.postDetail.reposted ? -1 : 1) } : s.postDetail }))
    try { await streamApi.toggleRepost(token, { postId }) }
    catch (err) { set({ feed: prevFeed, postDetail: prevDetail }); throw err }
  },

  toggleBookmark: async (token, { postId }) => {
    const prevFeed = get().feed; const prevDetail = get().postDetail
    set(s => ({ feed: s.feed.map(p => p.id === postId ? { ...p, bookmarked: !p.bookmarked } : p), postDetail: s.postDetail?.id === postId ? { ...s.postDetail, bookmarked: !s.postDetail.bookmarked } : s.postDetail }))
    try { await streamApi.toggleBookmark(token, { postId }) }
    catch (err) { set({ feed: prevFeed, postDetail: prevDetail }); throw err }
  },

  loadDmThreads: async (token) => {
    set({ dmThreadsLoading: true })
    try { const res = await streamApi.getDmThreads(token); set({ dmThreads: res.data || [], dmThreadsLoading: false }) }
    catch { set({ dmThreadsLoading: false }) }
  },

  openDmThread: async (token, { otherTokoId }) => {
    const res = await streamApi.openDmThread(token, { otherTokoId })
    set({ activeThreadId: res.data.threadId }); return res.data.threadId
  },

  setActiveThreadId: (threadId) => set({ activeThreadId: threadId }),

  loadDmMessages: async (token, threadId) => {
    set({ dmMessagesLoading: true })
    try {
      const res = await streamApi.getDmMessages(token, threadId)
      set({ dmMessages: res.data || [], dmMessagesLoading: false })
      set(s => ({ dmThreads: s.dmThreads.map(t => t.id === threadId ? { ...t, unread: 0 } : t) }))
    } catch { set({ dmMessagesLoading: false }) }
  },

  sendDmMessage: async (token, { threadId, teks }) => {
    const optimisticMsg = { id: `temp-${Date.now()}`, threadId, teks, createdAt: new Date().toISOString(), isMine: true }
    set(s => ({ dmMessages: [...s.dmMessages, optimisticMsg] }))
    try {
      const res = await streamApi.sendDmMessage(token, { threadId, teks })
      set(s => ({ dmMessages: s.dmMessages.map(m => m.id === optimisticMsg.id ? res.data : m), dmThreads: s.dmThreads.map(t => t.id === threadId ? { ...t, lastMessage: teks, lastMessageAt: res.data.createdAt } : t) }))
    } catch (err) { set(s => ({ dmMessages: s.dmMessages.filter(m => m.id !== optimisticMsg.id) })); throw err }
  },

  clearDmThread: () => set({ activeThreadId: null, dmMessages: [] }),

  loadNotifs: async (token) => {
    set({ notifsLoading: true })
    try {
      const res = await streamApi.getNotifications(token)
      set({ notifs: res.data || [], unreadNotifCount: (res.data || []).filter(n => !n.isRead).length, notifsLoading: false })
    } catch { set({ notifsLoading: false }) }
  },

  markNotifsRead: async (token) => {
    set(s => ({ notifs: s.notifs.map(n => ({ ...n, isRead: true })), unreadNotifCount: 0 }))
    try { await streamApi.markNotificationsRead(token) } catch {}
  },

  clear: () => set({ feed: [], feedLoading: false, feedError: null, activeTag: null, searchQuery: '', postDetail: null, postDetailLoading: false, postDetailError: null, dmThreads: [], dmThreadsLoading: false, activeThreadId: null, dmMessages: [], dmMessagesLoading: false, notifs: [], notifsLoading: false, unreadNotifCount: 0 }),
}))
