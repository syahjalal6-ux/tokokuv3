import React, { useEffect, useState } from 'react'
import {
  TrendingUp, Package, ShoppingBag, DollarSign,
  BarChart2, Award, RefreshCw, ArrowUpRight,
  ArrowDownRight, Calendar, Zap
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { useAuthStore } from '../lib/store.js'
import { analyticsApi } from '../lib/api.js'
import { formatRupiah, isPro } from '../lib/utils.js'
import toast from 'react-hot-toast'

export default function AnalyticsPage() {
  const { user, token } = useAuthStore()
  const pro = isPro(user)

  if (!pro) return <AnalyticsGate />

  return <AnalyticsDashboard token={token} />
}

// =============================================
// GATE — tampilan untuk user free
// =============================================

function AnalyticsGate() {
  return (
    <DashboardLayout title="Analytics">
      <div style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
        <div style={{
          padding: '52px 40px',
          background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.1) 100%)',
          border: '1px solid rgba(167,139,250,0.2)',
          borderRadius: 'var(--radius-2xl)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 'var(--radius-xl)',
            background: 'var(--accent-gradient-soft)',
            border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px', color: 'var(--accent-3)',
          }}>
            <BarChart2 size={28} />
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 10 }}>
            Analytics — Fitur Pro
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 28 }}>
            Pantau performa toko kamu: revenue, produk terlaris, tren pesanan, dan lebih banyak lagi.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28, textAlign: 'left' }}>
            {[
              'Grafik revenue harian & bulanan',
              'Produk terlaris',
              'Statistik pesanan lengkap',
              'Konversi & performa toko',
            ].map(f => (
              <div key={f} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />
                {f}
              </div>
            ))}
          </div>
          <Link to="/dashboard/upgrade" className="btn btn-primary">
            <Zap size={15} /> Upgrade ke Pro
          </Link>
        </div>
      </div>
    </DashboardLayout>
  )
}

// =============================================
// ANALYTICS DASHBOARD — Pro only
// =============================================

function AnalyticsDashboard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('bulan')

  useEffect(() => {
    load()
  }, [token])

  const load = async () => {
    setLoading(true)
    try {
      const res = await analyticsApi.getDashboard(token)
      setData(res.data)
    } catch (err) {
      toast.error('Gagal memuat analytics: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Performa toko kamu"
      actions={
        <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          Refresh
        </button>
      }
    >
      {loading ? <AnalyticsSkeleton /> : data ? <AnalyticsContent data={data} period={period} setPeriod={setPeriod} /> : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
          <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Belum ada data analytics</p>
        </div>
      )}
    </DashboardLayout>
  )
}

function AnalyticsContent({ data, period, setPeriod }) {
  const {
    totalProduk = 0,
    produkAktif = 0,
    totalPesanan = 0,
    pesananPending = 0,
    pesananSelesai = 0,
    totalRevenue = 0,
    topProduk = [],
    revenueHarian = [],
    revenueBulanan = [],
  } = data

  const conversionRate = totalPesanan > 0 ? Math.round((pesananSelesai / totalPesanan) * 100) : 0
  const chartData = period === 'hari' ? revenueHarian : revenueBulanan
  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.total || 0)) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        <KpiCard
          label="Total Revenue"
          value={formatRupiah(totalRevenue)}
          icon={<DollarSign size={16} />}
          color="var(--success)"
          sub="dari pesanan selesai"
        />
        <KpiCard
          label="Total Pesanan"
          value={totalPesanan}
          icon={<ShoppingBag size={16} />}
          color="var(--accent)"
          sub={`${pesananPending} menunggu konfirmasi`}
        />
        <KpiCard
          label="Pesanan Selesai"
          value={pesananSelesai}
          icon={<TrendingUp size={16} />}
          color="var(--warning)"
          sub={`${conversionRate}% conversion rate`}
        />
        <KpiCard
          label="Produk Aktif"
          value={`${produkAktif}/${totalProduk}`}
          icon={<Package size={16} />}
          color="var(--accent-3)"
          sub="produk ditampilkan"
        />
      </div>

      {/* Revenue chart + top produk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>

        {/* Revenue chart */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
                Revenue
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {period === 'hari' ? '30 hari terakhir' : '12 bulan terakhir'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['hari', 'bulan'].map(p => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.72rem', padding: '4px 10px',
                    background: period === p ? 'var(--surface-active)' : 'var(--surface)',
                    color: period === p ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    border: `1px solid ${period === p ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
                  }}
                >
                  {p === 'hari' ? 'Harian' : 'Bulanan'}
                </button>
              ))}
            </div>
          </div>

          {chartData.length > 0 ? (
            <BarChartCustom data={chartData} maxVal={maxRevenue} />
          ) : (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexDirection: 'column', gap: 8 }}>
              <BarChart2 size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '0.82rem' }}>Belum ada data revenue</p>
            </div>
          )}
        </div>

        {/* Top produk */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
            <Award size={16} color="var(--warning)" />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>
              Produk Terlaris
            </h3>
          </div>

          {topProduk.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {topProduk.map((p, i) => {
                const maxQty = topProduk[0].qty
                const pct = Math.round((p.qty / maxQty) * 100)
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: '50%',
                          background: i === 0 ? 'var(--accent-gradient)' : 'var(--surface)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '0.65rem', fontWeight: 800,
                          color: i === 0 ? '#fff' : 'var(--text-tertiary)',
                          flexShrink: 0,
                        }}>{i + 1}</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {p.nama}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>
                        ×{p.qty}
                      </span>
                    </div>
                    {/* Bar */}
                    <div style={{ height: 4, borderRadius: 2, background: 'var(--surface)', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: i === 0 ? 'var(--accent-gradient)' : 'rgba(91,138,245,0.4)',
                        borderRadius: 2, transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)' }}>
              <Award size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontSize: '0.82rem' }}>Belum ada data</p>
            </div>
          )}
        </div>
      </div>

      {/* Pesanan breakdown */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 18 }}>
          Status Pesanan
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { label: 'Menunggu', value: data.pesananPending || 0, color: 'var(--warning)', key: 'pending' },
            { label: 'Dikonfirmasi', value: data.pesananConfirmed || 0, color: 'var(--accent)', key: 'confirmed' },
            { label: 'Diproses', value: data.pesananProcessing || 0, color: 'var(--accent-3)', key: 'processing' },
            { label: 'Dikirim', value: data.pesananShipped || 0, color: '#38bdf8', key: 'shipped' },
            { label: 'Selesai', value: data.pesananSelesai || 0, color: 'var(--success)', key: 'done' },
            { label: 'Dibatalkan', value: data.pesananCancelled || 0, color: 'var(--danger)', key: 'cancelled' },
          ].map(s => (
            <div key={s.key} style={{
              padding: '14px 16px', borderRadius: 'var(--radius-lg)',
              background: `${s.color}10`,
              border: `1px solid ${s.color}20`,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {s.label}
              </p>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: s.color }}>
                {s.value}
              </p>
              {totalPesanan > 0 && (
                <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
                  {Math.round((s.value / totalPesanan) * 100)}% dari total
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// =============================================
// BAR CHART (pure CSS/JSX, no lib)
// =============================================

function BarChartCustom({ data, maxVal }) {
  if (!data || data.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Bars */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 160 }}>
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.total / maxVal) * 100 : 0
          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, height: '100%', justifyContent: 'flex-end' }}
              title={`${d.label}: ${formatRupiah(d.total)}`}
            >
              <div style={{
                width: '100%', minWidth: 4,
                height: `${Math.max(pct, 2)}%`,
                background: i === data.length - 1
                  ? 'var(--accent-gradient)'
                  : `rgba(91,138,245,${0.25 + (pct / 100) * 0.45})`,
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.5s ease',
                cursor: 'pointer',
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              />
            </div>
          )
        })}
      </div>

      {/* X labels — show every nth */}
      <div style={{ display: 'flex', gap: 4 }}>
        {data.map((d, i) => {
          const showLabel = data.length <= 12 || i % Math.ceil(data.length / 10) === 0 || i === data.length - 1
          return (
            <div key={i} style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
              {showLabel && (
                <span style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                  {d.label}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Tertinggi</p>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--success)' }}>{formatRupiah(maxVal)}</p>
        </div>
        <div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>Total Periode</p>
          <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent)' }}>
            {formatRupiah(data.reduce((s, d) => s + (d.total || 0), 0))}
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// KPI CARD
// =============================================

function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div className="glass-card" style={{ padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>{icon}</div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', lineHeight: 1, color }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', marginTop: 6 }}>{sub}</p>}
    </div>
  )
}

// =============================================
// SKELETON
// =============================================

function AnalyticsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 90, borderRadius: 'var(--radius-xl)' }} />
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />
        <div className="skeleton" style={{ height: 280, borderRadius: 'var(--radius-xl)' }} />
      </div>
    </div>
  )
}
