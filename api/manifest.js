export default function handler(req, res) {
  const { slug } = req.query

  res.setHeader('Content-Type', 'application/manifest+json')
  res.status(200).json({
    name: "Exora — Start. Sell. Scale.",
    short_name: "Exora",
    description: "Platform toko online mudah dan cepat",
    start_url: `/toko/${slug}`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#5b8af5",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ],
    categories: ["shopping", "business"],
    lang: "id"
  })
}
