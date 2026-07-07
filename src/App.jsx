import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './lib/store.js'
import AdminGuard, { isAdminEmail } from './lib/AdminGuard.jsx'
import InstallPrompt from './components/InstallPrompt.jsx'
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
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import RedirectResi from './pages/RedirectResi.jsx'
import StreamPage from './components/seller/StreamPage.jsx' 
import ShowcasePage from './pages/ShowcasePage.jsx'
import LivePage from './pages/LivePage.jsx'
import LiveViewerPage from './pages/LiveViewerPage.jsx'

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
  const { isAuthenticated, isLoading, user } = useAuthStore()
  if (isLoading) return <AppLoader />
  if (isAuthenticated) {
    // Admin gak perlu ke /dashboard (yang minta bikin toko dulu)
    return <Navigate to={isAdminEmail(user?.email) ? '/admin' : '/dashboard'} replace />
  }
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

// PageWrapper untuk animasi transisi halaman
function PageWrapper({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const init = useAuthStore(s => s.init)
  const location = useLocation()

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
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
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/" element={<PageWrapper><LandingPage /></PageWrapper>} />
          <Route path="/login" element={<PublicRoute><PageWrapper><LoginPage /></PageWrapper></PublicRoute>} />

          {/* Redirect resi → toko */}
          <Route path="/r/:resi" element={<PageWrapper><RedirectResi /></PageWrapper>} />

          {/* Storefront publik */}
          <Route path="/showcase" element={<PageWrapper><ShowcasePage /></PageWrapper>} />
          <Route path="/:slug" element={<PageWrapper><StorefrontPage /></PageWrapper>} />

          {/* Private (seller) */}
          <Route path="/dashboard" element={<PrivateRoute><PageWrapper><DashboardPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/produk" element={<PrivateRoute><PageWrapper><ProdukPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/pesanan" element={<PrivateRoute><PageWrapper><PesananPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/stream" element={<PrivateRoute><PageWrapper><StreamPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/analytics" element={<PrivateRoute><PageWrapper><AnalyticsPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/settings" element={<PrivateRoute><PageWrapper><SettingsPage /></PageWrapper></PrivateRoute>} />
          <Route path="/dashboard/live" element={<PrivateRoute><PageWrapper><LivePage /></PageWrapper></PrivateRoute>} />
          <Route path="/:slug/live" element={<PageWrapper><LiveViewerPage /></PageWrapper>} />
          <Route path="/dashboard/upgrade" element={<PrivateRoute><PageWrapper><UpgradePage /></PageWrapper></PrivateRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<AdminGuard><PageWrapper><AdminPage /></PageWrapper></AdminGuard>} />

          {/* 404 */}
          <Route path="*" element={<PageWrapper><NotFoundPage /></PageWrapper>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}
