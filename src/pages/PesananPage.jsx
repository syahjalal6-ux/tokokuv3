import React, { useEffect, useState } from 'react'
import { ShoppingBag, MessageCircle, ChevronDown, Search, Download, Truck } from 'lucide-react'
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

const KURIR_LIST = [
  'J&T Express', 'JNE', 'SiCepat', 'Anteraja', 'Ninja Xpress',
  'Lion Parcel', 'Pos Indonesia', 'Tiki', 'SAP Express', 'Lainnya',
]

const STATUS_KETERANGAN = {
  pending: 'Pesanan kamu sudah kami terima, segera kami proses ya!',
  confirmed: 'Pesanan kamu sudah kami konfirmasi, sedang diproses!',
  processing: 'Pesanan kamu sedang kami proses, mohon ditunggu ya!',
  shipped: 'Pesanan kamu sudah dikirim, segera cek resi pengiriman ya!',
  done: 'Pesanan kamu sudah selesai, terima kasih sudah berbelanja!',
  cancelled: 'Mohon maaf, pesanan kamu dibatalkan. Silakan hubungi kami untuk info lebih lanjut.',
}

function generatePesananWAMessage(p) {
  const statusLabel = PESANAN_STATUS[p.status] ? PESANAN_STATUS[p.status].label : p.status
  const keterangan = STATUS_KETERANGAN[p.status] || ''
  const lines = [
    'Halo ' + p.buyerNama + ', berikut info pesanan kamu:',
    '',
    '*' + p.produkNama + '*',
    'Qty: ' + p.qty,
    'Total: ' + formatRupiah(p.total),
    'Alamat: ' + p.buyerAlamat,
  ]
  if (p.catatan) lines.push('Catatan: ' + p.catatan)
  lines.push('')
  lines.push('Status: *' + statusLabel + '*')
  if (keterangan) lines.push(keterangan)
  return lines.join('\n')
}

function generateShippingWAMessage(p, kurir, resi) {
  const lines = [
    'Halo ' + p.buyerNama + ', pesanan kamu sudah kami kirim! 🚚',
    '',
    '*' + p.produkNama + '* x' + p.qty,
    'Total: ' + formatRupiah(p.total),
    '',
    'Info Pengiriman:',
    'Kurir: *' + kurir + '*',
    'No. Resi: *' + resi + '*',
    '',
    'Silakan cek status pengiriman dengan nomor resi di atas ya!',
    'Terima kasih sudah berbelanja 🙏',
  ]
  return lines.join('\n')
}

function exportToExcel(pesanan) {
  if (!pesanan.length) {
    toast.error('Tidak ada data untuk diekspor')
    return
  }

  const rows = []
  rows.push([
    'ID Pesanan', 'Tanggal', 'Nama Pembeli', 'WA Pembeli', 'Alamat',
    'Catatan', 'Produk', 'Total', 'Status'
  ])

  pesanan.forEach(function(p) {
    const produkList = p.items && p.items.length
      ? p.items.map(function(i) { return i.nama + ' x' + i.qty }).join('; ')
      : (p.produkNama + ' x' + p.qty)
    rows.push([
      p.id || '',
      formatDateTime(p.createdAt),
      p.buyerNama || '',
      p.buyerWa || '',
      p.buyerAlamat || '',
      p.catatan || '',
      produkList,
      p.total || 0,
      PESANAN_STATUS[p.status] ? PESANAN_STATUS[p.status].label : (p.status || ''),
    ])
  })

  const csv = rows.map(function(row) {
    return row.map(function(cell) {
      return '"' + String(cell).replace(/"/g, '""') + '"'
    }).join(',')
  }).join('\n')

  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'pesanan-' + new Date().toISOString().slice(0, 10) + '.csv'
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
    const matchSearch = !search || (p.buyerNama && p.buyerNama.toLowerCase().includes(search.toLowerCase())) || (p.id && p.id.includes(search))
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
      subtitle={pesanan.filter(p => p.status === 'pending').length + ' menunggu konfirmasi'}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

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
                    border: '1px solid ' + (activeTab === t.key ? 'var(--glass-border-hover)' : 'var(--glass-border)'),
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

        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={28} />}
            title={search ? 'Pesanan tidak ditemukan' : activeTab !== 'all' ? 'Tidak ada pesanan ' + (STATUS_TABS.find(t => t.key === activeTab) || {}).label : 'Belum ada pesanan'}
            description={activeTab === 'all' ? 'Pesanan dari pembeli akan muncul di sini' : 'Coba tab lain'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(p => (
              <PesananCard key={p.id} pesanan={p} onStatusChange={handleStatusChange} setPesanan={setPesanan} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

function PesananCard({ pesanan: p, onStatusChange, setPesanan }) {
  const [expanded, setExpanded] = useState(false)
  const [kurirOpen, setKurirOpen] = useState(false)
  const [kurir, setKurir] = useState(KURIR_LIST[0])
  const [resi, setResi] = useState('')
  const [sendingKurir, setSendingKurir] = useState(false)
  const statusCfg = PESANAN_STATUS[p.status] || PESANAN_STATUS.pending

  const dotColor = statusCfg.color === 'success' ? 'var(--success)'
    : statusCfg.color === 'warning' ? 'var(--warning)'
    : statusCfg.color === 'danger' ? 'var(--danger)'
    : 'var(--accent)'

  const waMessage = generatePesananWAMessage(p)

  const handleKirim = async () => {
    if (!resi.trim()) {
      toast.error('Nomor resi wajib diisi')
      return
    }
    setSendingKurir(true)
    try {
      await pesananApi.updateStatus(p.token || '', p.id, 'shipped')
      setPesanan(ps => ps.map(x => x.id === p.id ? { ...x, status: 'shipped', kurir, resi } : x))
      const msg = generateShippingWAMessage(p, kurir, resi)
      window.open(generateWALink(p.buyerWa, msg), '_blank')
      setKurirOpen(false)
      toast.success('Status dikirim & WA terkirim!')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSendingKurir(false)
    }
  }

  const canShip = p.status !== 'shipped' && p.status !== 'done' && p.status !== 'cancelled'

  return (
    <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 7,
          background: dotColor,
          boxShadow: '0 0 6px ' + dotColor,
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 2 }}>
                {p.buyerNama || 'Pembeli'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {'#' + (p.id ? p.id.slice(-8) : '-') + ' · ' + formatDateTime(p.createdAt)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
              <span className={'badge badge-' + statusCfg.color}>{statusCfg.label}</span>
              <button onClick={() => setExpanded(!expanded)} className="btn btn-ghost btn-icon btn-sm">
                <ChevronDown size={15} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 800, color: 'var(--accent)', fontSize: '0.95rem' }}>{formatRupiah(p.total)}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
              {p.produkNama ? (p.produkNama + ' x' + p.qty) : ((p.items ? p.items.length : 0) + ' item')}
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--glass-border)' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 16 }}>
            {p.items && p.items.length > 0 ? (
              p.items.map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.foto && (
                      <img src={item.foto} alt={item.nama} style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }} />
                    )}
                    <div>
                      <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{item.nama}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{'x ' + item.qty}</p>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, flexShrink: 0 }}>{formatRupiah(item.harga * item.qty)}</p>
                </div>
              ))
            ) : p.produkNama ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.produkNama}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{'x ' + p.qty}</p>
                </div>
                <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{formatRupiah(p.total)}</p>
              </div>
            ) : null}
          </div>

          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', padding: '12px', marginBottom: 14, fontSize: '0.82rem' }}>
            <p style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>Nama: </span>{p.buyerNama}
            </p>
            <p style={{ marginBottom: 4 }}>
              <span style={{ color: 'var(--text-tertiary)' }}>WA: </span>{p.buyerWa}
            </p>
            {p.buyerAlamat && (
              <p style={{ marginBottom: 4 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Alamat: </span>{p.buyerAlamat}
              </p>
            )}
            {p.catatan && (
              <p style={{ marginBottom: 0 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Catatan: </span>{p.catatan}
              </p>
            )}
            {p.resi && (
              <p style={{ marginBottom: 0, marginTop: 4 }}>
                <span style={{ color: 'var(--text-tertiary)' }}>Resi: </span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>{p.kurir} — {p.resi}</span>
              </p>
            )}
          </div>

          {/* Action icons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Chat WA */}
            <a
              href={generateWALink(p.buyerWa, waMessage)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-icon btn-sm"
              title="Chat via WA"
            >
              <MessageCircle size={15} />
            </a>

            {/* Status dropdown */}
            {p.status !== 'done' && p.status !== 'cancelled' && (
              <select
                className="form-input form-select"
                style={{
                  width: 'auto',
                  fontSize: '0.78rem',
                  padding: '6px 32px 6px 10px',
                  height: 34,
                  background: 'var(--surface)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
                value={p.status}
                onChange={e => onStatusChange(p.id, e.target.value)}
              >
                {Object.entries(PESANAN_STATUS).map(([key, val]) => (
                  <option key={key} value={key} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {val.label}
                  </option>
                ))}
              </select>
            )}

            {/* Kirim icon */}
            {canShip && (
              <button
                onClick={() => setKurirOpen(!kurirOpen)}
                className="btn btn-icon btn-sm"
                title="Input kurir & resi"
                style={{
                  background: kurirOpen ? 'var(--accent-gradient)' : 'var(--surface)',
                  border: '1px solid var(--glass-border)',
                  color: kurirOpen ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <Truck size={15} />
              </button>
            )}
          </div>

          {/* Form kurir & resi */}
          {kurirOpen && canShip && (
            <div style={{
              marginTop: 12, padding: '14px',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              display: 'flex', flexDirection: 'column', gap: '10px',
            }}>
              <div className="form-group">
                <label className="form-label">Kurir</label>
                <select
                  className="form-input form-select"
                  value={kurir}
                  onChange={e => setKurir(e.target.value)}
                  style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                >
                  {KURIR_LIST.map(k => (
                    <option key={k} value={k} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{k}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nomor Resi</label>
                <input
                  className="form-input"
                  placeholder="cth: JT1234567890"
                  value={resi}
                  onChange={e => setResi(e.target.value)}
                />
              </div>
              <button
                onClick={handleKirim}
                disabled={sendingKurir || !resi.trim()}
                className="btn btn-primary btn-sm"
                style={{ width: '100%', gap: 6 }}
              >
                <Truck size={14} />
                {sendingKurir ? 'Menyimpan...' : 'Simpan & Kirim WA'}
              </button>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
