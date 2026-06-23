// =============================================
// TOKOKU CONFIG — UPDATE SESUAI KEBUTUHAN
// =============================================

export const CONFIG = {
  // Google Apps Script Web App URL
  // Setelah deploy GAS, paste URL-nya di sini
  GAS_URL: import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '',

  //Livekit
  LIVEKIT_URL: 'wss://exora-85vdrsxe.livekit.cloud',
  LIVEKIT_API_KEY: 'API8L7e9n2Kwu6W',
  LIVEKIT_API_SECRET: 'qIWnbZosENTeUO9PFqMUqi0Xp8DWeqavM3VpF8Hw2f5B',
  
  // Google OAuth Client ID
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',

  // Nomor WA Admin (format: 628xxx tanpa +)
  ADMIN_WA: import.meta.env.VITE_ADMIN_WA || '6283879527517',

  // App info
  APP_NAME: 'Exora',
  APP_TAGLINE: 'Buka toko online gratis, terima pesanan via WhatsApp',
  APP_URL: import.meta.env.VITE_APP_URL || 'https://exorav2.vercel.app',

  // Batas produk untuk free plan
  FREE_PRODUCT_LIMIT: 25,

  // Harga pro (untuk ditampilkan di UI)
  PRO_PRICE: 'Rp 19.000/bulan',
  BITESHIP_KEY: 'biteship_live.eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiRXhvcmEiLCJ1c2VySWQiOiI2YTJhZmJiZGEyZTlhZjRjMzMyM2YzYTAiLCJpYXQiOjE3ODEyMDc2ODV9.jUyJf6vfA_Z51r7IfOXAlHTkFhIQ1X18HyLw15bsdok',
  GROQ_API_KEY: import.meta.env.VITE_GROQ_API_KEY || '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',
  GROQ_SHOWCASE_KEY: import.meta.env.VITE_GROQ_SHOWCASE_KEY || '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', 
  GROQ_PRODUK_KEY: import.meta.env.VITE_GROQ_PRODUK_KEY || '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',
  GROQ_KEYS: [
  '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',
  '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', 
  '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',
],
  GROQ_MODELS: [
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
   
  ],
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
