import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store.js'
import AdminGuard from './lib/AdminGuard.jsx'
// Pages
import LandingPage from './pages/LandingPage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import ProdukPage from './pages/ProdukPage.jsx'
import PesananPage from './pages/PesananPage.jsx'
import SettingsPage from './pages/SettingsPage.jsx'
import UpgradePage from './pages/UpgradePage.jsx'
import StorefrontPage from './pages/StorefrontPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'
import AdminPage from './pages/AdminPage.jsx'

const ExoraIcon = () => (
  <svg width="36" height="36" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGradLoader" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGradLoader)" />
  </svg>
)

// Route Guards
function PrivateRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <AppLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthStore()
  if (isLoading) return <AppLoader />
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}
function AppLoader() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      flexDirection: 'column',
      gap: '16px',
    }}>
      <div style={{
        animation: 'pulse 1.5s ease-in-out infinite',
        filter: 'drop-shadow(0 0 20px rgba(91,138,245,0.5))',
      }}>
        <ExoraIcon />
      </div>
      <div className="spinner" />
    </div>
  )
}
export default function App() {
  const init = useAuthStore(s => s.init)
  useEffect(() => {
    init()
  }, [init])
  return (
    <BrowserRouter>
      <div className="bg-mesh">
        <div className="bg-mesh-mid" />
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'hot-toast-custom',
          duration: 3500,
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)',
            fontFamily: 'var(--font-body)',
            fontSize: '0.875rem',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        {/* Storefront publik */}
        <Route path="/toko/:slug" element={<StorefrontPage />} />
        {/* Private (seller) */}
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/dashboard/produk" element={<PrivateRoute><ProdukPage /></PrivateRoute>} />
        <Route path="/dashboard/pesanan" element={<PrivateRoute><PesananPage /></PrivateRoute>} />
        <Route path="/dashboard/settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
        <Route path="/dashboard/upgrade" element={<PrivateRoute><UpgradePage /></PrivateRoute>} />
        {/* Admin */}
        <Route path="/admin" element={<AdminGuard><AdminPage /></AdminGuard>} />
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
