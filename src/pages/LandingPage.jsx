import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Package, MessageCircle, Zap, Check, Store,
  BarChart2, Shield, ChevronDown, Music, Megaphone, Bot, Sun, Moon
} from 'lucide-react'
import { PLAN_FEATURES, CONFIG } from '../lib/config.js'
import { useTheme } from '../lib/useTheme.js'

const FEATURES = [
  { icon: Store, title: 'Toko Online Instan', desc: 'Buat toko dalam hitungan menit, tanpa coding. Langsung online dan siap menerima pesanan.' },
  { icon: MessageCircle, title: 'Checkout via WhatsApp', desc: 'Buyer langsung chat WA kamu. Tidak perlu payment gateway rumit.' },
  { icon: Package, title: 'Manajemen Produk', desc: 'Upload hingga 2 foto per produk, atur harga, stok, diskon, dan kategori dengan mudah. Upgrade Pro untuk foto unlimited.' },
  { icon: Music, title: 'Musik Toko', desc: 'Pasang latar musik di tokomu untuk memberikan pengalaman belanja yang lebih hidup dan unik.' },
  { icon: Megaphone, title: 'Pengumuman Toko', desc: 'Tampilkan pengumuman teks, audio, atau video YouTube di tokomu — info diskon, jadwal operasional, atau promosi lainnya.' },
  { icon: Bot, title: 'Asisten AI', desc: '3 AI siap bantu: jawab pertanyaan pembeli di tokomu, kasih insight performa otomatis di Analitik, dan bantu buyer cari produk di Showcase.' },
  { icon: BarChart2, title: 'Analytics (Pro)', desc: 'Bukan cuma grafik — AI kasih insight otomatis: produk terlaris, tren revenue, saran naikin penjualan.' },
  { icon: Shield, title: 'Aman & Terpercaya', desc: 'Login dengan Google, data tersimpan aman di infrastruktur Google.' },
  { icon: Zap, title: 'Gratis Selamanya', desc: 'Paket gratis tanpa batas waktu. Upgrade kalau butuh lebih.' },
]

const WHY_EXORA = [
  { icon: Zap, text: 'Toko jadi sendiri hari ini, tanpa nunggu developer.' },
  { icon: MessageCircle, text: 'Checkout langsung masuk WA-mu — nggak perlu belajar dashboard rumit.' },
  { icon: Bot, text: 'AI jawab pertanyaan pembeli otomatis, walau kamu lagi sibuk packing.' },
]

const FAQ = [
  { q: 'Apakah benar-benar gratis?', a: 'Ya! Paket gratis tidak ada batas waktu. Kamu bisa buka toko dan jual hingga 25 produk tanpa biaya apapun.' },
  { q: 'Bagaimana cara checkout pembeli?', a: 'Pembeli klik tombol "Beli via WhatsApp" di toko kamu, lalu akan diarahkan ke chat WA kamu dengan pesan otomatis berisi detail pesanan.' },
  { q: 'Asisten AI itu apa?', a: 'Ada 3: Asisten di tokomu jawab pertanyaan pembeli soal produk. Asisten Aira kasih insight otomatis di Analitik. Asisten Showcase bantu buyer cari produk/toko yang mereka mau.' },
  { q: 'Foto produk disimpan di mana?', a: 'Foto disimpan di Supabase Storage (cloud milik Exora), sehingga kamu tidak perlu punya hosting sendiri.' },
  { q: 'Bagaimana cara upgrade ke Pro?', a: `Klik tombol Upgrade di dashboard, kamu akan diarahkan ke WhatsApp admin untuk konfirmasi pembayaran. Harga: ${CONFIG.PRO_PRICE}.` },
  { q: 'Apa itu Stream?', a: 'Tempat seller saling posting produk baru, cari reseller, atau tukar info supplier dengan seller lain di Exora. Bisa publik (buyer non-login bisa lihat) atau khusus sesama seller.' },
]

const FOUNDER_SLOTS_TOTAL = 20

const NAVY = '#0C447C'
const MID = '#185FA5'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

// Theme tokens — kept in lockstep with ShowcasePage.jsx's THEMES object.
const THEMES = {
  light: {
    bgPage: '#ffffff',
    bgNav: 'rgba(255,255,255,0.85)',
    bgNavScrolled: 'rgba(255,255,255,0.85)',
    bgSurface: '#f7f7f7',
    bgCard: '#ffffff',
    border: '#ececec',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#6a6a6a',
    textMuted: '#8a8a8a',
    accentSoftBg: 'rgba(55,138,221,0.1)',
    accentSoftBorder: 'rgba(55,138,221,0.3)',
    accentGlow1: 'rgba(55,138,221,0.12)',
    accentGlow2: 'rgba(12,68,124,0.08)',
    proGlowBg: 'rgba(251,191,36,0.15)',
    proGlowBorder: 'rgba(251,191,36,0.35)',
    proGlowText: '#92400e',
    shadowColored: '0 30px 80px rgba(12,68,124,0.12)',
    btnSecondaryBg: '#ffffff',
    btnSecondaryBorder: '#e2e2e2',
    btnSecondaryText: '#1a1a1a',
    iconBg: 'rgba(55,138,221,0.1)',
    pricingProBg: 'linear-gradient(135deg, rgba(55,138,221,0.08) 0%, rgba(12,68,124,0.06) 100%)',
    pricingProBorder: 'rgba(55,138,221,0.35)',
    chromeBg: '#f7f7f7',
  },
  dark: {
    bgPage: '#0b0b10',
    bgNav: 'rgba(11,11,16,0.85)',
    bgNavScrolled: 'rgba(11,11,16,0.85)',
    bgSurface: '#15151c',
    bgCard: '#15151c',
    border: 'rgba(255,255,255,0.08)',
    textPrimary: '#f5f5f7',
    textSecondary: '#c2c2c8',
    textTertiary: '#9a9aa4',
    textMuted: '#7a7a85',
    accentSoftBg: 'rgba(55,138,221,0.16)',
    accentSoftBorder: 'rgba(55,138,221,0.35)',
    accentGlow1: 'rgba(55,138,221,0.18)',
    accentGlow2: 'rgba(55,138,221,0.08)',
    proGlowBg: 'rgba(251,191,36,0.18)',
    proGlowBorder: 'rgba(251,191,36,0.4)',
    proGlowText: '#fbbf24',
    shadowColored: '0 30px 80px rgba(55,138,221,0.18)',
    btnSecondaryBg: '#15151c',
    btnSecondaryBorder: 'rgba(255,255,255,0.12)',
    btnSecondaryText: '#f5f5f7',
    iconBg: 'rgba(55,138,221,0.16)',
    pricingProBg: 'linear-gradient(135deg, rgba(55,138,221,0.16) 0%, rgba(55,138,221,0.06) 100%)',
    pricingProBorder: 'rgba(55,138,221,0.4)',
    chromeBg: '#1a1a22',
  },
}

const ExoraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={NAVY} />
        <stop offset="50%" stopColor={MID} />
        <stop offset="100%" stopColor={BLUE} />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGrad)" />
  </svg>
)

const PJS = "'Plus Jakarta Sans', sans-serif"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const c = THEMES[theme]
  const accent = theme === 'light' ? NAVY : BLUE

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ minHeight: '100vh', fontFamily: PJS, background: c.bgPage, transition: 'background 0.25s ease' }}>
      <style>{`
        .landing-body-text { text-align: left; }
        .landing-center { text-align: center; }
        .btn-primary {
          background: ${ACCENT_GRADIENT} !important;
          color: #ffffff !important;
          border: none !important;
        }
        .btn-secondary {
          background: ${c.btnSecondaryBg} !important;
          color: ${c.btnSecondaryText} !important;
          border: 1px solid ${c.btnSecondaryBorder} !important;
        }
        .btn-ghost {
          color: ${c.textPrimary} !important;
        }
        .glass-card {
          background: ${c.bgCard} !important;
          border: 1px solid ${c.border} !important;
        }
        .theme-toggle-btn:hover { transform: scale(1.06); }
        @media (max-width: 600px) {
          .section-pad { padding-top: 48px !important; padding-bottom: 48px !important; }
          .hero-pad { padding-top: 110px !important; padding-bottom: 24px !important; }
          .cta-pad { padding: 36px 20px !important; }
          .heading-sm { font-size: 1.5rem !important; }
          .heading-display { font-size: 1.7rem !important; white-space: normal !important; }
          .nav-cta-primary { display: none !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? c.bgNavScrolled : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? `1px solid ${c.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        height: 64,
        display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.3rem', color: c.textPrimary, letterSpacing: '0' }}>EXORA</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Ganti ke tema gelap' : 'Ganti ke tema terang'}
              title={theme === 'light' ? 'Tema gelap' : 'Tema terang'}
              style={{
                width: 32, height: 32, borderRadius: '50%', border: `1px solid ${c.border}`,
                background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: c.textSecondary, transition: 'transform 0.15s ease',
              }}
            >
              {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            </button>
            <Link to="/showcase" className="btn btn-ghost btn-sm ">Lihat Produk</Link>
            <Link to="/login" className="btn btn-ghost btn-sm hide-mobile">Masuk</Link>
            <Link to="/login" className="btn btn-primary btn-sm nav-cta-primary">
              Buka Toko Gratis
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-pad" style={{ paddingTop: 140, paddingBottom: 24, textAlign: 'center', position: 'relative' }}>
        <div className="container-sm" style={{ animation: 'fadeIn 0.7s ease' }}>

          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 18px', borderRadius: 'var(--radius-full)',
            background: c.accentSoftBg,
            border: `1px solid ${c.accentSoftBorder}`,
            marginBottom: '24px', gap: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color={accent} />
              <span style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>
                GRATIS • TANPA CODING
              </span>
            </div>
            <span style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: accent, letterSpacing: '0.04em' }}>
              LANGSUNG ONLINE
            </span>
          </div>

          <h1 style={{
            fontFamily: PJS, fontWeight: 800,
            fontSize: 'clamp(5rem, 16vw, 9rem)',
            marginBottom: '4px', letterSpacing: '-0.01em',
            color: c.textPrimary, lineHeight: 1,
          }}>EXORA</h1>

          <p style={{
            fontFamily: PJS, fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 700,
            color: accent,
            marginBottom: '12px',
          }}>Start. Sell. Scale.</p>

          <p style={{
            fontFamily: PJS, fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: c.textTertiary, lineHeight: 1.6, marginBottom: '36px',
            maxWidth: 420, margin: '0 auto 36px',
            textAlign: 'center',
          }}>WebApp Toko + AI Assistant + WA Checkout</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Buka Toko Gratis <ArrowRight size={16} />
            </Link>
            <a href="#fitur" className="btn btn-secondary btn-lg">Lihat Fitur</a>
          </div>

          <p style={{
            fontFamily: PJS, fontSize: 'clamp(0.95rem, 2vw, 1.05rem)',
            color: c.textMuted, marginTop: 40,
            maxWidth: 380, margin: '40px auto 0',
            textAlign: 'center',
          }}>Baru diluncurkan — jadi salah satu seller pertama yang ngebentuk Exora dari awal.</p>
        </div>

        {/* Browser Mockup */}
        <div style={{ marginTop: 24, padding: '0 16px' }}>
          <div style={{
            maxWidth: 800, margin: '0 auto',
            background: `linear-gradient(135deg, ${c.accentGlow1} 0%, ${c.accentGlow2} 100%)`,
            border: `1px solid ${c.border}`,
            borderRadius: 'var(--radius-2xl)', padding: '3px',
            boxShadow: c.shadowColored,
          }}>
            <div style={{ background: c.bgCard, borderRadius: 'calc(var(--radius-2xl) - 3px)', overflow: 'hidden' }}>
              <div style={{ background: c.chromeBg, borderBottom: `1px solid ${c.border}`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#f87171', '#fbbf24', '#34d399'].map(cc => (
                    <div key={cc} style={{ width: 10, height: 10, borderRadius: '50%', background: cc, opacity: 0.8 }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, maxWidth: 300, margin: '0 auto',
                  background: c.bgCard, border: `1px solid ${c.border}`,
                  borderRadius: 'var(--radius-full)', padding: '4px 12px',
                  fontSize: '0.72rem', color: c.textMuted, textAlign: 'center', fontFamily: PJS,
                }}>exora.app/toko/rina-handmade</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 20 }}>
                  <img src="/rina.png" alt="Rina Handmade" style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontFamily: PJS, fontWeight: 800, color: c.textPrimary }}>Rina Handmade</p>
                    <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: c.textMuted }}>✨ Produk handmade berkualitas</p>
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
                      <div style={{ height: 80, overflow: 'hidden', background: c.bgSurface }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{ fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, marginBottom: 3, color: c.textPrimary }}>{p.name}</p>
                        <p style={{ fontFamily: PJS, fontSize: '0.7rem', color: accent, fontWeight: 800 }}>{p.price}</p>
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
      <section id="fitur" className="section-pad" style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: c.textPrimary }}>
              Semua yang kamu butuhkan
            </h2>
            <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>
              Fitur lengkap, gratis, tanpa ribet.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card" style={{ padding: '24px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, color: accent,
                }}>
                  <f.icon size={20} />
                </div>
                <h3 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: c.textPrimary }}>{f.title}</h3>
                <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="section-pad" style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: c.textPrimary }}>
              Harga yang jelas
            </h2>
            <p style={{ fontFamily: PJS, color: c.textTertiary, textAlign: 'center' }}>Mulai gratis, upgrade kalau butuh lebih.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: 720, margin: '0 auto' }}>

            {/* Free */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <span className="badge badge-free" style={{ marginBottom: 14 }}>Gratis</span>
              <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2.2rem', marginBottom: 4, color: c.textPrimary }}>Rp 0</p>
              <p style={{ fontFamily: PJS, color: c.textMuted, fontSize: '0.85rem', marginBottom: 20 }}>Selamanya</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 24 }}>
                {[
                  'Maksimal 25 Produk',
                  'Upload Maksimal 2 Foto per Produk',
                  'Fitur Musik Toko',
                  'Fitur Pengumuman Toko',
                  'Asisten AI di toko kamu',
                  'Subdomain exora.app/toko/namamu',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: PJS, fontSize: '0.875rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>Mulai Gratis</Link>
            </div>

            {/* Pro */}
            <div style={{
              background: c.pricingProBg,
              border: `1px solid ${c.pricingProBorder}`,
              borderRadius: 'var(--radius-xl)', padding: '28px',
              boxShadow: c.shadowColored,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: `radial-gradient(circle, ${c.accentGlow1} 0%, transparent 70%)`, borderRadius: '50%' }} />

              <span className="badge badge-pro" style={{ marginBottom: 10 }}>⭐ Pro</span>

              <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2.2rem', marginBottom: 2, color: c.textPrimary }}>Rp 49.000</p>
              <p style={{ fontFamily: PJS, color: c.textMuted, fontSize: '0.82rem', marginBottom: 4 }}>per bulan</p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: c.accentSoftBg, border: `1px solid ${c.accentSoftBorder}`,
                borderRadius: 'var(--radius-full)', padding: '3px 10px',
                marginBottom: 18,
              }}>
                <span style={{ fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, color: accent }}>
                  🔒 Harga Founder — Kunci Selamanya
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 22 }}>
                {[
                  'Semua Fitur Paket Gratis',
                  'Unlimited Produk & Foto Unlimited',
                  'Asisten Aira di Analitik',
                  'Analytics & Statistik Penjualan',
                  'Badge Toko PRO / Terverifikasi',
                  'Prioritas Support Admin',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color={accent} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: PJS, fontSize: '0.875rem', color: c.textSecondary, textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Kunci Harga Founder Sekarang <ArrowRight size={14} />
              </Link>

              <p style={{ fontFamily: PJS, fontSize: '0.72rem', color: c.textMuted, textAlign: 'center', marginTop: 10 }}>
                Setelah {FOUNDER_SLOTS_TOTAL} user, harga naik ke Rp 79.000/bulan
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Why Exora */}
      <section className="section-pad" style={{ padding: '56px 0' }}>
        <div className="container">
          <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: c.textPrimary }}>
            Kenapa seller pilih Exora
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {WHY_EXORA.map((w, i) => (
              <div key={i} className="glass-card" style={{ padding: '22px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 'var(--radius-md)',
                  background: c.iconBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, color: accent,
                }}>
                  <w.icon size={18} />
                </div>
                <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textPrimary, fontSize: '0.9rem', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>"{w.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad" style={{ padding: '56px 0' }}>
        <div className="container-sm">
          <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: c.textPrimary }}>
            Pertanyaan umum
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {FAQ.map((f, i) => (
              <div key={i} className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', padding: '16px 18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'transparent', border: 'none', cursor: 'pointer', color: c.textPrimary,
                    fontFamily: PJS, fontWeight: 600, fontSize: '0.92rem', textAlign: 'left', gap: '12px',
                  }}
                >
                  {f.q}
                  <ChevronDown size={16} color={c.textMuted} style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '12px 18px 16px', borderTop: `1px solid ${c.border}` }}>
                    <p className="landing-body-text" style={{ fontFamily: PJS, color: c.textTertiary, fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
                      {f.a}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-pad" style={{ padding: '56px 0 100px' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <div className="cta-pad" style={{
            padding: '48px 32px',
            background: c.pricingProBg,
            border: `1px solid ${c.accentSoftBorder}`,
            borderRadius: 'var(--radius-2xl)',
            boxShadow: c.shadowColored,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: `radial-gradient(circle, ${c.accentGlow1} 0%, transparent 70%)`, borderRadius: '50%' }} />
            <h2 className="text-display heading-display" style={{
              fontFamily: PJS,
              fontSize: 'clamp(1.5rem, 5vw, 2.8rem)',
              marginBottom: 14,
              whiteSpace: 'nowrap',
              color: c.textPrimary,
            }}>
              Mulai jualan sekarang
            </h2>
            <p style={{
              fontFamily: PJS, color: c.textTertiary, marginBottom: 28,
              maxWidth: 340, margin: '0 auto 28px',
              textAlign: 'center',
            }}>
              Gratis, tanpa kartu kredit, tanpa coding. Toko onlinemu siap dalam 5 menit.
            </p>
            <Link to="/login" className="btn btn-primary btn-lg">
              Buat Toko Gratis <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${c.border}`, padding: '28px 24px', color: c.textMuted, fontSize: '0.82rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1rem', color: c.textPrimary, letterSpacing: '-0.02em' }}>EXORA</span>
          </div>
          <p style={{ fontFamily: PJS }}>© 2026 Exora. Platform toko online Indonesia.</p>
        </div>
      </footer>
    </div>
  )
}
