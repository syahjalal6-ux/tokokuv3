import React, { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { MessageCircle, Search, ShoppingBag, Store, ChevronLeft, ChevronRight, X, Plus, Minus, Package, Music, Star, Send } from 'lucide-react'
import { tokoApi, produkApi, ratingApi, pesananApi } from '../lib/api.js'
import { formatRupiah, generateCheckoutMessage, generateWALink, validateWA, truncate } from '../lib/utils.js'
import ChatModal from '../components/seller/ChatModal.jsx'

const TEMA = {
  default: { accent: '#5b8af5', accent2: '#7c6af7', gradient: 'linear-gradient(135deg, #5b8af5, #7c6af7)' },
  emerald: { accent: '#10b981', accent2: '#059669', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  sunset:  { accent: '#f59e0b', accent2: '#ef4444', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  rose:    { accent: '#f43f5e', accent2: '#ec4899', gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
}

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function safeWA(wa) {
  if (!wa) return ''
  return String(wa)
}

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <Star
          key={i}
          size={size}
          fill={(hover || value) >= i ? '#fbbf24' : 'transparent'}
          color={(hover || value) >= i ? '#fbbf24' : 'rgba(255,255,255,0.3)'}
          style={{ cursor: onChange ? 'pointer' : 'default', transition: 'all 0.1s' }}
          onClick={() => onChange && onChange(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
        />
      ))}
    </div>
  )
}

function MusicPlayer({ musikUrl, tema }) {
  const [playing, setPlaying] = useState(false)
  const iframeRef = useRef(null)
  const videoId = getYouTubeId(musikUrl)
  if (!videoId) return null

  const handleToggle = () => {
    setPlaying(p => !p)
  }

  return (
    <>
      {/* Hidden iframe — always mounted when playing */}
      {playing && (
        <div style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
          <iframe
            ref={iframeRef}
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
            title="Musik Toko"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            style={{ width: 1, height: 1, border: 'none' }}
          />
        </div>
      )}

      <button
        onClick={handleToggle}
        title={playing ? 'Pause musik' : 'Play musik'}
        style={{
          position: 'fixed', bottom: 48, left: 16, zIndex: 200,
          width: 40, height: 40, borderRadius: 'var(--radius-full)',
          background: playing ? tema.gradient : 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${playing ? tema.accent + '66' : 'var(--glass-border)'}`,
          boxShadow: playing ? `0 4px 24px ${tema.accent}66` : '0 4px 16px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: playing ? '#fff' : 'var(--text-secondary)',
          transition: 'all 0.3s ease',
        }}
      >
        <Music size={15} />
        {playing && (
          <style>{`
            @keyframes musicPulse {
              0%, 100% { box-shadow: 0 4px 24px ${tema.accent}66; }
              50% { box-shadow: 0 4px 32px ${tema.accent}99; }
            }
          `}</style>
        )}
      </button>
    </>
  )
}

function PhotoCarousel({ fotos, nama }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(null)
  if (!fotos.length) return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
      <Package size={56} />
    </div>
  )
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) }
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 40) setIdx(i => (i + 1) % fotos.length)
    else if (diff < -40) setIdx(i => (i - 1 + fotos.length) % fotos.length)
    touchStartX.current = null
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img key={idx} src={fotos[idx]} alt={`${nama} ${idx + 1}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '8px', background: 'var(--surface)', animation: 'fadeIn 0.2s ease' }}
      />
      {fotos.length > 1 && (
        <>
          <button onClick={prev} style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><ChevronLeft size={16} /></button>
          <button onClick={next} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}><ChevronRight size={16} /></button>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {fotos.map((_, i) => (
              <div key={i} onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 'var(--radius-full)', background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s ease', cursor: 'pointer' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RatingSection({ produkId, tokoId, tema }) {
  const [ratings, setRatings] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ buyerNama: '', rating: 0, komentar: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { loadRatings() }, [produkId])

  const loadRatings = async () => {
    try {
      const res = await ratingApi.get({ produkId })
      setRatings(res.data.ratings || [])
      setAvgRating(res.data.avgRating)
      setTotal(res.data.total)
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.buyerNama.trim() || !form.rating || !form.komentar.trim()) return
    setSubmitting(true)
    try {
      await ratingApi.add({ tokoId, produkId, buyerNama: form.buyerNama, rating: form.rating, komentar: form.komentar })
      setSubmitted(true)
      setShowForm(false)
      loadRatings()
    } catch (err) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>Ulasan</h3>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star size={14} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24' }}>{avgRating}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>({total})</span>
            </div>
          )}
        </div>
        {!submitted && (
          <button onClick={() => setShowForm(s => !s)} className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem' }}>
            + Tulis Ulasan
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Nama</label>
            <input className="form-input" placeholder="Nama kamu" value={form.buyerNama} onChange={e => setForm(f => ({ ...f, buyerNama: e.target.value }))} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Rating</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Komentar</label>
            <textarea className="form-input form-textarea" rows={3} placeholder="Bagaimana pengalaman kamu dengan produk ini?" value={form.komentar} onChange={e => setForm(f => ({ ...f, komentar: e.target.value }))} maxLength={500} />
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting || !form.rating || !form.buyerNama.trim() || !form.komentar.trim()}
            className="btn btn-sm btn-primary"
            style={{ background: tema.gradient, border: 'none' }}
          >
            {submitting ? 'Mengirim...' : <><Send size={13} /> Kirim Ulasan</>}
          </button>
        </div>
      )}

      {submitted && (
        <div style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: 'var(--success)' }}>
          ✓ Ulasan kamu berhasil dikirim!
        </div>
      )}

      {ratings.length === 0 ? (
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>Belum ada ulasan</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.slice(0, 5).map(r => (
            <div key={r.id} style={{ padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: tema.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>
                    {r.buyerNama?.[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem' }}>{r.buyerNama}</span>
                </div>
                <StarRating value={Number(r.rating)} size={13} />
              </div>
              {r.komentar && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{r.komentar}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StorefrontPage() {
  const { slug } = useParams()
  const [toko, setToko] = useState(null)
  const [produk, setProduk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState('all')
  const [selectedProduk, setSelectedProduk] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"]')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = `/toko/${slug}/manifest.json`
    document.head.appendChild(link)

    loadStorefront()

    return () => {
      const l = document.querySelector('link[rel="manifest"]')
      if (l) l.remove()
      const restore = document.createElement('link')
      restore.rel = 'manifest'
      restore.href = '/manifest.json'
      document.head.appendChild(restore)
    }
  }, [slug])

  const loadStorefront = async () => {
    setLoading(true)
    try {
      const [tokoRes, produkRes] = await Promise.all([
        tokoApi.getBySlug(slug),
        produkApi.getByToko(slug),
      ])
      const tokoData = tokoRes.data ? { ...tokoRes.data, wa: safeWA(tokoRes.data.wa) } : null
      setToko(tokoData)
      setProduk((produkRes.data || []).filter(p => p.aktif === true || p.aktif === 'TRUE'))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tema = TEMA[toko?.tema] || TEMA.default
  const kategoriList = [...new Set(produk.map(p => p.kategori).filter(Boolean))]
  const filtered = produk.filter(p => {
    const matchSearch = !search || p.nama.toLowerCase().includes(search.toLowerCase()) || p.deskripsi?.toLowerCase().includes(search.toLowerCase())
    const matchKat = filterKat === 'all' || p.kategori === filterKat
    return matchSearch && matchKat
  })

  if (loading) return <StorefrontSkeleton />

  if (error || !toko) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <Store size={48} color="var(--text-tertiary)" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Toko tidak ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 320 }}>Toko dengan alamat <strong>/toko/{slug}</strong> tidak ada atau sudah dihapus.</p>
        <a href="/" className="btn btn-primary btn-sm">Kembali ke Beranda</a>
      </div>
    )
  }

  if (toko.aktif === false || toko.aktif === 'FALSE') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '18px', background: tema.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '26px', color: '#fff' }}>
          {toko.nama?.[0]?.toUpperCase()}
        </div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{toko.nama}</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 320 }}>Toko ini sedang tidak aktif sementara. Silakan cek kembali nanti.</p>
        {toko.wa && (
          <a href={generateWALink(toko.wa)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: '#25d366', color: '#fff', border: 'none' }}>
            <MessageCircle size={14} /> Hubungi Penjual
          </a>
        )}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', paddingBottom: 56 }}>
      <style>{`
        .produk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 500px) { .produk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 700px) { .produk-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1000px) { .produk-grid { grid-template-columns: repeat(5, 1fr); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* Header */}
      <div style={{
        background: `linear-gradient(180deg, ${tema.accent}22 0%, transparent 100%)`,
        borderBottom: '1px solid var(--glass-border)',
        padding: '20px 16px 16px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '14px', flexShrink: 0,
              background: tema.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '22px', color: '#fff',
              boxShadow: `0 0 20px ${tema.accent}44`,
            }}>
              {toko.nama?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1rem, 5vw, 1.4rem)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                  {toko.nama}
                </h1>
                {toko.plan === 'pro' && (
                  <span style={{ background: tema.gradient, color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 'var(--radius-full)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>⭐ PRO</span>
                )}
              </div>
              {toko.deskripsi && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 4 }}>
                  {toko.deskripsi}
                </p>
              )}
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
                {produk.length} produk tersedia
              </p>
            </div>
            <button
              onClick={() => setChatOpen(null)}
              className="btn btn-sm"
              style={{ background: tema.gradient, color: '#fff', border: 'none', boxShadow: `0 4px 12px ${tema.accent}44`, flexShrink: 0, padding: '7px 12px' }}
            >
              <MessageCircle size={13} />
            </button>
          </div>

          {toko.pengumuman && (
            <div style={{
              marginTop: 12, padding: '8px 12px',
              background: `${tema.accent}15`, border: `1px solid ${tema.accent}33`,
              borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5,
            }}>
              📢 {toko.pengumuman}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 80px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 36 }}
              placeholder="Cari produk..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {kategoriList.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', marginBottom: '16px', paddingBottom: 4, scrollbarWidth: 'none' }}>
            <button onClick={() => setFilterKat('all')} className="btn btn-sm" style={{ background: filterKat === 'all' ? tema.accent + '22' : 'var(--surface)', color: filterKat === 'all' ? tema.accent : 'var(--text-secondary)', border: `1px solid ${filterKat === 'all' ? tema.accent + '44' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>Semua</button>
            {kategoriList.map(k => (
              <button key={k} onClick={() => setFilterKat(k)} className="btn btn-sm" style={{ background: filterKat === k ? tema.accent + '22' : 'var(--surface)', color: filterKat === k ? tema.accent : 'var(--text-secondary)', border: `1px solid ${filterKat === k ? tema.accent + '44' : 'var(--glass-border)'}`, borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>{k}</button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{search ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
          </div>
        ) : (
          <div className="produk-grid">
            {filtered.map(p => (
              <ProdukCard key={p.id} produk={p} tema={tema} onClick={() => setSelectedProduk(p)} />
            ))}
          </div>
        )}
      </div>

      {selectedProduk && (
        <ProdukModal
          produk={selectedProduk}
          toko={toko}
          tema={tema}
          onClose={() => setSelectedProduk(null)}
          onCheckout={(p) => { setSelectedProduk(null); setCheckoutOpen(p) }}
          onChat={(p) => { setSelectedProduk(null); setChatOpen(p) }}
        />
      )}

      {checkoutOpen && (
        <CheckoutModal produk={checkoutOpen} toko={toko} tema={tema} onClose={() => setCheckoutOpen(false)} />
      )}

      {chatOpen !== false && (
        <ChatModal
          produk={chatOpen || null}
          toko={toko}
          tema={tema}
          onClose={() => setChatOpen(false)}
          onCheckout={(p) => { setChatOpen(false); setCheckoutOpen(p) }}
          semuaProduk={produk}
        />
      )}

      {toko.musik && <MusicPlayer musikUrl={toko.musik} tema={tema} />}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,10,15,0.9)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '8px 16px', textAlign: 'center',
        fontSize: '0.72rem', color: 'var(--text-tertiary)',
      }}>
        Powered by <a href="/" style={{ color: '#3B82F6', fontWeight: 700 }}>Exora</a>
      </div>
    </div>
  )
}

function ProdukCard({ produk: p, tema, onClick }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--glass)', backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)',
        overflow: 'hidden', cursor: 'pointer',
        transition: 'all var(--transition-base)', boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.borderColor = `${tema.accent}44` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--glass-border)' }}
    >
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: 'var(--surface)' }}>
        {thumbUrl ? (
          <img src={thumbUrl} alt={p.nama} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}><Package size={32} /></div>
        )}
        {fotos.length > 1 && (
          <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', borderRadius: 'var(--radius-full)', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>
            1/{fotos.length}
          </div>
        )}
        {diskon && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 'var(--radius-full)' }}>-{diskon}%</div>
        )}
        {p.stok === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Habis</span>
          </div>
        )}
      </div>
      <div style={{ padding: '10px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: 3, lineHeight: 1.3 }}>{truncate(p.nama, 30)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 800, color: tema.accent, fontSize: '0.82rem' }}>{formatRupiah(p.harga)}</p>
          {p.hargaCoret && <p style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>}
        </div>
      </div>
    </div>
  )
}

function ProdukModal({ produk: p, toko, tema, onClose, onCheckout, onChat }) {
  const fotos = parseFotos(p.foto)
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null
  const sold = p.stok === 0

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 640, margin: '0 auto',
        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
          <PhotoCarousel fotos={fotos} nama={p.nama} />
          <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '7px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <X size={15} />
          </button>
          {diskon && <div style={{ position: 'absolute', top: 10, left: 10, background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: 'var(--radius-full)', zIndex: 10 }}>-{diskon}%</div>}
        </div>

        <div style={{ padding: '20px 20px 0', overflowY: 'auto', flex: 1 }}>
          {p.kategori && <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{p.kategori}</p>}
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 8 }}>{p.nama}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: tema.accent }}>{formatRupiah(p.harga)}</p>
            {p.hargaCoret && <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>}
          </div>
          {p.stok !== null && (
            <p style={{ fontSize: '0.78rem', color: p.stok === 0 ? 'var(--danger)' : p.stok < 5 ? 'var(--warning)' : 'var(--success)', marginBottom: 10 }}>
              {p.stok === 0 ? '✕ Stok habis' : p.stok < 5 ? `⚠ Sisa ${p.stok} stok` : `✓ Stok tersedia (${p.stok})`}
            </p>
          )}
          {p.deskripsi && <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-line' }}>{p.deskripsi}</p>}
          {p.berat && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 8 }}>Berat: {p.berat}g</p>}
          <RatingSection produkId={p.id} tokoId={toko.id} tema={tema} />
          <div style={{ height: 20 }} />
        </div>

        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 10, alignItems: 'center', background: 'var(--bg-secondary)' }}>
          <button
            onClick={() => onChat(p)}
            className="btn btn-secondary btn-icon"
            style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 'var(--radius-md)' }}
            title="Tanya Penjual"
          >
            <MessageCircle size={18} />
          </button>
          <button
            onClick={() => !sold && onCheckout(p)}
            disabled={sold}
            style={{
              flex: 1, height: 44,
              background: sold ? 'var(--surface)' : tema.gradient,
              color: sold ? 'var(--text-tertiary)' : '#fff',
              border: 'none', borderRadius: 'var(--radius-full)',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem',
              cursor: sold ? 'not-allowed' : 'pointer',
              boxShadow: sold ? 'none' : `0 4px 20px ${tema.accent}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <ShoppingBag size={16} />
            {sold ? 'Stok Habis' : 'Beli Sekarang'}
          </button>
        </div>
      </div>
    </div>
  )
}

function CheckoutModal({ produk: p, toko, tema, onClose }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const [form, setForm] = useState({ nama: '', wa: '', alamat: '', catatan: '', qty: 1 })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const maxQty = p.stok || 99

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    if (form.wa && !validateWA(String(form.wa))) e.wa = 'Format WA tidak valid'
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCheckout = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await pesananApi.create({
        tokoId: toko.id,
        produkId: p.id,
        produkNama: p.nama,
        harga: p.harga,
        qty: form.qty,
        total: p.harga * form.qty,
        buyerNama: form.nama,
        buyerWa: form.wa,
        buyerAlamat: form.alamat,
        catatan: form.catatan || '',
      })
      const message = generateCheckoutMessage(p, toko, form)
      const link = generateWALink(toko.wa, message)
      window.open(link, '_blank')
      onClose()
    } catch (err) {
      alert('Gagal menyimpan pesanan: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end', animation: 'fadeIn 0.2s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 560, margin: '0 auto',
        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
        maxHeight: '92vh', overflow: 'auto',
        animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Detail Pesanan</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
            {thumbUrl && <img src={thumbUrl} alt={p.nama} style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3 }}>{p.nama}</p>
              <p style={{ color: tema.accent, fontWeight: 800, fontSize: '0.9rem' }}>{formatRupiah(p.harga)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button onClick={() => set('qty', Math.max(1, form.qty - 1))} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem' }}>{form.qty}</span>
              <button onClick={() => set('qty', Math.min(maxQty, form.qty + 1))} style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className={`form-input ${errors.nama ? 'error' : ''}`} placeholder="Nama penerima" value={form.nama} onChange={e => set('nama', e.target.value)} />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp *</label>
            <input className={`form-input ${errors.wa ? 'error' : ''}`} placeholder="081234567890" value={form.wa} onChange={e => set('wa', e.target.value)} />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Pengiriman *</label>
            <textarea className={`form-input form-textarea ${errors.alamat ? 'error' : ''}`} placeholder="Alamat lengkap pengiriman..." value={form.alamat} onChange={e => set('alamat', e.target.value)} rows={3} />
            {errors.alamat && <span className="form-error">{errors.alamat}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Catatan (Opsional)</label>
            <input className="form-input" placeholder="Warna, ukuran, atau permintaan khusus..." value={form.catatan} onChange={e => set('catatan', e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: `${tema.accent}12`, border: `1px solid ${tema.accent}22`, borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: tema.accent }}>{formatRupiah(p.harga * form.qty)}</span>
          </div>

          <button
            onClick={handleCheckout}
            disabled={submitting}
            style={{ width: '100%', height: 48, background: submitting ? 'var(--surface)' : tema.gradient, color: submitting ? 'var(--text-tertiary)' : '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submitting ? 'none' : `0 4px 24px ${tema.accent}44` }}
          >
            <MessageCircle size={17} />
            {submitting ? 'Menyimpan...' : 'Lanjut ke WhatsApp Penjual'}
          </button>
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.72rem' }}>
            Kamu akan diarahkan ke WhatsApp penjual dengan detail pesanan otomatis
          </p>
        </div>
      </div>
    </div>
  )
}

function StorefrontSkeleton() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <style>{`
        .produk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 500px) { .produk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 700px) { .produk-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1000px) { .produk-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '14px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        <div className="produk-grid">
          {Array(6).fill(0).map((_, i) => <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-xl)' }} />)}
        </div>
      </div>
    </div>
  )
}
