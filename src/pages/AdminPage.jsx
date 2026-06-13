import React, { useEffect, useState } from 'react'
import {
  Users, Zap, ZapOff, Search, RefreshCw,
  Crown, Store, Calendar, ChevronDown,
  CheckCircle, XCircle, Clock, TrendingUp,
  Shield, Mail, BarChart2, Trash2, AlertTriangle
} from 'lucide-react'
import { useAuthStore } from '../lib/store.js'
import { formatDate, formatRupiah } from '../lib/utils.js'
import { adminApi } from '../lib/api/index.js'
import toast from 'react-hot-toast'

const DURATIONS = [
  { label: '1 Bulan', months: 1 },
  { label: '3 Bulan', months: 3 },
  { label: '6 Bulan', months: 6 },
  { label: '1 Tahun', months: 12 },
]

export default function AdminPage() {
  const { user, tokenSupabase, tokenGas } = useAuthStore()
  const tokenObj = { tokenSupabase, tokenGas }

  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState('all')
  const [togglingId, setTogglingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [selectedDuration, setSelectedDuration] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [usersRes, statsRes] = await Promise.all([
        adminApi.getUsers(tokenObj),
        adminApi.getStats(tokenObj),
      ])
      setUsers(usersRes.data || [])
      setStats(statsRes.data || null)
    } catch (err) {
      toast.error('Gagal memuat data: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePro = async (targetUser) => {
    const isPro = targetUser.plan === 'pro' && new Date(targetUser.planExpiry) > new Date()
    const months = selectedDuration[targetUser.id] || 1

    setTogglingId(targetUser.id)
    try {
      if (isPro) {
        await adminApi.revokePro(tokenObj, targetUser.id)
        setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, plan: 'free', planExpiry: null } : x))
        toast.success(`Pro dinonaktifkan untuk ${targetUser.name}`)
      } else {
        await adminApi.grantPro(tokenObj, targetUser.id, months)
        const expiry = new Date()
        expiry.setMonth(expiry.getMonth() + months)
        setUsers(u => u.map(x => x.id === targetUser.id ? { ...x, plan: 'pro', planExpiry: expiry.toISOString() } : x))
        toast.success(`Pro aktif ${months} bulan untuk ${targetUser.name} 🎉`)
      }
    } catch (err) {
      toast.error(err.message)
    } finally {
      setTogglingId(null)
    }
  }

  const handleDeleteUser = async () => {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      await adminApi.deleteUser(tokenObj, confirmDelete.id)
      setUsers(u => u.filter(x => x.id !== confirmDelete.id))
      if (expandedId === confirmDelete.id) setExpandedId(null)
      toast.success(`Akun ${confirmDelete.name} berhasil dihapus`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeletingId(null)
      setConfirmDelete(null)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.tokoNama?.toLowerCase().includes(search.toLowerCase())
    const matchPlan = filterPlan === 'all' || u.plan === filterPlan
    return matchSearch && matchPlan
  })

  const proCount = users.filter(u => u.plan === 'pro' && new Date(u.planExpiry) > new Date()).length
  const freeCount = users.length - proCount
  const expiredCount = users.filter(u => u.plan === 'pro' && new Date(u.planExpiry) <= new Date()).length

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>

      {/* Top navbar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '0 32px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 14, color: '#fff',
            boxShadow: '0 0 16px var(--accent-glow)',
          }}>E</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Exora</span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '3px 10px', borderRadius: 'var(--radius-full)',
            background: 'rgba(248,113,113,0.12)',
            border: '1px solid rgba(248,113,113,0.2)',
          }}>
            <Shield size={11} color="var(--danger)" />
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--danger)', letterSpacing: '0.06em' }}>
              ADMIN PANEL
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={loadAll} className="btn btn-ghost btn-icon btn-sm" disabled={loading}>
            <RefreshCw size={15} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.picture
              ? <img src={user.picture} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} />
              : <div className="avatar avatar-sm">{user?.name?.[0]}</div>
            }
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{user?.name}</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Total Seller', value: loading ? '—' : users.length, icon: Users, color: 'var(--accent)' },
            { label: 'Aktif Pro', value: loading ? '—' : proCount, icon: Crown, color: 'var(--warning)' },
            { label: 'Paket Gratis', value: loading ? '—' : freeCount, icon: ZapOff, color: 'var(--text-tertiary)' },
            { label: 'Pro Expired', value: loading ? '—' : expiredCount, icon: Clock, color: 'var(--danger)' },
            { label: 'Total Toko', value: loading ? '—' : (stats?.totalToko ?? '—'), icon: Store, color: 'var(--success)' },
            { label: 'Total Produk', value: loading ? '—' : (stats?.totalProduk ?? '—'), icon: BarChart2, color: 'var(--accent-3)' },
          ].map(s => (
            <div key={s.label} className="glass-card" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {s.label}
                </p>
                <s.icon size={14} color={s.color} />
              </div>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: s.color }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue stats */}
        {stats && (
          <div className="glass-card" style={{
            padding: '18px 24px', marginBottom: 24,
            background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.08) 100%)',
            border: '1px solid rgba(167,139,250,0.15)',
            display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <TrendingUp size={18} color="var(--accent)" />
              <div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Estimasi Pendapatan Platform
                </p>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: 'var(--accent)' }}>
                  {formatRupiah(proCount * 49000)}/bulan
                </p>
              </div>
            </div>
            <div style={{ height: 36, width: 1, background: 'var(--glass-border)' }} />
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Dari <strong>{proCount}</strong> seller Pro aktif × Rp 19.000
            </p>
          </div>
        )}

        {/* Search & filter */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari nama, email, atau nama toko..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {['all', 'pro', 'free'].map(p => (
            <button
              key={p}
              onClick={() => setFilterPlan(p)}
              className="btn btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                background: filterPlan === p ? 'var(--surface-active)' : 'var(--surface)',
                color: filterPlan === p ? 'var(--text-primary)' : 'var(--text-secondary)',
                border: `1px solid ${filterPlan === p ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
              }}
            >
              {p === 'all' ? 'Semua' : p === 'pro' ? '⭐ Pro' : 'Gratis'}
              <span style={{
                marginLeft: 4,
                background: 'var(--surface-hover)',
                padding: '1px 6px', borderRadius: 'var(--radius-full)',
                fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)',
              }}>
                {p === 'all' ? users.length : p === 'pro' ? proCount : freeCount}
              </span>
            </button>
          ))}
        </div>

        {/* Users list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
            <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p>Tidak ada seller ditemukan</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {filtered.map(u => (
              <SellerRow
                key={u.id}
                seller={u}
                expanded={expandedId === u.id}
                onExpand={() => setExpandedId(expandedId === u.id ? null : u.id)}
                onToggle={() => handleTogglePro(u)}
                onDelete={() => setConfirmDelete(u)}
                isToggling={togglingId === u.id}
                isDeleting={deletingId === u.id}
                duration={selectedDuration[u.id] || 1}
                onDurationChange={(months) => setSelectedDuration(d => ({ ...d, [u.id]: months }))}
              />
            ))}
          </div>
        )}
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <ConfirmDeleteModal
          seller={confirmDelete}
          isDeleting={deletingId === confirmDelete.id}
          onConfirm={handleDeleteUser}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  )
}

// =============================================
// CONFIRM DELETE MODAL
// =============================================
function ConfirmDeleteModal({ seller, isDeleting, onConfirm, onCancel }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'var(--bg-secondary)',
          border: '1px solid rgba(248,113,113,0.25)',
          borderRadius: 'var(--radius-2xl)',
          padding: 28,
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-xl)',
          background: 'rgba(248,113,113,0.12)',
          border: '1px solid rgba(248,113,113,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <AlertTriangle size={22} color="var(--danger)" />
        </div>

        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', marginBottom: 8 }}>
          Hapus Akun?
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
          Akun <strong>{seller.name}</strong> ({seller.email}) akan dihapus permanen beserta semua data toko, produk, pesanan, dan token-nya.
        </p>

        <div style={{
          padding: '10px 14px',
          background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.15)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 24,
          fontSize: '0.8rem', color: 'var(--danger)', lineHeight: 1.5,
        }}>
          ⚠ Tindakan ini tidak bisa dibatalkan.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="btn"
            style={{
              flex: 1,
              background: 'rgba(248,113,113,0.15)',
              color: 'var(--danger)',
              border: '1px solid rgba(248,113,113,0.3)',
            }}
          >
            {isDeleting
              ? <><span className="spinner" style={{ width: 13, height: 13 }} /> Menghapus...</>
              : <><Trash2 size={14} /> Hapus Permanen</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// SELLER ROW
// =============================================
function SellerRow({ seller, expanded, onExpand, onToggle, onDelete, isToggling, isDeleting, duration, onDurationChange }) {
  const now = new Date()
  const isPro = seller.plan === 'pro' && seller.planExpiry && new Date(seller.planExpiry) > now
  const isExpired = seller.plan === 'pro' && seller.planExpiry && new Date(seller.planExpiry) <= now

  const daysLeft = isPro
    ? Math.ceil((new Date(seller.planExpiry) - now) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div
      className="glass-card"
      style={{
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        border: isPro
          ? '1px solid rgba(167,139,250,0.25)'
          : isExpired
          ? '1px solid rgba(248,113,113,0.2)'
          : 'var(--glass-border)',
        transition: 'all var(--transition-fast)',
      }}
    >
      {/* Main row */}
      <div style={{
        padding: '14px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer',
      }} onClick={onExpand}>

        {seller.picture
          ? <img src={seller.picture} alt={seller.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          : <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{seller.name?.[0]}</div>
        }

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{seller.name}</p>
            {isPro && <span className="badge badge-pro" style={{ fontSize: '0.65rem', padding: '1px 7px' }}>⭐ Pro</span>}
            {isExpired && <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '1px 7px' }}>Expired</span>}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: 1 }}>
            {seller.email}
            {seller.tokoNama && <span style={{ marginLeft: 8 }}>· 🏪 {seller.tokoNama}</span>}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0, marginRight: 8 }}>
          {isPro && (
            <>
              <p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>{daysLeft} hari lagi</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                s/d {formatDate(seller.planExpiry, { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </>
          )}
          {isExpired && (
            <p style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700 }}>
              Expired {formatDate(seller.planExpiry, { day: 'numeric', month: 'short' })}
            </p>
          )}
          {!isPro && !isExpired && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Gratis</p>
          )}
        </div>

        <ChevronDown
          size={15}
          color="var(--text-tertiary)"
          style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}
        />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div style={{
          padding: '16px 18px 18px',
          borderTop: '1px solid var(--glass-border)',
          background: 'rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          {/* Detail info */}
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Mail size={12} color="var(--text-tertiary)" />
              {seller.email}
            </div>
            {seller.tokoSlug && (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <Store size={12} color="var(--text-tertiary)" />
                <a href={`/toko/${seller.tokoSlug}`}
                  target="_blank" rel="noreferrer"
                  style={{ color: 'var(--accent)' }}
                  onClick={e => e.stopPropagation()}
                >
                  /toko/{seller.tokoSlug}
                </a>
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <Calendar size={12} color="var(--text-tertiary)" />
              Daftar: {formatDate(seller.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
            {seller.totalProduk !== undefined && (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                📦 {seller.totalProduk} produk · 🛒 {seller.totalPesanan || 0} pesanan
              </div>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {!isPro && (
              <div style={{ display: 'flex', gap: 4 }}>
                {DURATIONS.map(d => (
                  <button
                    key={d.months}
                    onClick={e => { e.stopPropagation(); onDurationChange(d.months) }}
                    className="btn btn-sm"
                    style={{
                      borderRadius: 'var(--radius-full)',
                      padding: '5px 10px', fontSize: '0.72rem',
                      background: duration === d.months ? 'var(--accent-gradient-soft)' : 'var(--surface)',
                      color: duration === d.months ? 'var(--accent-3)' : 'var(--text-tertiary)',
                      border: `1px solid ${duration === d.months ? 'rgba(167,139,250,0.25)' : 'var(--glass-border)'}`,
                    }}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            )}

            {/* Toggle Pro */}
            <button
              onClick={e => { e.stopPropagation(); onToggle() }}
              disabled={isToggling || isDeleting}
              className="btn btn-sm"
              style={{
                background: isPro ? 'rgba(248,113,113,0.12)' : 'linear-gradient(135deg, #5b8af5, #a78bfa)',
                color: isPro ? 'var(--danger)' : '#fff',
                border: isPro ? '1px solid rgba(248,113,113,0.25)' : 'none',
                boxShadow: isPro ? 'none' : '0 4px 16px rgba(91,138,245,0.35)',
                minWidth: 120, gap: 7,
              }}
            >
              {isToggling
                ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Memproses...</>
                : isPro
                ? <><ZapOff size={13} /> Cabut Pro</>
                : <><Zap size={13} /> Aktifkan Pro {duration > 1 ? `${duration}bln` : ''}</>
              }
            </button>

            {/* Hapus Akun */}
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              disabled={isToggling || isDeleting}
              className="btn btn-sm"
              style={{
                background: 'rgba(248,113,113,0.1)',
                color: 'var(--danger)',
                border: '1px solid rgba(248,113,113,0.2)',
                gap: 6,
              }}
            >
              {isDeleting
                ? <><span className="spinner" style={{ width: 12, height: 12 }} /> Menghapus...</>
                : <><Trash2 size={13} /> Hapus Akun</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
