export const config = { runtime: 'edge' }

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzNFrArQcqL7BUh_uv3z2tNG0OoYI0EXZhsFGTrt0IfmxKTG4ascHDbUJ8CSjCXPnT1/exec'

const TEMA_COLORS = {
  default: { accent: '#5b8af5', bg: '#0a0a0f' },
  emerald: { accent: '#10b981', bg: '#0a0f0d' },
  sunset:  { accent: '#f59e0b', bg: '#0f0d0a' },
  rose:    { accent: '#f43f5e', bg: '#0f0a0d' },
}

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let nama = slug
  let deskripsi = 'Belanja mudah via WhatsApp'
  let tema = 'default'
  let logo = null

  try {
    const r = await fetch(`${GAS_URL}?action=getTokoBySlug&slug=${slug}`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = await r.json()
    if (json.data) {
      nama = json.data.nama || slug
      deskripsi = json.data.deskripsi || deskripsi
      tema = json.data.tema || 'default'
      logo = json.data.logo || null
    }
  } catch {}

  const colors = TEMA_COLORS[tema] || TEMA_COLORS.default

  const icons = logo
    ? [
        { src: logo, sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: logo, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]
    : [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ]

  const manifest = {
    name: `${nama} — Exora`,
    short_name: nama,
    description: deskripsi,
    start_url: `/${slug}`,
    scope: `/`,
    display: 'standalone',
    orientation: 'portrait',
    background_color: colors.bg,
    theme_color: colors.accent,
    icons,
    categories: ['shopping', 'business'],
    lang: 'id',
  }

  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
