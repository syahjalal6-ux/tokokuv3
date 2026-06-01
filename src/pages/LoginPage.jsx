import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'
import { CONFIG } from '../lib/config.js'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"

const ExoraIcon = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGradLogin" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGradLogin)" />
  </svg>
)

export default function LoginPage() {
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const btnRef = useRef(null)

  useEffect(() => {
    const scriptId = 'google-gsi'
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script')
      s.id = scriptId
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.defer = true
      s.onload = initGoogle
      document.head.appendChild(s)
    } else {
      initGoogle()
    }
  }, [])

  function initGoogle() {
    if (!window.google) return
    window.google.accounts.id.initialize({
      client_id: CONFIG.GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    })
    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 280,
      })
    }
  }

  async function handleCredential(response) {
    setLoading(true)
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      await loginWithGoogle({
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        sub: payload.sub,
      })
      toast.success(`Selamat datang, ${payload.name.split(' ')[0]}! 👋`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Login gagal, coba lagi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      fontFamily: PJS,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        animation: 'fadeInScale 0.4s ease',
      }}>
        {/* Card */}
        <div className="glass-card" style={{ padding: '48px 40px', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{
            width: 64, height: 64, borderRadius: '20px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 0 40px rgba(91,138,245,0.2)',
          }}>
            <ExoraIcon />
          </div>

          <h1 style={{ fontFamily: PJS, fontWeight: 800, fontSize: '1.6rem', marginBottom: 8 }}>
            Masuk ke exora
          </h1>
          <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 36, lineHeight: 1.6 }}>
            Login dengan akun Google untuk mulai membuka toko online kamu
          </p>

          {/* Google button */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div className="spinner" />
              <p style={{ fontFamily: PJS, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memproses login...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
              <div ref={btnRef} />
            </div>
          )}

          <div className="divider" style={{ margin: '28px 0' }} />

          <p style={{ fontFamily: PJS, color: 'var(--text-tertiary)', fontSize: '0.78rem', lineHeight: 1.6 }}>
            Dengan melanjutkan, kamu menyetujui syarat penggunaan exora.
            Data kamu aman dan tidak disebarkan.
          </p>
        </div>

        {/* Back link */}
        <p style={{ fontFamily: PJS, textAlign: 'center', marginTop: 20, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: 'var(--text-secondary)' }}>← Kembali ke beranda</a>
        </p>
      </div>
    </div>
  )
}
