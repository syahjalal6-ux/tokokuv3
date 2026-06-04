const GAS_URL = 'https://script.google.com/macros/s/AKfycbzNFrArQcqL7BUh_uv3z2tNG0OoYI0EXZhsFGTrt0IfmxKTG4ascHDbUJ8CSjCXPnT1/exec'

export default async function handler(req, res) {
  const { slug } = req.query

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

  const ua = req.headers['user-agent'] || ''
  const isBot = /whatsapp|telegram|facebook|twitter|linkedin|bot|crawler|spider/i.test(ua)

  if (!isBot) {
    res.redirect(302, `/toko/${slug}#spa`)
    return
  }

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
  <meta http-equiv="refresh" content="0;url=/toko/${slug}#spa" />
</head>
<body>
  <script>window.location.href = '/toko/${slug}'</script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}
