import React from 'react'
import Sidebar from './Sidebar.jsx'

export default function DashboardLayout({ children, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {/* Main content */}
      <main style={{
        flex: 1,
        marginLeft: 240,
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Page header */}
        {(title || actions) && (
          <div style={{
            padding: '32px 40px 0',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
            gap: '16px',
          }}>
            <div>
              {title && (
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: '1.6rem', letterSpacing: '-0.03em', marginBottom: '4px',
                }}>
                  {title}
                </h1>
              )}
              {subtitle && (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {actions && (
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0, marginTop: '4px' }}>
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px 40px 48px', flex: 1 }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; padding-top: 60px; }
          main > div:first-child { padding: 20px 16px 0 !important; }
          main > div:last-child { padding: 16px 16px 48px !important; }
          #mobile-topbar { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
