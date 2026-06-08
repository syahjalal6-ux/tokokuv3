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

    const res = await fetchWithTimeout(url.toString())
    const text = await res.text()

    let json
    try {
      json = JSON.parse(text)
    } catch {
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

async function requestSafe(action, data = {}) {
  const url = new URL(CONFIG.GAS_URL)
  url.searchParams.set('action', action)

  const { foto, logo, ...rest } = data
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })

  const urlWithoutLongFields = url.toString()
  const fotoStr = foto ? String(foto) : ''
  const logoStr = logo ? String(logo) : ''
  const totalLength = urlWithoutLongFields.length + fotoStr.length + logoStr.length

  if (totalLength <= 1800) {
    if (fotoStr) url.searchParams.set('foto', fotoStr)
    if (logoStr) url.searchParams.set('logo', logoStr)
    const res = await fetchWithTimeout(url.toString())
    return parseGasResponse(res)
  } else {
    const body = { action, ...rest }
    if (fotoStr) body.foto = fotoStr
    if (logoStr) body.logo = logoStr
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
    throw new ApiError('Response dari server tidak valid.', 500)
  }
  if (!json.success) throw new ApiError(json.message || 'Terjadi kesalahan', 400)
  return json
}

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

export const tokoApi = {
  create: (token, data) => request('createToko', { token, ...data }),
  update: (token, tokoId, data) => requestSafe('updateToko', { token, tokoId, ...data }),
  delete: (token, tokoId) => request('deleteToko', { token, tokoId }),
  getMine: (token) => request('getMyToko', { token }),
  getBySlug: (slug) => request('getTokoBySlug', { slug }),
  checkSlug: (slug) => request('checkSlug', { slug }),
  requestUpgrade: (token) => request('requestUpgrade', { token }),
  confirmUpgrade: (adminToken, userId) => request('confirmUpgrade', { adminToken, userId }),
}

export const produkApi = {
  create: (token, data) => requestSafe('createProduk', { token, ...data }),
  update: (token, produkId, data) => requestSafe('updateProduk', { token, produkId, ...data }),
  delete: (token, produkId) => request('deleteProduk', { token, produkId }),
  getMine: (token) => request('getMyProduk', { token }),
  getByToko: (tokoId, params = {}) => request('getProdukByToko', { tokoId, ...params }),
  getById: (produkId) => request('getProdukById', { produkId }),
}

export const pesananApi = {
  create: (data) => request('createPesanan', data),
  getMine: (token, status = 'all') => request('getMyPesanan', { token, status }),
  updateStatus: (token, pesananId, status) => request('updatePesananStatus', { token, pesananId, status }),
  getById: (pesananId, buyerWa) => request('getPesananById', { pesananId, buyerWa }),
}

export const analyticsApi = {
  getDashboard: (token) => request('getAnalytics', { token }),
}

export const tokoInfoApi = {
  get: (token) => request('getTokoInfo', { token }),
  update: (token, data) => request('updateTokoInfo', { token, ...data }),
}

export const ratingApi = {
  add: (data) => request('addRating', data),
  get: (params) => request('getRating', params),
}
