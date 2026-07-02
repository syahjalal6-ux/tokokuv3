import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { Modal } from '../ui/index.jsx'
import ImageUpload from './ImageUpload.jsx'
import { produkApi } from '../../lib/api/index.js'
import { useAuthStore, useProdukStore } from '../../lib/store.js'
import toast from 'react-hot-toast'

const KATEGORI = [
  'Fashion', 'Makanan & Minuman', 'Elektronik', 'Kecantikan',
  'Rumah & Taman', 'Olahraga', 'Handmade', 'Digital', 'Lainnya'
]

const INITIAL = {
  nama: '', deskripsi: '', harga: '', hargaCoret: '',
  stok: '', kategori: '', berat: '', fotos: [], aktif: true,
}

// Custom dropdown
function KategoriSelect({ value, onChange, error }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'var(--surface)',
          border: `1px solid ${error ? 'var(--danger)' : open ? 'var(--accent)' : 'var(--glass-border)'}`,
          borderRadius: 'var(--radius-md)',
          color: value ? 'var(--text-primary)' : 'var(--text-tertiary)',
          fontSize: '0.875rem',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
      >
        <span>{value || '— Pilih Kategori —'}</span>
        <ChevronDown
          size={16}
          style={{
            color: 'var(--text-tertiary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 100,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 0.1s ease',
        }}>
          {KATEGORI.map(k => (
            <button
              key={k}
              type="button"
              onClick={() => { onChange(k); setOpen(false) }}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px',
                background: value === k ? 'rgba(91,138,245,0.1)' : 'transparent',
                border: 'none',
                color: value === k ? 'var(--accent)' : 'var(--text-primary)',
                fontSize: '0.875rem', fontWeight: value === k ? 600 : 400,
                cursor: 'pointer', textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (value !== k) e.currentTarget.style.background = 'var(--surface-hover)' }}
              onMouseLeave={e => { if (value !== k) e.currentTarget.style.background = 'transparent' }}
            >
              {k}
              {value === k && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProdukForm({ isOpen, onClose, editData }) {
  const [form, setForm] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // State tambahan untuk Flash Sale & Pre-order
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [hargaFlash, setHargaFlash] = useState('')
  const [flashSaleUntil, setFlashSaleUntil] = useState('')
  const [isPreorder, setIsPreorder] = useState(false)
  const [preorderReadyDate, setPreorderReadyDate] = useState('')

  const { token, user } = useAuthStore()
  const tokenObj = token
  const { add, update } = useProdukStore()
  const isEdit = !!editData

  const plan = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date()
    ? 'pro'
    : 'free'

  useEffect(() => {
    if (editData) {
      // Parse foto: bisa JSON array, comma-separated string, atau string tunggal
      let fotos = []
      if (editData.foto) {
        try {
          const parsed = JSON.parse(editData.foto)
          fotos = Array.isArray(parsed) ? parsed : [parsed]
        } catch {
          // fallback: comma-separated (data lama)
          fotos = String(editData.foto).split(',').map(s => s.trim()).filter(Boolean)
        }
      }
      
      setForm({
        nama: editData.nama || '',
        deskripsi: editData.deskripsi || '',
        harga: editData.harga?.toString() || '',
        hargaCoret: editData.hargaCoret?.toString() || '',
        stok: editData.stok?.toString() || '',
        kategori: editData.kategori || '',
        berat: editData.berat?.toString() || '',
        fotos,
        aktif: editData.aktif !== false,
      })

      // Set state Flash Sale & Pre-order dari data edit
      setIsFlashSale(!!(editData?.hargaFlash && editData?.flashSaleUntil))
      setHargaFlash(editData?.hargaFlash?.toString() || '')
      setFlashSaleUntil(editData?.flashSaleUntil ? editData.flashSaleUntil.slice(0, 16) : '')
      setIsPreorder(editData?.isPreorder || false)
      setPreorderReadyDate(editData?.preorderReadyDate ? editData.preorderReadyDate.slice(0, 10) : '')
    } else {
      setForm(INITIAL)
      // Reset state Flash Sale & Pre-order
      setIsFlashSale(false)
      setHargaFlash('')
      setFlashSaleUntil('')
      setIsPreorder(false)
      setPreorderReadyDate('')
    }
    setErrors({})
  }, [editData, isOpen])

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama produk wajib diisi'
    if (!form.harga || isNaN(Number(form.harga)) || Number(form.harga) < 0) e.harga = 'Harga tidak valid'
    if (form.stok && (isNaN(Number(form.stok)) || Number(form.stok) < 0)) e.stok = 'Stok tidak valid'
    if (!form.kategori) e.kategori = 'Pilih kategori'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return

    // Validasi tambahan untuk Flash Sale
    if (isFlashSale) {
      if (!hargaFlash || !flashSaleUntil) {
        toast.error('Isi harga flash dan tanggal berakhir flash sale')
        return
      }
      if (Number(hargaFlash) >= Number(form.harga)) {
        toast.error('Harga flash harus lebih kecil dari harga normal')
        return
      }
    }

    setLoading(true)
    try {
      // Simpan sebagai JSON array string
      const fotoStr = JSON.stringify(form.fotos)

      const payload = {
        nama: form.nama.trim(),
        deskripsi: form.deskripsi.trim(),
        harga: Number(form.harga),
        hargaCoret: form.hargaCoret ? Number(form.hargaCoret) : null,
        stok: form.stok ? Number(form.stok) : null,
        kategori: form.kategori,
        berat: form.berat ? Number(form.berat) : null,
        aktif: form.aktif,
        foto: fotoStr,
        // Payload tambahan
        hargaFlash: isFlashSale ? Number(hargaFlash) : null,
        flashSaleUntil: isFlashSale ? new Date(flashSaleUntil).toISOString() : null,
        isPreorder,
        preorderReadyDate: isPreorder && preorderReadyDate ? preorderReadyDate : null,
      }

      if (isEdit) {
        const res = await produkApi.update(tokenObj, editData.id, payload)
        update(editData.id, res.data)
        toast.success('Produk berhasil diperbarui!')
      } else {
        const res = await produkApi.create(tokenObj, payload)
        add(res.data)
        toast.success('Produk berhasil ditambahkan!')
      }
      onClose()
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan produk')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={loading}>Batal</button>
          <button onClick={handleSubmit} className="btn btn-primary" disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Menyimpan...</>
              : isEdit ? 'Perbarui Produk' : 'Tambah Produk'
            }
          </button>
        </>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Foto Produk</label>
          <ImageUpload
            value={form.fotos}
            onChange={(urls) => set('fotos', urls)}
            plan={plan}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Nama Produk *</label>
          <input
            className={`form-input ${errors.nama ? 'error' : ''}`}
            placeholder="cth: Kaos Polos Premium"
            value={form.nama}
            onChange={e => set('nama', e.target.value)}
            maxLength={100}
          />
          {errors.nama && <span className="form-error">{errors.nama}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Harga (Rp) *</label>
          <input
            className={`form-input ${errors.harga ? 'error' : ''}`}
            type="number" placeholder="50000" min="0"
            value={form.harga}
            onChange={e => set('harga', e.target.value)}
          />
          {errors.harga && <span className="form-error">{errors.harga}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Harga Coret (Rp)</label>
          <input
            className="form-input"
            type="number" placeholder="75000 (opsional)" min="0"
            value={form.hargaCoret}
            onChange={e => set('hargaCoret', e.target.value)}
          />
          <span className="form-hint">Tampilkan harga sebelum diskon</span>
        </div>

        <div className="form-group">
          <label className="form-label">Stok</label>
          <input
            className={`form-input ${errors.stok ? 'error' : ''}`}
            type="number" placeholder="Kosongkan = tidak terbatas" min="0"
            value={form.stok}
            onChange={e => set('stok', e.target.value)}
          />
          {errors.stok && <span className="form-error">{errors.stok}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Berat (gram)</label>
          <input
            className="form-input"
            type="number" placeholder="500" min="0"
            value={form.berat}
            onChange={e => set('berat', e.target.value)}
          />
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Kategori *</label>
          <KategoriSelect
            value={form.kategori}
            onChange={(v) => set('kategori', v)}
            error={errors.kategori}
          />
          {errors.kategori && <span className="form-error">{errors.kategori}</span>}
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Deskripsi</label>
          <textarea
            className="form-input form-textarea"
            placeholder="Jelaskan detail produk, ukuran, material, dll..."
            value={form.deskripsi}
            onChange={e => set('deskripsi', e.target.value)}
            rows={4}
            maxLength={1000}
          />
          <span className="form-hint">{form.deskripsi.length}/1000 karakter</span>
        </div>

        <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            type="checkbox" id="aktif"
            checked={form.aktif}
            onChange={e => set('aktif', e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--accent)' }}
          />
          <label htmlFor="aktif" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            Produk aktif (tampil di toko)
          </label>
        </div>

        {/* ── Flash Sale ── */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                ⚡ Flash Sale
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Harga spesial dengan countdown timer di toko
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <input
                type="checkbox"
                checked={isFlashSale}
                onChange={e => setIsFlashSale(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </label>
          </div>

          {isFlashSale && (
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  HARGA FLASH (Rp)
                </label>
                <input
                  type="number"
                  value={hargaFlash}
                  onChange={e => setHargaFlash(e.target.value)}
                  placeholder="cth: 45000"
                  style={{
                    width: '100%', marginTop: 4, padding: '8px 12px',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text)', fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                  BERAKHIR PADA
                </label>
                <input
                  type="datetime-local"
                  value={flashSaleUntil}
                  onChange={e => setFlashSaleUntil(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{
                    width: '100%', marginTop: 4, padding: '8px 12px',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    borderRadius: 8, color: 'var(--text)', fontSize: 13,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* ── Pre-order ── */}
        <div style={{
          gridColumn: '1 / -1',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '14px 16px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>
                📦 Pre-order
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                Terima pesanan sebelum stok ready
              </div>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 8 }}>
              <input
                type="checkbox"
                checked={isPreorder}
                onChange={e => setIsPreorder(e.target.checked)}
                style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
              />
            </label>
          </div>

          {isPreorder && (
            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                ESTIMASI READY
              </label>
              <input
                type="date"
                value={preorderReadyDate}
                onChange={e => setPreorderReadyDate(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
                style={{
                  width: '100%', marginTop: 4, padding: '8px 12px',
                  background: 'var(--input-bg)', border: '1px solid var(--border)',
                  borderRadius: 8, color: 'var(--text)', fontSize: 13,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
