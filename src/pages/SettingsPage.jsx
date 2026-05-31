import React, { useState, useEffect } from 'react'
import { Save, Store, User, Bell, Shield } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { Alert } from '../components/ui/index.jsx'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { tokoApi } from '../lib/api.js'
import { validateWA, getStorefrontUrl, isPro } from '../lib/utils.js'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, token } = useAuthStore()
  const { toko, setToko } = useTokoStore()
  const [tab, setTab] = useState('toko')
  const pro = isPro(user)

  const TABS = [
    { key: 'toko', label: 'Info Toko', icon: Store },
    { key: 'profil', label: 'Profil', icon: User },
  ]

  return (
    <DashboardLayout title="Pengaturan">
      {/* Tabs */}
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
        {tab === 'toko' && <TokoSettings token={token} toko={toko} setToko={setToko} pro={pro} />}
        {tab === 'profil' && <ProfilSettings user={user} />}
      </div>
    </DashboardLayout>
  )
}

// =============================================
// TOKO SETTINGS
// =============================================

function TokoSettings({ token, toko, setToko, pro }) {
  const [form, setForm] = useState({ nama: '', deskripsi: '', wa: '', customDomain: '', tema: 'default' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (toko) {
      setForm({
        nama: toko.nama || '',
        deskripsi: toko.deskripsi || '',
        wa: toko.wa || '',
        customDomain: toko.customDomain || '',
        tema: toko.tema || 'default',
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
      const res = await tokoApi.update(token, toko.id, form)
      setToko(res.data)
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
      {/* Toko info */}
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
            <label className="form-label">Deskripsi Toko</label>
            <textarea className="form-input form-textarea" value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} rows={3} maxLength={300} />
            <span className="form-hint">{form.deskripsi.length}/300 karakter</span>
          </div>
        </div>
      </div>

      {/* Custom Domain (Pro only) */}
      <div className="glass-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Custom Domain</h3>
          {!pro && <span className="badge badge-pro">⭐ Pro</span>}
        </div>

        {pro ? (
          <div className="form-group">
            <label className="form-label">Domain Kustom</label>
            <input
              className="form-input"
              placeholder="cth: toko.namadomain.com"
              value={form.customDomain}
              onChange={e => set('customDomain', e.target.value)}
            />
            <span className="form-hint">Arahkan CNAME domain kamu ke: tokoku.vercel.app</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Pakai domain sendiri seperti <code style={{ color: 'var(--accent)', background: 'var(--surface)', padding: '2px 6px', borderRadius: 4, fontSize: '0.82rem' }}>toko.namakamu.com</code>
            </p>
            <a href="/dashboard/upgrade" className="btn btn-primary btn-sm" style={{ width: 'fit-content' }}>
              Upgrade ke Pro
            </a>
          </div>
        )}
      </div>

      {/* Tema (Pro only) */}
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

// =============================================
// PROFIL SETTINGS
// =============================================

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
