import { CONFIG } from './config.js'

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

// Semua request pakai GET — fix 302 redirect issue GAS
// Untuk field 'foto': dikirim terpisah via searchParams agar tidak corrupt di spread
async function request(action, data = {}) {
  try {
    const url = new URL(CONFIG.GAS_URL)
    url.searchParams.set('action', action)

    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) {
        // Encode eksplisit untuk semua string — penting untuk URL Cloudinary
        url.searchParams.set(k, String(v))
      }
    })

    console.log('[API] request:', action, '| foto:', data.foto ?? '(tidak ada)')
    console.log('[API] full URL length:', url.toString().length)

    const res = await fetch(url.toString(), { redirect: 'follow' })
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
// foto = URL string dari Cloudinary, dikirim via query param seperti field lain
// Jika URL length > 1800 char, switch otomatis ke POST untuk keamanan
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

// Khusus untuk request yang bisa punya URL panjang (create/update produk dengan foto)
// Jika total URL > 1800 char, kirim foto via POST body sebagai JSON
// GAS harus support doPost untuk ini — lihat catatan di bawah
async function requestSafe(action, data = {}) {
  const url = new URL(CONFIG.GAS_URL)
  url.searchParams.set('action', action)

  // Pisahkan foto dari data lain untuk estimasi panjang URL dulu
  const { foto, ...rest } = data
  Object.entries(rest).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })

  // Cek panjang URL tanpa foto
  const urlWithoutFoto = url.toString()
  const fotoStr = foto ? String(foto) : ''
  const totalLength = urlWithoutFoto.length + (fotoStr ? fotoStr.length + 6 : 0) // +6 untuk "&foto="

  console.log('[API] requestSafe:', action, '| URL length (estimasi):', totalLength)

  if (totalLength <= 1800) {
    // Aman pakai GET biasa
    if (fotoStr) url.searchParams.set('foto', fotoStr)
    console.log('[API] mode: GET | foto dikirim via query param')
    const res = await fetch(url.toString(), { redirect: 'follow' })
    return parseGasResponse(res)
  } else {
    // URL terlalu panjang — kirim via POST
    // CATATAN: GAS harus punya doPost() yang handle JSON body
    // Tambahkan ini ke GAS jika belum ada:
    //   function doPost(e) {
    //     const data = JSON.parse(e.postData.contents)
    //     return handleAction(data.action, data)
    //   }
    console.log('[API] mode: POST (URL terlalu panjang) | foto length:', fotoStr.length)
    const body = { action, ...rest }
    if (fotoStr) body.foto = fotoStr
    const res = await fetch(CONFIG.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      redirect: 'follow',
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