// ================================================
// src/lib/api/adminClient.js
// Pengganti panggilan langsung ke supabaseAdmin di browser.
// File ini AMAN ada di src/ karena TIDAK menyimpan secret apa pun —
// dia cuma fetch ke endpoint /api/admin milik kita sendiri,
// dan secret (SUPABASE_SERVICE_ROLE_KEY) tetap di server.
// ================================================

async function call(action, token, ...args) {
  const res = await fetch('/api/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, token: token ?? null, args }),
  })

  const data = await res.json()
  if (!res.ok || data.success === false) {
    throw new Error(data.message || 'Terjadi kesalahan')
  }
  return data
}

// ================================================
// AUTH
// ================================================
export const authApi = {
  loginWithGoogle: (googleUser) => call('authApi.loginWithGoogle', null, googleUser),
  getMe: (token) => call('authApi.getMe', token),
  logout: (token) => call('authApi.logout', token),
}

// ================================================
// TOKO
// ================================================
export const tokoApi = {
  create: (token, data) => call('tokoApi.create', token, data),
  update: (token, tokoId, data) => call('tokoApi.update', token, tokoId, data),
  delete: (token, tokoId) => call('tokoApi.delete', token, tokoId),
  getMine: (token) => call('tokoApi.getMine', token),
  getBySlug: (slug) => call('tokoApi.getBySlug', null, slug),
  checkSlug: (slug) => call('tokoApi.checkSlug', null, slug),
  requestUpgrade: (token) => call('tokoApi.requestUpgrade', token),
  confirmUpgrade: (token, userId) => call('tokoApi.confirmUpgrade', token, userId),
}

// ================================================
// PRODUK
// ================================================
export const produkApi = {
  create: (token, data) => call('produkApi.create', token, data),
  update: (token, produkId, data) => call('produkApi.update', token, produkId, data),
  delete: (token, produkId) => call('produkApi.delete', token, produkId),
  getMine: (token) => call('produkApi.getMine', token),
  getByToko: (tokoId, params) => call('produkApi.getByToko', null, tokoId, params?? {}),
  getById: (produkId) => call('produkApi.getById', null, produkId),
}

// ================================================
// PESANAN
// ================================================
export const pesananApi = {
  create: (data) => call('pesananApi.create', null, data),
  getMine: (token, status) => call('pesananApi.getMine', token, status),
  updateStatus: (token, pesananId, status, kurir, resi) => call('pesananApi.updateStatus', token, pesananId, status, kurir, resi),
  getById: (pesananId, buyerWa) => call('pesananApi.getById', null, pesananId, buyerWa),
  getSlugByResi: (resi) => call('pesananApi.getSlugByResi', null, resi),
}

// ================================================
// ANALYTICS
// ================================================
export const analyticsApi = {
  getDashboard: (token) => call('analyticsApi.getDashboard', token),
}

// ================================================
// TOKO INFO
// ================================================
export const tokoInfoApi = {
  get: (token) => call('tokoInfoApi.get', token),
  update: (token, data) => call('tokoInfoApi.update', token, data),
}

// ================================================
// RATING
// ================================================
export const ratingApi = {
  add: (data) => call('ratingApi.add', null, data),
  get: (params) => call('ratingApi.get', null, params),
}

// ================================================
// ADMIN
// ================================================
export const adminApi = {
  getUsers: (token) => call('adminApi.getUsers', token),
  getStats: (token) => call('adminApi.getStats', token),
  grantPro: (token, targetUserId, months) => call('adminApi.grantPro', token, targetUserId, months),
  revokePro: (token, targetUserId) => call('adminApi.revokePro', token, targetUserId),
  deleteUser: (token, targetUserId) => call('adminApi.deleteUser', token, targetUserId),
}

// ================================================
// STREAM
// ================================================
export const streamApi = {
  getFeed: (token, params) => call('streamApi.getFeed', token, params),
  getPostDetail: (token, postId) => call('streamApi.getPostDetail', token, postId),
  createPost: (token, data) => call('streamApi.createPost', token, data),
  deletePost: (token, postId) => call('streamApi.deletePost', token, postId),
  addReply: (token, data) => call('streamApi.addReply', token, data),
  toggleLike: (token, data) => call('streamApi.toggleLike', token, data),
  toggleRepost: (token, data) => call('streamApi.toggleRepost', token, data),
  toggleBookmark: (token, data) => call('streamApi.toggleBookmark', token, data),
  getDmThreads: (token) => call('streamApi.getDmThreads', token),
  getDmMessages: (token, threadId) => call('streamApi.getDmMessages', token, threadId),
  openDmThread: (token, data) => call('streamApi.openDmThread', token, data),
  sendDmMessage: (token, data) => call('streamApi.sendDmMessage', token, data),
  getNotifications: (token) => call('streamApi.getNotifications', token),
  markNotificationsRead: (token) => call('streamApi.markNotificationsRead', token),
  uploadImage: (token, data) => call('streamApi.uploadImage', token, data),
  getPublicShowcase: (params) => call('streamApi.getPublicShowcase', null, params),
}

// ================================================
// LIVE
// ================================================
export const liveApi = {
  goLive: (token, data) => call('liveApi.goLive', token, data),
  joinLive: (token, data) => call('liveApi.joinLive', token, data),
  endLive: (token, data) => call('liveApi.endLive', token, data),
  getActiveSessions: (token) => call('liveApi.getActiveSessions', token),
  sendReaction: (token, data) => call('liveApi.sendReaction', token, data),
  leaveRoom: (token, data) => call('liveApi.leaveRoom', token, data),
}
