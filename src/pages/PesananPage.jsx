import React, { useEffect, useState } from 'react'
import { ShoppingBag, MessageCircle, ChevronDown, Search, Download } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { EmptyState, ProGate } from '../components/ui/index.jsx'
import { useAuthStore } from '../lib/store.js'
import { pesananApi } from '../lib/api.js'
import { formatRupiah, formatDateTime, generateWALink, isPro, PESANAN_STATUS } from '../lib/utils.js'
import toast from 'react-hot-toast'

const STATUS_TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'pending', label: 'Menunggu' },
  { key: 'confirmed', label: 'Dikonfirmasi' },
  { key: 'processing', label: 'Diproses' },
  { key: 'shipped', label: 'Dikirim' },
  { key: 'done', label: 'Selesai' },
  { key: 'cancelled', label: 'Dibatalkan' },
]

function exportToExcel(pesanan) {
  if (!pesanan.length) {
    toast.error('Tidak ada data untuk diekspor')
    return
  }

  const rows = []

  // Header
  rows.push([
    'ID Pesanan', 'Tanggal', 'Nama Pembeli', 'WA Pembeli', 'Alamat',
    'Catatan', 'Produk', 'Total', 'Status'
  ])

  pesanan.forEach(p => {
    const produkList = (p.items || []).map(i => `${i.nama} x${i.qty}`).join('; ')
    rows.push([
      p.id || '',
      formatDateTime(p.createdAt),
      p.buyerNama || '',
      p.buyerWa || '',
      p.buyerAlamat || '',
      p.catatan || '',
      produkList,
      p.total || 0,
      PESANAN_STATUS[p.status]?.label || p.status || '',
    ])
  })

  // Build CSV
  const csv = rows.map(row =>
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `pesanan-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('Data berhasil diekspor!')
}

export default function PesananPage() {
  const { user, token } = useAuthStore()
  const [pesanan, setPesanan] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const pro = isPro(user)

  useEffect(() => {
    if (token && pro) loadPesanan()
    else setIsLoading(false)
  }, [token, pro])

  const loadPesanan = async () => {
    setIsLoading(true)
    try {
      const res = await pesananApi.getMine(token)
      setPesanan(res.data || [])
    } catch (err) {
      toast.error('Gagal memuat pesanan')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStatusChange = async (pesananId, status) => {
    try {
      await pesananApi.updateStatus(token, pesananId, status)
      setPesanan(ps => ps.map(p => p.id === pesananId ? { ...p, status } : p))
      toast.success('Status diperbarui')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const filtered = pesanan.filter(p => {
    const matchTab = activeTab === 'all' || p.status === activeTab
    const matchSearch = !search || p.buyerNama?.toLowerCase().includes(search.toLowerCase()) || p.id?.includes(search)
    return matchTab && matchSearch
  })

  if (!pro) {
    return (
      <DashboardLayout title="Pesanan">
        <div style={{ maxWidth: 500, margin: '0 auto', marginTop: 40 }}>
          <ProGate />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Pesanan"
      subtitle={`${pesanan.filter(p => p.status === 'pending').length} menunggu konfirmasi`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Tabs + Export */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: 4, flex: 1 }}>
            {STATUS_TABS.map(t => {
              const count = t.key === 'all' ? pesanan.length : pesanan.filter(p => p.status === t.key).length
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className="btn btn-sm"
                  style={{
                    flexShrink: 0,
                    background: activeTab === t.key ? 'var(--surface-active)' : 'var(--surface)',
                    color: activeTab === t.key ? 'var(--text-primary)' : 'var(--text-secondary)',
                    border: `1px solid ${activeTab === t.key ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-full)',
                    gap: 6,
                  }}
                >
                  {t.label}
                  {count > 0 && (
                    <span style={{
                      background: activeTab === t.key ? 'var(--accent)' : 'var(--surface-hover)',
                      color: activeTab === t.key ? '#fff' : 'var(--text-tertiary)',
                      borderRadius: 'var(--radius-full)',
                      padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700,
                    }}>{count}</span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Export button */}
          <button
            onClick={() => exportToExcel(filtered)}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0, gap: 6 }}
            disabled={filtered.length === 0}
          >
            <Download size={14} />
            Export Excel
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Cari nama pembeli / ID pesanan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Pesanan list */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title={search ? 'Pesanan tidak ditemukan' : activeTab !== 'all' ? `Tidak ada pesanan ${STATUS_TABS.find(t => t.key === activeTab)?.label}` : 'Belum ada pesanan'}
            description={activeTab === 'all' ? 'Pesanan dari pembeli akan muncul di sini' : 'Coba tab lain'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(p => (
              <PesananCard key={p.id} pesanan={p} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function PesananCard({ pesanan: p, onStatusChange }) {
  const [expanded, setExpanded] = useState(false)
  const statusCfg = PESANAN_STATUS[p.status] || PESANAN_STATUS.pending

  return (
    <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Status indicator */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 7,
          background: statusCfg.color === 'success' ? 'var(--success)'
            : statusCfg.color === 'warning' ? 'var(--warning)'
            : statusCfg.color === 'danger' ? 'var(--danger)'
            : 'var(--accent)',
          boxShadow: `0 0 6px ${statusCfg.color === 'success' ? 'var(--success)' : statusCfg.color === 'warning' ? 'var(--warning)' : 'var(--accent)'}`,
        }} />

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>
                {p.buyerNama || 'Pembeli'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                #{p.id?.slice(-8)} · {formatDateTime(p.createdAt)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <span className={`badge badge-${statusCfg.color}`}>{statusCfg.label}</span>
              <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-icon btn-sm">
                <ChevronDown size={15} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          {/* Summary */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>{formatRupiah(p.total)}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>{p.items?.length || 0} item</p>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>
          {/* Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 16 }}>
            {(p.items || []).map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {item.foto && <img src={item.foto} alt={item.nama} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />}
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.nama}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>× {item.qty}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>{formatRupiah(item.harga * item.qty)}</p>
              </div>
            ))}
          </div>

          {/* Buyer info */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 14, fontSize: '0.82rem' }}>
            <p><span style={{ color: 'var(--text-tertiary)' }}>Nama:</span> {p.buyerNama}</p>
            <p><span style={{ color: 'var(--text-tertiary)' }}>WA:</span> {p.buyerWa}</p>
            {p.buyerAlamat && <p><span style={{ color: 'var(--text-tertiary)' }}>Alamat:</span> {p.buyerAlamat}</p>}
            {p.catatan && <p><span style={{ color: 'var(--text-tertiary)' }}>Catatan:</span> {p.catatan}</p>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <a
              href={generateWALink(p.buyerWa, `Halo ${p.buyerNama}, pesanan #${p.id?.slice(-8)} kamu...`)}
              target="_blank" rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <MessageCircle size={13} /> Hubungi via WA
            </a>

            {p.status !== 'done' && p.status !== 'cancelled' && (
              <select
                className="form-input form-select"
                style={{ width: 'auto', fontSize: '0.78rem', padding: '6px 32px 6px 10px', height: 34 }}
                value={p.status}
                onChange={e => onStatusChange(p.id, e.target.value)}
              >
                {Object.entries(PESANAN_STATUS).map(([key, val]) => (
                  <option key={key} value={key}>{val.label}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
