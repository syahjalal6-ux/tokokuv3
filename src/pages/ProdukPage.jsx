import React, { useEffect, useState } from 'react'
import { Plus, Search, Package, Edit2, Trash2, Eye, EyeOff, MoreVertical, Zap, Ban, Lock, Clock } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import ProdukForm from '../components/seller/ProdukForm.jsx'
import { EmptyState, ConfirmDialog, Alert, ProductSkeleton } from '../components/ui/index.jsx'
import { useAuthStore, useProdukStore, useTokoStore } from '../lib/store.js'
import { produkApi, bundleApi, flashSaleApi } from '../lib/api/index.js'
import { formatRupiah, isPro, truncate } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function hitungDiskon(harga, hargaCoret) {
  if (!hargaCoret || hargaCoret <= harga) return null
  return Math.round((1 - harga / hargaCoret) * 100)
}

// ── Helper flash sale ──────────────────────────────────────────────────────
function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isFlashActive(p) {
  return !!(p.hargaFlash && p.flashSaleUntil && new Date(p.flashSaleUntil) > new Date())
}

function formatFlashSampai(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: '12px',
}

export default function ProdukPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token
  const { toko, load: loadToko, isLoading: tokoLoading } = useTokoStore()
  const { produk, load, update, remove, isLoading } = useProdukStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editData, setEditData] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const pro = isPro(user)
  const limitReached = !pro && produk.length >= CONFIG.FREE_PRODUCT_LIMIT

  // Tambah state di bagian atas komponen
  const [bundles, setBundles] = useState([])
  const [showBundleForm, setShowBundleForm] = useState(false)
  const [editBundle, setEditBundle] = useState(null)
  const [bundleNama, setBundleNama] = useState('')
  const [bundleDeskripsi, setBundleDeskripsi] = useState('')
  const [bundleHarga, setBundleHarga] = useState('')
  const [bundleProdukIds, setBundleProdukIds] = useState([])
  const [bundleLoading, setBundleLoading] = useState(false)
  const [bundleError, setBundleError] = useState('')

  // ── State hapus bundle (popup ConfirmDialog, bukan window.confirm lagi)
  const [deleteBundleId, setDeleteBundleId] = useState(null)
  const [deletingBundle, setDeletingBundle] = useState(false)

  // ── State flash sale
  const [flashSaleTarget, setFlashSaleTarget] = useState(null)
  const [flashHarga, setFlashHarga] = useState('')
  const [flashSampai, setFlashSampai] = useState('')
  const [flashLoading, setFlashLoading] = useState(false)
  const [flashError, setFlashError] = useState('')
  const [clearFlashSaleId, setClearFlashSaleId] = useState(null)
  const [clearingFlash, setClearingFlash] = useState(false)

  const loadBundles = async () => {
    try {
      const res = await bundleApi.getMine(token)
      if (res.success) setBundles(res.data)
    } catch {}
  }

  useEffect(() => {
    if (token) {
      load(tokenObj)
      loadToko(tokenObj)
      loadBundles()
    }
  }, [token])

  const filtered = produk.filter(p => {
    const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase())
    const matchKat = filterKat === 'all' || p.kategori === filterKat
    const matchStatus = filterStatus === 'all' || (filterStatus === 'aktif' ? p.aktif : !p.aktif)
    return matchSearch && matchKat && matchStatus
  })

  const kategoriList = [...new Set(produk.map(p => p.kategori).filter(Boolean))]

  const handleEdit = (p) => { setEditData(p); setFormOpen(true) }
  const handleAdd = () => { setEditData(null); setFormOpen(true) }

  const handleToggleAktif = async (p) => {
    try {
      await produkApi.update(tokenObj, p.id, { aktif: !p.aktif })
      update(p.id, { aktif: !p.aktif })
      toast.success(p.aktif ? 'Produk dinonaktifkan' : 'Produk diaktifkan')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await produkApi.delete(tokenObj, deleteId)
      remove(deleteId)
      toast.success('Produk dihapus')
      setDeleteId(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleBundleSubmit = async () => {
    if (!bundleNama.trim()) { setBundleError('Nama bundle wajib diisi'); return }
    if (!bundleHarga || isNaN(bundleHarga)) { setBundleError('Harga bundle tidak valid'); return }
    if (bundleProdukIds.length < 2) { setBundleError('Pilih minimal 2 produk'); return }
    setBundleLoading(true)
    setBundleError('')
    try {
      const data = {
        nama: bundleNama.trim(),
        deskripsi: bundleDeskripsi.trim(),
        hargaBundle: Number(bundleHarga),
        produkIds: bundleProdukIds,
        aktif: true,
      }
      if (editBundle) {
        await bundleApi.update(token, editBundle.id, data)
      } else {
        await bundleApi.create(token, data)
      }
      await loadBundles()
      setShowBundleForm(false)
      setEditBundle(null)
      setBundleNama('')
      setBundleDeskripsi('')
      setBundleHarga('')
      setBundleProdukIds([])
    } catch (e) {
      setBundleError(e.message || 'Gagal menyimpan bundle')
    }
    setBundleLoading(false)
  }

  // ── Hapus bundle lewat ConfirmDialog (redesign dari window.confirm)
  const handleDeleteBundle = async () => {
    setDeletingBundle(true)
    try {
      await bundleApi.delete(token, deleteBundleId)
      setBundles(prev => prev.filter(b => b.id !== deleteBundleId))
      toast.success('Bundle dihapus')
      setDeleteBundleId(null)
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus bundle')
    } finally {
      setDeletingBundle(false)
    }
  }

  const openEditBundle = (bundle) => {
    setEditBundle(bundle)
    setBundleNama(bundle.nama)
    setBundleDeskripsi(bundle.deskripsi || '')
    setBundleHarga(bundle.hargaBundle.toString())
    setBundleProdukIds(bundle.produkIds)
    setShowBundleForm(true)
  }

  // ── Handler flash sale
  const openFlashSale = (p) => {
    if (!pro) {
      toast.error('Flash Sale khusus seller Pro')
      return
    }
    setFlashSaleTarget(p)
    setFlashHarga(p.hargaFlash ? String(p.hargaFlash) : '')
    setFlashSampai(toDatetimeLocal(p.flashSaleUntil))
    setFlashError('')
  }

  const closeFlashSale = () => {
    setFlashSaleTarget(null)
    setFlashHarga('')
    setFlashSampai('')
    setFlashError('')
  }

  const handleFlashSaleSubmit = async () => {
    if (!flashHarga || isNaN(flashHarga) || Number(flashHarga) <= 0) {
      setFlashError('Harga flash sale tidak valid'); return
    }
    if (Number(flashHarga) >= Number(flashSaleTarget.harga)) {
      setFlashError('Harga flash sale harus lebih murah dari harga normal'); return
    }
    if (!flashSampai) {
      setFlashError('Tentukan waktu berakhir flash sale'); return
    }
    const untilDate = new Date(flashSampai)
    if (untilDate <= new Date()) {
      setFlashError('Waktu berakhir harus di masa depan'); return
    }
    setFlashLoading(true)
    setFlashError('')
    try {
      const flashSaleUntil = untilDate.toISOString()
      await flashSaleApi.set(token, flashSaleTarget.id, { hargaFlash: Number(flashHarga), flashSaleUntil })
      update(flashSaleTarget.id, { hargaFlash: Number(flashHarga), flashSaleUntil })
      toast.success('Flash sale aktif')
      closeFlashSale()
    } catch (e) {
      setFlashError(e.message || 'Gagal mengaktifkan flash sale')
    }
    setFlashLoading(false)
  }

  // Diminta dari dalam modal — tutup modal, buka ConfirmDialog
  const requestClearFlashSaleFromModal = () => {
    const id = flashSaleTarget.id
    closeFlashSale()
    setClearFlashSaleId(id)
  }

  const handleClearFlashSaleConfirm = async () => {
    setClearingFlash(true)
    try {
      await flashSaleApi.clear(token, clearFlashSaleId)
      update(clearFlashSaleId, { hargaFlash: null, flashSaleUntil: null })
      toast.success('Flash sale dihentikan')
      setClearFlashSaleId(null)
    } catch (e) {
      toast.error(e.message || 'Gagal menghentikan flash sale')
    } finally {
      setClearingFlash(false)
    }
  }

  const renderContent = () => {
    if (tokoLoading || isLoading) {
      return (
        <div style={gridStyle}>
          {Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
        </div>
      )
    }

    if (!toko) {
      return (
        <Alert type="warning" title="Buat toko dulu">
          Kamu belum punya toko. <Link to="/dashboard" style={{ color: 'var(--warning)', fontWeight: 700 }}>Buat toko sekarang</Link>
        </Alert>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {limitReached && !pro && (
          <Alert type="warning" title="Batas produk tercapai">
            Upgrade ke Pro untuk produk unlimited.{' '}
            <Link to="/dashboard/upgrade" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upgrade sekarang</Link>
          </Alert>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {kategoriList.length > 0 && (
            <select className="form-input form-select" style={{ width: 'auto', minWidth: 140 }} value={filterKat} onChange={e => setFilterKat(e.target.value)}>
              <option value="all">Semua Kategori</option>
              {kategoriList.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          )}

          <select className="form-input form-select" style={{ width: 'auto', minWidth: 120 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">Semua Status</option>
            <option value="aktif">Aktif</option>
            <option value="nonaktif">Nonaktif</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title={search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            description={search ? 'Coba kata kunci lain' : 'Tambahkan produk pertamamu agar pembeli bisa melihat tokomu'}
            action={!search && !limitReached && (
              <button onClick={handleAdd} className="btn btn-primary btn-sm">
                <Plus size={14} /> Tambah Produk Pertama
              </button>
            )}
          />
        ) : (
          <div style={gridStyle}>
            {filtered.map(p => (
              <ProductCard
                key={p.id}
                produk={p}
                pro={pro}
                onEdit={() => handleEdit(p)}
                onDelete={() => setDeleteId(p.id)}
                onToggle={() => handleToggleAktif(p)}
                onFlashSale={() => openFlashSale(p)}
                onClearFlashSale={() => setClearFlashSaleId(p.id)}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <DashboardLayout
      title="Produk"
      subtitle={`${produk.length}${pro ? '' : `/${CONFIG.FREE_PRODUCT_LIMIT}`} produk`}
      actions={
        <button onClick={handleAdd} className="btn btn-primary btn-sm" disabled={limitReached && !pro}>
          <Plus size={15} />
          Tambah Produk
        </button>
      }
    >
      {renderContent()}

      {/* ── SECTION BUNDLE ── */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>Bundling Produk</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Gabungkan beberapa produk dengan harga spesial
            </div>
          </div>
          <button
            onClick={() => {
              setEditBundle(null)
              setBundleNama('')
              setBundleDeskripsi('')
              setBundleHarga('')
              setBundleProdukIds([])
              setShowBundleForm(true)
            }}
            style={{
              padding: '8px 16px', borderRadius: 100,
              background: 'var(--accent)', color: '#fff',
              border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Buat Bundle
          </button>
        </div>

        {/* List bundles */}
        {bundles.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            background: 'var(--surface)', borderRadius: 12,
            border: '1px dashed var(--glass-border)',
            color: 'var(--text-tertiary)', fontSize: 13,
          }}>
            Belum ada bundle. Buat bundle untuk tingkatkan nilai transaksi.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {bundles.map(bundle => {
              const produkDiBundle = produk.filter(p => bundle.produkIds.includes(p.id))
              return (
                <div key={bundle.id} style={{
                  background: 'var(--surface)', border: '1px solid var(--glass-border)',
                  borderRadius: 12, padding: '14px 16px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>{bundle.nama}</div>
                    {bundle.deskripsi && (
                      <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 2 }}>{bundle.deskripsi}</div>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      {produkDiBundle.map(p => p.nama).join(' + ')}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--accent)', marginTop: 6 }}>
                      Rp {Number(bundle.hargaBundle).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                    <button
                      onClick={() => openEditBundle(bundle)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        background: 'transparent', border: '1px solid var(--glass-border)',
                        color: 'var(--text-primary)', cursor: 'pointer',
                      }}
                    >Edit</button>
                    <button
                      onClick={() => setDeleteBundleId(bundle.id)}
                      style={{
                        padding: '6px 12px', borderRadius: 8, fontSize: 12,
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: colorMix('var(--danger)', '10%'),
                        border: `1px solid ${colorMix('var(--danger)', '30%')}`,
                        color: 'var(--danger)', cursor: 'pointer', fontWeight: 600,
                      }}
                    ><Trash2 size={12} /> Hapus</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Form bundle — modal/drawer sederhana */}
        {showBundleForm && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <div style={{
              background: 'var(--bg-secondary)', borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px', width: '100%', maxWidth: 480,
              maxHeight: '90vh', overflowY: 'auto',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
                  {editBundle ? 'Edit Bundle' : 'Buat Bundle'}
                </div>
                <button onClick={() => setShowBundleForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}>×</button>
              </div>

              {bundleError && (
                <div style={{ background: colorMix('var(--danger)', '12%'), color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                  {bundleError}
                </div>
              )}

              {/* Nama bundle */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>NAMA BUNDLE *</label>
                <input
                  value={bundleNama}
                  onChange={e => setBundleNama(e.target.value)}
                  placeholder="cth: Paket Hemat Starter"
                  style={{
                    width: '100%', marginTop: 4, padding: '9px 12px',
                    background: 'var(--surface)', border: '1px solid var(--glass-border)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                  }}
                />
              </div>

              {/* Deskripsi */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>DESKRIPSI</label>
                <textarea
                  value={bundleDeskripsi}
                  onChange={e => setBundleDeskripsi(e.target.value)}
                  placeholder="Deskripsi bundle..."
                  rows={2}
                  style={{
                    width: '100%', marginTop: 4, padding: '9px 12px',
                    background: 'var(--surface)', border: '1px solid var(--glass-border)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13, resize: 'vertical',
                  }}
                />
              </div>

              {/* Harga bundle */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>HARGA BUNDLE (Rp) *</label>
                <input
                  type="number"
                  value={bundleHarga}
                  onChange={e => setBundleHarga(e.target.value)}
                  placeholder="cth: 150000"
                  style={{
                    width: '100%', marginTop: 4, padding: '9px 12px',
                    background: 'var(--surface)', border: '1px solid var(--glass-border)',
                    borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                  }}
                />
              </div>

              {/* Pilih produk */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                  PILIH PRODUK * (minimal 2)
                </label>
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                  {produk.map(p => {
                    const selected = bundleProdukIds.includes(p.id)
                    return (
                      <label key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selected ? colorMix('var(--accent)', '12%') : 'var(--surface)',
                        border: `1px solid ${selected ? 'var(--accent)' : 'var(--glass-border)'}`,
                      }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => {
                            setBundleProdukIds(prev =>
                              selected ? prev.filter(id => id !== p.id) : [...prev, p.id]
                            )
                          }}
                          style={{ accentColor: 'var(--accent)' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{p.nama}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                            Rp {Number(p.harga).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </label>
                    )
                  })}
                </div>
                {bundleProdukIds.length >= 2 && (
                  <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                    Total normal: Rp {produk.filter(p => bundleProdukIds.includes(p.id)).reduce((s, p) => s + Number(p.harga), 0).toLocaleString('id-ID')}
                    {bundleHarga && Number(bundleHarga) > 0 && (
                      <span style={{ color: 'var(--success)', marginLeft: 8 }}>
                        → Hemat Rp {(produk.filter(p => bundleProdukIds.includes(p.id)).reduce((s, p) => s + Number(p.harga), 0) - Number(bundleHarga)).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={handleBundleSubmit}
                disabled={bundleLoading}
                style={{
                  width: '100%', padding: '12px', borderRadius: 100,
                  background: 'var(--accent)', color: '#fff',
                  border: 'none', fontSize: 14, fontWeight: 700,
                  cursor: bundleLoading ? 'not-allowed' : 'pointer',
                  opacity: bundleLoading ? 0.7 : 1,
                }}
              >
                {bundleLoading ? 'Menyimpan...' : editBundle ? 'Perbarui Bundle' : 'Buat Bundle'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── FORM FLASH SALE ── */}
      {flashSaleTarget && (
        <FlashSaleForm
          produk={flashSaleTarget}
          harga={flashHarga}
          setHarga={setFlashHarga}
          sampai={flashSampai}
          setSampai={setFlashSampai}
          loading={flashLoading}
          error={flashError}
          onClose={closeFlashSale}
          onSubmit={handleFlashSaleSubmit}
          onRequestClear={isFlashActive(flashSaleTarget) ? requestClearFlashSaleFromModal : null}
        />
      )}

      <ProdukForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditData(null) }}
        editData={editData}
      />

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        isLoading={deleting}
        title="Hapus Produk"
        message="Produk yang dihapus tidak dapat dikembalikan. Yakin ingin menghapus?"
      />

      <ConfirmDialog
        isOpen={!!deleteBundleId}
        onClose={() => setDeleteBundleId(null)}
        onConfirm={handleDeleteBundle}
        isLoading={deletingBundle}
        title="Hapus Bundle"
        message="Bundle yang dihapus tidak dapat dikembalikan. Pembeli tidak akan lagi melihat paket ini. Yakin ingin menghapus?"
      />

      <ConfirmDialog
        isOpen={!!clearFlashSaleId}
        onClose={() => setClearFlashSaleId(null)}
        onConfirm={handleClearFlashSaleConfirm}
        isLoading={clearingFlash}
        title="Hentikan Flash Sale"
        message="Produk akan kembali ke harga normal dan hilang dari banner flash sale di toko. Yakin ingin menghentikan?"
      />
    </DashboardLayout>
  )
}

// ================================================
// FLASH SALE FORM (bottom sheet, konsisten dgn pola bundle)
// ================================================
function FlashSaleForm({ produk: p, harga, setHarga, sampai, setSampai, loading, error, onClose, onSubmit, onRequestClear }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const diskon = harga && !isNaN(harga) && Number(harga) < Number(p.harga)
    ? Math.round((1 - Number(harga) / Number(p.harga)) * 100)
    : null
  const nowLocal = toDatetimeLocal(new Date().toISOString())
  const active = isFlashActive(p)

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--bg-secondary)', borderRadius: '20px 20px 0 0',
        padding: '24px 20px 32px', width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={17} color="var(--accent)" />
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>
              {active ? 'Edit Flash Sale' : 'Buat Flash Sale'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--text-tertiary)' }}>×</button>
        </div>

        {/* Preview produk */}
        <div style={{
          display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px',
          background: 'var(--surface)', border: '1px solid var(--glass-border)',
          borderRadius: 10, marginBottom: 16,
        }}>
          {thumbUrl ? (
            <img src={thumbUrl} alt={p.nama} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Package size={18} color="var(--text-tertiary)" />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nama}</div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Harga normal: Rp {Number(p.harga).toLocaleString('id-ID')}</div>
          </div>
        </div>

        {error && (
          <div style={{ background: colorMix('var(--danger)', '12%'), color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
            {error}
          </div>
        )}

        {/* Harga flash */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>HARGA FLASH SALE (Rp) *</label>
          <input
            type="number"
            value={harga}
            onChange={e => setHarga(e.target.value)}
            placeholder="cth: 89000"
            style={{
              width: '100%', marginTop: 4, padding: '9px 12px',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
          {diskon !== null && (
            <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 6 }}>
              Hemat {diskon}% dari harga normal
            </div>
          )}
        </div>

        {/* Berakhir pada */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>BERAKHIR PADA *</label>
          <input
            type="datetime-local"
            value={sampai}
            min={nowLocal}
            onChange={e => setSampai(e.target.value)}
            style={{
              width: '100%', marginTop: 4, padding: '9px 12px',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
            }}
          />
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={11} /> Countdown otomatis muncul di halaman toko
          </div>
        </div>

        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '12px', borderRadius: 100,
            background: 'var(--accent)', color: '#fff',
            border: 'none', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          <Zap size={15} />
          {loading ? 'Menyimpan...' : active ? 'Perbarui Flash Sale' : 'Aktifkan Flash Sale'}
        </button>

        {/* Tombol hentikan — hanya muncul kalau flash sale sedang aktif */}
        {onRequestClear && (
          <button
            onClick={onRequestClear}
            style={{
              width: '100%', padding: '12px', borderRadius: 100, marginTop: 10,
              background: colorMix('var(--danger)', '10%'),
              border: `1px solid ${colorMix('var(--danger)', '35%')}`,
              color: 'var(--danger)', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              cursor: 'pointer',
            }}
          >
            <Ban size={15} />
            Hentikan Flash Sale
          </button>
        )}
      </div>
    </div>
  )
}

function ProductCard({ produk: p, pro, onEdit, onDelete, onToggle, onFlashSale, onClearFlashSale }) {
  const [showActions, setShowActions] = useState(false)
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const diskon = hitungDiskon(p.harga, p.hargaCoret)
  const flashActive = isFlashActive(p)

  return (
    <div
      className="glass-card"
      style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: 0 }}
    >
      {/* IMAGE AREA */}
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            <Package size={36} />
          </div>
        )}

        {/* DISKON BADGE */}
        {diskon && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#ef4444',
            borderRadius: '6px',
            padding: '2px 7px',
            fontSize: '0.7rem', fontWeight: 700, color: '#fff',
          }}>
            -{diskon}%
          </div>
        )}

        {/* STOK HABIS */}
        {p.stok === 0 && !diskon && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Habis</span>
          </div>
        )}

        {/* FOTO COUNT */}
        {fotos.length > 1 && (
          <div style={{
            position: 'absolute', bottom: flashActive ? 32 : 8, right: 8,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)',
            borderRadius: 'var(--radius-full)',
            padding: '2px 7px',
            fontSize: '0.65rem', fontWeight: 700, color: '#fff',
          }}>
            1/{fotos.length}
          </div>
        )}

        {/* NONAKTIF OVERLAY */}
        {!p.aktif && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="badge badge-free">Nonaktif</span>
          </div>
        )}

        {/* FLASH SALE BADGE */}
        {flashActive && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'var(--accent)',
            padding: '4px 8px',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Zap size={11} color="#fff" fill="#fff" />
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 10.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Rp {Number(p.hargaFlash).toLocaleString('id-ID')} · s/d {formatFlashSampai(p.flashSaleUntil)}
            </span>
          </div>
        )}

        {/* ACTION MENU BUTTON */}
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <button
            onClick={() => setShowActions(v => !v)}
            style={{
              width: 28, height: 28,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff',
            }}
          >
            <MoreVertical size={14} />
          </button>

          {showActions && (
            <div
              style={{
                position: 'absolute', top: 32, right: 0,
                background: 'var(--surface-elevated, var(--surface))',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '4px',
                zIndex: 10,
                minWidth: 160,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              onMouseLeave={() => setShowActions(false)}
            >
              <button onClick={() => { onToggle(); setShowActions(false) }} style={menuItemStyle}>
                {p.aktif ? <EyeOff size={13} /> : <Eye size={13} />}
                {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button onClick={() => { onEdit(); setShowActions(false) }} style={{ ...menuItemStyle, color: 'var(--text-primary, #1a1a1a)' }}>
                <Edit2 size={13} /> Edit
              </button>
              {flashActive ? (
                <button onClick={() => { onClearFlashSale(); setShowActions(false) }} style={{ ...menuItemStyle, color: 'var(--danger, #ef4444)' }}>
                  <Ban size={13} /> Hentikan Flash Sale
                </button>
              ) : (
                <button onClick={() => { onFlashSale(); setShowActions(false) }} style={{ ...menuItemStyle, justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Zap size={13} /> Flash Sale
                  </span>
                  {!pro && <Lock size={11} color="var(--text-tertiary)" />}
                </button>
              )}
              <button onClick={() => { onDelete(); setShowActions(false) }} style={{ ...menuItemStyle, color: 'var(--danger, #ef4444)' }}>
                <Trash2 size={13} /> Hapus
              </button>
            </div>
          )}
        </div>
      </div>

      {/* INFO AREA */}
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.8rem', marginBottom: 2, lineHeight: 1.3 }}>
          {truncate(p.nama, 35)}
        </p>
        {p.kategori && (
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginBottom: 5 }}>{p.kategori}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.88rem' }}>{formatRupiah(p.harga)}</p>
          {p.hargaCoret && (
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>
          )}
        </div>
      </div>
    </div>
  )
}

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '8px',
  width: '100%', padding: '7px 10px',
  background: 'none', border: 'none',
  borderRadius: '7px',
  cursor: 'pointer',
  fontSize: '0.78rem', fontWeight: 600,
  color: 'var(--text-primary)',
  textAlign: 'left',
}

// Helper function untuk color-mix
function colorMix(color, opacity) {
  return `color-mix(in srgb, ${color} ${opacity}, transparent)`
}
