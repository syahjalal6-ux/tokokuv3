import React, { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store.js'

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
        width: 48,
        height: 48,
        borderRadius: '14px',
        background: 'var(--accent-gradient)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '22px',
        fontWeight: 800,
        color: '#fff',
        fontFamily: 'var(--font-display)',
        boxShadow: '0 0 40px rgba(91,138,245,0.4)',
        animation: 'pulse 1.5s ease-in-out infinite',
      }}>T</div>
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

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
