// ================================================
// Supabase API Provider
// ================================================

import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config.js'

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

// Client khusus admin — pakai service role key agar bisa bypass RLS
const supabaseAdmin = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_SERVICE_ROLE_KEY
)

// ================================================
// HELPERS
// ================================================

class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function handleError(error) {
  throw new ApiError(error.message || 'Terjadi kesalahan', 400)
}

// ================================================
// AUTH
// ================================================

export const authApi = {
  loginWithGoogle: async (googleUser) => {
    const { data, error } = await supabaseAdmin
      .from('users')
      .upsert({
        email: googleUser.email,
        name: googleUser.name,
        picture: googleUser.picture,
        google_id: googleUser.sub,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'google_id' })
      .select()
      .single()

    if (error) handleError(error)

    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error: tokenError } = await supabaseAdmin
      .from('tokens')
      .insert({ token, user_id: data.id, expires_at: expiresAt.toISOString() })

    if (tokenError) handleError(tokenError)

    return { success: true, data: { user: data, token } }
  },

  getMe: async (token) => {
    const userId = await verifyToken(token)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) handleError(error)
    return { success: true, data: { ...data, planExpiry: data.plan_expiry } }
  },

  logout: async (token) => {
    const { error } = await supabaseAdmin
      .from('tokens')
      .delete()
      .eq('token', token)
    if (error) handleError(error)
    return { success: true }
  },
}

// ================================================
// TOKO
// ================================================

export const tokoApi = {
  create: async (token, data) => {
    const userId = await verifyToken(token)
    const { nama, slug, deskripsi, wa } = data

    const { data: toko, error } = await supabaseAdmin
      .from('toko')
      .insert({
        user_id: userId, nama, slug,
        deskripsi: deskripsi || '',
        wa: wa || '',
        tema: 'default',
        plan: 'free',
        aktif: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) handleError(error)
    return { success: true, data: toko }
  },

  update: async (token, tokoId, data) => {
    const userId = await verifyToken(token)
    const { customDomain, ...rest } = data
    const { error } = await supabaseAdmin
      .update({ ...rest, custom_domain: customDomain, updated_at: new Date().toISOString() })
      .eq('id', tokoId)
      .eq('user_id', userId)
    if (error) handleError(error)
    return { success: true }
  },

  delete: async (token, tokoId) => {
    const userId = await verifyToken(token)
    const { error } = await supabaseAdmin
      .from('toko')
      .delete()
      .eq('id', tokoId)
      .eq('user_id', userId)
    if (error) handleError(error)
    return { success: true }
  },

  getMine: async (token) => {
    const userId = await verifyToken(token)
    const { data, error } = await supabaseAdmin
      .from('toko')
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') handleError(error)
    return { success: true, data: data || null }
  },

  getBySlug: async (slug) => {
    const { data, error } = await supabase
      .from('toko')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) handleError(error)
    return { success: true, data }
  },

  checkSlug: async (slug) => {
    const { data } = await supabase
      .from('toko')
      .select('id')
      .eq('slug', slug)
      .single()
    return { success: true, data: { available: !data } }
  },

  requestUpgrade: async (token) => {
    await verifyToken(token)
    return { success: true, message: 'Request upgrade terkirim' }
  },

  confirmUpgrade: async (adminToken, userId) => {
    await verifyToken(adminToken)
    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + 1)
    const { error } = await supabaseAdmin
      .from('users')
      .update({ plan: 'pro', plan_expiry: expiry.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', userId)
    if (error) handleError(error)
    return { success: true }
  },
}

// ================================================
// PRODUK
// ================================================

export const produkApi = {
  create: async (token, data) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)

    const { data: produk, error } = await supabaseAdmin
      .from('produk')
      .insert({
        toko_id: toko.id,
        user_id: userId,
        nama: data.nama,
        deskripsi: data.deskripsi || '',
        harga: Number(data.harga),
        harga_coret: data.hargaCoret ? Number(data.hargaCoret) : null,
        stok: data.stok ? Number(data.stok) : null,
        kategori: data.kategori || '',
        berat: data.berat ? Number(data.berat) : null,
        foto: data.foto || '',
        aktif: data.aktif !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) handleError(error)
    return { success: true, data: produk }
  },

  update: async (token, produkId, data) => {
    const userId = await verifyToken(token)
    const { error } = await supabaseAdmin
      .from('produk')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', produkId)
      .eq('user_id', userId)
    if (error) handleError(error)
    return { success: true }
  },

  delete: async (token, produkId) => {
    const userId = await verifyToken(token)
    const { error } = await supabaseAdmin
      .from('produk')
      .delete()
      .eq('id', produkId)
      .eq('user_id', userId)
    if (error) handleError(error)
    return { success: true }
  },

  getMine: async (token) => {
    const userId = await verifyToken(token)
    const { data, error } = await supabaseAdmin
      .from('produk')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) handleError(error)
    return { success: true, data }
  },

  getByToko: async (tokoId, params = {}) => {
    let actualTokoId = tokoId
    const { data: toko } = await supabase
      .from('toko')
      .select('id')
      .or(`id.eq.${tokoId},slug.eq.${tokoId}`)
      .single()
    if (toko) actualTokoId = toko.id

    let query = supabase
      .from('produk')
      .select('*')
      .eq('toko_id', actualTokoId)
      .eq('aktif', true)
      .order('created_at', { ascending: false })

    if (params.kategori) query = query.eq('kategori', params.kategori)

    const { data, error } = await query
    if (error) handleError(error)
    return { success: true, data }
  },

  getById: async (produkId) => {
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('id', produkId)
      .single()
    if (error) handleError(error)
    return { success: true, data }
  },
}

// ================================================
// PESANAN
// ================================================

export const pesananApi = {
  create: async (data) => {
    const { data: pesanan, error } = await supabase
      .from('pesanan')
      .insert({
        toko_id: data.tokoId,
        produk_id: data.produkId,
        produk_nama: data.produkNama,
        harga: Number(data.harga),
        qty: Number(data.qty),
        buyer_nama: data.buyerNama,
        buyer_wa: data.buyerWa,
        buyer_alamat: data.buyerAlamat,
        catatan: data.catatan || '',
        total: Number(data.total || data.harga * data.qty),
        status: 'pending',
        kurir: '',
        resi: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) handleError(error)
    return { success: true, data: pesanan }
  },

  getMine: async (token, status = 'all') => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) return { success: true, data: [] }

    let query = supabaseAdmin
      .from('pesanan')
      .select('*')
      .eq('toko_id', toko.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) handleError(error)
    return { success: true, data }
  },

  updateStatus: async (token, pesananId, status, kurir, resi) => {
    await verifyToken(token)
    const updates = { status, updated_at: new Date().toISOString() }
    if (kurir !== undefined) updates.kurir = kurir || ''
    if (resi !== undefined) updates.resi = resi || ''

    const { error } = await supabaseAdmin
      .from('pesanan')
      .update(updates)
      .eq('id', pesananId)

    if (error) handleError(error)
    return { success: true }
  },

  getById: async (pesananId, buyerWa) => {
    const { data, error } = await supabase
      .from('pesanan')
      .select('*')
      .eq('id', pesananId)
      .eq('buyer_wa', buyerWa)
      .single()
    if (error) handleError(error)
    return { success: true, data }
  },
}

// ================================================
// ANALYTICS
// ================================================

export const analyticsApi = {
  getDashboard: async (token) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) return { success: true, data: {} }

    const { data: produk } = await supabaseAdmin.from('produk').select('*').eq('toko_id', toko.id)
    const { data: pesanans } = await supabaseAdmin.from('pesanan').select('*').eq('toko_id', toko.id)

    const done = (pesanans || []).filter(p => p.status === 'done')
    const totalRevenue = done.reduce((s, p) => s + Number(p.total), 0)

    return {
      success: true,
      data: {
        totalProduk: (produk || []).length,
        produkAktif: (produk || []).filter(p => p.aktif).length,
        totalPesanan: (pesanans || []).length,
        pesananPending: (pesanans || []).filter(p => p.status === 'pending').length,
        pesananSelesai: done.length,
        totalRevenue,
      }
    }
  },
}

// ================================================
// TOKO INFO
// ================================================

export const tokoInfoApi = {
  get: async (token) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Toko tidak ditemukan', 404)

    const { data, error } = await supabaseAdmin
      .from('toko_info')
      .select('*')
      .eq('toko_id', toko.id)
      .single()

    if (error && error.code !== 'PGRST116') handleError(error)
    return { success: true, data: data || { toko_id: toko.id, faq: '', garansi: '', policy: '', info_lain: '' } }
  },

  update: async (token, data) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Toko tidak ditemukan', 404)

    const { error } = await supabaseAdmin
      .from('toko_info')
      .upsert({ toko_id: toko.id, ...data }, { onConflict: 'toko_id' })

    if (error) handleError(error)
    return { success: true }
  },
}

// ================================================
// RATING
// ================================================

export const ratingApi = {
  add: async (data) => {
    const { data: rating, error } = await supabase
      .from('rating')
      .insert({
        toko_id: data.tokoId,
        produk_id: data.produkId,
        buyer_nama: data.buyerNama,
        rating: Number(data.rating),
        komentar: data.komentar || '',
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) handleError(error)
    return { success: true, data: rating }
  },

  get: async (params) => {
    let query = supabase.from('rating').select('*').order('created_at', { ascending: false })
    if (params.produkId) query = query.eq('produk_id', params.produkId)
    if (params.tokoId) query = query.eq('toko_id', params.tokoId)

    const { data, error } = await query
    if (error) handleError(error)

    const avgRating = data?.length
      ? (data.reduce((s, r) => s + Number(r.rating), 0) / data.length).toFixed(1)
      : null

    return {
      success: true,
      data: {
        ratings: data || [],
        total: (data || []).length,
        avgRating: avgRating ? Number(avgRating) : null,
      }
    }
  },
}

// ================================================
// ADMIN
// ================================================

export const adminApi = {
  getUsers: async (token) => {
    await verifyToken(token)

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    if (usersError) handleError(usersError)

    const { data: tokos } = await supabaseAdmin.from('toko').select('*')
    const { data: produks } = await supabaseAdmin.from('produk').select('id, user_id')
    const { data: pesanans } = await supabaseAdmin.from('pesanan').select('id, toko_id')

    const result = (users || []).map(u => {
      const toko = (tokos || []).find(t => t.user_id === u.id)
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        picture: u.picture,
        plan: u.plan || 'free',
        planExpiry: u.plan_expiry || null,
        createdAt: u.created_at,
        tokoNama: toko?.nama || null,
        tokoSlug: toko?.slug || null,
        tokoAktif: toko?.aktif !== false,
        totalProduk: (produks || []).filter(p => p.user_id === u.id).length,
        totalPesanan: toko ? (pesanans || []).filter(p => p.toko_id === toko.id).length : 0,
      }
    })

    return { success: true, data: result }
  },

  getStats: async (token) => {
    await verifyToken(token)

    const { count: totalUser } = await supabaseAdmin.from('users').select('*', { count: 'exact', head: true })
    const { count: totalToko } = await supabaseAdmin.from('toko').select('*', { count: 'exact', head: true })
    const { count: totalProduk } = await supabaseAdmin.from('produk').select('*', { count: 'exact', head: true })

    return {
      success: true,
      data: { totalUser, totalToko, totalProduk }
    }
  },

  grantPro: async (token, targetUserId, months) => {
    await verifyToken(token)

    const expiry = new Date()
    expiry.setMonth(expiry.getMonth() + Number(months || 1))

    const { error } = await supabaseAdmin
      .from('users')
      .update({ plan: 'pro', plan_expiry: expiry.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (error) handleError(error)

    return { success: true, message: `Pro aktif ${months} bulan` }
  },

  revokePro: async (token, targetUserId) => {
    await verifyToken(token)

    const { error } = await supabaseAdmin
      .from('users')
      .update({ plan: 'free', plan_expiry: null, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (error) handleError(error)

    return { success: true, message: 'Pro berhasil dicabut' }
  },

  deleteUser: async (token, targetUserId) => {
    await verifyToken(token)

    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', targetUserId).single()
    const tokoId = toko?.id || null

    await supabaseAdmin.from('tokens').delete().eq('user_id', targetUserId)
    await supabaseAdmin.from('produk').delete().eq('user_id', targetUserId)

    if (tokoId) {
      await supabaseAdmin.from('pesanan').delete().eq('toko_id', tokoId)
      await supabaseAdmin.from('toko_info').delete().eq('toko_id', tokoId)
      await supabaseAdmin.from('toko').delete().eq('id', tokoId)
    }

    const { error } = await supabaseAdmin.from('users').delete().eq('id', targetUserId)
    if (error) handleError(error)

    return { success: true, message: 'User berhasil dihapus' }
  },
}

// ================================================
// VERIFY TOKEN HELPER — pakai supabaseAdmin bypass RLS
// ================================================

async function verifyToken(token) {
  if (!token) throw new ApiError('Token diperlukan', 401)

  const { data, error } = await supabaseAdmin
    .from('tokens')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !data) throw new ApiError('Token tidak valid', 401)
  if (new Date(data.expires_at) < new Date()) throw new ApiError('Token kadaluarsa, silakan login ulang', 401)

  return data.user_id
}
