import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingBag, Settings,
  Zap, ExternalLink, LogOut, Menu, X, ChevronRight,
  Store
} from 'lucide-react'
import { useAuthStore, useTokoStore } from '../../lib/store.js'
import { getInitials, isPro } from '../../lib/utils.js'
import { CONFIG } from '../../lib/config.js'
import toast from 'react-hot-toast'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Ringkasan', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/produk', label: 'Produk', icon: Package },
  { to: '/dashboard/pesanan', label: 'Pesanan', icon: ShoppingBag },
  { to: '/dashboard/settings', label: 'Pengaturan', icon: Settings },
]

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const { toko, clear: clearToko } = useTokoStore()
  const navigate = useNavigate()

  const pro = isPro(user)

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
        <div style={{
          width: 34, height: 34, borderRadius: '10px',
          background: 'var(--accent-gradient)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', color: '#fff',
          boxShadow: '0 0 20px var(--accent-glow)',
          flexShrink: 0,
        }}>T</div>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>
          TokoKu
        </span>
      </div>

      {/* Toko info */}
      {toko && (
        <a
          href={`/toko/${toko.slug}`}
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
          <span style={{ flex: 1, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              fontSize: '0.875rem', fontWeight: isActive ? 600 : 500,
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
                {item.label}
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
              fontSize: '0.875rem', fontWeight: 600,
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
              fontSize: '0.72rem', fontWeight: 800,
            }}>BARU</span>
          </NavLink>
        )}
      </nav>

      {/* User profile */}
      <div style={{
        borderTop: '1px solid var(--glass-border)',
        paddingTop: '16px', marginTop: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', marginBottom: '4px' }}>
          {user?.picture ? (
            <img src={user.picture} alt={user.name}
              style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div className="avatar avatar-sm">{getInitials(user?.name)}</div>
          )}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span className={`badge ${pro ? 'badge-pro' : 'badge-free'}`} style={{ fontSize: '0.65rem', padding: '1px 6px' }}>
                {pro ? '⭐ Pro' : 'Free'}
              </span>
            </div>
          </div>
        </div>

        <button onClick={handleLogout} className="btn btn-ghost" style={{
          width: '100%', justifyContent: 'flex-start', gap: '10px',
          padding: '8px 12px', borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
          color: 'var(--text-tertiary)',
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
          <div style={{
            width: 28, height: 28, borderRadius: '8px',
            background: 'var(--accent-gradient)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '13px', color: '#fff',
          }}>T</div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>TokoKu</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="btn btn-ghost btn-icon btn-sm">
          <Menu size={20} />
        </button>
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
