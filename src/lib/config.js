// =============================================
// TOKOKU CONFIG — UPDATE SESUAI KEBUTUHAN
// =============================================

export const CONFIG = {
  // Google Apps Script Web App URL
  // Setelah deploy GAS, paste URL-nya di sini
  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',

  // Google OAuth Client ID
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Nomor WA Admin (format: 628xxx tanpa +)
  ADMIN_WA: import.meta.env.VITE_ADMIN_WA || '6283879527517',

  // App info
  APP_NAME: 'Exora',
  APP_TAGLINE: 'Buka toko online gratis, terima pesanan via WhatsApp',
  APP_URL: import.meta.env.VITE_APP_URL || 'https://exorav2.vercel.app',

  // Batas produk untuk free plan
  FREE_PRODUCT_LIMIT: 10,

  // Harga pro (untuk ditampilkan di UI)
  PRO_PRICE: 'Rp 49.000/bulan',
}

export const PLAN_FEATURES = {
  free: {
    name: 'Gratis',
    price: 'Rp 0',
    color: 'var(--text-secondary)',
    features: [
      `Hingga ${CONFIG.FREE_PRODUCT_LIMIT} produk`,
      '1 toko online',
      'Checkout via WhatsApp',
      'Subdomain tokoku.vercel.app/toko/slug',
      'Tema default',
      'Statistik dasar',
    ],
    limits: [
      'Tidak ada custom domain',
      'Tema terbatas',
      'Tanpa analytics lanjut',
    ]
  },
  pro: {
    name: 'Pro',
    price: CONFIG.PRO_PRICE,
    color: 'var(--accent)',
    features: [
      'Produk tidak terbatas',
      'Semua tema premium',
      'Custom domain',
      'Analytics lengkap',
      'Prioritas support',
      'Badge toko verified',
      'Manajemen pesanan',
      'Export data Excel',
    ],
    limits: []
  }
}
