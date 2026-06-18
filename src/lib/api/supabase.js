import { createClient } from '@supabase/supabase-js'
import { CONFIG } from '../config.js'

const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)

const supabaseAdmin = createClient(
  CONFIG.SUPABASE_URL,
  CONFIG.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
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
// MAPPERS — snake_case DB → camelCase frontend
// ================================================

function mapProduk(p) {
  if (!p) return null
  return {
    id: p.id,
    tokoId: p.toko_id,
    userId: p.user_id,
    nama: p.nama,
    deskripsi: p.deskripsi,
    harga: p.harga,
    hargaCoret: p.harga_coret,
    stok: p.stok,
    kategori: p.kategori,
    berat: p.berat,
    foto: p.foto,
    aktif: p.aktif,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

function mapToko(t) {
  if (!t) return null
  return {
    id: t.id,
    userId: t.user_id,
    nama: t.nama,
    slug: t.slug,
    deskripsi: t.deskripsi,
    wa: t.wa,
    logo: t.logo,
    tema: t.tema,
    plan: t.plan,
    aktif: t.aktif,
    pengumuman: t.pengumuman,
    musik: t.musik,
    video: t.video,
    customDomain: t.custom_domain,
    createdAt: t.created_at,
    updatedAt: t.updated_at,
  }
}

function mapUser(u) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    picture: u.picture,
    googleId: u.google_id,
    plan: u.plan || 'free',
    planExpiry: u.plan_expiry,
    createdAt: u.created_at,
    updatedAt: u.updated_at,
  }
}

function mapPesanan(p) {
  if (!p) return null
  return {
    id: p.id,
    tokoId: p.toko_id,
    tokoSlug: p.toko?.slug || null,
    produkId: p.produk_id,
    produkNama: p.produk_nama,
    harga: p.harga,
    qty: p.qty,
    total: p.total,
    buyerNama: p.buyer_nama,
    buyerWa: p.buyer_wa,
    buyerAlamat: p.buyer_alamat,
    catatan: p.catatan,
    status: p.status,
    kurir: p.kurir,
    resi: p.resi,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

function mapTokoInfo(d) {
  if (!d) return null
  return {
    tokoId: d.toko_id,
    faq: d.faq || '',
    garansi: d.garansi || '',
    policy: d.policy || '',
    infoLain: d.info_lain || '',
  }
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

    return { success: true, data: { user: mapUser(data), token } }
  },

  getMe: async (token) => {
    const userId = await verifyToken(token)
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) handleError(error)
    return { success: true, data: mapUser(data) }
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

    await supabaseAdmin
      .from('users')
      .update({ toko_id: toko.id, updated_at: new Date().toISOString() })
      .eq('id', userId)

    return { success: true, data: mapToko(toko) }
  },

  update: async (token, tokoId, data) => {
    const userId = await verifyToken(token)
    const { customDomain, ...rest } = data
    const { error } = await supabaseAdmin
      .from('toko')
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
    return { success: true, data: mapToko(data) }
  },

  getBySlug: async (slug) => {
    const { data, error } = await supabase
      .from('toko')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) handleError(error)
    return { success: true, data: mapToko(data) }
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

    const { data: tokoSync, error: tokoSyncErr } = await supabaseAdmin
      .from('toko')
      .update({ plan: 'pro', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()

    console.log('[confirmUpgrade] toko sync result:', tokoSync, tokoSyncErr)
    if (tokoSyncErr) handleError(tokoSyncErr)

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
        foto: data.foto || '[]',
        aktif: data.aktif !== false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) handleError(error)
    return { success: true, data: mapProduk(produk) }
  },

  update: async (token, produkId, data) => {
    const userId = await verifyToken(token)

    const updatePayload = {}
    if (data.nama !== undefined) updatePayload.nama = data.nama
    if (data.deskripsi !== undefined) updatePayload.deskripsi = data.deskripsi
    if (data.harga !== undefined) updatePayload.harga = data.harga
    if (data.hargaCoret !== undefined) updatePayload.harga_coret = data.hargaCoret
    if (data.stok !== undefined) updatePayload.stok = data.stok
    if (data.kategori !== undefined) updatePayload.kategori = data.kategori
    if (data.berat !== undefined) updatePayload.berat = data.berat
    if (data.foto !== undefined) updatePayload.foto = data.foto
    if (data.aktif !== undefined) updatePayload.aktif = data.aktif
    updatePayload.updated_at = new Date().toISOString()

    const { error } = await supabaseAdmin
      .from('produk')
      .update(updatePayload)
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
    return { success: true, data: (data || []).map(mapProduk) }
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
    return { success: true, data: (data || []).map(mapProduk) }
  },

  getById: async (produkId) => {
    const { data, error } = await supabase
      .from('produk')
      .select('*')
      .eq('id', produkId)
      .single()
    if (error) handleError(error)
    return { success: true, data: mapProduk(data) }
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
    return { success: true, data: mapPesanan(pesanan) }
  },

  getMine: async (token, status = 'all') => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id, slug').eq('user_id', userId).single()
    if (!toko) return { success: true, data: [] }

    let query = supabaseAdmin
      .from('pesanan')
      .select('*')
      .eq('toko_id', toko.id)
      .order('created_at', { ascending: false })

    if (status && status !== 'all') query = query.eq('status', status)

    const { data, error } = await query
    if (error) handleError(error)

    return {
      success: true,
      data: (data || []).map(p => mapPesanan({ ...p, toko: { slug: toko.slug } }))
    }
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
    return { success: true, data: mapPesanan(data) }
  },

  getSlugByResi: async (resi) => {
    const { data, error } = await supabase
      .from('pesanan')
      .select('resi, toko:toko_id(slug)')
      .eq('resi', resi)
      .single()
    if (error) handleError(error)
    return { success: true, data: { slug: data.toko?.slug || null } }
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
    const { data: pesanans } = await supabaseAdmin
      .from('pesanan')
      .select('*')
      .eq('toko_id', toko.id)
      .order('created_at', { ascending: true })

    const allPesanan = pesanans || []
    const done = allPesanan.filter(p => p.status === 'done')
    const totalRevenue = done.reduce((s, p) => s + Number(p.total), 0)

    // ── Revenue Harian (dari pesanan done) ──
    const revenueHarianMap = {}
    done.forEach(p => {
      const date = p.created_at?.slice(0, 10) // "YYYY-MM-DD"
      if (!date) return
      revenueHarianMap[date] = (revenueHarianMap[date] || 0) + Number(p.total)
    })
    const revenueHarian = Object.entries(revenueHarianMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, total]) => ({ date, label: date, total }))

    // ── Revenue Bulanan (dari pesanan done) ──
    const revenueBulananMap = {}
    done.forEach(p => {
      const yearMonth = p.created_at?.slice(0, 7) // "YYYY-MM"
      if (!yearMonth) return
      revenueBulananMap[yearMonth] = (revenueBulananMap[yearMonth] || 0) + Number(p.total)
    })
    const revenueBulanan = Object.entries(revenueBulananMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([yearMonth, total]) => ({ label: yearMonth, total }))

    // ── Revenue Minggu Ini & Minggu Lalu ──
    const now = new Date()
    const dayOfWeek = now.getDay() // 0 = Minggu
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - dayOfWeek)
    startOfThisWeek.setHours(0, 0, 0, 0)

    const startOfLastWeek = new Date(startOfThisWeek)
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7)

    const endOfLastWeek = new Date(startOfThisWeek)
    endOfLastWeek.setMilliseconds(-1)

    const revenueMingguIni = done
      .filter(p => new Date(p.created_at) >= startOfThisWeek)
      .reduce((s, p) => s + Number(p.total), 0)

    const revenueMingguLalu = done
      .filter(p => {
        const d = new Date(p.created_at)
        return d >= startOfLastWeek && d <= endOfLastWeek
      })
      .reduce((s, p) => s + Number(p.total), 0)

    // ── Top Produk Terlaris ──
    const produkQtyMap = {}
    done.forEach(p => {
      const nama = p.produk_nama || 'Produk'
      produkQtyMap[nama] = (produkQtyMap[nama] || 0) + Number(p.qty || 1)
    })
    const topProduk = Object.entries(produkQtyMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([nama, qty]) => ({ nama, qty }))

    return {
      success: true,
      data: {
        // Produk
        totalProduk: (produk || []).length,
        produkAktif: (produk || []).filter(p => p.aktif).length,

        // Pesanan
        totalPesanan: allPesanan.length,
        pesananPending:    allPesanan.filter(p => p.status === 'pending').length,
        pesananConfirmed:  allPesanan.filter(p => p.status === 'confirmed').length,
        pesananProcessing: allPesanan.filter(p => p.status === 'processing').length,
        pesananShipped:    allPesanan.filter(p => p.status === 'shipped').length,
        pesananSelesai:    done.length,
        pesananCancelled:  allPesanan.filter(p => p.status === 'cancelled').length,

        // Revenue
        totalRevenue,
        revenueMingguIni,
        revenueMingguLalu,

        // Chart data
        revenueHarian,
        revenueBulanan,

        // Top produk
        topProduk,
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
    return {
      success: true,
      data: mapTokoInfo(data) || { tokoId: toko.id, faq: '', garansi: '', policy: '', infoLain: '' }
    }
  },

  update: async (token, data) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Toko tidak ditemukan', 404)

    const { error } = await supabaseAdmin
      .from('toko_info')
      .upsert({
        toko_id: toko.id,
        faq: data.faq || '',
        garansi: data.garansi || '',
        policy: data.policy || '',
        info_lain: data.infoLain || '',
      }, { onConflict: 'toko_id' })

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

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({ plan: 'pro', plan_expiry: expiry.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (userErr) handleError(userErr)

    const { data: tokoData, error: tokoFindErr } = await supabaseAdmin
      .from('toko')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    console.log('[grantPro] target user_id:', targetUserId)
    console.log('[grantPro] toko found:', tokoData, tokoFindErr)

    if (tokoFindErr || !tokoData) {
      throw new ApiError('Toko tidak ditemukan untuk user ini', 404)
    }

    const { error: tokoErr } = await supabaseAdmin
      .from('toko')
      .update({ plan: 'pro', updated_at: new Date().toISOString() })
      .eq('id', tokoData.id)

    if (tokoErr) handleError(tokoErr)

    return { success: true, message: `Pro aktif ${months} bulan` }
  },

  revokePro: async (token, targetUserId) => {
    await verifyToken(token)

    const { error: userErr } = await supabaseAdmin
      .from('users')
      .update({ plan: 'free', plan_expiry: null, updated_at: new Date().toISOString() })
      .eq('id', targetUserId)
    if (userErr) handleError(userErr)

    const { data: tokoData, error: tokoFindErr } = await supabaseAdmin
      .from('toko')
      .select('id')
      .eq('user_id', targetUserId)
      .single()

    console.log('[revokePro] target user_id:', targetUserId)
    console.log('[revokePro] toko found:', tokoData, tokoFindErr)

    if (tokoFindErr || !tokoData) {
      throw new ApiError('Toko tidak ditemukan untuk user ini', 404)
    }

    const { error: tokoErr } = await supabaseAdmin
      .from('toko')
      .update({ plan: 'free', updated_at: new Date().toISOString() })
      .eq('id', tokoData.id)

    if (tokoErr) handleError(tokoErr)

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
// VERIFY TOKEN HELPER
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

// ================================================
// STREAM — helpers
// ================================================

function requirePro(userRow) {
  const ok = userRow?.plan === 'pro' && userRow?.plan_expiry && new Date(userRow.plan_expiry) > new Date()
  if (!ok) throw new ApiError('Fitur ini khusus seller Pro', 403)
}

function extractHashtags(text) {
  const matches = String(text || '').match(/#\w+/g) || []
  return [...new Set(matches)]
}

function mapStreamPost(p, extra = {}) {
  let foto = []
  try { foto = p.foto ? JSON.parse(p.foto) : [] } catch { foto = [] }
  return {
    id: p.id,
    toko: p.toko ? { id: p.toko.id, nama: p.toko.nama, slug: p.toko.slug, logo: p.toko.logo, pro: p.toko.plan === 'pro' } : null,
    teks: p.teks,
    foto,
    shopLink: p.shop_link ? { slug: p.shop_link.slug, nama: p.shop_link.nama } : null,
    hashtags: extra.hashtags || [],
    likesCount: p.likes_count,
    repostsCount: p.reposts_count,
    repliesCount: p.replies_count,
    liked: !!extra.liked,
    reposted: !!extra.reposted,
    bookmarked: !!extra.bookmarked,
    previewReplies: extra.previewReplies || [],
    createdAt: p.created_at,
  }
}

function mapStreamReply(r) {
  return {
    id: r.id,
    postId: r.post_id,
    parentReplyId: r.parent_reply_id,
    toko: r.toko ? { id: r.toko.id, nama: r.toko.nama, slug: r.toko.slug, logo: r.toko.logo, pro: r.toko.plan === 'pro' } : null,
    teks: r.teks,
    likesCount: r.likes_count,
    createdAt: r.created_at,
  }
}

function buildReplyTree(replies, likedSet) {
  const byId = {}
  replies.forEach(r => { byId[r.id] = { ...mapStreamReply(r), liked: likedSet.has(r.id), replies: [] } })
  const roots = []
  replies.forEach(r => {
    const node = byId[r.id]
    if (r.parent_reply_id && byId[r.parent_reply_id]) byId[r.parent_reply_id].replies.push(node)
    else roots.push(node)
  })
  return roots
}

async function getViewerFlags(viewerTokoId, postIds) {
  if (!viewerTokoId || !postIds.length) return { liked: new Set(), reposted: new Set(), bookmarked: new Set() }
  const [{ data: likes }, { data: reposts }, { data: bookmarks }] = await Promise.all([
    supabaseAdmin.from('stream_likes').select('target_id').eq('toko_id', viewerTokoId).eq('target_type', 'post').in('target_id', postIds),
    supabaseAdmin.from('stream_reposts').select('post_id').eq('toko_id', viewerTokoId).in('post_id', postIds),
    supabaseAdmin.from('stream_bookmarks').select('post_id').eq('toko_id', viewerTokoId).in('post_id', postIds),
  ])
  return {
    liked: new Set((likes || []).map(l => l.target_id)),
    reposted: new Set((reposts || []).map(r => r.post_id)),
    bookmarked: new Set((bookmarks || []).map(b => b.post_id)),
  }
}

async function getViewerFlagsMixed(viewerTokoId, postId, replyIds) {
  if (!viewerTokoId) return { likedPost: false, reposted: false, bookmarked: false, likedReplies: new Set() }
  const [{ data: likePost }, { data: repost }, { data: bookmark }, { data: likeReplies }] = await Promise.all([
    supabaseAdmin.from('stream_likes').select('id').eq('toko_id', viewerTokoId).eq('target_type', 'post').eq('target_id', postId).maybeSingle(),
    supabaseAdmin.from('stream_reposts').select('id').eq('toko_id', viewerTokoId).eq('post_id', postId).maybeSingle(),
    supabaseAdmin.from('stream_bookmarks').select('id').eq('toko_id', viewerTokoId).eq('post_id', postId).maybeSingle(),
    replyIds.length
      ? supabaseAdmin.from('stream_likes').select('target_id').eq('toko_id', viewerTokoId).eq('target_type', 'reply').in('target_id', replyIds)
      : { data: [] },
  ])
  return {
    likedPost: !!likePost,
    reposted: !!repost,
    bookmarked: !!bookmark,
    likedReplies: new Set((likeReplies || []).map(l => l.target_id)),
  }
}

// ================================================
// STREAM API
// ================================================

export const streamApi = {
  getFeed: async (token, params = {}) => {
    const userId = await verifyToken(token)
    const { data: viewerToko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    const viewerTokoId = viewerToko?.id || null

    let query = supabaseAdmin
      .from('stream_posts')
      .select('*, toko:toko_id(id,nama,slug,logo,plan), shop_link:shop_link_toko_id(id,nama,slug)')
      .order('created_at', { ascending: false })
      .limit(params.limit || 30)

    if (params.search) query = query.ilike('teks', `%${params.search}%`)

    if (params.tag) {
      const { data: tagRows } = await supabaseAdmin.from('stream_hashtags').select('post_id').eq('tag', params.tag)
      const ids = (tagRows || []).map(r => r.post_id)
      if (!ids.length) return { success: true, data: [] }
      query = query.in('id', ids)
    }

    const { data: posts, error } = await query
    if (error) handleError(error)

    const ids = (posts || []).map(p => p.id)
    const [{ data: hashtagRows }, { data: previewReplies }, viewerFlags] = await Promise.all([
      ids.length ? supabaseAdmin.from('stream_hashtags').select('post_id, tag').in('post_id', ids) : { data: [] },
      ids.length
        ? supabaseAdmin.from('stream_replies').select('*, toko:toko_id(id,nama,slug,logo,plan)').in('post_id', ids).is('parent_reply_id', null).order('created_at', { ascending: true })
        : { data: [] },
      getViewerFlags(viewerTokoId, ids),
    ])

    const hashtagsByPost = {}
    ;(hashtagRows || []).forEach(h => { (hashtagsByPost[h.post_id] ||= []).push(h.tag) })

    // Semua komentar top-level ditampilkan, tidak dibatasi lagi
    const repliesByPost = {}
    ;(previewReplies || []).forEach(r => {
      (repliesByPost[r.post_id] ||= []).push(r)
    })

    const result = (posts || []).map(p => mapStreamPost(p, {
      hashtags: hashtagsByPost[p.id] || [],
      previewReplies: (repliesByPost[p.id] || []).map(mapStreamReply),
      liked: viewerFlags.liked.has(p.id),
      reposted: viewerFlags.reposted.has(p.id),
      bookmarked: viewerFlags.bookmarked.has(p.id),
    }))

    return { success: true, data: result }
  },

  getPostDetail: async (token, postId) => {
    const userId = await verifyToken(token)
    const { data: viewerToko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    const viewerTokoId = viewerToko?.id || null

    const { data: post, error } = await supabaseAdmin
      .from('stream_posts')
      .select('*, toko:toko_id(id,nama,slug,logo,plan), shop_link:shop_link_toko_id(id,nama,slug)')
      .eq('id', postId)
      .single()
    if (error) handleError(error)

    const { data: hashtagRows } = await supabaseAdmin.from('stream_hashtags').select('tag').eq('post_id', postId)
    const { data: allReplies } = await supabaseAdmin
      .from('stream_replies')
      .select('*, toko:toko_id(id,nama,slug,logo,plan)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    const replyIds = (allReplies || []).map(r => r.id)
    const flags = await getViewerFlagsMixed(viewerTokoId, postId, replyIds)
    const tree = buildReplyTree(allReplies || [], flags.likedReplies)

    return {
      success: true,
      data: {
        ...mapStreamPost(post, {
          hashtags: (hashtagRows || []).map(h => h.tag),
          liked: flags.likedPost,
          reposted: flags.reposted,
          bookmarked: flags.bookmarked,
        }),
        replies: tree,
      }
    }
  },

  createPost: async (token, data) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('*').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const hashtags = extractHashtags(data.teks)

    const { data: post, error } = await supabaseAdmin
      .from('stream_posts')
      .insert({
        toko_id: toko.id,
        teks: data.teks,
        foto: JSON.stringify(data.foto || []),
        shop_link_toko_id: data.shopLinkTokoId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) handleError(error)

    if (hashtags.length) {
      await supabaseAdmin.from('stream_hashtags').insert(hashtags.map(tag => ({ post_id: post.id, tag })))
    }

    return { success: true, data: mapStreamPost(post, { toko, hashtags }) }
  },

  // Hapus post — hanya boleh oleh toko pemilik post
  deletePost: async (token, postId) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Toko tidak ditemukan', 404)

    const { data: post } = await supabaseAdmin.from('stream_posts').select('toko_id').eq('id', postId).single()
    if (!post) throw new ApiError('Post tidak ditemukan', 404)
    if (post.toko_id !== toko.id) throw new ApiError('Tidak diizinkan menghapus post ini', 403)

    await supabaseAdmin.from('stream_hashtags').delete().eq('post_id', postId)
    await supabaseAdmin.from('stream_replies').delete().eq('post_id', postId)
    await supabaseAdmin.from('stream_likes').delete().eq('target_type', 'post').eq('target_id', postId)
    await supabaseAdmin.from('stream_reposts').delete().eq('post_id', postId)
    await supabaseAdmin.from('stream_bookmarks').delete().eq('post_id', postId)
    await supabaseAdmin.from('stream_notifications').delete().eq('ref_post_id', postId)

    const { error } = await supabaseAdmin.from('stream_posts').delete().eq('id', postId)
    if (error) handleError(error)

    return { success: true }
  },

  addReply: async (token, { postId, parentReplyId, teks }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('*').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const { data: reply, error } = await supabaseAdmin
      .from('stream_replies')
      .insert({ post_id: postId, parent_reply_id: parentReplyId || null, toko_id: toko.id, teks, created_at: new Date().toISOString() })
      .select()
      .single()
    if (error) handleError(error)

    const { data: post } = await supabaseAdmin.from('stream_posts').select('toko_id').eq('id', postId).single()
    if (post && post.toko_id !== toko.id) {
      await supabaseAdmin.from('stream_notifications').insert({
        toko_id: post.toko_id, type: 'reply', actor_toko_id: toko.id, ref_post_id: postId, ref_reply_id: reply.id, created_at: new Date().toISOString(),
      })
    }

    // Notif ke pemilik parent reply (jika nested reply)
if (parentReplyId) {
  const { data: parentReply } = await supabaseAdmin
    .from('stream_replies')
    .select('toko_id')
    .eq('id', parentReplyId)
    .single()
  if (parentReply && parentReply.toko_id !== toko.id) {
    await supabaseAdmin.from('stream_notifications').insert({
      toko_id: parentReply.toko_id, type: 'reply', actor_toko_id: toko.id,
      ref_post_id: postId, ref_reply_id: reply.id, created_at: new Date().toISOString(),
    })
  }
}
    
    return { success: true, data: mapStreamReply({ ...reply, toko }) }
  },

  toggleLike: async (token, { targetType, targetId }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('*').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const { data: existing } = await supabaseAdmin
      .from('stream_likes').select('id').eq('toko_id', toko.id).eq('target_type', targetType).eq('target_id', targetId).maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin.from('stream_likes').delete().eq('id', existing.id)
      if (error) handleError(error)
      return { success: true, data: { liked: false } }
    }

    const { error } = await supabaseAdmin.from('stream_likes').insert({
      toko_id: toko.id, target_type: targetType, target_id: targetId, created_at: new Date().toISOString(),
    })
    if (error) handleError(error)

    if (targetType === 'post') {
      const { data: post } = await supabaseAdmin.from('stream_posts').select('toko_id').eq('id', targetId).single()
      if (post && post.toko_id !== toko.id) {
        await supabaseAdmin.from('stream_notifications').insert({
          toko_id: post.toko_id, type: 'like', actor_toko_id: toko.id, ref_post_id: targetId, created_at: new Date().toISOString(),
        })
      }
    }

    return { success: true, data: { liked: true } }
  },

  toggleRepost: async (token, { postId }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('*').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const { data: existing } = await supabaseAdmin
      .from('stream_reposts').select('id').eq('toko_id', toko.id).eq('post_id', postId).maybeSingle()

    if (existing) {
      const { error } = await supabaseAdmin.from('stream_reposts').delete().eq('id', existing.id)
      if (error) handleError(error)
      return { success: true, data: { reposted: false } }
    }

    const { error } = await supabaseAdmin.from('stream_reposts').insert({ toko_id: toko.id, post_id: postId, created_at: new Date().toISOString() })
    if (error) handleError(error)

    const { data: post } = await supabaseAdmin.from('stream_posts').select('toko_id').eq('id', postId).single()
    if (post && post.toko_id !== toko.id) {
      await supabaseAdmin.from('stream_notifications').insert({
        toko_id: post.toko_id, type: 'repost', actor_toko_id: toko.id, ref_post_id: postId, created_at: new Date().toISOString(),
      })
    }

    return { success: true, data: { reposted: true } }
  },

  toggleBookmark: async (token, { postId }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const { data: existing } = await supabaseAdmin
      .from('stream_bookmarks').select('id').eq('toko_id', toko.id).eq('post_id', postId).maybeSingle()

    if (existing) {
      await supabaseAdmin.from('stream_bookmarks').delete().eq('id', existing.id)
      return { success: true, data: { bookmarked: false } }
    }

    await supabaseAdmin.from('stream_bookmarks').insert({ toko_id: toko.id, post_id: postId, created_at: new Date().toISOString() })
    return { success: true, data: { bookmarked: true } }
  },

  getDmThreads: async (token) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) return { success: true, data: [] }

    const { data: threads, error } = await supabaseAdmin
      .from('stream_dm_threads')
      .select('*, toko_a:toko_a_id(id,nama,slug,logo,plan), toko_b:toko_b_id(id,nama,slug,logo,plan)')
      .or(`toko_a_id.eq.${toko.id},toko_b_id.eq.${toko.id}`)
      .order('last_message_at', { ascending: false })
    if (error) handleError(error)

    const threadIds = (threads || []).map(t => t.id)
    const { data: msgs } = threadIds.length
      ? await supabaseAdmin.from('stream_dm_messages').select('*').in('thread_id', threadIds).order('created_at', { ascending: false })
      : { data: [] }

    const lastByThread = {}
    ;(msgs || []).forEach(m => { if (!lastByThread[m.thread_id]) lastByThread[m.thread_id] = m })

    const unreadCount = {}
    ;(msgs || []).forEach(m => {
      if (m.sender_toko_id !== toko.id && !m.read_at) unreadCount[m.thread_id] = (unreadCount[m.thread_id] || 0) + 1
    })

    const result = (threads || []).map(t => {
      const other = t.toko_a_id === toko.id ? t.toko_b : t.toko_a
      const last = lastByThread[t.id]
      return {
        id: t.id,
        toko: other ? { id: other.id, nama: other.nama, slug: other.slug, logo: other.logo, pro: other.plan === 'pro' } : null,
        lastMessage: last?.teks || '',
        lastMessageAt: t.last_message_at,
        unread: unreadCount[t.id] || 0,
      }
    })

    return { success: true, data: result }
  },

  getDmMessages: async (token, threadId) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Toko tidak ditemukan', 404)

    const { data: messages, error } = await supabaseAdmin
      .from('stream_dm_messages').select('*').eq('thread_id', threadId).order('created_at', { ascending: true })
    if (error) handleError(error)

    await supabaseAdmin
      .from('stream_dm_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('thread_id', threadId)
      .neq('sender_toko_id', toko.id)
      .is('read_at', null)

    return {
      success: true,
      data: (messages || []).map(m => ({
        id: m.id, threadId: m.thread_id, teks: m.teks, createdAt: m.created_at, isMine: m.sender_toko_id === toko.id,
      }))
    }
  },

  openDmThread: async (token, { otherTokoId }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('*').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    if (otherTokoId === toko.id) throw new ApiError('Gak bisa DM toko sendiri', 400)
    const [a, b] = [toko.id, otherTokoId].sort()

    const { data: existing } = await supabaseAdmin.from('stream_dm_threads').select('id').eq('toko_a_id', a).eq('toko_b_id', b).maybeSingle()
    if (existing) return { success: true, data: { threadId: existing.id } }

    const { data: thread, error } = await supabaseAdmin
      .from('stream_dm_threads')
      .insert({ toko_a_id: a, toko_b_id: b, created_at: new Date().toISOString(), last_message_at: new Date().toISOString() })
      .select()
      .single()
    if (error) handleError(error)

    return { success: true, data: { threadId: thread.id } }
  },

  sendDmMessage: async (token, { threadId, teks }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const { data: msg, error } = await supabaseAdmin
      .from('stream_dm_messages')
      .insert({ thread_id: threadId, sender_toko_id: toko.id, teks, created_at: new Date().toISOString() })
      .select()
      .single()
    if (error) handleError(error)

    const { data: thread } = await supabaseAdmin.from('stream_dm_threads').select('toko_a_id, toko_b_id').eq('id', threadId).single()
    const recipientId = thread ? (thread.toko_a_id === toko.id ? thread.toko_b_id : thread.toko_a_id) : null
    if (recipientId) {
      await supabaseAdmin.from('stream_notifications').insert({
        toko_id: recipientId, type: 'dm', actor_toko_id: toko.id, ref_thread_id: threadId, created_at: new Date().toISOString(),
      })
    }

    return { success: true, data: { id: msg.id, threadId, teks: msg.teks, createdAt: msg.created_at, isMine: true } }
  },

  getNotifications: async (token) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) return { success: true, data: [] }

    // Join teks post & reply biar notif bisa nampilin excerpt yang relevan
    const { data, error } = await supabaseAdmin
      .from('stream_notifications')
      .select('*, actor:actor_toko_id(id,nama,slug,logo), post:ref_post_id(teks), reply:ref_reply_id(teks)')
      .eq('toko_id', toko.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) handleError(error)

    const excerpt = (txt) => {
      if (!txt) return null
      const clean = String(txt).trim()
      return clean.length > 60 ? clean.slice(0, 60) + '...' : clean
    }

    return {
      success: true,
      data: (data || []).map(n => ({
        id: n.id, type: n.type,
        actor: n.actor ? { id: n.actor.id, nama: n.actor.nama, slug: n.actor.slug, logo: n.actor.logo } : null,
        refPostId: n.ref_post_id, refReplyId: n.ref_reply_id, refThreadId: n.ref_thread_id,
        postExcerpt: excerpt(n.post?.teks),
        replyExcerpt: excerpt(n.reply?.teks),
        isRead: n.is_read, createdAt: n.created_at,
      }))
    }
  },

  markNotificationsRead: async (token) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) return { success: true }
    const { error } = await supabaseAdmin.from('stream_notifications').update({ is_read: true }).eq('toko_id', toko.id).eq('is_read', false)
    if (error) handleError(error)
    return { success: true }
  },


  uploadImage: async (token, { fileBase64, fileName, contentType }) => {
    const userId = await verifyToken(token)
    const { data: toko } = await supabaseAdmin.from('toko').select('id').eq('user_id', userId).single()
    if (!toko) throw new ApiError('Buat toko dulu', 400)
    const { data: userRow } = await supabaseAdmin.from('users').select('plan, plan_expiry').eq('id', userId).single()
    requirePro(userRow)

    const binaryStr = atob(fileBase64)
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i)
    }

    const ext = (fileName.split('.').pop() || 'jpg').toLowerCase()
    const path = `${toko.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const { error: upErr } = await supabaseAdmin.storage
      .from('stream-images')
      .upload(path, bytes, { contentType: contentType || 'image/jpeg', upsert: false })
    if (upErr) handleError(upErr)

    const { data: pub } = supabaseAdmin.storage.from('stream-images').getPublicUrl(path)
    return { success: true, data: { url: pub.publicUrl } }
  },
}
