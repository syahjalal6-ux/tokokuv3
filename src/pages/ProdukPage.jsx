import React, { useEffect, useState } from 'react'
import { Plus, Search, Package, Edit2, Trash2, Eye, EyeOff, MoreVertical } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import ProdukForm from '../components/seller/ProdukForm.jsx'
import { EmptyState, ConfirmDialog, Alert, ProductSkeleton } from '../components/ui/index.jsx'
import { useAuthStore, useProdukStore, useTokoStore } from '../lib/store.js'
import { produkApi } from '../lib/api/index.js'
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

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
  gap: '12px',
}

export default function ProdukPage() {
  const { user, tokenSupabase, tokenGas } = useAuthStore()
  const tokenObj = { tokenSupabase, tokenGas }
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

  useEffect(() => {
    if (tokenSupabase || tokenGas) {
      load(tokenObj)
      loadToko(tokenObj)
    }
  }, [tokenSupabase, tokenGas])

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
                onEdit={() => handleEdit(p)}
                onDelete={() => setDeleteId(p.id)}
                onToggle={() => handleToggleAktif(p)}
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
  const [showActions, setShowActions] = useState(false)
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const diskon = hitungDiskon(p.harga, p.hargaCoret)

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
            position: 'absolute', bottom: 8, right: 8,
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
                minWidth: 130,
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
              }}
              onMouseLeave={() => setShowActions(false)}
            >
              <button onClick={() => { onToggle(); setShowActions(false) }} style={menuItemStyle}>
                {p.aktif ? <EyeOff size={13} /> : <Eye size={13} />}
                {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
              </button>
              <button onClick={() => { onEdit(); setShowActions(false) }} style={menuItemStyle}>
                <Edit2 size={13} /> Edit
              </button>
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
