import { CONFIG } from './config.js'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

const TIMEOUT_MS = 8000

function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  return fetch(url, { ...options, signal: controller.signal, redirect: 'follow' })
    .finally(() => clearTimeout(timer))
}

async function request(action, data = {}) {
  try {
    const url = new URL(CONFIG.GAS_URL)
    url.searchParams.set('action', action)

    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        url.searchParams.set(k, String(v))
      }
    })

    console.log('[API] request:', action, '| foto:', data.foto ?? '(tidak ada)')
    console.log('[API] full URL length:', url.toString().length)

    const res = await fetchWithTimeout(url.toString())
    const text = await res.text()

    let json
    try {
      json = JSON.parse(text)
    } catch {
      console.error('GAS response bukan JSON:', text.slice(0, 300))
      throw new ApiError('Response dari server tidak valid.', 500)
    }

    if (!json.success) throw new ApiError(json.message || 'Terjadi kesalahan', 400)
    return json
  } catch (err) {
    if (err.name === 'AbortError') throw new ApiError('Request timeout. Coba lagi.', 408)
    if (err instanceof ApiError) throw err
    throw new ApiError(err.message || 'Gagal terhubung ke server', 0)
  }
}

// AUTH
export const authApi = {
  loginWithGoogle: (googleUser) => request('loginWithGoogle', {
    email: googleUser.email,
    name: googleUser.name,
    picture: googleUser.picture,
    googleId: googleUser.sub,
  }),
  getMe: (token) => request('getMe', { token }),
  logout: (token) => request('logout', { token }),
}

// TOKO
export const tokoApi = {
  create: (token, data) => request('createToko', { token, ...data }),
  update: (token, tokoId, data) => request('updateToko', { token, tokoId, ...data }),
  getMine: (token) => request('getMyToko', { token }),
  getBySlug: (slug) => request('getTokoBySlug', { slug }),
  checkSlug: (slug) => request('checkSlug', { slug }),
  requestUpgrade: (token) => request('requestUpgrade', { token }),
  confirmUpgrade: (adminToken, userId) => request('confirmUpgrade', { adminToken, userId }),
}

// PRODUK
export const produkApi = {
  create: (token, data) => requestSafe('createProduk', { token, ...data }),
  update: (token, produkId, data) => requestSafe('updateProduk', { token, produkId, ...data }),
  delete: (token, produkId) => request('deleteProduk', { token, produkId }),
  getMine: (token) => request('getMyProduk', { token }),
  getByToko: (tokoId, params = {}) => request('getProdukByToko', { tokoId, ...params }),
  getById: (produkId) => request('getProdukById', { produkId }),
}

// PESANAN
export const pesananApi = {
  create: (data) => request('createPesanan', data),
  getMine: (token, status = 'all') => request('getMyPesanan', { token, status }),
  updateStatus: (token, pesananId, status) => request('updatePesananStatus', { token, pesananId, status }),
  getById: (pesananId, buyerWa) => request('getPesananById', { pesananId, buyerWa }),
}

// ANALYTICS
export const analyticsApi = {
  getDashboard: (token) => request('getAnalytics', { token }),
}

async function requestSafe(action, data = {}) {
  const url = new URL(CONFIG.GAS_URL)
  url.searchParams.set('action', action)

  const { foto, ...rest } = data
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })

  const urlWithoutFoto = url.toString()
  const fotoStr = foto ? String(foto) : ''
  const totalLength = urlWithoutFoto.length + (fotoStr ? fotoStr.length + 6 : 0)

  console.log('[API] requestSafe:', action, '| URL length (estimasi):', totalLength)

  if (totalLength <= 1800) {
    if (fotoStr) url.searchParams.set('foto', fotoStr)
    console.log('[API] mode: GET | foto dikirim via query param')
    const res = await fetchWithTimeout(url.toString())
    return parseGasResponse(res)
  } else {
    console.log('[API] mode: POST (URL terlalu panjang) | foto length:', fotoStr.length)
    const body = { action, ...rest }
    if (fotoStr) body.foto = fotoStr
    const res = await fetchWithTimeout(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return parseGasResponse(res)
  }
}

async function parseGasResponse(res) {
  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    console.error('GAS response bukan JSON:', text.slice(0, 300))
    throw new ApiError('Response dari server tidak valid.', 500)
  }
  if (!json.success) throw new ApiError(json.message || 'Terjadi kesalahan', 400)
  return json
}
