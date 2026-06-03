import React from 'react'
import { Check, MessageCircle, Zap, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { generateUpgradeMessage, generateWALink, isPro } from '../lib/utils.js'
import { PLAN_FEATURES, CONFIG } from '../lib/config.js'

export default function UpgradePage() {
  const { user } = useAuthStore()
  const { toko } = useTokoStore()
  const pro = isPro(user)

  const waMessage = generateUpgradeMessage(user || {}, toko)
  const waLink = generateWALink(CONFIG.ADMIN_WA, waMessage)

  if (pro) {
    return (
      <DashboardLayout title="Upgrade Pro">
        <div style={{ maxWidth: 480, margin: '40px auto', textAlign: 'center', padding: '0 16px' }}>
          <div className="glass-card" style={{ padding: '48px 32px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⭐</div>
            <h2 className="text-heading" style={{ marginBottom: 12 }}>Kamu sudah Pro!</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
              Kamu sudah menikmati semua fitur Pro. Terima kasih sudah mendukung Exora!
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', marginBottom: 24 }}>
              Pro aktif hingga:{' '}
              <strong style={{ color: 'var(--text-secondary)' }}>
                {user?.planExpiry
                  ? new Date(user.planExpiry).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '-'}
              </strong>
            </p>
            <Link to="/dashboard" className="btn btn-secondary">
              <ArrowLeft size={14} /> Kembali ke Dashboard
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Upgrade ke Pro">
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        {/* Hero */}
        <div style={{
          textAlign: 'center', marginBottom: '32px',
          padding: 'clamp(24px, 4vw, 40px) clamp(16px, 4vw, 24px)',
          background: 'linear-gradient(135deg, rgba(91,138,245,0.08) 0%, rgba(167,139,250,0.08) 100%)',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid rgba(167,139,250,0.15)',
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            background: 'var(--accent-gradient-soft)',
            border: '1px solid rgba(167,139,250,0.2)',
            marginBottom: '16px',
          }}>
            <Zap size={13} color="var(--accent-3)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-3)', letterSpacing: '0.04em' }}>
              UPGRADE KE PRO
            </span>
          </div>
          <h1 className="text-display gradient-text" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.6rem)', marginBottom: 12 }}>
            Bisnis kamu layak yang terbaik
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto', lineHeight: 1.7, fontSize: 'clamp(0.85rem, 2vw, 1rem)' }}>
            Satu langkah kecil ke Pro, tapi dampaknya besar untuk bisnismu.
          </p>
        </div>

        {/* Comparison — 1 kolom di mobile, 2 kolom di desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}>
          {/* Free */}
          <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
            <span className="badge badge-free" style={{ marginBottom: 16 }}>Paket Sekarang</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 4 }}>
              Rp 0
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginBottom: 20 }}>Selamanya gratis</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 20 }}>
              {PLAN_FEATURES.free.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Check size={14} color="var(--success)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
              {PLAN_FEATURES.free.limits.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--danger)', fontSize: '0.85rem', flexShrink: 0, marginTop: 1 }}>✕</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textDecoration: 'line-through' }}>{f}</span>
                </div>
              ))}
            </div>

            <button className="btn btn-secondary" disabled style={{ width: '100%', opacity: 0.5 }}>
              Paket Aktif
            </button>
          </div>

          {/* Pro */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(91,138,245,0.12) 0%, rgba(167,139,250,0.15) 100%)',
            border: '2px solid rgba(167,139,250,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: 'clamp(20px, 4vw, 32px)',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(91,138,245,0.2)',
          }}>
            <div style={{
              position: 'absolute', top: 12, right: 12,
              background: 'var(--accent-gradient)', color: '#fff',
              fontSize: '0.7rem', fontWeight: 800,
              padding: '3px 10px', borderRadius: 'var(--radius-full)',
            }}>
              POPULER
            </div>
            <span className="badge badge-pro" style={{ marginBottom: 16 }}>⭐ Pro</span>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 4 }}>
              {CONFIG.PRO_PRICE}
            </p>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.82rem', marginBottom: 20 }}>per bulan</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: 24 }}>
              {PLAN_FEATURES.pro.features.map(f => (
                <div key={f} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <Check size={14} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f}</span>
                </div>
              ))}
            </div>

            <a
              href={waLink}
              target="_blank" rel="noreferrer"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <MessageCircle size={16} />
              Upgrade via WhatsApp
            </a>
          </div>
        </div>

        {/* How it works */}
        <div className="glass-card" style={{ padding: 'clamp(20px, 4vw, 32px)' }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '20px', textAlign: 'center', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)' }}>
            Cara upgrade
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
            {[
              { step: '1', title: 'Klik tombol upgrade', desc: 'Kamu akan diarahkan ke WhatsApp admin' },
              { step: '2', title: 'Kirim pesan', desc: 'Pesan sudah terisi otomatis, tinggal kirim' },
              { step: '3', title: 'Konfirmasi pembayaran', desc: 'Admin akan informasikan cara bayar' },
              { step: '4', title: 'Akun diaktifkan', desc: 'Fitur Pro langsung aktif setelah pembayaran' },
            ].map(s => (
              <div key={s.step} style={{ textAlign: 'center' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: 'var(--accent-gradient)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-display)', fontWeight: 800, color: '#fff',
                  margin: '0 auto 10px', fontSize: '0.9rem',
                }}>
                  {s.step}
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{s.title}</p>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <a
              href={waLink}
              target="_blank" rel="noreferrer"
              className="btn btn-primary"
              style={{ width: '100%', maxWidth: 360, justifyContent: 'center' }}
            >
              <MessageCircle size={15} />
              Upgrade Sekarang — {CONFIG.PRO_PRICE}
            </a>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
