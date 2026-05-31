// ================================================
// TOKOKU — Google Apps Script Backend
// ================================================
// Setup:
// 1. Buka script.google.com → New Project → Paste kode ini
// 2. Ganti SPREADSHEET_ID dan DRIVE_FOLDER_ID
// 3. Deploy → New Deployment → Web App
//    - Execute as: Me
//    - Who has access: Anyone
// 4. Copy Web App URL ke .env frontend (VITE_GAS_URL)
// ================================================

// ============ CONFIG ============
const SPREADSHEET_ID = 'GANTI_DENGAN_SPREADSHEET_ID_KAMU'
const DRIVE_FOLDER_ID = 'GANTI_DENGAN_FOLDER_ID_DRIVE_KAMU'
const ADMIN_EMAIL = 'emailkamu@gmail.com'
const FREE_PRODUCT_LIMIT = 10
const TOKEN_EXPIRY_DAYS = 30

// Sheet names
const SHEETS = {
  USERS: 'Users',
  TOKO: 'Toko',
  PRODUK: 'Produk',
  PESANAN: 'Pesanan',
  PESANAN_ITEMS: 'PesananItems',
  TOKENS: 'Tokens',
}

// ============ MAIN HANDLERS ============

function doGet(e) {
  try {
    const action = e.parameter.action
    const params = e.parameter
    const result = handleAction(action, params)
    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ success: false, message: err.message })
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents)
    const action = body.action
    const result = handleAction(action, body)
    return jsonResponse(result)
  } catch (err) {
    return jsonResponse({ success: false, message: err.message })
  }
}

function handleAction(action, params) {
  switch (action) {
    // Auth
    case 'loginWithGoogle':  return loginWithGoogle(params)
    case 'getMe':            return getMe(params)
    case 'logout':           return logout(params)

    // Toko
    case 'createToko':       return createToko(params)
    case 'updateToko':       return updateToko(params)
    case 'getMyToko':        return getMyToko(params)
    case 'getTokoBySlug':    return getTokoBySlug(params)
    case 'checkSlug':        return checkSlug(params)
    case 'requestUpgrade':   return requestUpgrade(params)
    case 'confirmUpgrade':   return confirmUpgrade(params)

    // Produk
    case 'createProduk':     return createProduk(params)
    case 'updateProduk':     return updateProduk(params)
    case 'deleteProduk':     return deleteProduk(params)
    case 'getMyProduk':      return getMyProduk(params)
    case 'getProdukByToko':  return getProdukByToko(params)
    case 'getProdukById':    return getProdukById(params)
    case 'uploadFoto':       return uploadFoto(params)

    // Pesanan
    case 'createPesanan':    return createPesanan(params)
    case 'getMyPesanan':     return getMyPesanan(params)
    case 'updatePesananStatus': return updatePesananStatus(params)
    case 'getPesananById':   return getPesananById(params)

    // Analytics
    case 'getAnalytics':     return getAnalytics(params)

    default:
      throw new Error('Action tidak dikenal: ' + action)
  }
}

// ============ HELPERS ============

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON)
}

function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = ss.getSheetByName(name)
  if (!sheet) {
    sheet = ss.insertSheet(name)
    initSheet(sheet, name)
  }
  return sheet
}

function initSheet(sheet, name) {
  const headers = {
    [SHEETS.USERS]: ['id','email','name','picture','googleId','plan','planExpiry','tokoId','createdAt','updatedAt'],
    [SHEETS.TOKO]: ['id','userId','nama','slug','deskripsi','wa','tema','customDomain','plan','createdAt','updatedAt'],
    [SHEETS.PRODUK]: ['id','tokoId','userId','nama','deskripsi','harga','hargaCoret','stok','kategori','berat','foto','aktif','createdAt','updatedAt'],
    [SHEETS.PESANAN]: ['id','tokoId','buyerNama','buyerWa','buyerAlamat','catatan','total','status','createdAt','updatedAt'],
    [SHEETS.PESANAN_ITEMS]: ['id','pesananId','produkId','nama','harga','qty','foto'],
    [SHEETS.TOKENS]: ['token','userId','expiresAt'],
  }
  if (headers[name]) {
    sheet.appendRow(headers[name])
    sheet.setFrozenRows(1)
  }
}

function sheetToObjects(sheet) {
  const data = sheet.getDataRange().getValues()
  if (data.length < 2) return []
  const headers = data[0]
  return data.slice(1).map(row => {
    const obj = {}
    headers.forEach((h, i) => { obj[h] = row[i] === '' ? null : row[i] })
    return obj
  })
}

function findRowIndex(sheet, colIndex, value) {
  const data = sheet.getDataRange().getValues()
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][colIndex]) === String(value)) return i + 1 // 1-based
  }
  return -1
}

function updateRow(sheet, rowIndex, updates) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
  const row = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0]
  headers.forEach((h, i) => {
    if (updates[h] !== undefined) row[i] = updates[h]
  })
  sheet.getRange(rowIndex, 1, 1, headers.length).setValues([row])
}

function generateId() {
  return Utilities.getUuid().replace(/-/g, '').slice(0, 16)
}

function generateToken() {
  return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '')
}

function now() {
  return new Date().toISOString()
}

function verifyToken(token) {
  if (!token) throw new Error('Token diperlukan')
  const sheet = getSheet(SHEETS.TOKENS)
  const tokens = sheetToObjects(sheet)
  const t = tokens.find(t => t.token === token)
  if (!t) throw new Error('Token tidak valid')
  if (new Date(t.expiresAt) < new Date()) throw new Error('Token kadaluarsa, silakan login ulang')
  return t.userId
}

// ============ AUTH ============

function loginWithGoogle(params) {
  const { email, name, picture, googleId } = params
  if (!email || !googleId) throw new Error('Data Google tidak lengkap')

  const usersSheet = getSheet(SHEETS.USERS)
  const users = sheetToObjects(usersSheet)
  let user = users.find(u => u.googleId === googleId || u.email === email)

  if (user) {
    // Update user info
    const rowIndex = findRowIndex(usersSheet, 0, user.id)
    updateRow(usersSheet, rowIndex, { name, picture, updatedAt: now() })
    user = { ...user, name, picture }
  } else {
    // Create new user
    user = {
      id: generateId(),
      email, name, picture, googleId,
      plan: 'free',
      planExpiry: null,
      tokoId: null,
      createdAt: now(),
      updatedAt: now(),
    }
    usersSheet.appendRow(Object.values(user))
  }

  // Create token
  const token = generateToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS)
  getSheet(SHEETS.TOKENS).appendRow([token, user.id, expiresAt.toISOString()])

  return { success: true, data: { user, token } }
}

function getMe(params) {
  const userId = verifyToken(params.token)
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  if (!user) throw new Error('User tidak ditemukan')
  return { success: true, data: user }
}

function logout(params) {
  const { token } = params
  const sheet = getSheet(SHEETS.TOKENS)
  const tokens = sheetToObjects(sheet)
  const idx = tokens.findIndex(t => t.token === token)
  if (idx >= 0) {
    sheet.deleteRow(idx + 2) // +2: 1 for header, 1 for 0-based
  }
  return { success: true }
}

// ============ TOKO ============

function createToko(params) {
  const { token, nama, slug, deskripsi, wa } = params
  const userId = verifyToken(token)

  if (!nama || !slug) throw new Error('Nama dan slug wajib diisi')

  // Check slug available
  const tokoSheet = getSheet(SHEETS.TOKO)
  const tokos = sheetToObjects(tokoSheet)
  if (tokos.find(t => t.slug === slug)) throw new Error('Slug sudah dipakai, coba yang lain')
  if (tokos.find(t => t.userId === userId)) throw new Error('Kamu sudah punya toko')

  // Validate slug format
  if (!/^[a-z0-9][a-z0-9-]{2,29}$/.test(slug)) throw new Error('Format slug tidak valid')

  const toko = {
    id: generateId(),
    userId, nama, slug,
    deskripsi: deskripsi || '',
    wa: wa || '',
    tema: 'default',
    customDomain: '',
    plan: 'free',
    createdAt: now(),
    updatedAt: now(),
  }

  tokoSheet.appendRow(Object.values(toko))

  // Update user tokoId
  const usersSheet = getSheet(SHEETS.USERS)
  const rowIndex = findRowIndex(usersSheet, 0, userId)
  if (rowIndex > 0) updateRow(usersSheet, rowIndex, { tokoId: toko.id, updatedAt: now() })

  return { success: true, data: toko }
}

function updateToko(params) {
  const { token, tokoId, nama, deskripsi, wa, tema, customDomain } = params
  const userId = verifyToken(token)

  const tokoSheet = getSheet(SHEETS.TOKO)
  const tokos = sheetToObjects(tokoSheet)
  const toko = tokos.find(t => t.id === tokoId && t.userId === userId)
  if (!toko) throw new Error('Toko tidak ditemukan')

  // Custom domain hanya pro
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  const updates = { updatedAt: now() }
  if (nama) updates.nama = nama
  if (deskripsi !== undefined) updates.deskripsi = deskripsi
  if (wa) updates.wa = wa
  if (tema) updates.tema = tema
  if (customDomain !== undefined && user.plan === 'pro') updates.customDomain = customDomain

  const rowIndex = findRowIndex(tokoSheet, 0, tokoId)
  updateRow(tokoSheet, rowIndex, updates)

  return { success: true, data: { ...toko, ...updates } }
}

function getMyToko(params) {
  const userId = verifyToken(params.token)
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.userId === userId)
  return { success: true, data: toko || null }
}

function getTokoBySlug(params) {
  const { slug } = params
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.slug === slug)
  if (!toko) throw new Error('Toko tidak ditemukan')
  return { success: true, data: toko }
}

function checkSlug(params) {
  const { slug } = params
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const available = !tokos.find(t => t.slug === slug)
  return { success: true, data: { available } }
}

function requestUpgrade(params) {
  const userId = verifyToken(params.token)
  // Kirim notif email ke admin
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  if (user) {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: '[TokoKu] Request Upgrade Pro',
      body: `User ${user.name} (${user.email}) minta upgrade ke Pro.\nUser ID: ${user.id}`,
    })
  }
  return { success: true, message: 'Request upgrade terkirim' }
}

function confirmUpgrade(params) {
  const { adminToken, userId } = params
  // Admin verify via token
  const adminUserId = verifyToken(adminToken)
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const adminUser = users.find(u => u.id === adminUserId)
  if (adminUser?.email !== ADMIN_EMAIL) throw new Error('Tidak ada akses')

  const usersSheet = getSheet(SHEETS.USERS)
  const rowIndex = findRowIndex(usersSheet, 0, userId)
  if (rowIndex < 0) throw new Error('User tidak ditemukan')

  const expiry = new Date()
  expiry.setMonth(expiry.getMonth() + 1)
  updateRow(usersSheet, rowIndex, { plan: 'pro', planExpiry: expiry.toISOString(), updatedAt: now() })

  // Update toko plan
  const tokoSheet = getSheet(SHEETS.TOKO)
  const tokoRowIndex = findRowIndex(tokoSheet, 1, userId) // col 1 = userId
  if (tokoRowIndex > 0) {
    updateRow(tokoSheet, tokoRowIndex, { plan: 'pro', updatedAt: now() })
  }

  return { success: true, message: 'Upgrade berhasil' }
}

// ============ PRODUK ============

function createProduk(params) {
  const { token, nama, deskripsi, harga, hargaCoret, stok, kategori, berat, aktif, base64Image, mimeType, fileName } = params
  const userId = verifyToken(token)

  if (!nama || harga === undefined) throw new Error('Nama dan harga wajib diisi')

  // Check limit free plan
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  if (user?.plan !== 'pro') {
    const produkSheet = getSheet(SHEETS.PRODUK)
    const myProduk = sheetToObjects(produkSheet).filter(p => p.userId === userId)
    if (myProduk.length >= FREE_PRODUCT_LIMIT) {
      throw new Error(`Batas ${FREE_PRODUCT_LIMIT} produk untuk paket gratis. Upgrade ke Pro untuk produk unlimited.`)
    }
  }

  // Get tokoId
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.userId === userId)
  if (!toko) throw new Error('Buat toko dulu sebelum menambahkan produk')

  // Upload foto jika ada
  let fotoUrl = null
  if (base64Image && mimeType) {
    fotoUrl = uploadImageToDrive(base64Image, mimeType, fileName || 'produk.jpg', toko.id)
  }

  const produk = {
    id: generateId(),
    tokoId: toko.id,
    userId,
    nama,
    deskripsi: deskripsi || '',
    harga: Number(harga),
    hargaCoret: hargaCoret ? Number(hargaCoret) : '',
    stok: stok !== null && stok !== undefined && stok !== '' ? Number(stok) : '',
    kategori: kategori || '',
    berat: berat ? Number(berat) : '',
    foto: fotoUrl || '',
    aktif: aktif !== false,
    createdAt: now(),
    updatedAt: now(),
  }

  getSheet(SHEETS.PRODUK).appendRow(Object.values(produk))
  return { success: true, data: produk }
}

function updateProduk(params) {
  const { token, produkId, nama, deskripsi, harga, hargaCoret, stok, kategori, berat, aktif, foto, base64Image, mimeType, fileName } = params
  const userId = verifyToken(token)

  const produkSheet = getSheet(SHEETS.PRODUK)
  const produks = sheetToObjects(produkSheet)
  const produk = produks.find(p => p.id === produkId && p.userId === userId)
  if (!produk) throw new Error('Produk tidak ditemukan')

  let fotoUrl = produk.foto
  if (base64Image && mimeType) {
    fotoUrl = uploadImageToDrive(base64Image, mimeType, fileName || 'produk.jpg', produk.tokoId)
  } else if (foto !== undefined) {
    fotoUrl = foto
  }

  const updates = { updatedAt: now() }
  if (nama !== undefined) updates.nama = nama
  if (deskripsi !== undefined) updates.deskripsi = deskripsi
  if (harga !== undefined) updates.harga = Number(harga)
  if (hargaCoret !== undefined) updates.hargaCoret = hargaCoret ? Number(hargaCoret) : ''
  if (stok !== undefined) updates.stok = stok !== '' && stok !== null ? Number(stok) : ''
  if (kategori !== undefined) updates.kategori = kategori
  if (berat !== undefined) updates.berat = berat ? Number(berat) : ''
  if (aktif !== undefined) updates.aktif = aktif
  if (fotoUrl !== undefined) updates.foto = fotoUrl

  const rowIndex = findRowIndex(produkSheet, 0, produkId)
  updateRow(produkSheet, rowIndex, updates)

  return { success: true, data: { ...produk, ...updates } }
}

function deleteProduk(params) {
  const { token, produkId } = params
  const userId = verifyToken(token)

  const produkSheet = getSheet(SHEETS.PRODUK)
  const produks = sheetToObjects(produkSheet)
  const produk = produks.find(p => p.id === produkId && p.userId === userId)
  if (!produk) throw new Error('Produk tidak ditemukan')

  const rowIndex = findRowIndex(produkSheet, 0, produkId)
  produkSheet.deleteRow(rowIndex)

  return { success: true }
}

function getMyProduk(params) {
  const userId = verifyToken(params.token)
  const produks = sheetToObjects(getSheet(SHEETS.PRODUK))
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { success: true, data: produks }
}

function getProdukByToko(params) {
  const { tokoId, kategori } = params

  // tokoId bisa berupa slug
  let actualTokoId = tokoId
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.id === tokoId || t.slug === tokoId)
  if (toko) actualTokoId = toko.id

  let produks = sheetToObjects(getSheet(SHEETS.PRODUK))
    .filter(p => p.tokoId === actualTokoId && p.aktif === true)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (kategori) produks = produks.filter(p => p.kategori === kategori)

  return { success: true, data: produks }
}

function getProdukById(params) {
  const { produkId } = params
  const produks = sheetToObjects(getSheet(SHEETS.PRODUK))
  const produk = produks.find(p => p.id === produkId)
  if (!produk) throw new Error('Produk tidak ditemukan')
  return { success: true, data: produk }
}

function uploadFoto(params) {
  const { token, produkId, base64Image, mimeType, fileName } = params
  const userId = verifyToken(token)

  const produks = sheetToObjects(getSheet(SHEETS.PRODUK))
  const produk = produks.find(p => p.id === produkId && p.userId === userId)
  if (!produk) throw new Error('Produk tidak ditemukan')

  const url = uploadImageToDrive(base64Image, mimeType, fileName || 'foto.jpg', produk.tokoId)

  const produkSheet = getSheet(SHEETS.PRODUK)
  const rowIndex = findRowIndex(produkSheet, 0, produkId)
  updateRow(produkSheet, rowIndex, { foto: url, updatedAt: now() })

  return { success: true, data: { url } }
}

function uploadImageToDrive(base64Image, mimeType, fileName, tokoId) {
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID)

  // Create subfolder per toko
  let tokoFolder
  const folderIter = folder.getFoldersByName(tokoId)
  if (folderIter.hasNext()) {
    tokoFolder = folderIter.next()
  } else {
    tokoFolder = folder.createFolder(tokoId)
  }

  const blob = Utilities.newBlob(Utilities.base64Decode(base64Image), mimeType, fileName)
  const file = tokoFolder.createFile(blob)
  file.setSharing(DriveApp.Access.ANYONE, DriveApp.Permission.VIEW)

  // Return direct image URL
  return `https://drive.google.com/uc?export=view&id=${file.getId()}`
}

// ============ PESANAN ============

function createPesanan(params) {
  const { tokoId, buyerNama, buyerWa, buyerAlamat, catatan, items } = params

  if (!tokoId || !buyerNama || !buyerWa || !buyerAlamat || !items || !items.length) {
    throw new Error('Data pesanan tidak lengkap')
  }

  // Verify toko ada
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.id === tokoId || t.slug === tokoId)
  if (!toko) throw new Error('Toko tidak ditemukan')

  // Hitung total
  const total = items.reduce((sum, item) => sum + (item.harga * item.qty), 0)

  const pesananId = generateId()
  const pesanan = {
    id: pesananId,
    tokoId: toko.id,
    buyerNama, buyerWa, buyerAlamat,
    catatan: catatan || '',
    total,
    status: 'pending',
    createdAt: now(),
    updatedAt: now(),
  }

  getSheet(SHEETS.PESANAN).appendRow(Object.values(pesanan))

  // Save items
  const itemsSheet = getSheet(SHEETS.PESANAN_ITEMS)
  items.forEach(item => {
    itemsSheet.appendRow([generateId(), pesananId, item.produkId, item.nama, item.harga, item.qty, item.foto || ''])
  })

  // Notify seller via email
  try {
    const sellerUsers = sheetToObjects(getSheet(SHEETS.USERS))
    const seller = sellerUsers.find(u => u.id === toko.userId)
    if (seller) {
      const itemsList = items.map(i => `- ${i.nama} x${i.qty} = Rp ${(i.harga * i.qty).toLocaleString('id-ID')}`).join('\n')
      MailApp.sendEmail({
        to: seller.email,
        subject: `[TokoKu] Pesanan Baru dari ${buyerNama}!`,
        body: `Halo ${seller.name},\n\nAda pesanan baru masuk ke toko "${toko.nama}":\n\n${itemsList}\n\nTotal: Rp ${total.toLocaleString('id-ID')}\n\nPembeli: ${buyerNama}\nWA: ${buyerWa}\nAlamat: ${buyerAlamat}\n${catatan ? 'Catatan: ' + catatan : ''}\n\nSegera hubungi pembeli via WA!\n\n— Tim TokoKu`,
      })
    }
  } catch (e) {
    // Email notification not critical
  }

  return { success: true, data: { ...pesanan, items } }
}

function getMyPesanan(params) {
  const { token, status } = params
  const userId = verifyToken(token)

  // Check pro plan
  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  if (user?.plan !== 'pro') throw new Error('Fitur ini hanya untuk pengguna Pro')

  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.userId === userId)
  if (!toko) return { success: true, data: [] }

  let pesanans = sheetToObjects(getSheet(SHEETS.PESANAN))
    .filter(p => p.tokoId === toko.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  if (status && status !== 'all') {
    pesanans = pesanans.filter(p => p.status === status)
  }

  // Attach items
  const allItems = sheetToObjects(getSheet(SHEETS.PESANAN_ITEMS))
  pesanans = pesanans.map(p => ({
    ...p,
    items: allItems.filter(i => i.pesananId === p.id),
  }))

  return { success: true, data: pesanans }
}

function updatePesananStatus(params) {
  const { token, pesananId, status } = params
  const userId = verifyToken(token)

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'done', 'cancelled']
  if (!validStatuses.includes(status)) throw new Error('Status tidak valid')

  const pesananSheet = getSheet(SHEETS.PESANAN)
  const pesanans = sheetToObjects(pesananSheet)
  const pesanan = pesanans.find(p => p.id === pesananId)
  if (!pesanan) throw new Error('Pesanan tidak ditemukan')

  // Verify ownership
  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.id === pesanan.tokoId && t.userId === userId)
  if (!toko) throw new Error('Tidak ada akses')

  const rowIndex = findRowIndex(pesananSheet, 0, pesananId)
  updateRow(pesananSheet, rowIndex, { status, updatedAt: now() })

  return { success: true, data: { ...pesanan, status } }
}

function getPesananById(params) {
  const { pesananId, buyerWa } = params
  const pesanans = sheetToObjects(getSheet(SHEETS.PESANAN))
  const pesanan = pesanans.find(p => p.id === pesananId)
  if (!pesanan) throw new Error('Pesanan tidak ditemukan')
  if (pesanan.buyerWa !== buyerWa) throw new Error('Tidak ada akses')

  const items = sheetToObjects(getSheet(SHEETS.PESANAN_ITEMS)).filter(i => i.pesananId === pesananId)
  return { success: true, data: { ...pesanan, items } }
}

// ============ ANALYTICS ============

function getAnalytics(params) {
  const userId = verifyToken(params.token)

  const users = sheetToObjects(getSheet(SHEETS.USERS))
  const user = users.find(u => u.id === userId)
  if (user?.plan !== 'pro') throw new Error('Fitur ini hanya untuk pengguna Pro')

  const tokos = sheetToObjects(getSheet(SHEETS.TOKO))
  const toko = tokos.find(t => t.userId === userId)
  if (!toko) return { success: true, data: {} }

  const produk = sheetToObjects(getSheet(SHEETS.PRODUK)).filter(p => p.tokoId === toko.id)
  const pesanans = sheetToObjects(getSheet(SHEETS.PESANAN)).filter(p => p.tokoId === toko.id)
  const allItems = sheetToObjects(getSheet(SHEETS.PESANAN_ITEMS))

  const done = pesanans.filter(p => p.status === 'done')
  const totalRevenue = done.reduce((s, p) => s + Number(p.total), 0)

  // Top produk
  const itemCounts = {}
  allItems.filter(i => done.map(p => p.id).includes(i.pesananId)).forEach(i => {
    itemCounts[i.produkId] = (itemCounts[i.produkId] || 0) + Number(i.qty)
  })
  const topProduk = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, qty]) => {
      const p = produk.find(p => p.id === id)
      return { nama: p?.nama || 'Unknown', qty }
    })

  return {
    success: true,
    data: {
      totalProduk: produk.length,
      produkAktif: produk.filter(p => p.aktif).length,
      totalPesanan: pesanans.length,
      pesananPending: pesanans.filter(p => p.status === 'pending').length,
      pesananSelesai: done.length,
      totalRevenue,
      topProduk,
    }
  }
}
