import React, { useEffect, useState } from 'react'
import { Plus, Search, Package, Edit2, Trash2, Eye, EyeOff, Filter } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import ProdukForm from '../components/seller/ProdukForm.jsx'
import { EmptyState, ConfirmDialog, Alert, ProductSkeleton } from '../components/ui/index.jsx'
import { useAuthStore, useProdukStore, useTokoStore } from '../lib/store.js'
import { produkApi } from '../lib/api.js'
import { formatRupiah, isPro, truncate } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function ProdukPage() {
  const { user, token } = useAuthStore()
  const { toko } = useTokoStore()
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

  useEffect(() => {
    if (token) load(token)
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
      const res = await produkApi.update(token, p.id, { aktif: !p.aktif })
      update(p.id, { aktif: !p.aktif })
      toast.success(p.aktif ? 'Produk dinonaktifkan' : 'Produk diaktifkan')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await produkApi.delete(token, deleteId)
      remove(deleteId)
      toast.success('Produk dihapus')
      setDeleteId(null)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
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
      {!toko ? (
        <Alert type="warning" title="Buat toko dulu">
          Kamu belum punya toko. <Link to="/dashboard" style={{ color: 'var(--warning)', fontWeight: 700 }}>Buat toko sekarang</Link>
        </Alert>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {limitReached && !pro && (
            <Alert type="warning" title="Batas produk tercapai">
              Upgrade ke Pro untuk produk unlimited.{' '}
              <Link to="/dashboard/upgrade" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upgrade sekarang</Link>
            </Alert>
          )}

          {/* Search & Filter */}
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

          {/* Product grid */}
          {isLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {Array(6).fill(0).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {filtered.map(p => (
                <ProductCard
                  key={p.id}
                  produk={p}
                  onEdit={() => handleEdit(p)}
                  onDelete={() => setDeleteId(p.id)}
                  onToggle={() => handleToggleAktif(p)}
                />
              ))}
            </div>
          )}
        </div>
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
    </DashboardLayout>
  )
}

function ProductCard({ produk: p, onEdit, onDelete, onToggle }) {
  return (
    <div className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
        {p.foto ? (
          <img src={p.foto} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            <Package size={36} />
          </div>
        )}
        {!p.aktif && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="badge badge-free">Nonaktif</span>
          </div>
        )}
        {p.stok === 0 && (
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Habis</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3, lineHeight: 1.3 }}>
          {truncate(p.nama, 40)}
        </p>
        {p.kategori && (
          <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>{p.kategori}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 12 }}>
          <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>{formatRupiah(p.harga)}</p>
          {p.hargaCoret && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
          <button onClick={onToggle} className="btn btn-secondary btn-sm" style={{ flex: 1, fontSize: '0.72rem' }} title={p.aktif ? 'Nonaktifkan' : 'Aktifkan'}>
            {p.aktif ? <EyeOff size={13} /> : <Eye size={13} />}
            {p.aktif ? 'Nonaktif' : 'Aktifkan'}
          </button>
          <button onClick={onEdit} className="btn btn-secondary btn-icon btn-sm" title="Edit">
            <Edit2 size={13} />
          </button>
          <button onClick={onDelete} className="btn btn-danger btn-icon btn-sm" title="Hapus">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}
