export const config = { runtime: 'edge' }

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzNFrArQcqL7BUh_uv3z2tNG0OoYI0EXZhsFGTrt0IfmxKTG4ascHDbUJ8CSjCXPnT1/exec'

export default async function handler(req) {
  const { searchParams } = new URL(req.url)
  const slug = searchParams.get('slug')

  const ua = req.headers.get('user-agent') || ''
  const isBot = /whatsapp|telegram|facebook|twitter|linkedin|bot|crawler|spider/i.test(ua)

  if (!isBot) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/toko/${slug}` },
    })
  }

  let tokoNama = slug
  let tokoDeskripsi = 'Belanja mudah via WhatsApp'

  try {
    const r = await fetch(`${GAS_URL}?action=getTokoBySlug&slug=${slug}`)
    const json = await r.json()
    if (json.data) {
      tokoNama = json.data.nama || slug
      tokoDeskripsi = json.data.deskripsi || tokoDeskripsi
    }
  } catch {}

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${tokoNama} — Exora</title>
  <meta name="description" content="${tokoDeskripsi}" />
  <meta property="og:title" content="${tokoNama} — Exora" />
  <meta property="og:description" content="${tokoDeskripsi}" />
  <meta property="og:url" content="https://exorav2.vercel.app/toko/${slug}" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content="https://exorav2.vercel.app/icons/icon-512.png" />
  <meta name="twitter:card" content="summary_large_image" />
</head>
<body>
  <script>window.location.href = '/toko/${slug}'</script>
</body>
</html>`

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  })
}
