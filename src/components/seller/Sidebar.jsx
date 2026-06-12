import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  Zap, ExternalLink, LogOut, Menu, X,
  Store, BarChart2, Sun, Moon
} from 'lucide-react'
import { useAuthStore, useTokoStore } from '../../lib/store.js'
import { pesananApi } from '../../lib/api.js'
import { getInitials, isPro } from '../../lib/utils.js'
import { CONFIG } from '../../lib/config.js'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"

const ExoraIcon = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="xGradSidebar" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7C3AED" />
        <stop offset="50%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#06B6D4" />
      </linearGradient>
    </defs>
    <path d="M10 10 L42 50 L10 90 H32 L50 65 L68 90 H90 L58 50 L90 10 H68 L50 35 L32 10 Z" fill="url(#xGradSidebar)" />
  </svg>
)

function getProExpiry(planExpiry) {
  if (!planExpiry) return null
  return Math.ceil((new Date(planExpiry) - new Date()) / 86400000)
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [pendingCount, setPendingCount] = useState(0)
  const { user, token, logout } = useAuthStore()
  const { toko, clear: clearToko } = useTokoStore()
  const navigate = useNavigate()

  const pro = isPro(user)
  const sisaHari = pro ? getProExpiry(user?.planExpiry) : null

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    if (token && pro) {
      pesananApi.getMine(token, 'pending')
        .then(res => setPendingCount((res.data || []).length))
        .catch(() => {})
    }
  }, [token, pro])

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  const handleLogout = async () => {
    try {
      await logout()
      clearToko()
      navigate('/login')
      toast.success('Berhasil keluar')
    } catch {
      toast.error('Gagal logout')
    }
  }

  const NAV_ITEMS = [
    { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
    { to: '/dashboard/produk', label: 'Produk', icon: Package },
    { to: '/dashboard/pesanan', label: 'Pesanan', icon: ShoppingBag, badge: pendingCount },
    { to: '/dashboard/analytics', label: 'Analitik', icon: BarChart2 },
    { to: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
  ]

  const ProExpiryBadge = () => {
    if (!pro || sisaHari === null) return null

    if (sisaHari <= 0) {
      return (
        <span style={{ fontFamily: PJS, fontSize: '0.6rem', fontWeight: 700, color: 'var(--danger)' }}>
          Expired
        </span>
      )
    }
    if (sisaHari <= 7) {
      return (
        <span style={{ fontFamily: PJS, fontSize: '0.6rem', fontWeight: 700, color: 'var(--danger)' }}>
          • ⚠️ {sisaHari}h lagi
        </span>
      )
    }
    if (sisaHari <= 30) {
      return (
        <span style={{ fontFamily: PJS, fontSize: '0.6rem', fontWeight: 600, color: 'var(--warning)' }}>
          • {sisaHari}h lagi
        </span>
      )
    }
    return (
      <span style={{ fontFamily: PJS, fontSize: '0.6rem', fontWeight: 500, color: 'var(--text-tertiary)' }}>
        • {sisaHari}h lagi
      </span>
    )
  }

  const SidebarContent = () => (
    <div style={{
      width: 240, height: '100%',
      display: 'flex', flexDirection: 'column',
      padding: '20px 12px',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--glass-border)',
    }}>
      {/* Logo */}
      <div style={{ padding: '4px 12px 20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ExoraIcon size={26} />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <span style={{
            fontFamily: PJS, fontWeight: 800, fontSize: '1.05rem',
            color: 'var(--text-primary)', letterSpacing: '-0.02em',
          }}>exora</span>
          <span style={{
            fontFamily: PJS, fontWeight: 600, fontSize: '0.55rem',
            background: 'linear-gradient(90deg, #3B82F6, #7C3AED)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.05em',
          }}>Start. Sell. Scale.</span>
        </div>
      </div>

      {/* Toko info */}
      {toko && (
        <a
          href={'/toko/' + toko.slug}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: 'var(--radius-lg)',
            background: 'var(--surface)', border: '1px solid var(--glass-border)',
            marginBottom: '16px', transition: 'all var(--transition-fast)',
            textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
        >
          <Store size={14} color="var(--text-tertiary)" />
          <span style={{ flex: 1, fontFamily: PJS, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toko.nama}
          </span>
          <ExternalLink size={12} color="var(--text-tertiary)" />
        </a>
      )}

      {/* Nav */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
        {NAV_ITEMS.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              fontFamily: PJS, fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--surface-active)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              position: 'relative',
            })}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div style={{
                    position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                    width: 3, height: 20, borderRadius: '0 2px 2px 0',
                    background: 'var(--accent-gradient)',
                  }} />
                )}
                <item.icon size={16} style={{ opacity: isActive ? 1 : 0.6 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: 'var(--danger)',
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                    padding: '1px 7px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    minWidth: 18,
                    textAlign: 'center',
                  }}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Upgrade banner (only free) */}
        {!pro && (
          <NavLink
            to="/dashboard/upgrade"
            onClick={() => setMobileOpen(false)}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: 'var(--radius-md)',
              fontFamily: PJS, fontSize: '0.875rem', fontWeight: 600,
              color: 'var(--accent-3)',
              background: isActive ? 'var(--accent-gradient-soft)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              marginTop: '8px',
            })}
          >
            <Zap size={16} />
            Upgrade Pro
            <span style={{
              marginLeft: 'auto',
              background: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: PJS,
              fontSize: '0.72rem', fontWeight: 800,
            }}>BARU</span>
          </NavLink>
        )}
      </nav>

      {/* User profile */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
          {user?.picture ? (
            <img src={user.picture} alt={user.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div className="avatar avatar-sm">{getInitials(user?.name)}</div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span className={'badge ' + (pro ? 'badge-pro' : 'badge-free')} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {pro ? '⭐ Pro' : 'Free'}
              </span>
              <ProExpiryBadge />
            </div>
          </div>
        </div>

        <button onClick={toggleTheme} className="btn btn-ghost" style={{
          width: '100%', justifyContent: 'flex-start', gap: '10px',
          padding: '8px 12px', borderRadius: 'var(--radius-md)',
          fontFamily: PJS, fontSize: '0.85rem', color: 'var(--text-tertiary)',
        }}>
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          {theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
        </button>

        <button onClick={handleLogout} className="btn btn-ghost" style={{
          width: '100%', justifyContent: 'flex-start', gap: '10px',
          padding: '8px 12px', borderRadius: 'var(--radius-md)',
          fontFamily: PJS, fontSize: '0.85rem', color: 'var(--text-tertiary)',
        }}>
          <LogOut size={15} />
          Keluar
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hide-mobile" style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}>
        <SidebarContent />
      </div>

      {/* Mobile top bar */}
      <div style={{
        display: 'none',
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '12px 16px',
        alignItems: 'center', justifyContent: 'space-between',
      }} className="flex show-mobile" id="mobile-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ExoraIcon size={22} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontFamily: PJS, fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>exora</span>
            <span style={{
              fontFamily: PJS, fontWeight: 600, fontSize: '0.5rem',
              background: 'linear-gradient(90deg, #3B82F6, #7C3AED)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.05em',
            }}>Start. Sell. Scale.</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {pendingCount > 0 && (
            <span style={{
              background: 'var(--danger)', color: '#fff',
              borderRadius: 'var(--radius-full)',
              padding: '1px 8px', fontSize: '0.7rem', fontWeight: 700,
            }}>
              {pendingCount} pesanan
            </span>
          )}
          <button onClick={() => setMobileOpen(true)} className="btn btn-ghost btn-icon btn-sm">
            <Menu size={20} />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              animation: 'slideInRight 0.25s ease',
            }}
          >
            <SidebarContent />
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'absolute', top: 12, right: 16,
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)', padding: '8px',
              color: 'var(--text-primary)', cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  )
}
