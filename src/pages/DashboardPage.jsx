import React, { useEffect, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, ShoppingBag, Eye, TrendingUp, Plus, ExternalLink, Copy, CheckCircle, ArrowRight, Zap, AlertCircle, MessageCircle, Instagram } from 'lucide-react'
import DashboardLayout from '../components/seller/DashboardLayout.jsx'
import { StatCard, Alert, EmptyState } from '../components/ui/index.jsx'
import ProdukForm from '../components/seller/ProdukForm.jsx'
import { useAuthStore, useTokoStore, useProdukStore } from '../lib/store.js'
import { tokoApi, pesananApi } from '../lib/api/index.js'
import { formatRupiah, getStorefrontUrl, isPro, copyToClipboard, generateShareTokoWA } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function AnimatedNumber({ value, duration = 800, formatter }) {
  const [display, setDisplay] = useState(0)
  const prevValue = useRef(0)

  useEffect(() => {
    if (typeof value !== 'number' || isNaN(value)) {
      setDisplay(value)
      return
    }
    const start = prevValue.current
    const end = value
    const startTime = performance.now()
    let rafId

    function tick(now) {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(start + (end - start) * eased)
      setDisplay(current)
      if (progress < 1) {
        rafId = requestAnimationFrame(tick)
      }
    }
    rafId = requestAnimationFrame(tick)
    prevValue.current = end
    
    // Cleanup to prevent memory leak on unmount
    return () => {
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [value, duration])

  if (typeof display !== 'number' || isNaN(display)) return <span>{display}</span>
  return <span>{formatter ? formatter(display) : display}</span>
}

export default function DashboardPage() {
  const { user, token } = useAuthStore()
  const tokenObj = token
  const { toko, load: loadToko, setToko } = useTokoStore()
  const { produk, load: loadProduk } = useProdukStore()
  const [linkCopied, setLinkCopied] = useState(false)
  const [tokoLoading, setTokoLoading] = useState(true)
  const [showProdukForm, setShowProdukForm] = useState(false)
  const [pesananCount, setPesananCount] = useState(null)
  const [totalRevenue, setTotalRevenue] = useState(null)
  const navigate = useNavigate()
  const pro = isPro(user)

  const sisaHari = pro && user?.planExpiry
    ? Math.ceil((new Date(user.planExpiry) - new Date()) / 86400000)
    : null

  useEffect(() => {
    if (token) {
      setTokoLoading(true)
      loadToko(tokenObj).finally(() => setTokoLoading(false))
      loadProduk(tokenObj)
    }
  }, [token])

  useEffect(() => {
    if (token) {
      pesananApi.getMine(tokenObj, 'all')
        .then(res => {
          const data = res.data || []
          setPesananCount(data.length)
          if (pro) {
            const revenue = data
              .filter(p => p.status === 'done')
              .reduce((s, p) => s + Number(p.total), 0)
            setTotalRevenue(revenue)
          }
        })
        .catch(() => {})
    }
  }, [token])

  const handleCopyLink = async () => {
    await copyToClipboard(getStorefrontUrl(toko.slug))
    setLinkCopied(true)
    toast.success('Link toko disalin!')
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleShareIG = async () => {
    const url = getStorefrontUrl(toko.slug)
    if (navigator.share) {
      try {
        await navigator.share({
          title: toko.nama,
          text: `Cek toko online saya di Exora 🛍️\n${toko.nama}`,
          url,
        })
      } catch (err) {
        if (err.name !== 'AbortError') toast.error('Gagal share')
      }
    } else {
      await copyToClipboard(url)
      toast.success('Link disalin! Paste di Instagram kamu.')
    }
  }

  const produkAktif = produk.filter(p => p.aktif).length
  const limitReached = !pro && produk.length >= CONFIG.FREE_PRODUCT_LIMIT
  const perpanjangBg = sisaHari <= 0 ? 'var(--danger)' : 'var(--warning)'

  // Framer Motion variants for staggered Stat Cards
  const statContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const statItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }
  }

  return (
    <DashboardLayout
      title={'Halo, ' + (user?.name?.split(' ')[0]) + ' 👋'}
      subtitle={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      actions={
        toko && (
          <a href={getStorefrontUrl(toko.slug)} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            Lihat Toko
          </a>
        )
      }
    >
      {/* LOCAL STYLES FOR ANIMATIONS (Isolated to this file) */}
      <style>{`
        .produk-row { transition: background 0.2s ease; }
        .produk-row:hover { background: var(--surface-hover) !important; }
        .produk-thumb { transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        .produk-row:hover .produk-thumb { transform: scale(1.05); }
        
        .quick-action-btn { position: relative; overflow: hidden; }
        .quick-action-icon { transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1); }
        .quick-action-btn:hover .quick-action-icon { transform: scale(1.1) rotate(4deg); }
        
        .badge-pulse-aktif { position: relative; z-index: 1; }
        .badge-pulse-aktif::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: var(--success);
          opacity: 0.4;
          animation: pulseBadge 2s infinite;
          z-index: -1;
        }
        @keyframes pulseBadge {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>

      {tokoLoading ? (
        // AREA 6: Skeleton Loading State
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="skeleton skeleton-text sm" style={{ width: '60%' }} />
                <div className="skeleton skeleton-title" style={{ width: '80%' }} />
                <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ padding: '20px', height: '120px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card" style={{ padding: '16px', height: '68px' }} />
            ))}
          </div>
        </div>
      ) : !toko ? (
        // AREA 4: Entrance Animation for SetupTokoCard
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SetupTokoCard tokenObj={tokenObj} setToko={setToko} />
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* AREA 7: Exit Animation for Banners/Alerts */}
          <AnimatePresence mode="popLayout">
            {!pro && (
              <motion.div
                key="upgrade-banner"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="anim-fade-up"
                style={{
                  background: 'linear-gradient(135deg, rgba(91,138,245,0.1) 0%, rgba(167,139,250,0.1) 100%)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  borderRadius: 'var(--radius-xl)',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  overflow: 'hidden'
                }}
              >
                <Zap size={20} color="var(--accent-3)" style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', marginBottom: 2 }}>
                    Upgrade ke Pro
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Produk unlimited, custom domain, analytics, dan lebih banyak lagi. Hanya {CONFIG.PRO_PRICE}.
                  </p>
                </div>
                <Link
                  to="/dashboard/upgrade"
                  className="btn btn-primary btn-sm"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Upgrade Sekarang
                  <ArrowRight size={13} />
                </Link>
              </motion.div>
            )}

            {pro && sisaHari !== null && sisaHari <= 7 && (
              <motion.div
                key="expiry-banner"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="anim-fade-up"
                style={{
                  background: sisaHari <= 0 ? 'var(--danger-bg)' : 'var(--warning-bg)',
                  border: '1px solid ' + (sisaHari <= 0 ? 'rgba(248,113,113,0.3)' : 'rgba(251,191,36,0.3)'),
                  borderRadius: 'var(--radius-xl)',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  flexWrap: 'wrap',
                  overflow: 'hidden'
                }}
              >
                <AlertCircle size={20} color={sisaHari <= 0 ? 'var(--danger)' : 'var(--warning)'} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    marginBottom: 2,
                    color: sisaHari <= 0 ? 'var(--danger)' : 'var(--warning)',
                  }}>
                    {sisaHari <= 0 ? 'Paket Pro kamu sudah expired' : 'Paket Pro berakhir dalam ' + sisaHari + ' hari'}
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {sisaHari <= 0
                      ? 'Perpanjang sekarang agar toko dan fitur Pro tetap aktif.'
                      : 'Segera perpanjang agar tidak kehilangan akses ke fitur Pro.'}
                  </p>
                </div>
                <a
                  href={'https://wa.me/' + CONFIG.ADMIN_WA + '?text=' + encodeURIComponent('Halo, saya mau perpanjang paket Pro Exora.')}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-sm"
                  style={{ flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '4px', background: perpanjangBg, color: '#fff' }}
                >
                  Perpanjang Sekarang
                  <ArrowRight size={13} />
                </a>
              </motion.div>
            )}

            {limitReached && (
              <motion.div
                key="limit-banner"
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="anim-fade-up"
                style={{ overflow: 'hidden' }}
              >
                <Alert type="warning" title="Batas produk tercapai">
                  Kamu sudah mencapai batas {CONFIG.FREE_PRODUCT_LIMIT} produk untuk paket gratis.{' '}
                  <Link to="/dashboard/upgrade" style={{ color: 'var(--warning)', fontWeight: 700 }}>Upgrade ke Pro</Link> untuk produk unlimited.
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass-card" style={{ padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Link Toko Kamu
                </p>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--accent)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {getStorefrontUrl(toko.slug)}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={handleCopyLink} className="btn btn-secondary btn-sm">
                  {linkCopied ? (
                    // AREA 5: Success Feedback on Copy Link (Bounce-in animation)
                    <motion.span 
                      initial={{ scale: 0 }} 
                      animate={{ scale: 1 }} 
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <CheckCircle size={13} color="var(--success)" /> Disalin
                    </motion.span>
                  ) : (
                    <><Copy size={13} /> Salin</>
                  )}
                </button>
                <button onClick={() => window.location.href = getStorefrontUrl(toko.slug)} className="btn btn-secondary btn-sm">
                  <ExternalLink size={13} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <a
                href={generateShareTokoWA(toko)}
                target="_blank" rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <MessageCircle size={13} /> Share ke WA
              </a>
              <button
                onClick={handleShareIG}
                className="btn btn-secondary btn-sm"
              >
                <Instagram size={13} /> Share ke IG
              </button>
            </div>
          </div>

          {/* AREA 1: Entrance Animation for Stat Cards (Staggered) */}
          <motion.div 
            variants={statContainerVariants}
            initial="hidden"
            animate="visible"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}
          >
            <motion.div variants={statItemVariants}>
              <StatCard
                label="Total Produk"
                value={<AnimatedNumber value={produk.length} />}
                icon={<Package size={18} />}
                trend={produkAktif + ' aktif'}
              />
            </motion.div>
            <motion.div variants={statItemVariants}>
              <StatCard
                label="Produk Aktif"
                value={<AnimatedNumber value={produkAktif} />}
                icon={<Eye size={18} />}
                color="var(--success)"
              />
            </motion.div>
            <motion.div variants={statItemVariants}>
              <StatCard
                label="Pesanan Masuk"
                value={pesananCount !== null ? <AnimatedNumber value={pesananCount} /> : '...'}
                icon={<ShoppingBag size={18} />}
                trend="Lihat detail"
                color="var(--warning)"
              />
            </motion.div>
            <motion.div variants={statItemVariants}>
              <StatCard
                label="Total Penjualan"
                value={
                  pro
                    ? (totalRevenue !== null ? <AnimatedNumber value={totalRevenue} formatter={formatRupiah} /> : '...')
                    : '🔒'
                }
                icon={<TrendingUp size={18} />}
                trend={pro ? '' : 'Upgrade untuk akses'}
                color="var(--accent-3)"
              />
            </motion.div>
          </motion.div>

          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginBottom: '16px' }}>
              Aksi Cepat
            </h2>
            {/* AREA 2: Interactions in Quick Actions (Ripple + Icon Hover) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              <button
                onClick={() => { if (!limitReached) setShowProdukForm(true) }}
                disabled={limitReached}
                className="hover-lift quick-action-btn ripple"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface)',
                  border: '1px solid var(--glass-border)',
                  opacity: limitReached ? 0.5 : 1,
                  cursor: limitReached ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <div className="quick-action-icon" style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent)18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                  flexShrink: 0,
                }}>
                  <Plus size={16} />
                </div>
                <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Tambah Produk</span>
                <ArrowRight size={14} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
              </button>

              {[
                { icon: ShoppingBag, label: 'Lihat Pesanan', to: '/dashboard/pesanan', color: 'var(--warning)' },
                { icon: Package, label: 'Kelola Produk', to: '/dashboard/produk', color: 'var(--success)' },
              ].map(a => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="hover-lift quick-action-btn ripple"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '16px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface)',
                    border: '1px solid var(--glass-border)',
                    cursor: 'pointer',
                  }}
                >
                  <div className="quick-action-icon" style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--radius-md)',
                    background: a.color + '18',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: a.color,
                    flexShrink: 0,
                  }}>
                    <a.icon size={16} />
                  </div>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{a.label}</span>
                  <ArrowRight size={14} color="var(--text-tertiary)" style={{ marginLeft: 'auto' }} />
                </Link>
              ))}
            </div>
          </div>

          {produk.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>Produk Terbaru</h2>
                <Link
                  to="/dashboard/produk"
                  className="btn btn-ghost btn-sm"
                  style={{ color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  Lihat semua
                  <ArrowRight size={13} />
                </Link>
              </div>
              {/* AREA 3 & 8: Hover Effect on List & Micro-interaction on Badges */}
              <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {produk.slice(0, 5).map(p => {
                  const thumbUrl = parseFotos(p.foto)[0] || null
                  return (
                    <div key={p.id} className="glass-card produk-row" style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      borderRadius: 'var(--radius-lg)',
                      cursor: 'default'
                    }}>
                      {thumbUrl ? (
                        <img
                          src={thumbUrl}
                          alt={p.nama}
                          className="produk-thumb"
                          style={{ width: 44, height: 44, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 44,
                          height: 44,
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-tertiary)',
                          flexShrink: 0,
                        }}>
                          <Package size={18} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nama}</p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>{p.kategori}</p>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <p style={{ fontWeight: 700, color: 'var(--accent)', fontSize: '0.875rem' }}>{formatRupiah(p.harga)}</p>
                        <span className={'badge ' + (p.aktif ? 'badge-success badge-pulse-aktif' : 'badge-free')} style={{ fontSize: '0.65rem' }}>
                          {p.aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

        </div>
      )}

      <ProdukForm
        isOpen={showProdukForm}
        onClose={() => setShowProdukForm(false)}
        editData={null}
      />
    </DashboardLayout>
  )
}

function SetupTokoCard({ tokenObj, setToko }) {
  const [form, setForm] = useState({ nama: '', slug: '', deskripsi: '', wa: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [slugManual, setSlugManual] = useState(false)
  const { updateUser } = useAuthStore()

  const set = (field, val) => {
    setForm(f => ({ ...f, [field]: val }))
    if (errors[field]) setErrors(e => ({ ...e, [field]: null }))
    if (field === 'nama' && !slugManual) {
      const s = val.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 30)
      setForm(f => ({ ...f, nama: val, slug: s }))
    }
  }

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama toko wajib diisi'
    if (!form.slug || !/^[a-z0-9][a-z0-9-]{2,29}$/.test(form.slug)) e.slug = 'Slug tidak valid (huruf kecil, angka, tanda -). Min 3 karakter.'
    if (!form.wa.trim()) e.wa = 'Nomor WhatsApp wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const res = await tokoApi.create(tokenObj, form)
      setToko(res.data)
      updateUser({ tokoId: res.data.id })
      toast.success('Toko berhasil dibuat! 🎉')
    } catch (err) {
      toast.error(err.message || 'Gagal membuat toko')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <div className="glass-card" style={{ padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🏪</div>
          <h2 className="text-heading" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>Buat Toko Pertamamu</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Isi informasi di bawah ini untuk membuka toko online kamu
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div className="form-group">
            <label className="form-label">Nama Toko *</label>
            <input
              className={'form-input ' + (errors.nama ? 'error' : '')}
              placeholder="cth: Toko Rina Handmade"
              value={form.nama}
              onChange={e => set('nama', e.target.value)}
              maxLength={50}
            />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Slug / URL Toko *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span style={{ position: 'absolute', left: 12, color: 'var(--text-tertiary)', fontSize: '0.82rem', pointerEvents: 'none' }}>
                exora.app/
              </span>
              <input
                className={'form-input ' + (errors.slug ? 'error' : '')}
                style={{ paddingLeft: 80 }}
                placeholder="nama-toko"
                value={form.slug}
                onChange={e => {
                  setSlugManual(true)
                  set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 30))
                }}
                maxLength={30}
              />
            </div>
            {errors.slug && <span className="form-error">{errors.slug}</span>}
            <span className="form-hint">Huruf kecil, angka, tanda minus. Tidak bisa diubah nanti.</span>
          </div>

          <div className="form-group">
            <label className="form-label">Nomor WhatsApp *</label>
            <input
              className={'form-input ' + (errors.wa ? 'error' : '')}
              placeholder="cth: 081234567890"
              value={form.wa}
              onChange={e => set('wa', e.target.value)}
            />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
            <span className="form-hint">Nomor ini yang dihubungi pembeli saat checkout</span>
          </div>

          <div className="form-group">
            <label className="form-label">Deskripsi Toko</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Ceritakan sedikit tentang tokomu..."
              value={form.deskripsi}
              onChange={e => set('deskripsi', e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-lg ripple"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Membuat Toko...' : 'Buat Toko Sekarang 🚀'}
          </button>
        </div>
      </div>
    </div>
  )
}
