import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexDirection: 'column', gap: '16px',
      padding: '24px', textAlign: 'center',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(5rem, 20vw, 9rem)', color: 'var(--text-tertiary)', lineHeight: 1, letterSpacing: '-0.05em' }}>
        404
      </p>
      <h1 className="text-heading" style={{ fontSize: '1.4rem', marginBottom: 4 }}>Halaman tidak ditemukan</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 320, marginBottom: 24 }}>
        Halaman yang kamu cari tidak ada atau sudah dipindahkan.
      </p>
      <Link to="/" className="btn btn-primary">
        <ArrowLeft size={15} /> Kembali ke Beranda
      </Link>
    </div>
  )
}
