import * as gas from './gas.js'
import * as supabase from './supabase.js'

function splitToken(tokenObj) {
  if (tokenObj && typeof tokenObj === 'object' && ('tokenSupabase' in tokenObj || 'tokenGas' in tokenObj)) {
    return [tokenObj.tokenSupabase, tokenObj.tokenGas]
  }
  return [tokenObj, tokenObj]
}

function isProActive(user) {
  if (!user || user.plan !== 'pro') return false
  const expiry = user.planExpiry ?? user.plan_expiry
  if (!expiry) return false
  const d = new Date(expiry)
  return !Number.isNaN(d.getTime()) && d > new Date()
}

// Gabung profil Supabase + GAS — plan Pro dari mana pun yang aktif menang
function mergeUsers(sbUser, gasUser) {
  if (!sbUser && !gasUser) return null
  const merged = { ...(gasUser || {}), ...(sbUser || {}) }

  if (isProActive(gasUser)) {
    merged.plan = 'pro'
    merged.planExpiry = gasUser.planExpiry ?? gasUser.plan_expiry
  } else if (isProActive(sbUser)) {
    merged.plan = 'pro'
    merged.planExpiry = sbUser.planExpiry ?? sbUser.plan_expiry
  }

  return merged
}

async function readWith(apiName, method, tokenObj, ...args) {
  const [tokenSb, tokenGas] = splitToken(tokenObj)
  try {
    return await supabase[apiName][method](tokenSb, ...args)
  } catch (e) {
    console.warn(`[${apiName}.${method}] supabase gagal, fallback GAS:`, e.message)
    return await gas[apiName][method](tokenGas, ...args)
  }
}

async function writeWith(apiName, method, tokenObj, ...args) {
  const [tokenSb, tokenGas] = splitToken(tokenObj)
  const [sb, g] = await Promise.allSettled([
    supabase[apiName][method](tokenSb, ...args),
    gas[apiName][method](tokenGas, ...args),
  ])
  if (sb.status === 'fulfilled') return sb.value
  if (g.status === 'fulfilled') return g.value
  throw sb.reason
}

async function readWithNoToken(apiName, method, ...args) {
  try {
    return await supabase[apiName][method](...args)
  } catch (e) {
    console.warn(`[${apiName}.${method}] supabase gagal, fallback GAS:`, e.message)
    return await gas[apiName][method](...args)
  }
}

async function writeWithNoToken(apiName, method, ...args) {
  const [sb, g] = await Promise.allSettled([
    supabase[apiName][method](...args),
    gas[apiName][method](...args),
  ])
  if (sb.status === 'fulfilled') return sb.value
  if (g.status === 'fulfilled') return g.value
  throw sb.reason
}

// Admin: baca dari Sheet (GAS) dulu, fallback Supabase
async function readWithGasFirst(apiName, method, tokenObj, ...args) {
  const [tokenSb, tokenGas] = splitToken(tokenObj)
  if (tokenGas) {
    try {
      return await gas[apiName][method](tokenGas, ...args)
    } catch (e) {
      console.warn(`[${apiName}.${method}] GAS gagal, fallback supabase:`, e.message)
    }
  }
  return await supabase[apiName][method](tokenSb, ...args)
}

// Admin: wajib tulis ke Sheet (GAS), Supabase ikut sync kalau ada
async function writeWithGasRequired(apiName, method, tokenObj, ...args) {
  const [tokenSb, tokenGas] = splitToken(tokenObj)
  const [sb, g] = await Promise.allSettled([
    tokenSb ? supabase[apiName][method](tokenSb, ...args) : Promise.resolve(null),
    tokenGas ? gas[apiName][method](tokenGas, ...args) : Promise.reject(new Error('Token GAS tidak tersedia — login ulang')),
  ])
  if (g.status === 'rejected') throw g.reason
  return g.value
}

// ================================================
// AUTH
// ================================================
export const authApi = {
  loginWithGoogle: async (googleUser) => {
    const [sb, g] = await Promise.allSettled([
      supabase.authApi.loginWithGoogle(googleUser),
      gas.authApi.loginWithGoogle(googleUser),
    ])

    const sbOk = sb.status === 'fulfilled'
    const gOk = g.status === 'fulfilled'

    if (!sbOk && !gOk) {
      throw new Error(sb.reason?.message || g.reason?.message || 'Login gagal di kedua provider')
    }

    const sbUser = sbOk ? sb.value.data.user : null
    const gasUser = gOk ? g.value.data.user : null
    const user = mergeUsers(sbUser, gasUser)

    return {
      success: true,
      data: {
        user,
        tokenSupabase: sbOk ? sb.value.data.token : null,
        tokenGas: gOk ? g.value.data.token : null,
      }
    }
  },

  getMe: async (tokenObj) => {
    const [tokenSb, tokenGas] = splitToken(tokenObj)
    const [sb, g] = await Promise.allSettled([
      tokenSb ? supabase.authApi.getMe(tokenSb) : Promise.reject(new Error('no sb token')),
      tokenGas ? gas.authApi.getMe(tokenGas) : Promise.reject(new Error('no gas token')),
    ])
    const sbUser = sb.status === 'fulfilled' ? sb.value.data : null
    const gasUser = g.status === 'fulfilled' ? g.value.data : null
    const user = mergeUsers(sbUser, gasUser)
    if (!user) throw sb.reason || g.reason
    return { success: true, data: user }
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
  getUsers:   (tokenObj) => readWithGasFirst('adminApi', 'getUsers', tokenObj),
  getStats:   (tokenObj) => readWithGasFirst('adminApi', 'getStats', tokenObj),
  grantPro:   (tokenObj, targetUserId, months, targetUserEmail) => writeWithGasRequired('adminApi', 'grantPro', tokenObj, targetUserId, months, targetUserEmail),
  revokePro:  (tokenObj, targetUserId, targetUserEmail) => writeWithGasRequired('adminApi', 'revokePro', tokenObj, targetUserId, targetUserEmail),
  deleteUser: (tokenObj, targetUserId, targetUserEmail) => writeWithGasRequired('adminApi', 'deleteUser', tokenObj, targetUserId, targetUserEmail),
}
