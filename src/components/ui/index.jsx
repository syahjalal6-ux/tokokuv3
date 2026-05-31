import React, { useState, useRef, useEffect } from 'react'
import { clsx } from 'clsx'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'

// =============================================
// MODAL
// =============================================

export function Modal({ isOpen, onClose, title, children, size = 'md', footer }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const sizes = {
    sm: '420px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: sizes[size],
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg)',
          animation: 'fadeInScale 0.25s ease',
          overflow: 'hidden',
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid var(--glass-border)',
        }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem' }}>
            {title}
          </h3>
          <button onClick={onClose} className="btn btn-ghost btn-icon btn-sm">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--glass-border)',
            display: 'flex', gap: '10px', justifyContent: 'flex-end',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// =============================================
// CONFIRM DIALOG
// =============================================

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel = 'Hapus', danger = true, isLoading }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || 'Konfirmasi'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary" disabled={isLoading}>
            Batal
          </button>
          <button
            onClick={onConfirm}
            className={clsx('btn', danger ? 'btn-danger' : 'btn-primary')}
            disabled={isLoading}
          >
            {isLoading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Memproses...</> : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  )
}

// =============================================
// EMPTY STATE
// =============================================

export function EmptyState({ icon, title, description, action }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', textAlign: 'center', padding: '60px 24px',
      gap: '16px',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 'var(--radius-xl)',
        background: 'var(--surface)',
        border: '1px solid var(--glass-border)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', color: 'var(--text-tertiary)',
      }}>
        {icon}
      </div>
      <div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>
          {title}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: 300 }}>
          {description}
        </p>
      </div>
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}

// =============================================
// STAT CARD
// =============================================

export function StatCard({ label, value, icon, trend, color = 'var(--accent)' }) {
  return (
    <div className="glass-card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </p>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius-md)',
          background: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
      </div>
      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', lineHeight: 1 }}>
        {value}
      </p>
      {trend && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', marginTop: 6 }}>
          {trend}
        </p>
      )}
    </div>
  )
}

// =============================================
// ALERT
// =============================================

const alertConfig = {
  info: { icon: Info, color: 'var(--accent)', bg: 'rgba(91,138,245,0.1)', border: 'rgba(91,138,245,0.2)' },
  success: { icon: CheckCircle, color: 'var(--success)', bg: 'var(--success-bg)', border: 'rgba(52,211,153,0.2)' },
  warning: { icon: AlertTriangle, color: 'var(--warning)', bg: 'var(--warning-bg)', border: 'rgba(251,191,36,0.2)' },
  danger: { icon: AlertCircle, color: 'var(--danger)', bg: 'var(--danger-bg)', border: 'rgba(248,113,113,0.2)' },
}

export function Alert({ type = 'info', title, children }) {
  const cfg = alertConfig[type]
  const Icon = cfg.icon
  return (
    <div style={{
      display: 'flex', gap: '12px', padding: '14px 16px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-lg)',
    }}>
      <Icon size={18} color={cfg.color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {title && <p style={{ fontWeight: 700, fontSize: '0.875rem', color: cfg.color, marginBottom: 4 }}>{title}</p>}
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{children}</div>
      </div>
    </div>
  )
}

// =============================================
// TOGGLE SWITCH
// =============================================

export function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1 }}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        style={{
          width: 44, height: 26, borderRadius: 'var(--radius-full)',
          background: checked ? 'var(--accent)' : 'var(--surface)',
          border: `1px solid ${checked ? 'var(--accent)' : 'var(--glass-border)'}`,
          position: 'relative', transition: 'all var(--transition-base)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          boxShadow: checked ? '0 0 12px var(--accent-glow)' : 'none',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 20 : 2,
          width: 20, height: 20, borderRadius: '50%',
          background: '#fff', transition: 'left var(--transition-spring)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        }} />
      </div>
      {label && <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{label}</span>}
    </label>
  )
}

// =============================================
// COPY BUTTON
// =============================================

export function CopyButton({ text, className }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <button onClick={handleCopy} className={clsx('btn btn-secondary btn-sm', className)}>
      {copied ? <><CheckCircle size={13} color="var(--success)" /> Tersalin</> : 'Salin'}
    </button>
  )
}

// =============================================
// LOADING OVERLAY
// =============================================

export function LoadingOverlay({ message = 'Memuat...' }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '16px',
    }}>
      <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{message}</p>
    </div>
  )
}

// =============================================
// PLAN GATE — Wrap konten yang hanya untuk Pro
// =============================================

export function ProGate({ children, fallback }) {
  return fallback || (
    <div style={{
      padding: '32px 24px', textAlign: 'center',
      background: 'var(--accent-gradient-soft)',
      border: '1px solid rgba(167,139,250,0.15)',
      borderRadius: 'var(--radius-xl)',
    }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>⭐</div>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8 }}>Fitur Pro</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 16 }}>
        Upgrade ke plan Pro untuk mengakses fitur ini.
      </p>
      <a href="/dashboard/upgrade" className="btn btn-primary btn-sm">Upgrade Sekarang</a>
    </div>
  )
}

// =============================================
// PRODUCT CARD SKELETON
// =============================================

export function ProductSkeleton() {
  return (
    <div className="glass-card" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ height: 180 }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div className="skeleton" style={{ height: 16, width: '70%' }} />
        <div className="skeleton" style={{ height: 12, width: '50%' }} />
        <div className="skeleton" style={{ height: 20, width: '40%' }} />
      </div>
    </div>
  )
}
