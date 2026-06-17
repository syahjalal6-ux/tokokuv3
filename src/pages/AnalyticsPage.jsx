import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  TrendingUp, Package, ShoppingBag, DollarSign,
  BarChart2, Award, RefreshCw, Download, Zap,
  Sparkles, Send, Trash2, Bot, User, Loader
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { useAuthStore } from '../lib/store.js'
import { analyticsApi, authApi } from '../lib/api/index.js'
import { formatRupiah, isPro } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const CHAT_STORAGE_KEY = 'exora_ai_chat_history'
const PJS = "'Plus Jakarta Sans', sans-serif"

// ============ GROQ HELPER ============
async function callGroq(messages) {
  let lastError = ''
  for (const model of CONFIG.GROQ_MODELS) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.GROQ_API_KEY}`,
        },
        body: JSON.stringify({ model, messages, max_tokens: 512, temperature: 0.75 }),
      })
      const data = await res.json()
      if (data.error) { lastError = data.error.message; continue }
      const reply = data.choices?.[0]?.message?.content
      if (!reply) { lastError = 'Reply kosong'; continue }
      return reply
    } catch (e) {
      lastError = e.message
      continue
    }
  }
  throw new Error('Semua model gagal. Error: ' + lastError)
}

function buildSystemPrompt(data, tokoNama = 'toko kamu') {
  const dataContext = `
Data toko "${tokoNama}" saat ini:
- Total Revenue: Rp ${Number(data.totalRevenue || 0).toLocaleString('id-ID')}
- Total Pesanan: ${data.totalPesanan || 0} (${data.pesananPending || 0} menunggu, ${data.pesananSelesai || 0} selesai)
- Conversion Rate: ${data.totalPesanan > 0 ? Math.round((data.pesananSelesai / data.totalPesanan) * 100) : 0}%
- Produk Aktif: ${data.produkAktif || 0} dari ${data.totalProduk || 0} produk
- Pesanan Dikonfirmasi: ${data.pesananConfirmed || 0}
- Pesanan Diproses: ${data.pesananProcessing || 0}
- Pesanan Dikirim: ${data.pesananShipped || 0}
- Pesanan Dibatalkan: ${data.pesananCancelled || 0}
- Top Produk Terlaris: ${data.topProduk && data.topProduk.length > 0
    ? data.topProduk.map((p, i) => `${i + 1}. ${p.nama} (${p.qty}x)`).join(', ')
    : 'belum ada data'}
- Revenue Minggu Ini: Rp ${Number(data.revenueMingguIni || 0).toLocaleString('id-ID')}
- Revenue Minggu Lalu: Rp ${Number(data.revenueMingguLalu || 0).toLocaleString('id-ID')}
`.trim()

  return `Kamu adalah Aira, konsultan bisnis UMKM Indonesia yang blak-blakan, analitis, dan ngomongnya kayak teman dekat — bukan robot korporat. Nama kamu adalah Aira. Kalau ditanya siapa kamu, jawab "Aku Aira, konsultan bisnis toko kamu."

${dataContext}

ATURAN WAJIB:
1. Semua jawaban HARUS spesifik berdasarkan data di atas. Dilarang jawaban generik seperti "tingkatkan pemasaran" tanpa konteks data.
2. Sebut angka nyata dari data. Contoh: "Revenue kamu Rp 0 — artinya belum ada pesanan selesai nih."
3. Variasikan cara ngomong: kadang pakai analogi, kadang langsung to the point, kadang humor ringan tapi tetap relevan.
4. Bahasa Indonesia casual, singkat, padat. Maksimal 4 kalimat per respons kecuali diminta lebih.
5. Kalau data masih kosong/nol, jujur bilang dan kasih saran konkret apa yang harus dilakukan pertama.
6. Jangan pernai mulai jawaban dengan "Tentu!", "Baik!", "Halo!" atau sapaan basa-basi lainnya.
7. Kalau ditanya di luar konteks bisnis/toko, tolak dengan santai dan arahkan balik ke topik toko.`
}

// ============ UTILS ============
function groupByWeek(revenueHarian = []) {
  if (!revenueHarian.length) return []
  const weeks = {}
  revenueHarian.forEach(d => {
    const dateStr = d.date || d.label
    const date = new Date(dateStr)
    if (isNaN(date)) return
    const year = date.getFullYear()
    const month = date.getMonth()
    const weekOfMonth = Math.ceil(date.getDate() / 7)
    const key = `${year}-${month}-W${weekOfMonth}`
    if (!weeks[key]) weeks[key] = { label: `W${weekOfMonth}`, total: 0, key }
    weeks[key].total += d.total || 0
  })
  return Object.values(weeks)
}

function shortenMonthLabel(label = '') {
  const monthMap = {
    january: 'Jan', february: 'Feb', march: 'Mar', april: 'Apr',
    may: 'Mei', june: 'Jun', july: 'Jul', august: 'Agu',
    september: 'Sep', october: 'Okt', november: 'Nov', december: 'Des',
    jan: 'Jan', feb: 'Feb', mar: 'Mar', apr: 'Apr',
    mei: 'Mei', jun: 'Jun', jul: 'Jul', agu: 'Agu',
    sep: 'Sep', okt: 'Okt', nov: 'Nov', des: 'Des',
  }
  const isoMatch = label.match(/^(\d{4})-(\d{2})/)
  if (isoMatch) {
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    return months[parseInt(isoMatch[2]) - 1] || label
  }
  const word = label.split(/[\s,]/)[0].toLowerCase()
  return monthMap[word] || label.slice(0, 3)
}

function shortRupiah(value) {
  if (!value || value <= 0) return 'Rp 0'
  if (value >= 1000000) { const v = value / 1000000; return `Rp ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}jt` }
  if (value >= 1000) { const v = value / 1000; return `Rp ${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}rb` }
  return `Rp ${Math.round(value)}`
}

const WEEKLY_SKELETON = [
  { label: 'W1', total: 0 }, { label: 'W2', total: 0 },
  { label: 'W3', total: 0 }, { label: 'W4', total: 0 },
]
const MONTHLY_SKELETON = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
  .map(label => ({ label, total: 0 }))

const STATUS_PESANAN = [
  { key: 'pesananPending',   label: 'Menunggu',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.18)' },
  { key: 'pesananConfirmed', label: 'Dikonfirmasi', color: '#5b8af5', bg: 'rgba(91,138,245,0.08)',  border: 'rgba(91,138,245,0.18)' },
  { key: 'pesananProcessing',label: 'Diproses',     color: '#a78bfa', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.18)' },
  { key: 'pesananShipped',   label: 'Dikirim',      color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',  border: 'rgba(56,189,248,0.18)' },
  { key: 'pesananSelesai',   label: 'Selesai',      color: '#34d399', bg: 'rgba(52,211,153,0.08)',  border: 'rgba(52,211,153,0.18)' },
  { key: 'pesananCancelled', label: 'Dibatalkan',   color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.18)' },
]

// ============ PAGE ENTRY ============
export default function AnalyticsPage() {
  const { user, tokenSupabase, tokenGas, isLoading, updateUser } = useAuthStore()
  const tokenObj = { tokenSupabase, tokenGas }
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    authApi.getMe(tokenObj).then(res => {
      if (res?.data) updateUser(res.data)
    }).catch(() => {}).finally(() => setChecking(false))
  }, [tokenSupabase, tokenGas])

  if (isLoading || checking) return null
  const pro = isPro(user)
  if (!pro) return <AnalyticsGate />
  return <AnalyticsDashboard tokenObj={tokenObj} />
}

// ============ GATE ============
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
            {['Grafik revenue mingguan & bulanan', 'Produk terlaris', 'Statistik pesanan lengkap', 'Export data ke Excel', 'AI Insight & Chat Konsultan'].map(f => (
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

// ============ DASHBOARD ============
function AnalyticsDashboard({ tokenObj }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('minggu')
  const [exporting, setExporting] = useState(false)

  useEffect(() => { load() }, [tokenObj.tokenSupabase])

  const load = async () => {
    setLoading(true)
    try {
      const res = await analyticsApi.getDashboard(tokenObj)
      setData(res.data)
    } catch (err) {
      toast.error('Gagal memuat analytics: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!data) return
    setExporting(true)
    try {
      const wb = XLSX.utils.book_new()
      const ringkasan = [
        ['Ringkasan Analytics'], [''],
        ['Total Revenue', data.totalRevenue],
        ['Total Pesanan', data.totalPesanan],
        ['Pesanan Selesai', data.pesananSelesai],
        ['Produk Aktif', data.produkAktif],
        ['Total Produk', data.totalProduk],
      ]
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ringkasan), 'Ringkasan')
      if (data.topProduk?.length > 0) {
        const topRows = [['Produk', 'Qty Terjual'], ...data.topProduk.map(p => [p.nama, p.qty])]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(topRows), 'Top Produk')
      }
      if (data.revenueHarian?.length > 0) {
        const harianRows = [['Tanggal', 'Revenue'], ...data.revenueHarian.map(d => [d.label, d.total])]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(harianRows), 'Revenue Harian')
      }
      if (data.revenueBulanan?.length > 0) {
        const bulananRows = [['Bulan', 'Revenue'], ...data.revenueBulanan.map(d => [d.label, d.total])]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bulananRows), 'Revenue Bulanan')
      }
      XLSX.writeFile(wb, `analytics-exora-${new Date().toISOString().slice(0, 10)}.xlsx`)
      toast.success('Export berhasil!')
    } catch (err) {
      toast.error('Gagal export: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  return (
    <DashboardLayout
      title="Analytics"
      subtitle="Performa toko kamu"
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExport} className="btn btn-secondary btn-sm" disabled={exporting || !data}>
            <Download size={13} />
            {exporting ? 'Exporting...' : 'Export Excel'}
          </button>
          <button onClick={load} className="btn btn-secondary btn-sm" disabled={loading}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      }
    >
      {loading ? <AnalyticsSkeleton /> : data ? (
        <AnalyticsContent data={data} period={period} setPeriod={setPeriod} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
          <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Belum ada data analytics</p>
        </div>
      )}
    </DashboardLayout>
  )
}

// ============ CONTENT ============
function AnalyticsContent({ data, period, setPeriod }) {
  const {
    totalProduk = 0, produkAktif = 0,
    totalPesanan = 0, pesananPending = 0, pesananSelesai = 0,
    totalRevenue = 0, topProduk = [],
    revenueHarian = [], revenueBulanan = [],
    revenueMingguIni = 0, revenueMingguLalu = 0,
  } = data

  const conversionRate = totalPesanan > 0 ? Math.round((pesananSelesai / totalPesanan) * 100) : 0

  const chartData = useMemo(() => {
    if (period === 'minggu') {
      const grouped = groupByWeek(revenueHarian)
      if (grouped.length > 0) return grouped
      const result = []
      for (let i = 0; i < revenueHarian.length; i += 7) {
        const chunk = revenueHarian.slice(i, i + 7)
        const total = chunk.reduce((s, d) => s + (d.total || 0), 0)
        result.push({ label: `W${result.length + 1}`, total })
      }
      return result.length > 0 ? result : WEEKLY_SKELETON
    }
    const bulanan = (revenueBulanan || []).map(d => ({ ...d, label: shortenMonthLabel(d.label) }))
    return bulanan.length > 0 ? bulanan : MONTHLY_SKELETON
  }, [period, revenueHarian, revenueBulanan])

  const maxRevenue = Math.max(...chartData.map(d => d.total || 0), 0)
  const totalPeriode = useMemo(() => chartData.reduce((s, d) => s + (d.total || 0), 0), [chartData])
  const nonZero = chartData.filter(d => d.total > 0)
  const rataRata = nonZero.length ? totalPeriode / nonZero.length : 0

  const pctChange = useMemo(() => {
    if (period !== 'minggu') {
      if (revenueBulanan.length < 2) return null
      const cur = revenueBulanan[revenueBulanan.length - 1]?.total || 0
      const prev = revenueBulanan[revenueBulanan.length - 2]?.total || 0
      if (prev === 0) return cur > 0 ? 100 : null
      return Math.round(((cur - prev) / prev) * 100)
    }
    if (revenueMingguLalu === 0) return revenueMingguIni > 0 ? 100 : null
    return Math.round(((revenueMingguIni - revenueMingguLalu) / revenueMingguLalu) * 100)
  }, [period, revenueMingguIni, revenueMingguLalu, revenueBulanan])

  const revenueUtama = useMemo(() => {
    if (period === 'minggu') return revenueMingguIni
    return revenueBulanan.length > 0 ? revenueBulanan[revenueBulanan.length - 1]?.total || 0 : 0
  }, [period, revenueMingguIni, revenueBulanan])

  const periodLabel = period === 'minggu' ? '4 minggu terakhir' : 'tahun ini'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <AIInsightCard data={data} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <KpiCard label="Total Revenue" value={formatRupiah(totalRevenue)} icon={<DollarSign size={15} />} color="var(--success)" sub="dari pesanan selesai" />
        <KpiCard label="Total Pesanan" value={totalPesanan} icon={<ShoppingBag size={15} />} color="var(--accent)" sub={`${pesananPending} menunggu`} />
        <KpiCard label="Pesanan Selesai" value={pesananSelesai} icon={<TrendingUp size={15} />} color="var(--warning)" sub={`${conversionRate}% conversion`} />
        <KpiCard label="Produk Aktif" value={`${produkAktif}/${totalProduk}`} icon={<Package size={15} />} color="var(--accent-3)" sub="ditampilkan" />
      </div>

      <style>{`
        .analytics-3col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .analytics-3col {
            grid-template-columns: 1fr 1fr 1fr;
            align-items: start;
          }
        }
        .analytics-right-col {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
      `}</style>

      <div className="analytics-3col">

        {/* Kolom 1: Revenue card */}
        <div className="glass-card" style={{ padding: '20px' }}>

          {/* Header: label + toggle */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Revenue
            </p>
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 'var(--radius-full)', padding: 3 }}>
              {[{ key: 'minggu', label: 'Min' }, { key: 'bulan', label: 'Bln' }].map(p => (
                <button key={p.key} onClick={() => setPeriod(p.key)} className="btn btn-sm" style={{
                  borderRadius: 'var(--radius-full)', fontSize: '0.7rem', padding: '4px 12px',
                  background: period === p.key ? 'var(--accent)' : 'transparent',
                  color: period === p.key ? '#fff' : 'var(--text-tertiary)',
                  border: 'none',
                  boxShadow: period === p.key ? '0 2px 8px rgba(91,138,245,0.4)' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Revenue amount + badge */}
          <div style={{ marginBottom: 14 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.25rem, 4vw, 1.5rem)', color: 'var(--text-primary)', margin: 0, lineHeight: 1.1 }}>
              {formatRupiah(revenueUtama)}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
              {pctChange !== null && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 7px',
                  borderRadius: 'var(--radius-full)',
                  background: pctChange >= 0 ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                  color: pctChange >= 0 ? 'var(--success)' : 'var(--danger)',
                }}>
                  {pctChange >= 0 ? '▲' : '▼'} {Math.abs(pctChange)}%
                </span>
              )}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>{periodLabel}</span>
            </div>
          </div>

          {/* Bar chart — selalu render, skeleton jika data kosong */}
          <BarChartRevenue data={chartData} maxVal={maxRevenue} period={period} />

          {/* 4 KPI chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginTop: 14 }}>
            <SummaryChip label="Rata-rata" value={shortRupiah(Math.round(rataRata))} />
            <SummaryChip label="Tertinggi" value={shortRupiah(maxRevenue)} color="#fbbf24" />
            <SummaryChip label="Transaksi" value={`${totalPesanan} pesanan`} />
            <SummaryChip label="Conversion" value={`${conversionRate}%`} />
          </div>
        </div>

        {/* Kolom 2: Top produk + Status pesanan */}
        <div className="analytics-right-col">
          <div className="glass-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Award size={16} color="var(--warning)" />
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Produk Terlaris</h3>
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
                            color: i === 0 ? '#fff' : 'var(--text-tertiary)', flexShrink: 0,
                          }}>{i + 1}</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{p.nama}</span>
                        </div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-tertiary)', flexShrink: 0 }}>×{p.qty}</span>
                      </div>
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

          <div className="glass-card" style={{ padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 16 }}>Status Pesanan</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {STATUS_PESANAN.map(s => {
                const value = data[s.key] || 0
                return (
                  <div key={s.key} style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-lg)',
                    background: s.bg,
                    border: `1px solid ${s.border}`,
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {s.label}
                    </p>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: s.color }}>
                      {value}
                    </p>
                    {totalPesanan > 0 && (
                      <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>
                        {Math.round((value / totalPesanan) * 100)}%
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Kolom 3: AI Chat */}
        <AIChatCard data={data} />
      </div>
    </div>
  )
}

// ============ BAR CHART REVENUE ============
function BarChartRevenue({ data, maxVal, period }) {
  const [selected, setSelected] = useState(null)
  const scrollRef = useRef(null)
  const isDragging = useRef(false)
  const dragStartX = useRef(0)
  const dragScrollLeft = useRef(0)

  useEffect(() => { setSelected(null) }, [period])

  if (!data || data.length === 0) return null

  const isMonthly = period === 'bulan'
  const allZero = maxVal === 0
  const yMax = maxVal > 0 ? maxVal * 1.1 : 1

  // Mobile-friendly sizing
  const BAR_W = isMonthly ? 28 : 0
  const BAR_GAP = isMonthly ? 8 : 8
  const CHART_H = 120

  const selectedItem = selected !== null ? data[selected] : null
  const isHighestSelected = selectedItem && !allZero && (selectedItem.total || 0) === maxVal && maxVal > 0

  const handleMouseDown = (e) => {
    if (!isMonthly) return
    isDragging.current = false
    dragStartX.current = e.pageX
    dragScrollLeft.current = scrollRef.current.scrollLeft
    const onMove = (ev) => {
      const diff = ev.pageX - dragStartX.current
      if (Math.abs(diff) > 4) isDragging.current = true
      scrollRef.current.scrollLeft = dragScrollLeft.current - diff
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleTouchStart = (e) => {
    if (!isMonthly) return
    isDragging.current = false
    dragStartX.current = e.touches[0].pageX
    dragScrollLeft.current = scrollRef.current.scrollLeft
  }

  const handleTouchMove = (e) => {
    if (!isMonthly) return
    const diff = e.touches[0].pageX - dragStartX.current
    if (Math.abs(diff) > 4) isDragging.current = true
    scrollRef.current.scrollLeft = dragScrollLeft.current - diff
  }

  return (
    <div style={{ width: '100%', overflow: 'hidden' }}>
      {/* Scrollable bars — overflow hidden di luar biar card gak melebar */}
      <div
        ref={scrollRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{
          overflowX: isMonthly ? 'scroll' : 'hidden',
          overflowY: 'visible',
          width: '100%',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          cursor: isMonthly ? 'grab' : 'default',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: BAR_GAP,
          height: CHART_H,
          width: isMonthly ? `${data.length * (BAR_W + BAR_GAP) + 8}px` : '100%',
          paddingTop: 8,
          boxSizing: 'border-box',
        }}>
          {data.map((d, i) => {
            const total = d.total || 0
            const heightPct = total === 0
              ? (allZero ? 35 : 4)
              : Math.max((total / yMax) * 100, 6)
            const isBarHighest = !allZero && total === maxVal && total > 0
            const isSelected = selected === i
            const dimmed = selected !== null && !isSelected

            let barBg
            if (isSelected) barBg = '#7da4ff'
            else if (total === 0) barBg = allZero ? 'rgba(91,138,245,0.15)' : 'rgba(255,255,255,0.06)'
            else if (isBarHighest) barBg = 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
            else barBg = 'linear-gradient(180deg, #5b8af5 0%, #3d6de0 100%)'

            return (
              <div
                key={i}
                onClick={() => {
                  if (isDragging.current) return
                  setSelected(selected === i ? null : i)
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 6,
                  flex: isMonthly ? 'none' : 1,
                  width: isMonthly ? BAR_W : undefined,
                  height: '100%',
                  cursor: 'pointer',
                  opacity: dimmed ? 0.25 : 1,
                  transition: 'opacity 0.15s',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{
                  width: isMonthly ? BAR_W : '100%',
                  maxWidth: isMonthly ? BAR_W : 40,
                  height: `${heightPct}%`,
                  minHeight: 3,
                  borderRadius: '4px 4px 2px 2px',
                  background: barBg,
                  transition: 'height 0.35s cubic-bezier(0.34,1.56,0.64,1), background 0.2s',
                  boxShadow: isSelected
                    ? '0 0 10px rgba(125,164,255,0.5)'
                    : isBarHighest
                      ? '0 0 8px rgba(251,191,36,0.35)'
                      : 'none',
                  position: 'relative',
                }}>
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: -5, left: '50%',
                      transform: 'translateX(-50%)',
                      width: 6, height: 6, borderRadius: '50%',
                      background: '#7da4ff',
                      boxShadow: '0 0 5px rgba(125,164,255,0.9)',
                    }} />
                  )}
                </div>
                <span style={{
                  fontSize: isMonthly ? 8 : 10,
                  lineHeight: 1,
                  color: isSelected
                    ? 'var(--text-primary)'
                    : isBarHighest
                      ? '#fbbf24'
                      : 'var(--text-tertiary)',
                  fontWeight: isSelected || isBarHighest ? 700 : 400,
                  userSelect: 'none',
                  letterSpacing: 0.2,
                }}>
                  {d.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Scroll dots — monthly only */}
      {isMonthly && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginTop: 8 }}>
          {data.map((_, i) => (
            <div key={i} style={{
              width: selected === i ? 12 : 3,
              height: 3, borderRadius: 3,
              background: selected === i ? 'var(--accent)' : 'var(--surface)',
              transition: 'width 0.2s',
            }} />
          ))}
        </div>
      )}

      {/* Tooltip slide bawah */}
      <div style={{
        overflow: 'hidden',
        maxHeight: selectedItem ? 72 : 0,
        opacity: selectedItem ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
        marginTop: selectedItem ? 10 : 0,
      }}>
        {selectedItem && (
          <div style={{
            padding: '10px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          }}>
            <div>
              <p style={{
                fontSize: '0.62rem', color: 'var(--text-tertiary)',
                fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: 3,
              }}>
                {isMonthly ? selectedItem.label : `Minggu ${selectedItem.label}`}
              </p>
              <p style={{
                fontFamily: 'var(--font-display)', fontWeight: 800,
                fontSize: '1rem', lineHeight: 1,
                color: isHighestSelected ? '#fbbf24' : 'var(--text-primary)',
              }}>
                {formatRupiah(selectedItem.total || 0)}
              </p>
            </div>
            {isHighestSelected ? (
              <span style={{
                fontSize: '0.58rem', fontWeight: 700, color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.3)',
                borderRadius: 'var(--radius-full)', padding: '3px 8px',
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>Tertinggi</span>
            ) : (selectedItem.total || 0) > 0 ? (
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                {Math.round(((selectedItem.total || 0) / maxVal) * 100)}% dari tertinggi
              </p>
            ) : (
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>Belum ada transaksi</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ============ AI INSIGHT CARD ============
function AIInsightCard({ data }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => { if (data) generateInsight() }, [data])

  const generateInsight = async () => {
    setLoading(true)
    setInsight(null)
    try {
      const reply = await callGroq([
        { role: 'system', content: buildSystemPrompt(data) },
        { role: 'user', content: 'Berikan 3 insight singkat dan actionable tentang performa toko ini sekarang. Format: tiap insight 1-2 kalimat, langsung ke poin, pakai emoji yang relevan di depan. Jangan pakai numbering, cukup bullet dengan emoji.' },
      ])
      setInsight(reply)
    } catch (err) {
      setInsight('Gagal memuat insight: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.1) 100%)',
      border: '1px solid rgba(167,139,250,0.2)',
      borderRadius: 'var(--radius-xl)',
      padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={14} color="var(--accent-3)" />
          </div>
          <div>
            <p style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.85rem' }}>AI Insight</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>oleh Aira — diperbarui tiap refresh</p>
          </div>
        </div>
        <button onClick={generateInsight} disabled={loading} className="btn btn-secondary btn-sm" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>
          <RefreshCw size={11} style={{ animation: loading ? 'spin 0.7s linear infinite' : 'none' }} />
          {loading ? 'Menganalisis...' : 'Refresh'}
        </button>
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[80, 60, 70].map((w, i) => (
            <div key={i} className="skeleton" style={{ height: 14, width: `${w}%`, borderRadius: 4 }} />
          ))}
        </div>
      ) : insight ? (
        <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.75, whiteSpace: 'pre-line' }}>
          {insight}
        </div>
      ) : null}
    </div>
  )
}

// ============ AI CHAT CARD ============
function AIChatCard({ data }) {
  const [messages, setMessages] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY)) || [] } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)) } catch {}
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const reply = await callGroq([
        { role: 'system', content: buildSystemPrompt(data) },
        ...newMessages.slice(-20).map(m => ({ role: m.role, content: m.content })),
      ])
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Gagal: ' + err.message }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([])
    localStorage.removeItem(CHAT_STORAGE_KEY)
    toast.success('Riwayat chat dihapus')
  }

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.85rem' }}>Tanya Aira</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Konsultan AI toko kamu</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={handleClear} className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)', fontSize: '0.72rem', gap: 4, padding: '4px 8px' }}>
            <Trash2 size={11} /> Hapus
          </button>
        )}
      </div>

      <div style={{ height: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16, paddingRight: 2 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-tertiary)', fontSize: '0.82rem' }}>
            <Bot size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p>Tanya apa saja tentang toko kamu</p>
            <p style={{ fontSize: '0.72rem', marginTop: 4 }}>Misal: "Kenapa revenue saya nol?" atau "Produk mana yang perlu dioptimasi?"</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8, alignItems: 'flex-end' }}>
            {m.role === 'assistant' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={12} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: '78%', padding: '10px 14px',
              borderRadius: m.role === 'user' ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)' : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
              background: m.role === 'user' ? 'var(--accent-gradient)' : 'var(--surface)',
              border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              fontSize: '0.83rem', lineHeight: 1.65,
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
              whiteSpace: 'pre-line',
            }}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={12} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={12} color="#fff" />
            </div>
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--text-tertiary)', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', borderTop: '1px solid var(--glass-border)', paddingTop: 14 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
          placeholder="Tanya sesuatu tentang toko kamu..."
          rows={1}
          style={{
            flex: 1, padding: '10px 14px',
            background: 'var(--surface)', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', color: 'var(--text-primary)',
            fontSize: '0.85rem', resize: 'none', fontFamily: PJS,
            outline: 'none', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-lg)',
            background: input.trim() && !loading ? 'var(--accent-gradient)' : 'var(--surface)',
            border: '1px solid var(--glass-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            opacity: input.trim() && !loading ? 1 : 0.5, flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
        >
          {loading
            ? <Loader size={14} color="var(--text-tertiary)" style={{ animation: 'spin 0.7s linear infinite' }} />
            : <Send size={14} color={input.trim() ? '#fff' : 'var(--text-tertiary)'} />
          }
        </button>
      </div>
      <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
        Enter untuk kirim · Shift+Enter baris baru · Riwayat tersimpan di perangkat ini
      </p>
    </div>
  )
}

// ============ SUMMARY CHIP ============
function SummaryChip({ label, value, color }) {
  return (
    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-lg)', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {label}
      </p>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: String(value).length > 11 ? '0.78rem' : '0.92rem', color: color || 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3 }}>
        {value}
      </p>
    </div>
  )
}

// ============ KPI CARD ============
function KpiCard({ label, value, icon, color, sub }) {
  return (
    <div className="glass-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
        <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-md)', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', lineHeight: 1, color: 'var(--text-primary)' }}>{value}</p>
      {sub && <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', marginTop: 5 }}>{sub}</p>}
    </div>
  )
}

// ============ SKELETON ============
function AnalyticsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-xl)' }} />
          <div className="skeleton" style={{ height: 140, borderRadius: 'var(--radius-xl)' }} />
        </div>
        <div className="skeleton" style={{ height: 300, borderRadius: 'var(--radius-xl)' }} />
      </div>
    </div>
  )
}
