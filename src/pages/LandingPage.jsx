import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Package, MessageCircle, Zap, Check, Store, BarChart2, Shield, Star, ChevronDown } from 'lucide-react'
import { PLAN_FEATURES, CONFIG } from '../lib/config.js'

const FEATURES = [
  { icon: Store, title: 'Toko Online Instan', desc: 'Buat toko dalam hitungan menit, tanpa coding. Langsung online dan siap menerima pesanan.' },
  { icon: MessageCircle, title: 'Checkout via WhatsApp', desc: 'Buyer langsung chat WA kamu. Tidak perlu payment gateway rumit.' },
  { icon: Package, title: 'Manajemen Produk', desc: 'Upload foto, atur harga, stok, dan kategori dengan mudah.' },
  { icon: BarChart2, title: 'Analytics (Pro)', desc: 'Pantau performa toko, produk terlaris, dan tren penjualan.' },
  { icon: Shield, title: 'Aman & Terpercaya', desc: 'Login dengan Google, data tersimpan aman di infrastruktur Google.' },
  { icon: Zap, title: 'Gratis Selamanya', desc: 'Paket gratis tanpa batas waktu. Upgrade kalau butuh lebih.' },
]

const TESTIMONIALS = [
  { name: 'Rina S.', toko: 'Rina Handmade', text: 'Buka toko online jadi gampang banget! Langsung jalan dalam 10 menit.', stars: 5 },
  { name: 'Budi W.', toko: 'BudiSnack', text: 'Pesanan masuk lewat WA, gampang banget kelolanya. Recommended!', stars: 5 },
  { name: 'Sari M.', toko: 'Sari Beauty', text: 'Desainnya keren, pembeli saya bilang toko saya keliatan profesional.', stars: 5 },
]

const FAQ = [
  { q: 'Apakah benar-benar gratis?', a: 'Ya! Paket gratis tidak ada batas waktu. Kamu bisa buka toko dan jual hingga 10 produk tanpa biaya apapun.' },
  { q: 'Bagaimana cara checkout pembeli?', a: 'Pembeli klik tombol "Beli via WhatsApp" di toko kamu, lalu akan diarahkan ke chat WA kamu dengan pesan otomatis berisi detail pesanan.' },
  { q: 'Foto produk disimpan di mana?', a: 'Foto disimpan di Google Drive (milik pengelola platform), sehingga kamu tidak perlu punya hosting sendiri.' },
  { q: 'Bagaimana cara upgrade ke Pro?', a: `Klik tombol Upgrade di dashboard, kamu akan diarahkan ke WhatsApp admin untuk konfirmasi pembayaran. Harga: ${CONFIG.PRO_PRICE}.` },
]

// Icon X Exora (SVG gradient)
const ExoraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGrad)" />
  </svg>
)

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(10,10,15,0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--glass-border)' : '1px solid transparent',
        transition: 'all 0.3s ease',
        height: 64,
        display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
          {/* Logo Exora */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontWeight: 800,
                fontSize: '1.15rem',
                color: '#ffffff',
                letterSpacing: '-0.02em',
              }}>exora</span>
              <span style={{
                fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
                fontWeight: 600,
                fontSize: '0.6rem',
                background: 'linear-gradient(90deg, #3B82F6, #7C3AED)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.05em',
              }}>Start. Sell. Scale.</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">Masuk</Link>
            <Link to="/login" className="btn btn-primary btn-sm">
              Buka Toko Gratis
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ paddingTop: 140, paddingBottom: 100, textAlign: 'center', position: 'relative' }}>
        <div className="container-sm" style={{ animation: 'fadeIn 0.7s ease' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient-soft)',
            border: '1px solid rgba(167,139,250,0.2)',
            marginBottom: '28px',
          }}>
            <Zap size={13} color="var(--accent-3)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-3)', letterSpacing: '0.04em' }}>
              GRATIS • TANPA CODING • LANGSUNG ONLINE
            </span>
          </div>

          {/* Hero brand */}
          <h1 className="text-display gradient-text" style={{ fontSize: 'clamp(3rem, 8vw, 5.5rem)', marginBottom: '8px', letterSpacing: '-0.04em' }}>
            exora
          </h1>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.4rem)',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #3B82F6, #7C3AED)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px',
          }}>
            Start. Sell. Scale.
          </p>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.2rem)',
            color: 'var(--text-secondary)', lineHeight: 1.7,
            marginBottom: '40px', maxWidth: 480, margin: '0 auto 40px',
          }}>
            Bangun toko online, kelola bisnis, dan jual ke mana saja.
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Buka Toko Gratis
              <ArrowRight size={16} />
            </Link>
            <a href="#fitur" className="btn btn-secondary btn-lg">
              Lihat Fitur
            </a>
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 48, display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { val: '20+', label: 'Toko Aktif' },
              { val: '100+', label: 'Produk Terjual' },
              { val: '4.9/5', label: 'Rating Seller' },
            ].map(s => (
              <div key={s.val} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', letterSpacing: '-0.03em' }}>{s.val}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero mockup */}
        <div style={{ marginTop: 72, position: 'relative' }}>
          <div style={{
            maxWidth: 800, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(91,138,245,0.15) 0%, rgba(167,139,250,0.1) 100%)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-2xl)',
            padding: '3px',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 80px rgba(91,138,245,0.15)',
          }}>
            <div style={{
              background: 'var(--bg-secondary)',
              borderRadius: 'calc(var(--radius-2xl) - 3px)',
              overflow: 'hidden',
            }}>
              {/* Browser bar */}
              <div style={{
                background: 'var(--bg-tertiary)',
                borderBottom: '1px solid var(--glass-border)',
                padding: '10px 16px',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#f87171', '#fbbf24', '#34d399'].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, maxWidth: 300, margin: '0 auto',
                  background: 'var(--surface)', border: '1px solid var(--glass-border)',
                  borderRadius: 'var(--radius-full)', padding: '4px 12px',
                  fontSize: '0.72rem', color: 'var(--text-tertiary)', textAlign: 'center',
                }}>
                  exora.app/toko/rina-handmade
                </div>
              </div>

              {/* Mock storefront */}
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 20 }}>
                  <img src="/rina.png" alt="Rina Handmade" style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>Rina Handmade</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>✨ Produk handmade berkualitas</p>
                  </div>
                  <span className="badge badge-pro" style={{ marginLeft: 'auto' }}>⭐ Pro</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { name: 'Tote Bag Batik Mega Mendung', price: 'Rp 49.000', img: '/bag.png' },
                    { name: 'Lilin Aromaterapi Coconut Wax', price: 'Rp 39.000', img: '/wax.png' },
                    { name: 'Midori Matcha Latte', price: 'Rp 29.000', img: '/matcha.png' },
                  ].map(p => (
                    <div key={p.name} className="glass-card" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
                      <div style={{ height: 80, overflow: 'hidden' }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: 3 }}>{p.name}</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 800 }}>{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="fitur" style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="text-heading" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: 12 }}>
              Semua yang kamu butuhkan
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              Fitur lengkap untuk berjualan online, tanpa ribet.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }} className="stagger">
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card animate-fade-in" style={{ padding: '28px 24px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                  background: 'var(--accent-gradient-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16, color: 'var(--accent-3)',
                }}>
                  <f.icon size={20} />
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8, fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" style={{ padding: '100px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 className="text-heading" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', marginBottom: 12 }}>
              Harga yang jelas
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>Mulai gratis, upgrade kalau butuh lebih.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: 720, margin: '0 auto' }}>
            <div className="glass-card" style={{ padding: '32px' }}>
              <span className="badge badge-free" style={{ marginBottom: 16 }}>Gratis</span>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.4rem', marginBottom: 4 }}>Rp 0</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 24 }}>Selamanya</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 28 }}>
                {PLAN_FEATURES.free.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>Mulai Gratis</Link>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(91,138,245,0.12) 0%, rgba(167,139,250,0.12) 100%)',
              border: '1px solid rgba(167,139,250,0.3)',
              borderRadius: 'var(--radius-xl)', padding: '32px',
              boxShadow: '0 8px 40px rgba(91,138,245,0.2)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', borderRadius: '50%' }} />
              <span className="badge badge-pro" style={{ marginBottom: 16 }}>⭐ Pro</span>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.4rem', marginBottom: 4 }}>Rp 49.000</p>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: 24 }}>per bulan</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 28 }}>
                {PLAN_FEATURES.pro.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/login" className="btn btn-primary" style={{ width: '100%' }}>
                Coba Pro Sekarang <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 0' }}>
        <div className="container">
          <h2 className="text-heading" style={{ textAlign: 'center', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 48 }}>
            Kata mereka yang sudah pakai
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: 12 }}>
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} size={14} fill="var(--warning)" color="var(--warning)" />
                  ))}
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 16, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="avatar avatar-sm">{t.name[0]}</div>
                  <div>
                    <p style={{ fontSize: '0.82rem', fontWeight: 700 }}>{t.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{t.toko}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '80px 0' }}>
        <div className="container-sm">
          <h2 className="text-heading" style={{ textAlign: 'center', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', marginBottom: 48 }}>
            Pertanyaan umum
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQ.map((f, i) => (
              <div key={i} className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '18px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', textAlign: 'left', gap: '12px',
                  }}
                >
                  {f.q}
                  <ChevronDown size={16} color="var(--text-tertiary)" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '0 20px 18px', color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.65, borderTop: '1px solid var(--glass-border)', paddingTop: 14 }}>
                    {f.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 0 120px' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <div style={{
            padding: '56px 40px',
            background: 'linear-gradient(135deg, rgba(91,138,245,0.12) 0%, rgba(167,139,250,0.12) 100%)',
            border: '1px solid rgba(167,139,250,0.2)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(167,139,250,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
            <h2 className="text-display" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', marginBottom: 16 }}>Mulai jualan sekarang</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
              Gratis, tanpa kartu kredit, tanpa coding. Toko onlinemu siap dalam 5 menit.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Buat Toko Gratis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--glass-border)',
        padding: '32px 24px',
        color: 'var(--text-tertiary)', fontSize: '0.82rem',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <span style={{
              fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
              fontWeight: 800, fontSize: '1rem', color: '#ffffff', letterSpacing: '-0.02em',
            }}>exora</span>
          </div>
          <p>© 2025 Exora. Platform toko online Indonesia.</p>
        </div>
      </footer>
    </div>
  )
}
