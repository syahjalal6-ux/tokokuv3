import React from 'react'
import Sidebar from './Sidebar.jsx'

export default function DashboardLayout({ children, title, subtitle, actions }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {/* Main content */}
      <main className="dashboard-main">
        {/* Page header */}
        {(title || actions) && (
          <div className="dashboard-header">
            <div>
              {title && (
                <h1 style={{
                  fontFamily: 'var(--font-display)', fontWeight: 800,
                  fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                  letterSpacing: '-0.03em', marginBottom: '4px',
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
              <div style={{ display: 'flex', gap: '10px', flexShrink: 0, flexWrap: 'wrap', marginTop: '4px' }}>
                {actions}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="dashboard-content">
          {children}
        </div>
      </main>

      <style>{`
        .dashboard-main {
          flex: 1;
          margin-left: 240px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        .dashboard-header {
          padding: 32px 40px 0;
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .dashboard-content {
          padding: 24px 40px 48px;
          flex: 1;
        }

        @media (max-width: 768px) {
          .dashboard-main {
            margin-left: 0;
            padding-top: 60px;
          }
          .dashboard-header {
            padding: 20px 16px 0;
          }
          .dashboard-content {
            padding: 16px 16px 80px;
          }
        }
      `}</style>
    </div>
  )
}
