import React, { useEffect, useState, useMemo, useRef } from 'react'
import {
  TrendingUp, Package, ShoppingBag, DollarSign,
  BarChart2, Award, RefreshCw, Download, Zap,
  ChevronLeft, ChevronRight, Sparkles, Send,
  Trash2, Bot, User, Loader
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { useAuthStore } from '../lib/store.js'
import { analyticsApi } from '../lib/api.js'
import { formatRupiah, isPro } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import toast from 'react-hot-toast'
import * as XLSX from 'xlsx'

const CHAT_STORAGE_KEY = 'exora_ai_chat_history'
const PJS = "'Plus Jakarta Sans', sans-serif"

export default function AnalyticsPage() {
  const { user, token } = useAuthStore()
  const pro = isPro(user)
  if (!pro) return <AnalyticsGate />
  return <AnalyticsDashboard token={token} />
}

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
            {['Grafik revenue mingguan & bulanan','Produk terlaris','Statistik pesanan lengkap','Export data ke Excel','AI Insight & Chat Konsultan'].map(f => (
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

function AnalyticsDashboard({ token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('minggu')
  const [exporting, setExporting] = useState(false)

  useEffect(() => { load() }, [token])

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
      if (data.revenueMinggu?.length > 0) {
        const mingguRows = [['Minggu', 'Revenue'], ...data.revenueMinggu.map(d => [d.label, d.total])]
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mingguRows), 'Revenue Mingguan')
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
        <AnalyticsContent data={data} period={period} setPeriod={setPeriod} token={token} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
          <BarChart2 size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p>Belum ada data analytics</p>
        </div>
      )}
    </DashboardLayout>
  )
}

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
    const monthNames = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    if (!weeks[key]) {
      weeks[key] = { label: `W${weekOfMonth} ${monthNames[month]}`, total: 0, key }
    }
    weeks[key].total += d.total || 0
  })
  return Object.values(weeks)
}

function shortenMonthLabel(label = '') {
  const monthMap = {
    january:'Jan', february:'Feb', march:'Mar', april:'Apr',
    may:'Mei', june:'Jun', july:'Jul', august:'Agu',
    september:'Sep', october:'Okt', november:'Nov', december:'Des',
    jan:'Jan', feb:'Feb', mar:'Mar', apr:'Apr',
    mei:'Mei', jun:'Jun', jul:'Jul', agu:'Agu',
    sep:'Sep', okt:'Okt', nov:'Nov', des:'Des',
  }
  const isoMatch = label.match(/^(\d{4})-(\d{2})/)
  if (isoMatch) {
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']
    return months[parseInt(isoMatch[2]) - 1] || label
  }
  const word = label.split(/[\s,]/)[0].toLowerCase()
  return monthMap[word] || label.slice(0, 3)
}

const STATUS_PESANAN = [
  { key: 'pesananPending',    label: 'Menunggu',    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.18)'   },
  { key: 'pesananConfirmed',  label: 'Dikonfirmasi', color: '#5b8af5', bg: 'rgba(91,138,245,0.08)',  border: 'rgba(91,138,245,0.18)'   },
  { key: 'pesananProcessing', label: 'Diproses',    color: '#a78bfa', bg: 'rgba(167,139,250,0.08)',  border: 'rgba(167,139,250,0.18)'  },
  { key: 'pesananShipped',    label: 'Dikirim',     color: '#38bdf8', bg: 'rgba(56,189,248,0.08)',   border: 'rgba(56,189,248,0.18)'   },
  { key: 'pesananSelesai',    label: 'Selesai',     color: '#34d399', bg: 'rgba(52,211,153,0.08)',   border: 'rgba(52,211,153,0.18)'   },
  { key: 'pesananCancelled',  label: 'Dibatalkan',  color: '#f87171', bg: 'rgba(248,113,113,0.08)',  border: 'rgba(248,113,113,0.18)'  },
]

function AnalyticsContent({ data, period, setPeriod, token }) {
  const {
    totalProduk = 0, produkAktif = 0,
    totalPesanan = 0, pesananPending = 0, pesananSelesai = 0,
    totalRevenue = 0, topProduk = [],
    revenueHarian = [], revenueBulanan = [],
  } = data

  const conversionRate = totalPesanan > 0 ? Math.round((pesananSelesai / totalPesanan) * 100) : 0

  const rawChartData = useMemo(() => {
    if (period === 'minggu') {
      const grouped = groupByWeek(revenueHarian)
      if (grouped.length > 0) return grouped
      const result = []
      for (let i = 0; i < revenueHarian.length; i += 7) {
        const chunk = revenueHarian.slice(i, i + 7)
        const total = chunk.reduce((s, d) => s + (d.total || 0), 0)
        result.push({ label: chunk[0]?.label || `W${result.length + 1}`, total })
      }
      return result
    }
    return (revenueBulanan || []).map(d => ({ ...d, label: shortenMonthLabel(d.label) }))
  }, [period, revenueHarian, revenueBulanan])

  const WINDOW = period === 'minggu' ? 8 : 6
  const [offset, setOffset] = useState(0)
  useEffect(() => { setOffset(0) }, [period])

  const totalItems = rawChartData.length
  const maxOffset = Math.max(0, totalItems - WINDOW)

  const chartData = useMemo(() => {
    const start = Math.max(0, totalItems - WINDOW - offset)
    const end = totalItems - offset
    return rawChartData.slice(start, end)
  }, [rawChartData, offset, WINDOW, totalItems])

  const maxRevenue = chartData.length > 0 ? Math.max(...chartData.map(d => d.total || 0)) : 0
  const maxRevenueAll = rawChartData.length > 0 ? Math.max(...rawChartData.map(d => d.total || 0)) : 0
  const canGoBack = offset < maxOffset
  const canGoForward = offset > 0
  const periodLabel = period === 'minggu' ? `${WINDOW} minggu terakhir` : `${WINDOW} bulan terakhir`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* AI Insight Card */}
      <AIInsightCard token={token} data={data} />

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        <KpiCard label="Total Revenue" value={formatRupiah(totalRevenue)} icon={<DollarSign size={15} />} color="var(--success)" sub="dari pesanan selesai" />
        <KpiCard label="Total Pesanan" value={totalPesanan} icon={<ShoppingBag size={15} />} color="var(--accent)" sub={`${pesananPending} menunggu`} />
        <KpiCard label="Pesanan Selesai" value={pesananSelesai} icon={<TrendingUp size={15} />} color="var(--warning)" sub={`${conversionRate}% conversion`} />
        <KpiCard label="Produk Aktif" value={`${produkAktif}/${totalProduk}`} icon={<Package size={15} />} color="var(--accent-3)" sub="ditampilkan" />
      </div>

      {/* Revenue chart */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>Revenue</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{periodLabel}</p>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ key: 'minggu', label: 'Mingguan' }, { key: 'bulan', label: 'Bulanan' }].map(p => (
              <button key={p.key} onClick={() => setPeriod(p.key)} className="btn btn-sm" style={{
                borderRadius: 'var(--radius-full)', fontSize: '0.72rem', padding: '4px 10px',
                background: period === p.key ? 'var(--surface-active)' : 'var(--surface)',
                color: period === p.key ? 'var(--text-primary)' : 'var(--text-tertiary)',
                border: `1px solid ${period === p.key ? 'var(--glass-border-hover)' : 'var(--glass-border)'}`,
              }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {totalItems > WINDOW && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6, marginBottom: 10 }}>
            <button onClick={() => setOffset(o => Math.min(o + 1, maxOffset))} disabled={!canGoBack} style={{
              width: 26, height: 26, borderRadius: 'var(--radius-md)',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canGoBack ? 'pointer' : 'not-allowed', opacity: canGoBack ? 1 : 0.3, color: 'var(--text-secondary)',
            }}>
              <ChevronLeft size={13} />
            </button>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)' }}>
              {chartData[0]?.label} – {chartData[chartData.length - 1]?.label}
            </span>
            <button onClick={() => setOffset(o => Math.max(o - 1, 0))} disabled={!canGoForward} style={{
              width: 26, height: 26, borderRadius: 'var(--radius-md)',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: canGoForward ? 'pointer' : 'not-allowed', opacity: canGoForward ? 1 : 0.3, color: 'var(--text-secondary)',
            }}>
              <ChevronRight size={13} />
            </button>
          </div>
        )}

        {chartData.length > 0 ? (
          <BarChartCustom data={chartData} maxVal={maxRevenue} globalMax={maxRevenueAll} />
        ) : (
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', flexDirection: 'column', gap: 8 }}>
            <BarChart2 size={32} style={{ opacity: 0.3 }} />
            <p style={{ fontSize: '0.82rem' }}>Belum ada data revenue</p>
          </div>
        )}
      </div>

      {/* Top produk */}
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

      {/* Status Pesanan */}
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
                <p style={{
                  fontSize: '0.65rem', color: 'var(--text-tertiary)',
                  fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {s.label}
                </p>
                <p style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '1.3rem', color: s.color,
                }}>
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

      {/* AI Chat Card */}
      <AIChatCard token={token} data={data} />

    </div>
  )
}

// ============ AI INSIGHT CARD ============
function AIInsightCard({ token, data }) {
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (data) generateInsight()
  }, [data])

  const generateInsight = async () => {
    setLoading(true)
    setInsight(null)
    try {
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getAIInsight',
          token,
          type: 'insight',
          analyticsData: data,
        }),
      })
      const json = await res.json()
      if (json.success) setInsight(json.reply)
      else throw new Error(json.message)
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
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient-soft)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Sparkles size={14} color="var(--accent-3)" />
          </div>
          <div>
            <p style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.85rem' }}>AI Insight</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>oleh Aira — diperbarui tiap refresh</p>
          </div>
        </div>
        <button
          onClick={generateInsight}
          disabled={loading}
          className="btn btn-secondary btn-sm"
          style={{ fontSize: '0.72rem', padding: '4px 10px' }}
        >
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
        <div style={{
          fontSize: '0.83rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.75,
          whiteSpace: 'pre-line',
        }}>
          {insight}
        </div>
      ) : null}
    </div>
  )
}

// ============ AI CHAT CARD ============
function AIChatCard({ token, data }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages))
    } catch {}
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
      const res = await fetch(CONFIG.GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'getAIInsight',
          token,
          type: 'chat',
          messages: newMessages,
          analyticsData: data,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: json.reply }])
      } else {
        throw new Error(json.message)
      }
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 'var(--radius-md)',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={14} color="#fff" />
          </div>
          <div>
            <p style={{ fontFamily: PJS, fontWeight: 700, fontSize: '0.85rem' }}>Tanya Aira</p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Konsultan AI toko kamu</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--danger)', fontSize: '0.72rem', gap: 4, padding: '4px 8px' }}
          >
            <Trash2 size={11} />
            Hapus
          </button>
        )}
      </div>

      {/* Messages */}
      <div style={{
        maxHeight: 360,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        marginBottom: messages.length > 0 ? 16 : 0,
        paddingRight: 2,
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '24px 0',
            color: 'var(--text-tertiary)', fontSize: '0.82rem',
          }}>
            <Bot size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
            <p>Tanya apa saja tentang toko kamu</p>
            <p style={{ fontSize: '0.72rem', marginTop: 4 }}>Misal: "Kenapa revenue saya nol?" atau "Produk mana yang perlu dioptimasi?"</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            gap: 8,
            alignItems: 'flex-end',
          }}>
            {m.role === 'assistant' && (
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--accent-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Bot size={12} color="#fff" />
              </div>
            )}
            <div style={{
              maxWidth: '78%',
              padding: '10px 14px',
              borderRadius: m.role === 'user'
                ? 'var(--radius-lg) var(--radius-lg) 4px var(--radius-lg)'
                : 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
              background: m.role === 'user'
                ? 'var(--accent-gradient)'
                : 'var(--surface)',
              border: m.role === 'user' ? 'none' : '1px solid var(--glass-border)',
              fontSize: '0.83rem',
              lineHeight: 1.65,
              color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
              whiteSpace: 'pre-line',
            }}>
              {m.content}
            </div>
            {m.role === 'user' && (
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <User size={12} color="var(--text-secondary)" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--accent-gradient)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Bot size={12} color="#fff" />
            </div>
            <div style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-lg) var(--radius-lg) var(--radius-lg) 4px',
              background: 'var(--surface)',
              border: '1px solid var(--glass-border)',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'var(--text-tertiary)',
                  animation: 'pulse 1.2s ease-in-out infinite',
                  animationDelay: `${i * 0.2}s`,
                }} />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'flex-end',
        borderTop: messages.length > 0 ? '1px solid var(--glass-border)' : 'none',
        paddingTop: messages.length > 0 ? 14 : 0,
      }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya sesuatu tentang toko kamu..."
          rows={1}
          style={{
            flex: 1,
            padding: '10px 14px',
            background: 'var(--surface)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            resize: 'none',
            fontFamily: PJS,
            outline: 'none',
            lineHeight: 1.5,
            maxHeight: 120,
            overflowY: 'auto',
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
            opacity: input.trim() && !loading ? 1 : 0.5,
            flexShrink: 0,
            transition: 'all var(--transition-fast)',
          }}
        >
          {loading ? <Loader size={14} color="var(--text-tertiary)" style={{ animation: 'spin 0.7s linear infinite' }} /> : <Send size={14} color={input.trim() ? '#fff' : 'var(--text-tertiary)'} />}
        </button>
      </div>
      <p style={{ fontSize: '0.62rem', color: 'var(--text-tertiary)', marginTop: 8, textAlign: 'center' }}>
        Enter untuk kirim · Shift+Enter baris baru · Riwayat tersimpan di perangkat ini
      </p>
    </div>
  )
}

function BarChartCustom({ data, maxVal, globalMax }) {
  const [selected, setSelected] = useState(null)

  if (!data || data.length === 0) return null

  const totalPeriod = data.reduce((s, d) => s + (d.total || 0), 0)
  const selectedItem = selected !== null ? data[selected] : null
  const isHighestSelected = selectedItem && maxVal > 0 && selectedItem.total === maxVal && selectedItem.total > 0

  const handleBarClick = (i) => {
    setSelected(prev => prev === i ? null : i)
  }

  useEffect(() => { setSelected(null) }, [data])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 140 }}>
        {data.map((d, i) => {
          const pct = maxVal > 0 ? (d.total / maxVal) * 100 : 0
          const isHighest = maxVal > 0 && d.total === maxVal && d.total > 0
          const isEmpty = d.total === 0
          const isActive = selected === i

          return (
            <div
              key={i}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', height: '100%', justifyContent: 'flex-end',
                position: 'relative', cursor: 'pointer',
              }}
              onClick={() => handleBarClick(i)}
            >
              {isHighest && (
                <div style={{
                  position: 'absolute',
                  bottom: `${Math.max(pct, 2)}%`,
                  left: '50%', transform: 'translateX(-50%) translateY(-4px)',
                  background: '#fbbf24', borderRadius: '50%',
                  width: 6, height: 6,
                  boxShadow: '0 0 8px rgba(251,191,36,0.7)',
                }} />
              )}
              <div style={{
                width: '100%', minWidth: 4,
                height: `${Math.max(pct, isEmpty ? 1 : 2)}%`,
                background: isHighest
                  ? 'linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)'
                  : isEmpty
                    ? 'var(--glass-border-hover)'
                    : `rgba(91,138,245,${0.25 + (pct / 100) * 0.5})`,
                borderRadius: '3px 3px 0 0',
                transition: 'height 0.5s ease, opacity 0.15s ease',
                opacity: selected !== null && !isActive ? 0.4 : 1,
                boxShadow: isHighest ? '0 0 10px rgba(251,191,36,0.4)' : 'none',
                outline: isActive ? '2px solid rgba(167,139,250,0.6)' : 'none',
                outlineOffset: '2px',
              }} />
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, textAlign: 'center', overflow: 'hidden' }}>
            <span style={{
              fontSize: '0.6rem',
              color: selected === i ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: selected === i ? 700 : 400,
              whiteSpace: 'nowrap',
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              transition: 'color 0.15s, font-weight 0.15s',
            }}>
              {d.label}
            </span>
          </div>
        ))}
      </div>

      <div style={{
        overflow: 'hidden',
        maxHeight: selectedItem ? 80 : 0,
        opacity: selectedItem ? 1 : 0,
        transition: 'max-height 0.25s ease, opacity 0.2s ease',
      }}>
        {selectedItem && (
          <div style={{
            marginTop: 4,
            padding: '12px 16px',
            background: 'linear-gradient(135deg, rgba(30,32,48,0.95) 0%, rgba(20,22,36,0.95) 100%)',
            border: '1px solid rgba(167,139,250,0.25)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {selectedItem.label}
              </p>
              <p style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1rem',
                color: isHighestSelected ? '#fbbf24' : '#fff',
              }}>
                {formatRupiah(selectedItem.total || 0)}
              </p>
            </div>
            {isHighestSelected && (
              <div style={{
                fontSize: '0.62rem', fontWeight: 700,
                color: '#fbbf24',
                background: 'rgba(251,191,36,0.12)',
                border: '1px solid rgba(251,191,36,0.25)',
                borderRadius: 'var(--radius-full)',
                padding: '3px 8px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}>
                Tertinggi
              </div>
            )}
            {!isHighestSelected && maxVal > 0 && selectedItem.total > 0 && (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>
                {Math.round((selectedItem.total / maxVal) * 100)}% dari tertinggi
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: 'var(--glass-border)', margin: '4px 0' }} />

      <div style={{ display: 'flex', gap: 0 }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingRight: 12 }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tertinggi
          </p>
          <p style={{
            fontWeight: 800, fontFamily: 'var(--font-display)', color: '#fbbf24',
            fontSize: formatRupiah(maxVal).length > 12 ? '0.75rem' : '0.88rem',
            wordBreak: 'break-all', lineHeight: 1.2,
          }}>
            {formatRupiah(maxVal)}
          </p>
        </div>
        <div style={{ width: 1, background: 'var(--glass-border)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 12 }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Periode
          </p>
          <p style={{
            fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent)',
            fontSize: formatRupiah(totalPeriod).length > 12 ? '0.75rem' : '0.88rem',
            wordBreak: 'break-all', lineHeight: 1.2,
          }}>
            {formatRupiah(totalPeriod)}
          </p>
        </div>
      </div>
    </div>
  )
}

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

function AnalyticsSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-xl)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 'var(--radius-xl)' }} />)}
      </div>
      <div className="skeleton" style={{ height: 240, borderRadius: 'var(--radius-xl)' }} />
      <div className="skeleton" style={{ height: 200, borderRadius: 'var(--radius-xl)' }} />
      <div className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />
    </div>
  )
}
