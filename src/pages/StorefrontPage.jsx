import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { MessageCircle, Search, ShoppingBag, Store, Star, ChevronLeft, X, Plus, Minus, Package, Music, Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'
import { tokoApi, produkApi } from '../lib/api.js'
import { formatRupiah, generateCheckoutMessage, generateWALink, validateWA, truncate } from '../lib/utils.js'

const TEMA = {
  default: { accent: '#5b8af5', accent2: '#7c6af7', gradient: 'linear-gradient(135deg, #5b8af5, #7c6af7)' },
  emerald: { accent: '#10b981', accent2: '#059669', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  sunset:  { accent: '#f59e0b', accent2: '#ef4444', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  rose:    { accent: '#f43f5e', accent2: '#ec4899', gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
}

// Guard: pastikan wa selalu string sebelum dipakai
function safeWA(wa) {
  if (!wa) return ''
  return String(wa)
}

// Extract YouTube video ID dari berbagai format URL
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

// =============================================
// MUSIC PLAYER — floating button + mini player
// =============================================

function MusicPlayer({ musikUrl, tema }) {
  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(false)
  const videoId = getYouTubeId(musikUrl)

  if (!videoId) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: 56, // di atas footer
          right: 20,
          zIndex: 200,
          width: 48, height: 48,
          borderRadius: 'var(--radius-full)',
          background: playing ? tema.gradient : 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(16px)',
          border: `1px solid ${playing ? tema.accent + '66' : 'var(--glass-border)'}`,
          boxShadow: playing
            ? `0 4px 24px ${tema.accent}55, 0 0 0 3px ${tema.accent}22`
            : '0 4px 16px rgba(0,0,0,0.4)',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff',
          transition: 'all 0.3s ease',
          animation: playing ? 'musicPulse 2s ease-in-out infinite' : 'none',
        }}
        title={open ? 'Tutup player' : 'Putar musik toko'}
      >
        <Music size={18} />
        <style>{`
          @keyframes musicPulse {
            0%, 100% { box-shadow: 0 4px 24px ${tema.accent}55, 0 0 0 3px ${tema.accent}22; }
            50% { box-shadow: 0 4px 32px ${tema.accent}77, 0 0 0 6px ${tema.accent}15; }
          }
          @keyframes playerSlideIn {
            from { opacity: 0; transform: translateY(12px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
        `}</style>
      </button>

      {/* Mini player panel */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: 116,
          right: 20,
          zIndex: 200,
          width: 300,
          background: 'rgba(10,10,15,0.92)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${tema.accent}33`,
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          boxShadow: `0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px ${tema.accent}15`,
          animation: 'playerSlideIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}>
          {/* Player header */}
          <div style={{
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            borderBottom: `1px solid ${tema.accent}22`,
            background: `${tema.accent}0d`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Music size={13} color={tema.accent} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: tema.accent, letterSpacing: '0.04em' }}>
                MUSIK TOKO
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'transparent', border: 'none',
                color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
                display: 'flex', padding: 2,
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* YouTube iframe */}
          <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`}
              title="Musik Toko"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setPlaying(true)}
              style={{
                position: 'absolute', top: 0, left: 0,
                width: '100%', height: '100%',
                border: 'none',
              }}
            />
          </div>

          {/* Note */}
          <div style={{ padding: '8px 14px', borderTop: `1px solid ${tema.accent}15` }}>
            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
              Musik dipilih oleh pemilik toko
            </p>
          </div>
        </div>
      )}
    </>
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

  useEffect(() => {
    loadStorefront()
  }, [slug])

  const loadStorefront = async () => {
    setLoading(true)
    try {
      const [tokoRes, produkRes] = await Promise.all([
        tokoApi.getBySlug(slug),
        produkApi.getByToko(slug),
      ])
      // Normalisasi data toko — pastikan wa selalu string
      const tokoData = tokoRes.data
        ? { ...tokoRes.data, wa: safeWA(tokoRes.data.wa) }
        : null
      setToko(tokoData)
      setProduk((produkRes.data || []).filter(p => p.aktif))
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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Hero / Header */}
      <div style={{
        background: `linear-gradient(180deg, ${tema.accent}22 0%, transparent 100%)`,
        borderBottom: '1px solid var(--glass-border)',
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            {/* Logo */}
            <div style={{
              width: 64, height: 64, borderRadius: '18px',
              background: tema.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '26px', color: '#fff',
              flexShrink: 0,
              boxShadow: `0 0 28px ${tema.accent}44`,
            }}>
              {toko.nama?.[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                  {toko.nama}
                </h1>
                {toko.plan === 'pro' && (
                  <span style={{
                    background: tema.gradient, color: '#fff',
                    fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px',
                    borderRadius: 'var(--radius-full)', letterSpacing: '0.04em',
                  }}>⭐ VERIFIED</span>
                )}
              </div>
              {toko.deskripsi && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                  {toko.deskripsi}
                </p>
              )}
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', marginTop: 6 }}>
                {produk.length} produk tersedia
              </p>
            </div>
            {toko.wa && (
              <a
                href={generateWALink(toko.wa)}
                target="_blank" rel="noreferrer"
                className="btn btn-sm"
                style={{
                  background: '#25d366', color: '#fff', border: 'none',
                  boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                  flexShrink: 0,
                }}
              >
                <MessageCircle size={14} />
                Chat Penjual
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px 80px' }}>
        {/* Search & filter */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
          {kategoriList.length > 1 && (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilterKat('all')}
                className="btn btn-sm"
                style={{
                  background: filterKat === 'all' ? tema.accent + '22' : 'var(--surface)',
                  color: filterKat === 'all' ? tema.accent : 'var(--text-secondary)',
                  border: `1px solid ${filterKat === 'all' ? tema.accent + '44' : 'var(--glass-border)'}`,
                  borderRadius: 'var(--radius-full)',
                }}
              >Semua</button>
              {kategoriList.map(k => (
                <button
                  key={k}
                  onClick={() => setFilterKat(k)}
                  className="btn btn-sm"
                  style={{
                    background: filterKat === k ? tema.accent + '22' : 'var(--surface)',
                    color: filterKat === k ? tema.accent : 'var(--text-secondary)',
                    border: `1px solid ${filterKat === k ? tema.accent + '44' : 'var(--glass-border)'}`,
                    borderRadius: 'var(--radius-full)',
                  }}
                >{k}</button>
              ))}
            </div>
          )}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>
              {search ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {filtered.map(p => (
              <ProdukCard
                key={p.id}
                produk={p}
                tema={tema}
                onClick={() => setSelectedProduk(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {selectedProduk && (
        <ProdukModal
          produk={selectedProduk}
          toko={toko}
          tema={tema}
          onClose={() => setSelectedProduk(null)}
          onCheckout={(p) => { setSelectedProduk(null); setCheckoutOpen(p) }}
        />
      )}

      {/* Checkout modal */}
      {checkoutOpen && (
        <CheckoutModal
          produk={checkoutOpen}
          toko={toko}
          tema={tema}
          onClose={() => setCheckoutOpen(false)}
        />
      )}

      {/* Music player floating */}
      {toko.musik && <MusicPlayer musikUrl={toko.musik} tema={tema} />}

      {/* Footer */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--glass-border)',
        padding: '10px 24px', textAlign: 'center',
        fontSize: '0.72rem', color: 'var(--text-tertiary)',
      }}>
        Toko ini ditenagai oleh{' '}
        <a href="/" style={{ color: tema.accent, fontWeight: 700 }}>Exora</a>
        {' '}— Buka toko online gratis kamu sekarang
      </div>
    </div>
  )
}

// =============================================
// PRODUCT CARD
// =============================================

function ProdukCard({ produk: p, tema, onClick }) {
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null

  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.borderColor = `${tema.accent}44`
        e.currentTarget.style.boxShadow = `var(--shadow-lg), 0 0 40px ${tema.accent}15`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.boxShadow = 'var(--shadow-card)'
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '1', overflow: 'hidden', background: 'var(--surface)' }}>
        {p.foto ? (
          <img
            src={p.foto}
            alt={p.nama}
            style={{
              width: '100%', height: '100%',
              objectFit: 'contain',
              objectPosition: 'center',
              padding: '4px',
              transition: 'transform 0.4s ease',
              background: 'var(--surface)',
            }}
            onMouseEnter={e => e.target.style.transform = 'scale(1.04)'}
            onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
            <Package size={40} />
          </div>
        )}
        {diskon && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            background: '#ef4444', color: '#fff',
            fontSize: '0.7rem', fontWeight: 800,
            padding: '2px 8px', borderRadius: 'var(--radius-full)',
          }}>-{diskon}%</div>
        )}
        {p.stok === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span className="badge badge-danger">Habis</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 4, lineHeight: 1.3 }}>
          {truncate(p.nama, 36)}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 800, color: tema.accent, fontSize: '0.95rem' }}>
            {formatRupiah(p.harga)}
          </p>
          {p.hargaCoret && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
              {formatRupiah(p.hargaCoret)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================
// PRODUCT DETAIL MODAL
// =============================================

function ProdukModal({ produk: p, toko, tema, onClose, onCheckout }) {
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null
  const sold = p.stok === 0

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

        {/* Image */}
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: 'var(--surface)', flexShrink: 0 }}>
          {p.foto ? (
            <img
              src={p.foto}
              alt={p.nama}
              style={{
                width: '100%', height: '100%',
                objectFit: 'contain',
                objectPosition: 'center',
                padding: '8px',
                background: 'var(--surface)',
              }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <Package size={56} />
            </div>
          )}
          <button onClick={onClose} style={{
            position: 'absolute', top: 12, right: 12,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 'var(--radius-full)', padding: '8px',
            cursor: 'pointer', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <X size={16} />
          </button>
          {diskon && (
            <div style={{
              position: 'absolute', top: 12, left: 12,
              background: '#ef4444', color: '#fff',
              fontSize: '0.8rem', fontWeight: 800,
              padding: '4px 10px', borderRadius: 'var(--radius-full)',
            }}>-{diskon}%</div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {p.kategori && (
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              {p.kategori}
            </p>
          )}
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', marginBottom: 10 }}>
            {p.nama}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.4rem', color: tema.accent }}>
              {formatRupiah(p.harga)}
            </p>
            {p.hargaCoret && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>
                {formatRupiah(p.hargaCoret)}
              </p>
            )}
          </div>

          {p.stok !== null && (
            <p style={{ fontSize: '0.8rem', color: p.stok === 0 ? 'var(--danger)' : p.stok < 5 ? 'var(--warning)' : 'var(--success)', marginBottom: 12 }}>
              {p.stok === 0 ? '✕ Stok habis' : p.stok < 5 ? `⚠ Sisa ${p.stok} stok` : `✓ Stok tersedia (${p.stok})`}
            </p>
          )}

          {p.deskripsi && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 16, whiteSpace: 'pre-line' }}>
              {p.deskripsi}
            </p>
          )}

          {p.berat && (
            <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Berat: {p.berat}g</p>
          )}
        </div>

        {/* Action */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px' }}>
          {toko.wa && (
            <a
              href={generateWALink(toko.wa, `Halo, saya mau tanya tentang produk: ${p.nama}`)}
              target="_blank" rel="noreferrer"
              className="btn btn-secondary"
              style={{ flex: 1 }}
            >
              <MessageCircle size={15} /> Tanya Penjual
            </a>
          )}
          <button
            onClick={() => !sold && onCheckout(p)}
            className="btn btn-primary"
            disabled={sold}
            style={{
              flex: 2,
              background: sold ? 'var(--surface)' : tema.gradient,
              boxShadow: sold ? 'none' : `0 4px 20px ${tema.accent}44`,
            }}
          >
            <ShoppingBag size={15} />
            {sold ? 'Stok Habis' : 'Beli via WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// CHECKOUT MODAL
// =============================================

function CheckoutModal({ produk: p, toko, tema, onClose }) {
  const [form, setForm] = useState({ nama: '', wa: '', alamat: '', catatan: '', qty: 1 })
  const [errors, setErrors] = useState({})

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
  }

  const maxQty = p.stok || 99

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    // Validasi WA dengan guard String() dulu
    if (form.wa && !validateWA(String(form.wa))) e.wa = 'Format WA tidak valid'
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCheckout = () => {
    if (!validate()) return
    const message = generateCheckoutMessage(p, toko, form)
    const link = generateWALink(toko.wa, message)
    window.open(link, '_blank')
  }

  const total = p.harga * form.qty

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 600,
        background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560,
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          maxHeight: '92vh', overflow: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Detail Pesanan</h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Product summary */}
          <div style={{ display: 'flex', gap: '12px', padding: '14px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--glass-border)' }}>
            {p.foto && <img src={p.foto} alt={p.nama} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{p.nama}</p>
              <p style={{ color: tema.accent, fontWeight: 800 }}>{formatRupiah(p.harga)}</p>
            </div>
            {/* Qty selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <button
                onClick={() => set('qty', Math.max(1, form.qty - 1))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Minus size={12} /></button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{form.qty}</span>
              <button
                onClick={() => set('qty', Math.min(maxQty, form.qty + 1))}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--surface-hover)', border: '1px solid var(--glass-border)', cursor: 'pointer', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              ><Plus size={12} /></button>
            </div>
          </div>

          {/* Form */}
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

          {/* Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 16px', background: `${tema.accent}12`, border: `1px solid ${tema.accent}22`, borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontWeight: 700 }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', color: tema.accent }}>
              {formatRupiah(total)}
            </span>
          </div>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            className="btn btn-lg"
            style={{
              width: '100%', background: tema.gradient,
              color: '#fff', border: 'none',
              boxShadow: `0 4px 24px ${tema.accent}44`,
              fontFamily: 'var(--font-display)', fontWeight: 700,
            }}
          >
            <MessageCircle size={18} />
            Lanjut ke WhatsApp Penjual
          </button>

          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
            Kamu akan diarahkan ke WhatsApp penjual dengan detail pesanan yang sudah terisi otomatis
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// LOADING SKELETON
// =============================================

function StorefrontSkeleton() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{ padding: '40px 24px 32px', borderBottom: '1px solid var(--glass-border)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: '18px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 24, width: '40%', marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 14, width: '60%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '1', borderRadius: 'var(--radius-xl)' }} />
          ))}
        </div>
      </div>
    </div>
  )
}
