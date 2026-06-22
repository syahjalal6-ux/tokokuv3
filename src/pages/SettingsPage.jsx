import React, { useState, useEffect, useCallback } from 'react'
import { Save, Store, User, Bot, Upload, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { Alert } from '../components/ui/index.jsx'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { tokoApi, tokoInfoApi } from '../lib/api/index.js'
import { validateWA, getStorefrontUrl, isPro, compressImage } from '../lib/utils.js'
import toast from 'react-hot-toast'

const CLOUDINARY_CLOUD = 'dgplz1pd0'
const CLOUDINARY_PRESET = 'tokoku'

async function uploadLogoToCloudinary(file) {
  const compressed = await compressImage(file, 400, 0.85)
  const formData = new FormData()
  formData.append('file', compressed)
  formData.append('upload_preset', CLOUDINARY_PRESET)
  formData.append('folder', 'tokoku/logos')

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error('Upload logo gagal')
  const data = await res.json()
  return data.secure_url
}

export default function SettingsPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token
  const { toko, setToko } = useTokoStore()
  const [tab, setTab] = useState('toko')
  const pro = isPro(user)

  useEffect(() => {
    if ((token) && !toko) {
      tokoApi.getMine(tokenObj).then(res => {
        if (res.data) setToko(res.data)
      }).catch(() => {})
    }
  }, [token])

  const TABS = [
    { key: 'toko', label: 'Info Toko', icon: Store },
    { key: 'asisten', label: 'Asisten AI', icon: Bot },
    { key: 'profil', label: 'Profil', icon: User },
  ]

  return (
    <DashboardLayout title="Pengaturan">
      <div style={{ display: 'flex', gap: '4px', marginBottom: '28px' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="btn btn-sm"
            style={{
              background: tab === t.key ? 'var(--surface-active)' : 'var(--surface)',
              color: tab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: `1px solid ${tab === t.key ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
              borderRadius: 'var(--radius-full)',
            }}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 600 }}>
        {tab === 'toko' && <TokoSettings tokenObj={tokenObj} toko={toko} setToko={setToko} pro={pro} />}
        {tab === 'asisten' && <AsistenSettings tokenObj={tokenObj} toko={toko} />}
        {tab === 'profil' && <ProfilSettings user={user} />}
      </div>
    </DashboardLayout>
  )
}

// ================================================
// LOGO UPLOAD
// ================================================
function LogoUpload({ value, onChange, disabled }) {
  const [uploading, setUploading] = useState(false)

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadLogoToCloudinary(file)
      onChange(url)
      toast.success('Logo berhasil diupload')
    } catch (err) {
      toast.error('Gagal upload logo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }, [onChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    disabled: disabled || uploading,
  })

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {value ? (
          <>
            <img
              src={value}
              alt="Logo toko"
              style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', border: '1px solid var(--glass-border)' }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 20, height: 20,
                  background: 'var(--danger)',
                  border: 'none', borderRadius: '50%',
                  cursor: 'pointer', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={11} />
              </button>
            )}
          </>
        ) : (
          <div style={{
            width: 72, height: 72, borderRadius: 16,
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}>
            <Store size={28} />
          </div>
        )}
      </div>

      <div
        {...getRootProps()}
        style={{
          flex: 1,
          padding: '12px 16px',
          border: `2px dashed ${isDragActive ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-lg)',
          background: isDragActive ? 'rgba(91,138,245,0.05)' : 'var(--surface)',
          cursor: (disabled || uploading) ? 'not-allowed' : 'pointer',
          opacity: (disabled || uploading) ? 0.6 : 1,
          transition: 'all var(--transition-fast)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <><span className="spinner" style={{ width: 14, height: 14 }} />
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Mengupload...</span></>
        ) : (
          <>
            <Upload size={15} color="var(--text-tertiary)" />
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {isDragActive ? 'Lepaskan file di sini' : value ? 'Ganti logo' : 'Upload logo toko'}
              </p>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 2 }}>
                JPG, PNG, WEBP — maks 5MB
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ================================================
// ASISTEN SETTINGS
// ================================================
function AsistenSettings({ tokenObj, toko }) {
  const { token } = useAuthStore()
  const [form, setForm] = useState({ faq: '', garansi: '', policy: '', infoLain: '' })
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (!(token || token) || !toko) return
    tokoInfoApi.get(tokenObj).then(res => {
      if (res.data) setForm({
        faq: res.data.faq || '',
        garansi: res.data.garansi || '',
        policy: res.data.policy || '',
        infoLain: res.data.infoLain || '',
      })
    }).catch(() => {}).finally(() => setFetching(false))
  }, [token, token, toko])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async () => {
    setLoading(true)
    try {
      await tokoInfoApi.update(tokenObj, form)
      toast.success('Data asisten AI disimpan!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  if (!toko) return (
    <Alert type="warning" title="Belum ada toko">
      Buat toko dari <a href="/dashboard" style={{ color: 'var(--warning)', fontWeight: 700 }}>halaman dashboard</a>.
    </Alert>
  )

  if (fetching) return <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memuat...</p>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
          Bank Data Asisten AI
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '20px' }}>
          Data ini digunakan AI untuk menjawab pertanyaan pembeli di halaman produk.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">FAQ</label>
            <textarea
              className="form-input form-textarea"
              rows={4}
              placeholder="cth: Q: Apakah ada diskon? A: Ada, untuk pembelian di atas 3 pcs."
              value={form.faq}
              onChange={e => set('faq', e.target.value)}
            />
            <span className="form-hint">Pertanyaan dan jawaban umum dari pembeli</span>
          </div>

          <div className="form-group">
            <label className="form-label">Garansi</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Garansi 7 hari barang rusak atau tidak sesuai foto."
              value={form.garansi}
              onChange={e => set('garansi', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Kebijakan Toko</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Tidak menerima retur kecuali barang cacat produksi."
              value={form.policy}
              onChange={e => set('policy', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Informasi Lain</label>
            <textarea
              className="form-input form-textarea"
              rows={3}
              placeholder="cth: Pengiriman setiap hari Senin-Sabtu jam 10.00-15.00."
              value={form.infoLain}
              onChange={e => set('infoLain', e.target.value)}
            />
          </div>
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

// ================================================
// TOKO SETTINGS
// ================================================
function TokoSettings({ tokenObj, toko, setToko, pro }) {
  const [form, setForm] = useState({
    nama: '',
    deskripsi: '',
    wa: '',
    customDomain: '',
    tema: 'default',
    musik: '',
    video: '',
    pengumuman: '',
    logo: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (toko) {
      setForm({
        nama: toko.nama || '',
        deskripsi: toko.deskripsi || '',
        wa: String(toko.wa || ''),
        customDomain: toko.customDomain || '',
        tema: toko.tema || 'default',
        musik: toko.musik || '',
        video: toko.video || '',
        pengumuman: toko.pengumuman || '',
        logo: toko.logo || '',
      })
    }
  }, [toko])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama toko wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    if (form.wa && !validateWA(form.wa)) e.wa = 'Format nomor WA tidak valid'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      await tokoApi.update(tokenObj, toko.id, form)
      setToko({ ...toko, ...form })
      toast.success('Pengaturan toko disimpan!')
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  if (!toko) return (
    <Alert type="warning" title="Belum ada toko">
      Buat toko dari <a href="/dashboard" style={{ color: 'var(--warning)', fontWeight: 700 }}>halaman dashboard</a>.
    </Alert>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Logo Toko */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
          Logo Toko
        </h3>
        <LogoUpload
          value={form.logo}
          onChange={(url) => set('logo', url)}
        />
        <span className="form-hint" style={{ marginTop: 10, display: 'block' }}>
          Tampil sebagai avatar di halaman toko kamu
        </span>
      </div>

      {/* Informasi Toko */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
          Informasi Toko
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Nama Toko *</label>
            <input className={`form-input ${errors.nama ? 'error' : ''}`} value={form.nama} onChange={e => set('nama', e.target.value)} maxLength={50} />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">URL Toko (tidak bisa diubah)</label>
            <input className="form-input" value={getStorefrontUrl(toko.slug)} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp *</label>
            <input className={`form-input ${errors.wa ? 'error' : ''}`} placeholder="081234567890" value={form.wa} onChange={e => set('wa', e.target.value)} />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
            <span className="form-hint">Nomor ini yang dihubungi pembeli saat checkout</span>
          </div>

          <div className="form-group">
            <label className="form-label">Musik Toko (YouTube)</label>
            <input
              className="form-input"
              placeholder="cth: https://www.youtube.com/watch?v=xxxxx"
              value={form.musik}
              onChange={e => set('musik', e.target.value)}
            />
            <span className="form-hint">Tombol 🎵 muncul di kiri bawah toko — buyer klik untuk play/pause</span>
          </div>

          <div className="form-group">
            <label className="form-label">Video Toko (YouTube)</label>
            <input
              className="form-input"
              placeholder="cth: https://www.youtube.com/watch?v=xxxxx"
              value={form.video}
              onChange={e => set('video', e.target.value)}
            />
            <span className="form-hint">Tampil sebagai video kecil di bawah produk — cocok untuk video katalog atau tutorial</span>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Toko</label>
            <textarea className="form-input form-textarea" value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3} maxLength={300} />
            <span className="form-hint">{form.deskripsi.length}/300 karakter</span>
          </div>
        </div>
      </div>

      {/* Pengumuman Toko */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '8px', fontSize: '1rem' }}>
          📢 Pengumuman Toko
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem', marginBottom: '16px' }}>
          Tampil di bagian atas halaman toko kamu. Kosongkan jika tidak ingin ada pengumuman.
        </p>
        <div className="form-group">
          <textarea
            className="form-input form-textarea"
            rows={3}
            placeholder="cth: Promo akhir tahun! Diskon 20% untuk semua produk s/d 31 Desember 🎉"
            value={form.pengumuman}
            onChange={e => set('pengumuman', e.target.value)}
            maxLength={150}
          />
          <span className="form-hint">{form.pengumuman.length}/150 karakter</span>
        </div>
      </div>

      {/* Custom Domain */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Custom Domain</h3>
          {!pro && <span className="badge badge-pro">⭐ Pro</span>}
        </div>
        {pro ? (
          <div className="form-group">
            <label className="form-label">Domain Kustom</label>
            <input className="form-input" placeholder="cth: toko.namadomain.com" value={form.customDomain} onChange={e => set('customDomain', e.target.value)} />
            <span className="form-hint">Arahkan CNAME domain kamu ke: tokoku.vercel.app</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Pakai domain sendiri seperti <code style={{ color: 'var(--accent)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>toko.namakamu.com</code>
            </p>
            <a href="/dashboard/upgrade" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>Upgrade ke Pro</a>
          </div>
        )}
      </div>

      {/* Tema Toko */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Tema Toko</h3>
          {!pro && <span className="badge badge-pro">⭐ Pro</span>}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '10px' }}>
          {[
            { key: 'default', label: 'Default', preview: ['#5b8af5', '#7c6af7'] },
            { key: 'emerald', label: 'Emerald', preview: ['#10b981', '#059669'], pro: true },
            { key: 'sunset', label: 'Sunset', preview: ['#f59e0b', '#ef4444'], pro: true },
            { key: 'rose', label: 'Rose', preview: ['#f43f5e', '#ec4899'], pro: true },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => (pro || !t.pro) && set('tema', t.key)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-lg)',
                border: `2px solid ${form.tema === t.key ? 'var(--accent)' : 'var(--glass-border)'}`,
                background: form.tema === t.key ? 'var(--surface-active)' : 'var(--surface)',
                cursor: (pro || !t.pro) ? 'pointer' : 'not-allowed',
                opacity: t.pro && !pro ? 0.5 : 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                transition: 'all var(--transition-fast)',
              }}
            >
              <div style={{ display: 'flex', gap: '4px' }}>
                {t.preview.map((c, i) => (
                  <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t.label} {t.pro && !pro && '🔒'}
              </span>
            </button>
          ))}
        </div>
      </div>

      <button onClick={handleSave} className="btn btn-primary" disabled={loading} style={{ width: 'fit-content' }}>
        {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
      </button>
    </div>
  )
}

// ================================================
// PROFIL SETTINGS
// ================================================
function ProfilSettings({ user }) {
  return (
    <div className="glass-card" style={{ padding: '28px' }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', fontSize: '1rem' }}>
        Profil Akun
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        {user?.picture ? (
          <img src={user.picture} alt={user.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
        ) : (
          <div className="avatar avatar-xl">{user?.name?.[0]}</div>
        )}
        <div>
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>{user?.name}</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{user?.email}</p>
          <span className={`badge ${user?.plan === 'pro' ? 'badge-pro' : 'badge-free'}`} style={{ marginTop: 6 }}>
            {user?.plan === 'pro' ? '⭐ Pro' : 'Gratis'}
          </span>
        </div>
      </div>
      <Alert type="info">
        Data profil diambil dari akun Google kamu dan tidak bisa diubah di sini.
        Ubah foto dan nama melalui akun Google kamu.
      </Alert>
    </div>
  )
}
