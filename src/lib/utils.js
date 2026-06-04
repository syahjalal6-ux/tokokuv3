import { CONFIG } from './config.js'

// Format harga ke Rupiah
export function formatRupiah(amount) {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format tanggal
export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options
  }).format(new Date(dateStr))
}

// Format tanggal pendek
export function formatDateShort(dateStr) {
  return formatDate(dateStr, { day: 'numeric', month: 'short', year: 'numeric' })
}

// Format tanggal + waktu
export function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

// Slugify text
export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Validate slug
export function isValidSlug(slug) {
  return /^[a-z0-9][a-z0-9-]{2,29}$/.test(slug)
}

// Validate & normalisasi nomor WA (format Indonesia)
// Selalu return string E.164 tanpa '+' (misal '6281234567890'), atau null jika tidak valid
// Guard: handle null, undefined, number (dari GAS spreadsheet yang simpan angka)
export function validateWA(wa) {
  if (wa === null || wa === undefined || wa === '') return null
  const clean = String(wa).replace(/\D/g, '')  // hapus semua non-digit, termasuk spasi dan +
  if (clean.length < 8) return null             // terlalu pendek, pasti salah
  if (clean.startsWith('0')) return '62' + clean.slice(1)
  if (clean.startsWith('62')) return clean
  if (clean.startsWith('8')) return '62' + clean
  return null
}

// Format WA untuk display
export function formatWADisplay(wa) {
  if (!wa) return '-'
  const clean = String(wa).replace(/\D/g, '')
  const num = clean.startsWith('62') ? clean : '62' + clean
  return '+' + num.slice(0, 2) + ' ' + num.slice(2, 5) + '-' + num.slice(5, 9) + '-' + num.slice(9)
}

// Generate WA link — aman meski wa null/undefined/number
export function generateWALink(wa, message = '') {
  const clean = validateWA(wa)
  if (!clean) return '#'
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${clean}${message ? '?text=' + encoded : ''}`
}

// Generate pesan checkout WA
export function generateCheckoutMessage(produk, toko, buyer) {
  return `Halo ${toko.nama}, saya mau pesan:

🛍️ *${produk.nama}*
💰 Harga: ${formatRupiah(produk.harga)}
📦 Qty: ${buyer.qty || 1}

Nama: ${buyer.nama}
Alamat: ${buyer.alamat}
${buyer.catatan ? `Catatan: ${buyer.catatan}` : ''}

Total: ${formatRupiah(produk.harga * (buyer.qty || 1))}

Mohon konfirmasi ketersediaan ya! 🙏`
}

// Generate pesan upgrade pro ke admin
export function generateUpgradeMessage(user, toko) {
  return `Halo Admin Exora, saya ingin upgrade ke Pro:

👤 Nama: ${user.name}
📧 Email: ${user.email}
🏪 Toko: ${toko?.nama || '-'}
🔗 Slug: ${toko?.slug || '-'}

Mohon info cara pembayarannya ya! 🙏`
}

// Truncate text — handle non-string values
export function truncate(text, length = 100) {
  if (text === null || text === undefined || text === '') return ''
  const str = String(text)
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

// Get initials dari nama
export function getInitials(name) {
  if (!name) return '?'
  return String(name)
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()
}

// File to base64
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Compress image sebelum upload
export function compressImage(file, maxWidth = 800, quality = 0.8) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })),
          'image/jpeg',
          quality
        )
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

// Status pesanan
export const PESANAN_STATUS = {
  pending: { label: 'Menunggu', color: 'warning' },
  confirmed: { label: 'Dikonfirmasi', color: 'success' },
  processing: { label: 'Diproses', color: 'accent' },
  shipped: { label: 'Dikirim', color: 'accent' },
  done: { label: 'Selesai', color: 'success' },
  cancelled: { label: 'Dibatalkan', color: 'danger' },
}

// Cek apakah user adalah pro
export function isPro(user) {
  return user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date()
}

// Storefront URL
export function getStorefrontUrl(slug) {
  return `${CONFIG.APP_URL}/toko/${slug}`
}

// Debounce
export function debounce(fn, delay) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Copy to clipboard
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    return true
  }
}
