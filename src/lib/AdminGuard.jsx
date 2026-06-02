import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../lib/store.js'
import { CONFIG } from '../lib/config.js'

// =============================================
// ADMIN GUARD
// Proteksi route /admin — hanya email admin yang boleh masuk
// =============================================

export default function AdminGuard({ children }) {
  const { user, isAuthenticated, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', flexDirection: 'column', gap: 16,
      }}>
        <div className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Memverifikasi akses...</p>
      </div>
    )
  }

  // Belum login → ke login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  // Bukan admin → ke dashboard biasa
  if (!isAdminEmail(user?.email)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

// Cek apakah email adalah admin
export function isAdminEmail(email) {
  if (!email) return false
  const adminEmail = CONFIG.ADMIN_EMAIL || import.meta.env.VITE_ADMIN_EMAIL || ''
  return email.toLowerCase() === adminEmail.toLowerCase()
}

// Hook: cek apakah user saat ini adalah admin
export function useIsAdmin() {
  const { user } = useAuthStore()
  return isAdminEmail(user?.email)
}
