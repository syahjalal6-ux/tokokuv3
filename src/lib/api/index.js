// ================================================
// API Index — Dual Write + Fallback Read
// Semua WRITE → dua provider sekaligus (Supabase + GAS)
// Semua READ → Supabase dulu, fallback GAS
// ================================================
import * as gas from './gas.js'
import * as supabase from './supabase.js'

// ================================================
// HELPERS — dengan dual-token support
// ================================================
// tokenObj = { tokenSupabase, tokenGas }
function splitToken(tokenObj) {
  if (tokenObj && typeof tokenObj === 'object' && ('tokenSupabase' in tokenObj || 'tokenGas' in tokenObj)) {
    return [tokenObj.tokenSupabase, tokenObj.tokenGas]
  }
  // fallback kalau ada kode lama yang masih kirim string token tunggal
  return [tokenObj, tokenObj]
}

// READ: Supabase dulu, fallback GAS — pakai token sesuai provider
async function readWith(apiName, method, tokenObj, ...args) {
  const [tokenSb, tokenGas] = splitToken(tokenObj)
  try {
    return await supabase[apiName][method](tokenSb, ...args)
  } catch (e) {
    console.warn(`[${apiName}.${method}] supabase gagal, fallback GAS:`, e.message)
    return await gas[apiName][method](tokenGas, ...args)
  }
}

// WRITE: tulis ke dua-duanya, return Supabase kalau sukses — pakai token sesuai provider
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

// READ tanpa token (publik)
async function readWithNoToken(apiName, method, ...args) {
  try {
    return await supabase[apiName][method](...args)
  } catch (e) {
    console.warn(`[${apiName}.${method}] supabase gagal, fallback GAS:`, e.message)
    return await gas[apiName][method](...args)
  }
}

// WRITE tanpa token (publik)
async function writeWithNoToken(apiName, method, ...args) {
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

    const user = sbOk ? sb.value.data.user : g.value.data.user

    return {
      success: true,
      data: {
        user,
        tokenSupabase: sbOk ? sb.value.data.token : null,
        tokenGas: gOk ? g.value.data.token : null,
      }
    }
  },

  getMe: (tokenObj) => readWith('authApi', 'getMe', tokenObj),

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
  create:       (...args) => writeWithNoToken('pesananApi', 'create', ...args),
  getMine:      (tokenObj, ...args) => readWith('pesananApi', 'getMine', tokenObj, ...args),
  updateStatus: (tokenObj, ...args) => writeWith('pesananApi', 'updateStatus', tokenObj, ...args),
  getById:      (...args) => readWithNoToken('pesananApi', 'getById', ...args),
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
  grantPro:   (tokenObj, ...args) => writeWith('adminApi', 'grantPro', tokenObj, ...args),
  revokePro:  (tokenObj, ...args) => writeWith('adminApi', 'revokePro', tokenObj, ...args),
  deleteUser: (tokenObj, ...args) => writeWith('adminApi', 'deleteUser', tokenObj, ...args),
}
