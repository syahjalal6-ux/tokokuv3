import * as supabase from './supabase.js'

function splitToken(tokenObj) {
  if (tokenObj && typeof tokenObj === 'object' && ('tokenSupabase' in tokenObj || 'tokenGas' in tokenObj)) {
    return [tokenObj.tokenSupabase, tokenObj.tokenGas]
  }
  return [tokenObj, tokenObj]
}

async function readWith(apiName, method, tokenObj, ...args) {
  const [tokenSb] = splitToken(tokenObj)
  return await supabase[apiName][method](tokenSb, ...args)
}

async function writeWith(apiName, method, tokenObj, ...args) {
  const [tokenSb] = splitToken(tokenObj)
  return await supabase[apiName][method](tokenSb, ...args)
}

async function readWithNoToken(apiName, method, ...args) {
  return await supabase[apiName][method](...args)
}

async function writeWithNoToken(apiName, method, ...args) {
  return await supabase[apiName][method](...args)
}

// ================================================
// AUTH
// ================================================
export const authApi = {
  loginWithGoogle: async (googleUser) => {
    const res = await supabase.authApi.loginWithGoogle(googleUser)
    return {
      success: true,
      data: {
        user: res.data.user,
        tokenSupabase: res.data.token,
        tokenGas: null,
      }
    }
  },

  getMe: async (tokenObj) => {
    const [tokenSb] = splitToken(tokenObj)
    return await supabase.authApi.getMe(tokenSb)
  },

  logout: (tokenObj) => writeWith('authApi', 'logout', tokenObj),
}

// ================================================
// TOKO
// ================================================
export const tokoApi = {
  create:         (tokenObj, ...args) => writeWith('tokoApi', 'create', tokenObj, ...args),
  update:         (tokenObj, ...args) => writeWith('tokoApi', 'update', tokenObj, ...args),
  delete:         (tokenObj, ...args) => writeWith('tokoApi', 'delete', tokenObj, ...args),
  getMine:        (tokenObj) => readWith('tokoApi', 'getMine', tokenObj),
  getBySlug:      (...args) => readWithNoToken('tokoApi', 'getBySlug', ...args),
  checkSlug:      (...args) => readWithNoToken('tokoApi', 'checkSlug', ...args),
  requestUpgrade: (tokenObj) => writeWith('tokoApi', 'requestUpgrade', tokenObj),
  confirmUpgrade: (tokenObj, ...args) => writeWith('tokoApi', 'confirmUpgrade', tokenObj, ...args),
}

// ================================================
// PRODUK
// ================================================
export const produkApi = {
  create:    (tokenObj, ...args) => writeWith('produkApi', 'create', tokenObj, ...args),
  update:    (tokenObj, ...args) => writeWith('produkApi', 'update', tokenObj, ...args),
  delete:    (tokenObj, ...args) => writeWith('produkApi', 'delete', tokenObj, ...args),
  getMine:   (tokenObj) => readWith('produkApi', 'getMine', tokenObj),
  getByToko: (...args) => readWithNoToken('produkApi', 'getByToko', ...args),
  getById:   (...args) => readWithNoToken('produkApi', 'getById', ...args),
}

// ================================================
// PESANAN
// ================================================
export const pesananApi = {
  create:        (...args) => writeWithNoToken('pesananApi', 'create', ...args),
  getMine:       (tokenObj, ...args) => readWith('pesananApi', 'getMine', tokenObj, ...args),
  updateStatus:  (tokenObj, ...args) => writeWith('pesananApi', 'updateStatus', tokenObj, ...args),
  getById:       (...args) => readWithNoToken('pesananApi', 'getById', ...args),
  getSlugByResi: (...args) => readWithNoToken('pesananApi', 'getSlugByResi', ...args),
}

// ================================================
// ANALYTICS
// ================================================
export const analyticsApi = {
  getDashboard: (tokenObj) => readWith('analyticsApi', 'getDashboard', tokenObj),
}

// ================================================
// TOKO INFO
// ================================================
export const tokoInfoApi = {
  get:    (tokenObj) => readWith('tokoInfoApi', 'get', tokenObj),
  update: (tokenObj, ...args) => writeWith('tokoInfoApi', 'update', tokenObj, ...args),
}

// ================================================
// RATING
// ================================================
export const ratingApi = {
  add: (...args) => writeWithNoToken('ratingApi', 'add', ...args),
  get: (...args) => readWithNoToken('ratingApi', 'get', ...args),
}

// ================================================
// ADMIN
// ================================================
export const adminApi = {
  getUsers:   (tokenObj) => readWith('adminApi', 'getUsers', tokenObj),
  getStats:   (tokenObj) => readWith('adminApi', 'getStats', tokenObj),
  grantPro:   (tokenObj, targetUserId, months, targetUserEmail) => writeWith('adminApi', 'grantPro', tokenObj, targetUserId, months),
  revokePro:  (tokenObj, targetUserId, targetUserEmail) => writeWith('adminApi', 'revokePro', tokenObj, targetUserId),
  deleteUser: (tokenObj, targetUserId, targetUserEmail) => writeWith('adminApi', 'deleteUser', tokenObj, targetUserId),
}

// ================================================
// STREAM
// ================================================
export const streamApi = {
  getFeed:               (tokenObj, params) => readWith('streamApi', 'getFeed', tokenObj, params),
  getPostDetail:          (tokenObj, postId) => readWith('streamApi', 'getPostDetail', tokenObj, postId),
  createPost:             (tokenObj, data) => writeWith('streamApi', 'createPost', tokenObj, data),
  addReply:               (tokenObj, data) => writeWith('streamApi', 'addReply', tokenObj, data),
  toggleLike:             (tokenObj, data) => writeWith('streamApi', 'toggleLike', tokenObj, data),
  toggleRepost:           (tokenObj, data) => writeWith('streamApi', 'toggleRepost', tokenObj, data),
  toggleBookmark:         (tokenObj, data) => writeWith('streamApi', 'toggleBookmark', tokenObj, data),
  getDmThreads:           (tokenObj) => readWith('streamApi', 'getDmThreads', tokenObj),
  getDmMessages:          (tokenObj, threadId) => readWith('streamApi', 'getDmMessages', tokenObj, threadId),
  openDmThread:           (tokenObj, data) => writeWith('streamApi', 'openDmThread', tokenObj, data),
  sendDmMessage:          (tokenObj, data) => writeWith('streamApi', 'sendDmMessage', tokenObj, data),
  getNotifications:       (tokenObj) => readWith('streamApi', 'getNotifications', tokenObj),
  markNotificationsRead:  (tokenObj) => writeWith('streamApi', 'markNotificationsRead', tokenObj),
  uploadImage:            (tokenObj, data) => writeWith('streamApi', 'uploadImage', tokenObj, data),
  deletePost: (tokenObj, postId) => writeWith('streamApi', 'deletePost', tokenObj, postId),
  getPublicShowcase: (params) => readWithNoToken('streamApi', 'getPublicShowcase', params),
}

// ================================================
// LIVE
// ================================================
export const liveApi = {
  goLive:            (tokenObj, data) => writeWith('liveApi', 'goLive', tokenObj, data),
  joinLive:          (tokenObj, data) => writeWith('liveApi', 'joinLive', tokenObj, data),
  endLive:           (tokenObj, data) => writeWith('liveApi', 'endLive', tokenObj, data),
  getActiveSessions: (tokenObj) => readWith('liveApi', 'getActiveSessions', tokenObj),
  sendReaction:      (tokenObj, data) => writeWith('liveApi', 'sendReaction', tokenObj, data),
  leaveRoom:         (tokenObj, data) => writeWith('liveApi', 'leaveRoom', tokenObj, data),
}
