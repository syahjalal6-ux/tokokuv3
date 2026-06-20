import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowRight, Package, MessageCircle, Zap, Check, Store, 
  BarChart2, Shield, Star, ChevronDown, Music, Megaphone, Bot 
} from 'lucide-react'
import { PLAN_FEATURES, CONFIG } from '../lib/config.js'

const FEATURES = [
  { icon: Store, title: 'Toko Online Instan', desc: 'Buat toko dalam hitungan menit, tanpa coding. Langsung online dan siap menerima pesanan.' },
  { icon: MessageCircle, title: 'Checkout via WhatsApp', desc: 'Buyer langsung chat WA kamu. Tidak perlu payment gateway rumit.' },
  { icon: Package, title: 'Manajemen Produk', desc: 'Upload hingga 2 foto per produk, atur harga, stok, diskon, dan kategori dengan mudah. Upgrade Pro untuk foto unlimited.' },
  { icon: Music, title: 'Musik Toko', desc: 'Pasang latar musik di tokomu untuk memberikan pengalaman belanja yang lebih hidup dan unik.' },
  { icon: Megaphone, title: 'Pengumuman Toko', desc: 'Tampilkan banner pengumuman, info diskon, atau jadwal operasional toko di bagian atas.' },
  { icon: Bot, title: 'Asisten AI', desc: 'AI menjawab pertanyaan pembeli otomatis 24/7. Isi bank data toko sekali, AI sisanya.' },
  { icon: BarChart2, title: 'Analytics (Pro)', desc: 'Pantau performa toko, produk terlaris, dan tren penjualan.' },
  { icon: Shield, title: 'Aman & Terpercaya', desc: 'Login dengan Google, data tersimpan aman di infrastruktur Google.' },
  { icon: Zap, title: 'Gratis Selamanya', desc: 'Paket gratis tanpa batas waktu. Upgrade kalau butuh lebih.' },
]

const TESTIMONIALS = [
  { name: 'Rina S.', toko: 'Rina Handmade', text: 'Buka toko online jadi gampang banget! Langsung jalan dalam 10 menit.', stars: 5, img: '/rina2.png' },
  { name: 'Budi W.', toko: 'BudiSnack', text: 'Pesanan masuk lewat WA, gampang banget kelolanya. Recommended!', stars: 5, img: '/budi.png' },
  { name: 'Sari M.', toko: 'Sari Beauty', text: 'Desainnya keren, pembeli saya bilang toko saya keliatan profesional.', stars: 5, img: '/sari.png' },
]

const FAQ = [
  { q: 'Apakah benar-benar gratis?', a: 'Ya! Paket gratis tidak ada batas waktu. Kamu bisa buka toko dan jual hingga 25 produk tanpa biaya apapun.' },
  { q: 'Bagaimana cara checkout pembeli?', a: 'Pembeli klik tombol "Beli via WhatsApp" di toko kamu, lalu akan diarahkan ke chat WA kamu dengan pesan otomatis berisi detail pesanan.' },
  { q: 'Asisten AI itu apa?', a: 'Fitur cerdas yang otomatis menjawab pertanyaan calon pembeli mengenai produk atau tokomu selama 24/7 berdasarkan bank data yang sudah kamu siapkan.' },
  { q: 'Foto produk disimpan di mana?', a: 'Foto disimpan di Supabase Storage (cloud milik Exora), sehingga kamu tidak perlu punya hosting sendiri.' },
  { q: 'Bagaimana cara upgrade ke Pro?', a: `Klik tombol Upgrade di dashboard, kamu akan diarahkan ke WhatsApp admin untuk konfirmasi pembayaran. Harga: ${CONFIG.PRO_PRICE}.` },
]

const FOUNDER_SLOTS_TOTAL = 20
const FOUNDER_SLOTS_TAKEN = 3
const FOUNDER_SLOTS_LEFT = FOUNDER_SLOTS_TOTAL - FOUNDER_SLOTS_TAKEN

const ExoraIcon = () => (
  <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#0C447C" />
        <stop offset="50%" stopColor="#185FA5" />
        <stop offset="100%" stopColor="#378ADD" />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGrad)" />
  </svg>
)

const PJS = "'Plus Jakarta Sans', sans-serif"

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <div style={{ minHeight: '100vh', fontFamily: PJS, background: '#ffffff' }}>
      <style>{`
        .landing-body-text { text-align: left; }
        .landing-center { text-align: center; }
        .btn-primary {
          background: linear-gradient(90deg, #0C447C, #378ADD) !important;
          color: #ffffff !important;
          border: none !important;
        }
        .btn-secondary {
          background: #ffffff !important;
          color: #1a1a1a !important;
          border: 1px solid #e2e2e2 !important;
        }
        .btn-ghost {
          color: #1a1a1a !important;
        }
        .glass-card {
          background: #ffffff !important;
          border: 1px solid #ececec !important;
        }
        @media (max-width: 600px) {
          .section-pad { padding-top: 48px !important; padding-bottom: 48px !important; }
          .hero-pad { padding-top: 110px !important; padding-bottom: 24px !important; }
          .cta-pad { padding: 36px 20px !important; }
          .heading-sm { font-size: 1.5rem !important; }
          .heading-display { font-size: 1.7rem !important; white-space: normal !important; }
        }
      `}</style>

      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px',
        background: scrolled ? 'rgba(255,255,255,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid #ececec' : '1px solid transparent',
        transition: 'all 0.3s ease',
        height: 64,
        display: 'flex', alignItems: 'center',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.15rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>exora</span>
              <span style={{
                fontFamily: PJS, fontWeight: 600, fontSize: '0.6rem',
                color: '#0C447C',
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
      <section className="hero-pad" style={{ paddingTop: 140, paddingBottom: 24, textAlign: 'center', position: 'relative' }}>
        <div className="container-sm" style={{ animation: 'fadeIn 0.7s ease' }}>

          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            padding: '8px 18px', borderRadius: 'var(--radius-full)',
            background: 'rgba(55,138,221,0.1)',
            border: '1px solid rgba(55,138,221,0.3)',
            marginBottom: '24px', gap: 2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={13} color="#0C447C" />
              <span style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: '#0C447C', letterSpacing: '0.04em' }}>
                GRATIS • TANPA CODING
              </span>
            </div>
            <span style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: '#0C447C', letterSpacing: '0.04em' }}>
              LANGSUNG ONLINE
            </span>
          </div>

          <h1 style={{
            fontFamily: PJS, fontWeight: 800,
            fontSize: 'clamp(5rem, 16vw, 9rem)',
            marginBottom: '4px', letterSpacing: '-0.05em',
            color: '#1a1a1a', lineHeight: 1,
          }}>exora</h1>

          <p style={{
            fontFamily: PJS, fontSize: 'clamp(1rem, 2.5vw, 1.4rem)', fontWeight: 700,
            color: '#0C447C',
            marginBottom: '12px',
          }}>Start. Sell. Scale.</p>

          <p style={{
            fontFamily: PJS, fontSize: 'clamp(0.95rem, 2vw, 1.1rem)',
            color: '#4a4a4a', lineHeight: 1.6, marginBottom: '36px',
            maxWidth: 420, margin: '0 auto 36px',
            textAlign: 'center',
          }}>WebApp Toko + AI Assistant + WA Checkout</p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/login" className="btn btn-primary btn-lg">
              Buka Toko Gratis <ArrowRight size={16} />
            </Link>
            <a href="#fitur" className="btn btn-secondary btn-lg">Lihat Fitur</a>
          </div>

          <div style={{ marginTop: 40, display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { val: '20+', label: 'Toko Aktif' },
              { val: '100+', label: 'Produk Terjual' },
              { val: '4.9/5', label: 'Rating Seller' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: 'clamp(1.4rem, 3vw, 2rem)', color: '#1a1a1a' }}>{s.val}</p>
                <p style={{ fontFamily: PJS, fontSize: '0.8rem', color: '#8a8a8a' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Browser Mockup */}
        <div style={{ marginTop: 24, padding: '0 16px' }}>
          <div style={{
            maxWidth: 800, margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(55,138,221,0.12) 0%, rgba(12,68,124,0.08) 100%)',
            border: '1px solid #ececec',
            borderRadius: 'var(--radius-2xl)', padding: '3px',
            boxShadow: '0 30px 80px rgba(12,68,124,0.12)',
          }}>
            <div style={{ background: '#ffffff', borderRadius: 'calc(var(--radius-2xl) - 3px)', overflow: 'hidden' }}>
              <div style={{ background: '#f7f7f7', borderBottom: '1px solid #ececec', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {['#f87171', '#fbbf24', '#34d399'].map(c => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
                  ))}
                </div>
                <div style={{
                  flex: 1, maxWidth: 300, margin: '0 auto',
                  background: '#ffffff', border: '1px solid #ececec',
                  borderRadius: 'var(--radius-full)', padding: '4px 12px',
                  fontSize: '0.72rem', color: '#8a8a8a', textAlign: 'center', fontFamily: PJS,
                }}>exora.app/toko/rina-handmade</div>
              </div>
              <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 20 }}>
                  <img src="/rina.png" alt="Rina Handmade" style={{ width: 44, height: 44, borderRadius: '12px', objectFit: 'cover' }} />
                  <div>
                    <p style={{ fontFamily: PJS, fontWeight: 800, color: '#1a1a1a' }}>Rina Handmade</p>
                    <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: '#8a8a8a' }}>✨ Produk handmade berkualitas</p>
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
                      <div style={{ height: 80, overflow: 'hidden', background: '#f0f0f0' }}>
                        <img src={p.img} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ padding: '10px' }}>
                        <p style={{ fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, marginBottom: 3, color: '#1a1a1a' }}>{p.name}</p>
                        <p style={{ fontFamily: PJS, fontSize: '0.7rem', color: '#0C447C', fontWeight: 800 }}>{p.price}</p>
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
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: '#1a1a1a' }}>
              Semua yang kamu butuhkan
            </h2>
            <p style={{ fontFamily: PJS, color: '#6a6a6a', textAlign: 'center' }}>
              Fitur lengkap, gratis, tanpa ribet.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {FEATURES.map(f => (
              <div key={f.title} className="glass-card" style={{ padding: '24px' }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--radius-md)',
                  background: 'rgba(55,138,221,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 14, color: '#0C447C',
                }}>
                  <f.icon size={20} />
                </div>
                <h3 style={{ fontFamily: PJS, fontWeight: 700, fontSize: '1rem', marginBottom: 6, color: '#1a1a1a' }}>{f.title}</h3>
                <p className="landing-body-text" style={{ fontFamily: PJS, color: '#6a6a6a', fontSize: '0.875rem', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="section-pad" style={{ padding: '64px 0' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 8, color: '#1a1a1a' }}>
              Harga yang jelas
            </h2>
            <p style={{ fontFamily: PJS, color: '#6a6a6a', textAlign: 'center' }}>Mulai gratis, upgrade kalau butuh lebih.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', maxWidth: 720, margin: '0 auto' }}>

            {/* Free */}
            <div className="glass-card" style={{ padding: '28px' }}>
              <span className="badge badge-free" style={{ marginBottom: 14 }}>Gratis</span>
              <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2.2rem', marginBottom: 4, color: '#1a1a1a' }}>Rp 0</p>
              <p style={{ fontFamily: PJS, color: '#8a8a8a', fontSize: '0.85rem', marginBottom: 20 }}>Selamanya</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 24 }}>
                {[
                  'Maksimal 25 Produk',
                  'Upload Maksimal 2 Foto per Produk',
                  'Fitur Musik Toko',
                  'Fitur Pengumuman Toko',
                  'Asisten AI (basic)',
                  'Subdomain exora.app/toko/namamu',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: PJS, fontSize: '0.875rem', color: '#4a4a4a', textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>
              <Link to="/login" className="btn btn-secondary" style={{ width: '100%' }}>Mulai Gratis</Link>
            </div>

            {/* Pro */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(55,138,221,0.08) 0%, rgba(12,68,124,0.06) 100%)',
              border: '1px solid rgba(55,138,221,0.35)',
              borderRadius: 'var(--radius-xl)', padding: '28px',
              boxShadow: '0 8px 30px rgba(12,68,124,0.1)',
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, background: 'radial-gradient(circle, rgba(55,138,221,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.35)',
                borderRadius: 'var(--radius-full)', padding: '3px 10px',
                marginBottom: 10,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d97706', animation: 'pulse 1.5s infinite' }} />
                <span style={{ fontFamily: PJS, fontSize: '0.72rem', fontWeight: 700, color: '#92400e' }}>
                  🔥 {FOUNDER_SLOTS_LEFT} dari {FOUNDER_SLOTS_TOTAL} slot founder tersisa
                </span>
              </div>

              <span className="badge badge-pro" style={{ marginBottom: 10 }}>⭐ Pro</span>

              <p style={{ fontFamily: PJS, fontWeight: 800, fontSize: '2.2rem', marginBottom: 2, color: '#1a1a1a' }}>Rp 19.000</p>
              <p style={{ fontFamily: PJS, color: '#8a8a8a', fontSize: '0.82rem', marginBottom: 4 }}>per bulan</p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(55,138,221,0.12)', border: '1px solid rgba(55,138,221,0.3)',
                borderRadius: 'var(--radius-full)', padding: '3px 10px',
                marginBottom: 18,
              }}>
                <span style={{ fontFamily: PJS, fontSize: '0.75rem', fontWeight: 700, color: '#0C447C' }}>
                  🔒 Harga Founder — Kunci Selamanya
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: 22 }}>
                {[
                  'Semua Fitur Paket Gratis',
                  'Unlimited Produk & Foto Unlimited',
                  'Asisten AI Penuh (tanpa batas)',
                  'Statistik & Analytics Penjualan',
                  'Badge Toko PRO / Terverifikasi',
                  'Prioritas Support Admin',
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Check size={15} color="#0C447C" style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontFamily: PJS, fontSize: '0.875rem', color: '#4a4a4a', textAlign: 'left' }}>{f}</span>
                  </div>
                ))}
              </div>

              <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Kunci Harga Founder Sekarang <ArrowRight size={14} />
              </Link>

              <p style={{ fontFamily: PJS, fontSize: '0.72rem', color: '#8a8a8a', textAlign: 'center', marginTop: 10 }}>
                Setelah {FOUNDER_SLOTS_TOTAL} user, harga naik ke Rp 49.000/bulan
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad" style={{ padding: '56px 0' }}>
        <div className="container">
          <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: '#1a1a1a' }}>
            Kata mereka yang sudah pakai
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="glass-card" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: 10 }}>
                  {Array(t.stars).fill(0).map((_, i) => (
                    <Star key={i} size={14} fill="var(--warning)" color="var(--warning)" />
                  ))}
                </div>
                <p className="landing-body-text" style={{ fontFamily: PJS, color: '#1a1a1a', fontSize: '0.9rem', lineHeight: 1.65, marginBottom: 14, fontStyle: 'italic' }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={t.img} alt={t.name} style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  <div>
                    <p style={{ fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700, color: '#1a1a1a' }}>{t.name}</p>
                    <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: '#8a8a8a' }}>{t.toko}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-pad" style={{ padding: '56px 0' }}>
        <div className="container-sm">
          <h2 className="text-heading heading-sm" style={{ fontFamily: PJS, textAlign: 'center', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', marginBottom: 36, color: '#1a1a1a' }}>
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
                    background: 'transparent', border: 'none', cursor: 'pointer', color: '#1a1a1a',
                    fontFamily: PJS, fontWeight: 600, fontSize: '0.92rem', textAlign: 'left', gap: '12px',
                  }}
                >
                  {f.q}
                  <ChevronDown size={16} color="#8a8a8a" style={{ transform: openFaq === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
                </button>
                {openFaq === i && (
                  <div style={{ padding: '12px 18px 16px', borderTop: '1px solid #ececec' }}>
                    <p className="landing-body-text" style={{ fontFamily: PJS, color: '#6a6a6a', fontSize: '0.875rem', lineHeight: 1.65, margin: 0 }}>
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
            background: 'linear-gradient(135deg, rgba(55,138,221,0.08) 0%, rgba(12,68,124,0.06) 100%)',
            border: '1px solid rgba(55,138,221,0.3)',
            borderRadius: 'var(--radius-2xl)',
            boxShadow: '0 30px 70px rgba(12,68,124,0.1)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, background: 'radial-gradient(circle, rgba(55,138,221,0.12) 0%, transparent 70%)', borderRadius: '50%' }} />
            <h2 className="text-display heading-display" style={{
              fontFamily: PJS,
              fontSize: 'clamp(1.5rem, 5vw, 2.8rem)',
              marginBottom: 14,
              whiteSpace: 'nowrap',
              color: '#1a1a1a',
            }}>
              Mulai jualan sekarang
            </h2>
            <p style={{
              fontFamily: PJS, color: '#6a6a6a', marginBottom: 28,
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
      <footer style={{ borderTop: '1px solid #ececec', padding: '28px 24px', color: '#8a8a8a', fontSize: '0.82rem' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExoraIcon />
            <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1rem', color: '#1a1a1a', letterSpacing: '-0.02em' }}>exora</span>
          </div>
          <p style={{ fontFamily: PJS }}>© 2026 Exora. Platform toko online Indonesia.</p>
        </div>
      </footer>
    </div>
  )
}
