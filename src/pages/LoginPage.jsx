import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'
import { CONFIG } from '../lib/config.js'
import toast from 'react-hot-toast'

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
      // Decode JWT payload dari Google
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
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        animation: 'fadeInScale 0.4s ease',
      }}>
        {/* Card */}
        <div className="glass-card" style={{ padding: '48px 40px', textAlign: 'center' }}>
          {/* Logo */}
          <div style={{
            width: 60, height: 60, borderRadius: '18px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '26px', color: '#fff',
            margin: '0 auto 28px',
            boxShadow: '0 0 40px var(--accent-glow)',
          }}>T</div>

          <h1 className="text-heading" style={{ fontSize: '1.6rem', marginBottom: 8 }}>
            Masuk ke TokoKu
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 36, lineHeight: 1.6 }}>
            Login dengan akun Google untuk mulai membuka toko online kamu
          </p>

          {/* Google button */}
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '16px' }}>
              <div className="spinner" />
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Memproses login...</p>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', minHeight: 44 }}>
              <div ref={btnRef} />
            </div>
          )}

          <div className="divider" style={{ margin: '28px 0' }} />

          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem', lineHeight: 1.6 }}>
            Dengan melanjutkan, kamu menyetujui syarat penggunaan TokoKu.
            Data kamu aman dan tidak disebarkan.
          </p>
        </div>

        {/* Back link */}
        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
          <a href="/" style={{ color: 'var(--text-secondary)' }}>← Kembali ke beranda</a>
        </p>
      </div>
    </div>
  )
}
