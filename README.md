# TokoKu — Platform Toko Online

Platform toko online freemium dengan checkout via WhatsApp.
**Stack:** React + Vite · Google Apps Script · Google Sheets · Google Drive

---

## 🚀 Setup Lengkap

### 1. Google Sheets — Database

1. Buka [sheets.new](https://sheets.new) → buat spreadsheet baru
2. Beri nama: **TokoKu Database**
3. Copy **Spreadsheet ID** dari URL:
   `https://docs.google.com/spreadsheets/d/**SPREADSHEET_ID**/edit`

### 2. Google Drive — Penyimpanan Foto

1. Buka [drive.google.com](https://drive.google.com)
2. Buat folder baru: **TokoKu Produk**
3. Klik kanan folder → **Get link** → copy **Folder ID** dari URL:
   `https://drive.google.com/drive/folders/**FOLDER_ID**`

### 3. Google Apps Script — Backend

1. Buka [script.google.com](https://script.google.com) → **New project**
2. Hapus kode default, paste isi file `gas/Code.gs`
3. Ganti nilai di bagian CONFIG:
   ```javascript
   const SPREADSHEET_ID = 'ID_spreadsheet_kamu'
   const DRIVE_FOLDER_ID = 'ID_folder_drive_kamu'
   const ADMIN_EMAIL = 'emailkamu@gmail.com'
   ```
4. Klik **Deploy** → **New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Klik **Deploy** → **Authorize access** (izinkan semua)
6. Copy **Web App URL**

### 4. Google OAuth Client ID

1. Buka [console.cloud.google.com](https://console.cloud.google.com)
2. Create project baru atau pilih yang ada
3. **APIs & Services** → **OAuth consent screen**:
   - User type: External
   - Isi nama app, email
   - Add scope: email, profile, openid
4. **Credentials** → **Create credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized JavaScript origins:
     - `http://localhost:5173` (development)
     - `https://tokoku.vercel.app` (production — ganti dengan domain kamu)
5. Copy **Client ID**

### 5. Frontend Setup

```bash
# Clone/extract project
cd tokoku

# Install dependencies
npm install

# Copy env template
cp .env.example .env.local

# Edit .env.local — isi semua nilai
nano .env.local

# Jalankan development
npm run dev
```

### 6. Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables di dashboard Vercel:
# VITE_GAS_URL, VITE_GOOGLE_CLIENT_ID, VITE_ADMIN_WA, VITE_APP_URL
```

---

## 📁 Struktur Project

```
tokoku/
├── src/
│   ├── components/
│   │   ├── seller/
│   │   │   ├── Sidebar.jsx          # Navigasi dashboard
│   │   │   ├── DashboardLayout.jsx  # Layout wrapper
│   │   │   ├── ProdukForm.jsx       # Form tambah/edit produk
│   │   │   └── ImageUpload.jsx      # Upload foto dengan drag-drop
│   │   └── ui/
│   │       └── index.jsx            # Komponen UI reusable
│   ├── pages/
│   │   ├── LandingPage.jsx          # Halaman utama
│   │   ├── LoginPage.jsx            # Login Google
│   │   ├── DashboardPage.jsx        # Dashboard seller
│   │   ├── ProdukPage.jsx           # Manajemen produk
│   │   ├── PesananPage.jsx          # Manajemen pesanan (Pro)
│   │   ├── SettingsPage.jsx         # Pengaturan toko
│   │   ├── UpgradePage.jsx          # Upgrade ke Pro
│   │   ├── StorefrontPage.jsx       # Toko publik (buyer)
│   │   └── NotFoundPage.jsx         # 404
│   ├── lib/
│   │   ├── api.js                   # API calls ke GAS
│   │   ├── config.js                # Konfigurasi app
│   │   ├── store.js                 # Zustand state management
│   │   └── utils.js                 # Helper functions
│   ├── styles/
│   │   └── globals.css              # Design system (glassmorphism)
│   ├── App.jsx                      # Router utama
│   └── main.jsx                     # Entry point
├── gas/
│   └── Code.gs                      # Backend Google Apps Script
├── .env.example                     # Template env variables
├── vite.config.js
└── package.json
```

---

## ✨ Fitur

### Paket Gratis
- Hingga 10 produk
- 1 toko online
- Checkout via WhatsApp pembeli langsung ke seller
- URL toko: `yourapp.vercel.app/toko/slug-toko`
- Tema default

### Paket Pro (Rp 49.000/bulan)
- Produk tidak terbatas
- Semua tema premium
- Custom domain
- Manajemen pesanan dengan status tracking
- Analytics (revenue, top produk, dll)
- Badge "Verified" di toko
- Email notifikasi pesanan baru
- Export data

---

## 🔄 Flow Upgrade Pro

1. Seller klik "Upgrade ke Pro" di dashboard
2. Diarahkan ke WhatsApp admin dengan pesan otomatis
3. Admin konfirmasi pembayaran manual
4. Admin jalankan `confirmUpgrade` via GAS (atau buat admin panel sederhana)
5. Akun seller otomatis upgraded

### Cara Admin Confirm Upgrade (via GAS)
Di GAS editor, jalankan fungsi ini:
```javascript
function adminUpgrade() {
  // Ganti dengan userId seller dan admin token
  confirmUpgrade({ adminToken: 'TOKEN_ADMIN', userId: 'USER_ID_SELLER' })
}
```

---

## 🛠️ Customization

### Ganti Harga Pro
Edit `src/lib/config.js`:
```javascript
PRO_PRICE: 'Rp 99.000/bulan',
```

### Tambah Tema Baru
Edit `src/pages/StorefrontPage.jsx` bagian `TEMA`:
```javascript
namatema: { accent: '#warna', accent2: '#warna2', gradient: 'linear-gradient(...)' },
```

### Limit Produk Free
Edit di `src/lib/config.js` dan `gas/Code.gs`:
```javascript
FREE_PRODUCT_LIMIT: 10
```

---

## ⚠️ Catatan Penting

- GAS Web App harus di-**redeploy** setiap kali ada perubahan kode
- Google Sheets memiliki batas 10 juta sel — cukup untuk ribuan toko
- Foto produk disimpan di Google Drive dengan akses publik (view only)
- Token auth berlaku 30 hari
- Untuk skala besar, pertimbangkan migrasi ke Firebase/Supabase
