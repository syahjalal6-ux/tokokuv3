// ================================================
// /api/og.js — Serverless Function untuk Open Graph Meta Tags
// Dipanggil oleh crawler sosmed (WA, IG, Threads, dll)
// GET /api/og?slug=nama-toko&produk=produk-id
// ================================================

import { createClient } from '@supabase/supabase-js'

const supabasePublic = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SECRET_KEY
)

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function formatRupiah(n) {
  if (!n && n !== 0) return ''
  return 'Rp' + Number(n).toLocaleString('id-ID')
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Deteksi apakah request dari crawler sosmed
function isCrawler(userAgent = '') {
  const ua = userAgent.toLowerCase()
  return (
    ua.includes('facebookexternalhit') ||
    ua.includes('whatsapp') ||
    ua.includes('twitterbot') ||
    ua.includes('linkedinbot') ||
    ua.includes('telegrambot') ||
    ua.includes('slackbot') ||
    ua.includes('discordbot') ||
    ua.includes('applebot') ||
    ua.includes('googlebot') ||
    ua.includes('bingbot') ||
    ua.includes('ia_archiver') ||
    ua.includes('preview')
  )
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const { slug, produk: produkId } = req.query
  const userAgent = req.headers['user-agent'] || ''
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`

  // Kalau bukan crawler, redirect ke halaman React langsung
  if (!isCrawler(userAgent)) {
    const dest = produkId ? `/${slug}?produk=${produkId}` : `/${slug}`
    return res.redirect(302, dest)
  }

  try {
    // Fetch data toko
    const { data: toko, error: tokoErr } = await supabasePublic
      .from('toko')
      .select('id, nama, slug, deskripsi, logo')
      .eq('slug', slug)
      .maybeSingle()

    if (tokoErr || !toko) {
      return res.status(404).send(buildHtml({
        title: 'Toko tidak ditemukan',
        description: '',
        image: `${baseUrl}/og-default.png`,
        url: `${baseUrl}/${slug}`,
      }))
    }

    // Kalau ada produkId, fetch produk
    let title = escapeHtml(toko.nama)
    let description = escapeHtml(toko.deskripsi || `Belanja di ${toko.nama}`)
    let image = toko.logo || `${baseUrl}/og-default.png`
    const url = produkId
      ? `${baseUrl}/${slug}?produk=${produkId}`
      : `${baseUrl}/${slug}`

    if (produkId) {
      const { data: produk } = await supabasePublic
        .from('produk')
        .select('nama, harga, deskripsi, foto')
        .eq('id', produkId)
        .maybeSingle()

      if (produk) {
        const fotos = parseFotos(produk.foto)
        title = escapeHtml(`${produk.nama} — ${formatRupiah(produk.harga)}`)
        description = escapeHtml(
          produk.deskripsi
            ? produk.deskripsi.slice(0, 120)
            : `Beli ${produk.nama} di ${toko.nama}`
        )
        if (fotos[0]) image = fotos[0]
      }
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
    return res.status(200).send(buildHtml({ title, description, image, url, tokoNama: toko.nama }))

  } catch (err) {
    console.error('og.js error:', err)
    return res.status(500).send('<html><body>Error</body></html>')
  }
}

function buildHtml({ title, description, image, url, tokoNama }) {
  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>

  <!-- Primary Meta -->
  <meta name="title" content="${title}" />
  <meta name="description" content="${description}" />

  <!-- Open Graph / Facebook / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${url}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  ${tokoNama ? `<meta property="og:site_name" content="${escapeHtml(tokoNama)}" />` : ''}

  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${url}" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${image}" />

  <!-- Redirect browser biasa ke React app -->
  <meta http-equiv="refresh" content="0; url=${url}" />
</head>
<body>
  <p>Mengalihkan ke <a href="${url}">${title}</a>...</p>
</body>
</html>`
}
