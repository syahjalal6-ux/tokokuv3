import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence, useAnimation, useInView } from 'framer-motion'
import { MessageCircle, Search, ShoppingBag, Store, ChevronLeft, ChevronRight, X, Plus, Minus, Package, Music, Star, Send, Truck, MapPin, Weight, Sun, Moon, Share2, Copy, Check } from 'lucide-react'
import { tokoApi, produkApi, ratingApi, pesananApi, trafficApi, bundleApi, flashSaleApi, voucherApi } from '../lib/api/index.js'
import { liveApi } from '../lib/api/adminClient.js'
import { formatRupiah, generateCheckoutMessage, generateWALink, validateWA, truncate, generateShareProdukWA } from '../lib/utils.js'
import { CONFIG } from '../lib/config.js'
import ChatModal from '../components/seller/ChatModal.jsx'
import { useTheme } from '../lib/useTheme.js'
import confetti from 'canvas-confetti'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TEMA = {
  default: { accent: '#5b8af5', accent2: '#7c6af7', gradient: 'linear-gradient(135deg, #5b8af5, #7c6af7)' },
  emerald: { accent: '#10b981', accent2: '#059669', gradient: 'linear-gradient(135deg, #10b981, #059669)' },
  sunset:  { accent: '#f59e0b', accent2: '#ef4444', gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
  rose:    { accent: '#f43f5e', accent2: '#ec4899', gradient: 'linear-gradient(135deg, #f43f5e, #ec4899)' },
}

const THEMES = {
  dark: {
    bgPrimary: '#0a0a0f',
    bgSecondary: '#13131a',
    surface: '#1a1a22',
    surfaceHover: '#22222b',
    glass: 'rgba(255,255,255,0.03)',
    glassBorder: 'rgba(255,255,255,0.08)',
    borderCard: '#ffffff',
    textPrimary: '#f5f5f7',
    textSecondary: '#c2c2c8',
    textTertiary: '#7a7a85',
    footerBg: 'rgba(10,10,15,0.9)',
    footerBorder: 'rgba(255,255,255,0.08)',
  },
  light: {
    bgPrimary: '#ffffff',
    bgSecondary: '#ffffff',
    surface: '#f6f6f7',
    surfaceHover: '#ececee',
    glass: 'rgba(0,0,0,0.015)',
    glassBorder: '#e7e7ea',
    borderCard: '#111111',
    textPrimary: '#1a1a1f',
    textSecondary: '#4a4a52',
    textTertiary: '#8a8a92',
    footerBg: 'rgba(255,255,255,0.92)',
    footerBorder: '#e7e7ea',
  },
}

// ========== TAMBAHAN FITUR BARU: Helpers ==========

// 1. Magnetic Button - tombol yang mengikuti kursor saat hover
function MagneticButton({ children, strength = 0.3, style, className, ...props }) {
  const ref = useRef(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = e.clientX - centerX
    const dy = e.clientY - centerY
    setOffset({ x: dx * strength, y: dy * strength })
  }

  const handleMouseLeave = () => setOffset({ x: 0, y: 0 })

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15, mass: 0.1 }}
      style={{ display: 'inline-block', ...style }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// 2. Parallax - hook untuk efek paralaks berdasarkan scroll/mouse
function useParallax(strength = 0.1) {
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX - window.innerWidth / 2) * strength
      const y = (e.clientY - window.innerHeight / 2) * strength
      setOffset({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [strength])

  return offset
}

// 3. Shake-to-Refresh - hook untuk deteksi goyangan perangkat
function useShakeDetection(onShake, threshold = 15) {
  const lastShake = useRef(0)
  const lastAcc = useRef({ x: 0, y: 0, z: 0 })

  useEffect(() => {
    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity || e.acceleration
      if (!acc || acc.x == null) return
      const deltaX = Math.abs(acc.x - lastAcc.current.x)
      const deltaY = Math.abs(acc.y - lastAcc.current.y)
      const deltaZ = Math.abs(acc.z - lastAcc.current.z)
      if ((deltaX + deltaY + deltaZ) > threshold) {
        const now = Date.now()
        if (now - lastShake.current > 1500) {
          lastShake.current = now
          onShake && onShake()
        }
      }
      lastAcc.current = { x: acc.x || 0, y: acc.y || 0, z: acc.z || 0 }
    }

    const enable = () => {
      if (typeof DeviceMotionEvent !== 'undefined') {
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          DeviceMotionEvent.requestPermission().then(res => {
            if (res === 'granted') window.addEventListener('devicemotion', handleMotion)
          }).catch(() => {})
        } else {
          window.addEventListener('devicemotion', handleMotion)
        }
      }
    }

    // Auto-enable on first user interaction (untuk iOS)
    const onFirstTouch = () => {
      enable()
      document.removeEventListener('touchstart', onFirstTouch)
    }
    document.addEventListener('touchstart', onFirstTouch, { once: true })
    enable()

    return () => {
      window.removeEventListener('devicemotion', handleMotion)
      document.removeEventListener('touchstart', onFirstTouch)
    }
  }, [onShake, threshold])
}

// 4. Confetti helper - fungsi untuk memicu confetti
function fireConfetti() {
  const duration = 2000
  const end = Date.now() + duration
  const colors = ['#5b8af5', '#7c6af7', '#f59e0b', '#ef4444', '#10b981', '#f43f5e']
  ;(function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}

// ========== AKHIR TAMBAHAN FITUR BARU ==========

function parseFotos(foto) {
  if (!foto) return []
  try {
    const parsed = JSON.parse(foto)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(foto).split(',').map(s => s.trim()).filter(Boolean)
  }
}

function safeWA(wa) {
  if (!wa) return ''
  return String(wa)
}

function getYouTubeId(url) {
  if (!url) return null
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Cloudinary helper untuk optimasi gambar
function cloudinaryThumb(url, width = 300, height = 400) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`)
}

function cloudinaryMedium(url, width = 800) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', `/upload/w_${width}/`)
}

const TRACKING_CACHE = {}
const CACHE_TTL = 5 * 60 * 1000

async function fetchTracking(resi) {
  const key = resi.trim().toUpperCase()
  const now = Date.now()
  if (TRACKING_CACHE[key] && now - TRACKING_CACHE[key].ts < CACHE_TTL) return TRACKING_CACHE[key].data
  const res = await fetch(`https://api.biteship.com/v1/trackings/${encodeURIComponent(key)}`, {
    headers: { 'Authorization': CONFIG.BITESHIP_KEY, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Resi tidak ditemukan atau tidak valid')
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Gagal melacak resi')
  TRACKING_CACHE[key] = { data, ts: now }
  return data
}

const ONGKIR_CACHE = {}

async function fetchOngkir({ originAreaId, destinationAreaId, weight }) {
  const key = `${originAreaId}-${destinationAreaId}-${weight}`
  const now = Date.now()
  if (ONGKIR_CACHE[key] && now - ONGKIR_CACHE[key].ts < CACHE_TTL) return ONGKIR_CACHE[key].data
  const res = await fetch('https://api.biteship.com/v1/rates/couriers', {
    method: 'POST',
    headers: { 'Authorization': CONFIG.BITESHIP_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin_area_id: originAreaId,
      destination_area_id: destinationAreaId,
      couriers: 'jne,jnt,sicepat,anteraja,lion,ninja,tiki,pos,grab,gosend',
      items: [{ name: 'Produk', description: '', value: 10000, length: 10, width: 10, height: 10, weight }],
    }),
  })
  if (!res.ok) throw new Error('Gagal mengambil data ongkir')
  const data = await res.json()
  if (!data.success) throw new Error(data.error || 'Gagal menghitung ongkir')
  ONGKIR_CACHE[key] = { data, ts: now }
  return data
}

async function searchArea(query) {
  if (!query || query.length < 3) return []
  const res = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=${encodeURIComponent(query)}&type=single`, {
    headers: { 'Authorization': CONFIG.BITESHIP_KEY, 'Content-Type': 'application/json' },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data.areas || []
}

// Debounce hook
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

function AreaSearchInput({ label, icon, placeholder, value, onInputChange, options, searching, onSelect, c }) {
  return (
    <div style={{ position: 'relative' }}>
      <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5, color: c.textSecondary }}>
        {icon}{label}
      </label>
      <div style={{ position: 'relative' }}>
        <input className="form-input" placeholder={placeholder} value={value} onChange={e => onInputChange(e.target.value)} style={{ fontSize: '0.875rem', paddingRight: searching ? 36 : 12, border: '2px solid var(--glass-border)' }} />
        {searching && <span className="spinner" style={{ width: 14, height: 14, position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />}
      </div>
      <AnimatePresence>
        {options.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: c.bgSecondary, border: `2px solid ${c.glassBorder}`, borderRadius: 'var(--radius-md)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', maxHeight: 200, overflowY: 'auto', marginTop: 4 }}
          >
            {options.map(area => (
              <motion.div
                key={area.id}
                whileHover={{ scale: 1.02, backgroundColor: c.surfaceHover }}
                onClick={() => onSelect(area)}
                style={{ padding: '9px 12px', fontSize: '0.82rem', cursor: 'pointer', borderBottom: `1px solid ${c.glassBorder}`, color: c.textPrimary }}
              >
                <span style={{ fontWeight: 600 }}>{area.name}</span>
                {area.administrative_division_level_1_name && <span style={{ color: c.textTertiary, marginLeft: 6, fontSize: '0.75rem' }}>{area.administrative_division_level_1_name}</span>}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function OngkirModal({ onClose, c }) {
  const [origin, setOrigin] = useState('')
  const [originAreaId, setOriginAreaId] = useState(null)
  const [originAreaOptions, setOriginAreaOptions] = useState([])
  const [searchingOriginArea, setSearchingOriginArea] = useState(false)
  const originSearchTimeout = useRef(null)
  const [destination, setDestination] = useState('')
  const [destinationAreaId, setDestinationAreaId] = useState(null)
  const [destinationAreaOptions, setDestinationAreaOptions] = useState([])
  const [searchingDestinationArea, setSearchingDestinationArea] = useState(false)
  const destinationSearchTimeout = useRef(null)
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const isMobile = window.innerWidth < 640

  const handleOriginInput = (val) => {
    setOrigin(val); setOriginAreaId(null); setOriginAreaOptions([]); setResult(null); setError(null)
    clearTimeout(originSearchTimeout.current)
    if (val.length >= 3) {
      setSearchingOriginArea(true)
      originSearchTimeout.current = setTimeout(async () => {
        const areas = await searchArea(val)
        setOriginAreaOptions(areas); setSearchingOriginArea(false)
      }, 400)
    }
  }

  const handleDestinationInput = (val) => {
    setDestination(val); setDestinationAreaId(null); setDestinationAreaOptions([]); setResult(null); setError(null)
    clearTimeout(destinationSearchTimeout.current)
    if (val.length >= 3) {
      setSearchingDestinationArea(true)
      destinationSearchTimeout.current = setTimeout(async () => {
        const areas = await searchArea(val)
        setDestinationAreaOptions(areas); setSearchingDestinationArea(false)
      }, 400)
    }
  }

  const handleCek = async () => {
    if (!originAreaId) { setError('Pilih kota/kecamatan asal pengiriman dari daftar'); return }
    if (!destinationAreaId) { setError('Pilih kota/kecamatan tujuan dari daftar'); return }
    setLoading(true); setError(null); setResult(null)
    try {
      const data = await fetchOngkir({ originAreaId, destinationAreaId, weight })
      setResult(data)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const pricings = result?.pricing || []

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}
    >
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: isMobile ? '100%' : 480, background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: isMobile ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)', maxHeight: isMobile ? '92vh' : '80vh', overflow: 'auto' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: c.bgSecondary, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <MapPin size={18} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: c.textPrimary }}>Estimasi Ongkir</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></motion.button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AreaSearchInput c={c} label="Dikirim dari" icon={<Truck size={12} />} placeholder="Contoh: Jakarta, Surabaya, Medan..." value={origin} onInputChange={handleOriginInput} options={originAreaOptions} searching={searchingOriginArea} onSelect={a => { setOriginAreaId(a.id); setOrigin(a.name); setOriginAreaOptions([]) }} />
          <AreaSearchInput c={c} label="Kota/Kecamatan Tujuan" icon={<MapPin size={12} />} placeholder="Contoh: Bandung, Cimahi, Depok..." value={destination} onInputChange={handleDestinationInput} options={destinationAreaOptions} searching={searchingDestinationArea} onSelect={a => { setDestinationAreaId(a.id); setDestination(a.name); setDestinationAreaOptions([]) }} />
          <div>
            <label className="form-label" style={{ fontSize: '0.75rem', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5, color: c.textSecondary }}><Weight size={12} /> Berat Paket (gram)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[500, 1000, 2000, 5000].map(w => (
                <motion.button
                  key={w}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setWeight(w)}
                  className="btn btn-sm"
                  style={{ background: weight === w ? 'var(--accent)' : c.surface, color: weight === w ? '#fff' : c.textSecondary, border: `2px solid ${weight === w ? 'var(--accent)' : c.glassBorder}`, borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}
                >
                  {w >= 1000 ? `${w / 1000}kg` : `${w}g`}
                </motion.button>
              ))}
              <input type="number" className="form-input" placeholder="Custom (g)" value={weight} onChange={e => setWeight(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: 90, fontSize: '0.8rem', padding: '5px 10px', border: '2px solid var(--glass-border)' }} />
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCek}
            disabled={loading || !destinationAreaId || !originAreaId}
            className="btn btn-primary"
            style={{ width: '100%', height: 42, fontSize: '0.875rem', fontWeight: 700, border: '2px solid var(--accent)' }}
          >
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Cek Ongkir'}
          </motion.button>
          {error && <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '2px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--danger)' }}>{error}</div>}
          {pricings.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: '0.75rem', color: c.textTertiary, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{pricings.length} layanan tersedia</p>
              {pricings.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  style={{ padding: '11px 14px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <div>
                    <p style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 2, color: c.textPrimary }}>{item.courier_name} — <span style={{ fontWeight: 500 }}>{item.courier_service_name}</span></p>
                    {item.duration && <p style={{ fontSize: '0.72rem', color: c.textTertiary }}>Estimasi {item.duration}</p>}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.875rem', color: 'var(--accent)', whiteSpace: 'nowrap' }}>{formatRupiah(item.price)}</span>
                </motion.div>
              ))}
            </div>
          )}
          {result && pricings.length === 0 && !error && <p style={{ textAlign: 'center', color: c.textTertiary, fontSize: '0.82rem', padding: '12px 0' }}>Tidak ada layanan kurir tersedia untuk rute ini</p>}
          {!result && !loading && !error && <p style={{ textAlign: 'center', color: c.textTertiary, fontSize: '0.82rem', padding: '12px 0' }}>Pilih asal, tujuan, dan berat untuk melihat estimasi ongkir</p>}
        </div>
      </motion.div>
    </motion.div>
  )
}

function TrackingModal({ onClose, initialResi = '', c }) {
  const [resi, setResi] = useState(initialResi)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const isMobile = window.innerWidth < 640

  useEffect(() => { if (initialResi) handleTrack(initialResi) }, [])

  const handleTrack = async (resiVal) => {
    const val = resiVal || resi
    if (!val.trim()) return
    setLoading(true); setError(null); setResult(null)
    try { const data = await fetchTracking(val.trim()); setResult(data) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 700, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}
    >
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: isMobile ? '100%' : 480, background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: isMobile ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)', maxHeight: isMobile ? '92vh' : '80vh', overflow: 'auto' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: c.bgSecondary, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Truck size={18} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: c.textPrimary }}>Lacak Pesanan</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></motion.button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="form-input" placeholder="Masukkan nomor resi..." value={resi} onChange={e => setResi(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleTrack()} style={{ flex: 1, fontSize: '0.875rem', border: '2px solid var(--glass-border)' }} />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleTrack()}
              disabled={loading || !resi.trim()}
              className="btn btn-primary btn-sm"
              style={{ flexShrink: 0, border: '2px solid var(--accent)' }}
            >
              {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Lacak'}
            </motion.button>
          </div>
          {error && <div style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '2px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: 'var(--danger)' }}>{error}</div>}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ padding: '12px 14px', background: c.surface, borderRadius: 'var(--radius-lg)', border: `2px solid ${c.borderCard}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: c.textTertiary }}>Kurir</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: c.textPrimary }}>{result.courier?.name || '-'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', color: c.textTertiary }}>No. Resi</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: c.textPrimary }}>{result.waybill_id || resi}</span>
                </div>
                {result.destination && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.78rem', color: c.textTertiary }}>Tujuan</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: c.textPrimary }}>{result.destination}</span>
                  </div>
                )}
              </div>
              {result.status && (
                <motion.div
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  style={{ padding: '8px 14px', background: result.status === 'delivered' ? 'var(--success-bg)' : 'rgba(91,138,245,0.1)', border: `2px solid ${result.status === 'delivered' ? 'rgba(52,211,153,0.2)' : 'rgba(91,138,245,0.2)'}`, borderRadius: 'var(--radius-md)', fontSize: '0.82rem', color: result.status === 'delivered' ? 'var(--success)' : 'var(--accent)', fontWeight: 700, textAlign: 'center' }}
                >
                  {result.status === 'delivered' ? '✓ Paket telah diterima' : result.status === 'in_transit' ? '🚚 Dalam perjalanan' : result.status === 'on_delivery' ? '🛵 Sedang diantar' : result.status === 'picked_up' ? '📦 Sudah dipickup' : result.status}
                </motion.div>
              )}
              {result.history && result.history.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {result.history.map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ display: 'flex', gap: 12, alignItems: 'flex-start', paddingBottom: i < result.history.length - 1 ? 12 : 0 }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', marginTop: 3, flexShrink: 0, background: i === 0 ? 'var(--success)' : c.surfaceHover, border: `2px solid ${i === 0 ? 'var(--success)' : c.glassBorder}` }} />
                        {i < result.history.length - 1 && <div style={{ width: 2, flex: 1, minHeight: 20, background: c.glassBorder, margin: '4px 0' }} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.82rem', fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--success)' : c.textPrimary, margin: 0 }}>{h.note || h.status}</p>
                        {h.service_area && <p style={{ fontSize: '0.72rem', color: c.textTertiary, margin: '2px 0 0' }}>{h.service_area}</p>}
                        <p style={{ fontSize: '0.72rem', color: c.textTertiary, margin: '2px 0 0' }}>{h.updated_at ? new Date(h.updated_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
          {!result && !loading && !error && <p style={{ textAlign: 'center', color: c.textTertiary, fontSize: '0.82rem', padding: '20px 0' }}>Masukkan nomor resi untuk melacak status pengiriman</p>}
        </div>
      </motion.div>
    </motion.div>
  )
}

function StarRating({ value, onChange, size = 20 }) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1,2,3,4,5].map(i => (
        <motion.div
          key={i}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Star size={size} fill={(hover || value) >= i ? '#fbbf24' : 'transparent'} color={(hover || value) >= i ? '#fbbf24' : 'rgba(255,255,255,0.3)'} style={{ cursor: onChange ? 'pointer' : 'default' }} onClick={() => onChange && onChange(i)} onMouseEnter={() => onChange && setHover(i)} onMouseLeave={() => onChange && setHover(0)} />
        </motion.div>
      ))}
    </div>
  )
}

function MusicPlayer({ musikUrl, tema, c }) {
  const [playing, setPlaying] = useState(false)
  const videoId = getYouTubeId(musikUrl)
  if (!videoId) return null
  return (
    <>
      {playing && (
        <div style={{ position: 'fixed', width: 0, height: 0, overflow: 'hidden', zIndex: -1 }}>
          <iframe src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`} title="Musik Toko" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" style={{ width: 1, height: 1, border: 'none' }} />
        </div>
      )}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setPlaying(p => !p)}
        title={playing ? 'Pause musik' : 'Play musik'}
        style={{ position: 'fixed', bottom: 48, left: 16, zIndex: 200, width: 40, height: 40, borderRadius: 'var(--radius-full)', background: playing ? tema.gradient : c.bgSecondary, backdropFilter: 'blur(16px)', border: `2px solid ${playing ? tema.accent + '66' : c.glassBorder}`, boxShadow: playing ? `0 4px 24px ${tema.accent}66` : '0 4px 16px rgba(0,0,0,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: playing ? '#fff' : c.textSecondary }}
      >
        <Music size={15} />
      </motion.button>
    </>
  )
}

function VideoToko({ videoUrl, c }) {
  const videoId = getYouTubeId(videoUrl)
  if (!videoId) return null
  return (
    <div style={{ border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: c.surface }}>
      <div style={{ padding: '7px 12px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: c.textSecondary, letterSpacing: '0.04em' }}>VIDEO TOKO</span>
      </div>
      <div style={{ position: 'relative', paddingBottom: '40%', height: 0, background: '#000' }}>
        <iframe src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`} title="Video Toko" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
      </div>
    </div>
  )
}

function PhotoCarousel({ fotos, nama, c }) {
  const [idx, setIdx] = useState(0)
  const touchStartX = useRef(null)
  if (!fotos.length) return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textTertiary }}><Package size={56} /></div>
  const prev = (e) => { e.stopPropagation(); setIdx(i => (i - 1 + fotos.length) % fotos.length) }
  const next = (e) => { e.stopPropagation(); setIdx(i => (i + 1) % fotos.length) }
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (diff > 20) setIdx(i => (i + 1) % fotos.length)
    else if (diff < -20) setIdx(i => (i - 1 + fotos.length) % fotos.length)
    touchStartX.current = null
  }
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <AnimatePresence mode="wait">
        <motion.img
          key={idx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          src={fotos[idx]}
          alt={`${nama} ${idx + 1}`}
          loading="lazy"
          style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '8px', background: c.surface }}
        />
      </AnimatePresence>
      {fotos.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={prev}
            style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <ChevronLeft size={16} />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={next}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
          >
            <ChevronRight size={16} />
          </motion.button>
          <div style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 5 }}>
            {fotos.map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.2 }}
                onClick={(e) => { e.stopPropagation(); setIdx(i) }}
                style={{ width: i === idx ? 18 : 6, height: 6, borderRadius: 'var(--radius-full)', background: i === idx ? '#fff' : 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function RatingSection({ produkId, tokoId, tema, c }) {
  const [ratings, setRatings] = useState([])
  const [avgRating, setAvgRating] = useState(null)
  const [total, setTotal] = useState(0)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ buyerNama: '', rating: 0, komentar: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => { loadRatings() }, [produkId])

  const loadRatings = async () => {
    try {
      const res = await ratingApi.get({ produkId })
      setRatings(res.data.ratings || []); setAvgRating(res.data.avgRating); setTotal(res.data.total)
    } catch {}
  }

  const handleSubmit = async () => {
    if (!form.buyerNama.trim() || !form.rating || !form.komentar.trim()) return
    setSubmitting(true)
    try {
      await ratingApi.add({ tokoId, produkId, buyerNama: form.buyerNama, rating: form.rating, komentar: form.komentar })
      setSubmitted(true); setShowForm(false); loadRatings()
    } catch (err) { alert(err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary }}>Ulasan</h3>
          {avgRating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Star size={14} fill="#fbbf24" color="#fbbf24" />
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#fbbf24' }}>{avgRating}</span>
              <span style={{ fontSize: '0.78rem', color: c.textTertiary }}>({total})</span>
            </div>
          )}
        </div>
        {!submitted && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowForm(s => !s)}
            className="btn btn-sm btn-secondary"
            style={{ fontSize: '0.75rem', border: '2px solid var(--glass-border)' }}
          >
            + Tulis Ulasan
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ background: c.surface, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-lg)', padding: 16, marginBottom: 16, overflow: 'hidden' }}
          >
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Nama</label>
              <input className="form-input" placeholder="Nama kamu" value={form.buyerNama} onChange={e => setForm(f => ({ ...f, buyerNama: e.target.value }))} style={{ border: '2px solid var(--glass-border)' }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label className="form-label" style={{ display: 'block', marginBottom: 8 }}>Rating</label>
              <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label className="form-label">Komentar</label>
              <textarea className="form-input form-textarea" rows={3} placeholder="Bagaimana pengalaman kamu dengan produk ini?" value={form.komentar} onChange={e => setForm(f => ({ ...f, komentar: e.target.value }))} maxLength={500} style={{ border: '2px solid var(--glass-border)' }} />
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={submitting || !form.rating || !form.buyerNama.trim() || !form.komentar.trim()}
              className="btn btn-sm btn-primary"
              style={{ background: tema.gradient, border: '2px solid var(--accent)' }}
            >
              {submitting ? 'Mengirim...' : <><Send size={13} /> Kirim Ulasan</>}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      {submitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ background: 'rgba(52,211,153,0.1)', border: '2px solid rgba(52,211,153,0.2)', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 16, fontSize: '0.82rem', color: 'var(--success)' }}
        >
          ✓ Ulasan kamu berhasil dikirim!
        </motion.div>
      )}
      {ratings.length === 0 ? (
        <p style={{ color: c.textTertiary, fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>Belum ada ulasan</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ratings.slice(0, 5).map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              style={{ padding: '12px 14px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-lg)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: tema.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', color: '#fff', flexShrink: 0 }}>{r.buyer_nama?.[0]?.toUpperCase()}</div>
                  <span style={{ fontWeight: 700, fontSize: '0.82rem', color: c.textPrimary }}>{r.buyer_nama}</span>
                </div>
                <StarRating value={Number(r.rating)} size={13} />
              </div>
              {r.komentar && <p style={{ fontSize: '0.82rem', color: c.textSecondary, lineHeight: 1.6, margin: 0 }}>{r.komentar}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = url
  })
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height
  const boxRatio = w / h
  let sx, sy, sw, sh
  if (imgRatio > boxRatio) {
    sh = img.height
    sw = sh * boxRatio
    sx = (img.width - sw) / 2
    sy = 0
  } else {
    sw = img.width
    sh = sw / boxRatio
    sx = 0
    sy = (img.height - sh) / 2
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ')
  let line = ''
  let curY = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY)
      line = word + ' '
      curY += lineHeight
    } else {
      line = test
    }
  }
  ctx.fillText(line, x, curY)
}

function ShareModal({ produk, toko, onClose, c }) {
  const [copied, setCopied] = useState(false)
  const isMobile = window.innerWidth < 640

  const produkUrl = `${window.location.origin}/${toko.slug}?produk=${produk.id}`
  const ogUrl = `${window.location.origin}/api/og?slug=${toko.slug}&produk=${produk.id}`
  const shareText = `${produk.nama} — ${formatRupiah(produk.harga)}\n${produkUrl}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(produkUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.createElement('textarea')
      el.value = produkUrl
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

 const handleShareIG = async () => {
  try {
    const canvas = document.createElement('canvas')
    const W = 1080, H = 1920
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#0a0a0f'
    ctx.fillRect(0, 0, W, H)

    // Load foto produk
    const fotoUrl = parseFotos(produk.foto)[0]
    if (fotoUrl) {
      const img = await loadImage(fotoUrl)
      // Cover-fit gambar produk ke area atas (misal 1080x1350)
      drawImageCover(ctx, img, 0, 0, W, 1350)
    }

    // Overlay gradient bawah biar teks kebaca
    const gradient = ctx.createLinearGradient(0, 1200, 0, H)
    gradient.addColorStop(0, 'rgba(10,10,15,0)')
    gradient.addColorStop(1, 'rgba(10,10,15,1)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 1200, W, H - 1200)

    // Nama produk
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 56px sans-serif'
    wrapText(ctx, produk.nama, 60, 1480, W - 120, 64)

    // Harga
    ctx.fillStyle = '#5b8af5'
    ctx.font = 'bold 64px sans-serif'
    ctx.fillText(formatRupiah(produk.harga), 60, 1620)

    // Nama toko + CTA
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    ctx.font = '36px sans-serif'
    ctx.fillText(`${toko.nama} — Cek link di bio`, 60, 1700)

    canvas.toBlob(async (blob) => {
      const file = new File([blob], 'produk.png', { type: 'image/png' })
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file] })
        } catch (err) {
          if (err.name !== 'AbortError') console.error(err)
        }
      } else {
        // Fallback: download gambar kalau device gak support share file
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = 'produk.png'
        link.click()
      }
    }, 'image/png')
  } catch (err) {
    console.error('Gagal generate gambar story:', err)
  }
}
  
  const channels = [
    {
      key: 'wa',
      label: 'WhatsApp',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      ),
      color: '#25d366',
      action: () => window.open(generateShareProdukWA(produk, toko), '_blank'),
    },
    {
      key: 'threads',
      label: 'Threads',
      icon: (
        <svg width="22" height="22" viewBox="0 0 192 192" fill="currentColor">
          <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143C137.537 61.538 122.616 45.905 97.562 45.745H97.222c-14.968 0-27.414 6.396-35.059 18.036l13.177 9.048c5.728-8.695 14.724-10.548 21.882-10.548h.23c8.441.054 14.786 2.509 18.868 7.295 2.985 3.493 4.981 8.318 5.97 14.396-7.487-1.271-15.576-1.662-24.215-1.17-24.33 1.4-39.956 15.591-38.89 35.273.538 9.983 5.568 18.577 14.176 24.199 7.243 4.784 16.576 7.139 26.288 6.604 12.83-.703 22.889-5.603 29.909-14.572 5.362-6.963 8.749-15.978 10.245-27.397 6.147 3.71 10.705 8.595 13.184 14.374 4.237 9.853 4.491 26.021-8.79 39.241-11.774 11.73-25.963 16.809-47.317 16.966-23.615-.169-41.491-7.763-53.134-22.572C28.371 128.66 22.947 110.017 22.725 96c.222-14.017 5.646-32.66 17.472-47.16C51.84 34.183 69.716 26.589 93.331 26.42c23.76.17 41.924 7.798 54.073 22.688 5.953 7.376 10.474 16.53 13.451 27.056l15.45-4.14c-3.6-13.229-9.187-24.53-16.676-33.668C145.932 19.216 122.927 9.248 93.4 9.044h-.13c-29.456.204-52.291 10.232-67.939 29.812C13.553 54.18 7.17 75.68 6.923 96c.247 20.32 6.63 42 17.408 57.144 15.648 19.58 38.483 29.608 67.939 29.812h.13c26.545-.184 45.24-7.084 60.637-22.419 20.1-20.028 19.468-44.917 12.874-60.249-4.706-10.9-13.88-19.79-24.374-25.3zM96.45 129.03c-10.655.603-21.948-4.175-26.975-11.625-3.253-4.768-3.696-10.52-.88-15.886 3.696-7.01 12.687-11.187 23.818-11.82 1.763-.102 3.496-.152 5.2-.152 6.04 0 11.664.569 16.703 1.67-.988 12.34-4.52 21.516-10.282 27.283-3.81 3.79-8.812 6.11-14.594 6.47l-2.99.06z"/>
        </svg>
      ),
      color: '#000000',
      action: () => window.open(`https://www.threads.net/intent/post?text=${encodeURIComponent(shareText)}`, '_blank'),
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.994 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      color: '#1877f2',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(ogUrl)}`, '_blank'),
    },
    {
      key: 'ig-stories',
      label: 'IG Stories',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
        </svg>
      ),
      color: '#e1306c',
      action: handleShareIG,
    },
    {
      key: 'copy',
      label: copied ? 'Tersalin!' : 'Salin Link',
      icon: copied ? <Check size={22} /> : <Copy size={22} />,
      color: copied ? '#34d399' : '#6b7280',
      action: handleCopyLink,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 800, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 24 }}
    >
      <motion.div
        initial={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        animate={isMobile ? { y: 0 } : { scale: 1, opacity: 1 }}
        exit={isMobile ? { y: '100%' } : { scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: isMobile ? '100%' : 400, background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: isMobile ? 'var(--radius-2xl) var(--radius-2xl) 0 0' : 'var(--radius-2xl)', overflow: 'hidden' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Share2 size={17} color="var(--accent)" />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', color: c.textPrimary }}>Bagikan Produk</span>
          </div>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></motion.button>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          {parseFotos(produk.foto)[0]
            ? <img src={parseFotos(produk.foto)[0]} alt={produk.nama} style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-md)', background: c.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Package size={18} color={c.textTertiary} /></div>
          }
          <div style={{ minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.82rem', color: c.textPrimary, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{produk.nama}</p>
            <p style={{ fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 800 }}>{formatRupiah(produk.harga)}</p>
          </div>
        </div>

        <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {channels.map(ch => (
            <motion.button
              key={ch.key}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={ch.action}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 8px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-lg)', cursor: 'pointer', color: ch.color }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 'var(--radius-full)', background: ch.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ch.color, flexShrink: 0 }}>
                {ch.icon}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: c.textSecondary, textAlign: 'center', lineHeight: 1.2 }}>{ch.label}</span>
            </motion.button>
          ))}
        </div>

        <div style={{ padding: '0 20px 20px', display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, padding: '8px 12px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-md)', fontSize: '0.72rem', color: c.textTertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {produkUrl}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCopyLink}
            style={{ flexShrink: 0, padding: '8px 14px', background: copied ? 'rgba(52,211,153,0.15)' : c.surface, border: `2px solid ${copied ? 'rgba(52,211,153,0.3)' : c.borderCard}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', color: copied ? '#34d399' : c.textSecondary, fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Tersalin' : 'Salin'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function StorefrontPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const [toko, setToko] = useState(null)
  const [produk, setProduk] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filterKat, setFilterKat] = useState('all')
  const [selectedProduk, setSelectedProduk] = useState(null)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [trackingOpen, setTrackingOpen] = useState(false)
  const [ongkirOpen, setOngkirOpen] = useState(false)
  const [liveSession, setLiveSession] = useState(null)
  const [initialResi, setInitialResi] = useState('')
  const [shareTarget, setShareTarget] = useState(null)

  const [bundles, setBundles] = useState([])
  const [flashProduk, setFlashProduk] = useState([])
  const [countdown, setCountdown] = useState({})

  const { theme, toggleTheme } = useTheme()
  const c = THEMES[theme]

  const debouncedSearch = useDebounce(search, 300)

  // ========== TAMBAHAN: Shake-to-Refresh & Parallax ==========
  const parallaxOffset = useParallax(0.05)
  const handleShake = useCallback(() => {
    if (toko?.id) {
      fireConfetti()
      loadStorefront()
    }
  }, [toko?.id])
  useShakeDetection(handleShake, 18)
  // ========== AKHIR TAMBAHAN ==========

  // ========== TAMBAHAN: GSAP ScrollTrigger & Stagger ==========
  useEffect(() => {
    if (!loading && produk.length > 0) {
      // Stagger animation saat load
      gsap.fromTo('.produk-card', 
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          duration: 0.5,
          ease: 'power2.out'
        }
      )

      // ScrollTrigger untuk auto reveal
      ScrollTrigger.batch('.produk-card', {
        onEnter: (elements) => {
          gsap.fromTo(elements,
            { y: 50, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'power2.out' }
          )
        },
        start: 'top 90%',
        once: true
      })
    }

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill())
    }
  }, [loading, produk])
  // ========== AKHIR TAMBAHAN ==========

  useEffect(() => {
    if (toko?.id) {
      trafficApi.trackVisit(toko.id).catch(() => {})
    }
  }, [toko?.id])

  useEffect(() => {
    const produkParam = searchParams.get('produk')
    if (produkParam && produk.length > 0) {
      const found = produk.find(p => String(p.id) === String(produkParam))
      if (found) setSelectedProduk(found)
    }
  }, [produk])
  
  useEffect(() => {
    const resiParam = searchParams.get('resi')
    if (resiParam) { setInitialResi(resiParam); setTrackingOpen(true) }

    const existing = document.querySelector('link[rel="manifest"]')
    if (existing) existing.remove()
    const link = document.createElement('link')
    link.rel = 'manifest'
    link.href = `/api/manifest?slug=${slug}`
    document.head.appendChild(link)

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: `/${slug}/` })
        .catch(() => navigator.serviceWorker.register('/sw.js'))
    }

    loadStorefront()

    return () => {
      const l = document.querySelector('link[rel="manifest"]')
      if (l) l.remove()
      const restore = document.createElement('link')
      restore.rel = 'manifest'
      restore.href = '/manifest.json'
      document.head.appendChild(restore)
    }
  }, [slug])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const liveRes = await liveApi.getActiveSessions(null)
        const sesi = (liveRes.data || []).find(s => s.toko_id === toko?.id)
        setLiveSession(sesi || null)
      } catch {}
    }, 15000)
    return () => clearInterval(interval)
  }, [toko])

  useEffect(() => {
    if (!flashProduk.length) return
    const interval = setInterval(() => {
      const now = new Date()
      const next = {}
      flashProduk.forEach(p => {
        if (!p.flashSaleUntil) return
        const diff = new Date(p.flashSaleUntil) - now
        if (diff <= 0) {
          next[p.id] = null
          return
        }
        const h = Math.floor(diff / 3600000)
        const m = Math.floor((diff % 3600000) / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        next[p.id] = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      })
      setCountdown(next)
    }, 1000)
    return () => clearInterval(interval)
  }, [flashProduk])

  const getFlashInfo = (produkId) => {
    return flashProduk.find(fp => fp.id === produkId) || null
  }

  const loadStorefront = async () => {
    setLoading(true)
    try {
      const [tokoRes, produkRes] = await Promise.all([
        tokoApi.getBySlug(slug),
        produkApi.getByToko(slug),
      ])
      const tokoData = tokoRes.data ? { ...tokoRes.data, wa: safeWA(tokoRes.data.wa) } : null
      setToko(tokoData)
      setProduk((produkRes.data || []).filter(p => p.aktif === true || p.aktif === 'TRUE'))

      if (tokoData?.id) {
        const [bundleRes, flashRes] = await Promise.all([
          bundleApi.getByToko(tokoData.id),
          flashSaleApi.getActive(tokoData.id),
        ])
        if (bundleRes.success) setBundles(bundleRes.data)
        if (flashRes.success) setFlashProduk(flashRes.data)
      }

      try {
        const liveRes = await liveApi.getActiveSessions(null)
        const sesi = (liveRes.data || []).find(s => s.toko_id === tokoData?.id)
        setLiveSession(sesi || null)
      } catch {}
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const tema = TEMA[toko?.tema] || TEMA.default
  const accentColor = (tema.accent === '#f59e0b' && theme === 'light') ? '#b45309' : tema.accent

  const kategoriList = useMemo(() => [...new Set(produk.map(p => p.kategori).filter(Boolean))], [produk])
  
  const filtered = useMemo(() => {
    return produk.filter(p => {
      const matchSearch = !debouncedSearch || p.nama.toLowerCase().includes(debouncedSearch.toLowerCase()) || p.deskripsi?.toLowerCase().includes(debouncedSearch.toLowerCase())
      const matchKat = filterKat === 'all' || p.kategori === filterKat
      return matchSearch && matchKat
    })
  }, [produk, debouncedSearch, filterKat])

  if (loading) return <StorefrontSkeleton c={c} />

  if (error || !toko) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <Store size={48} color="var(--text-tertiary)" />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Toko tidak ditemukan</h2>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 320 }}>Toko dengan alamat <strong>/{slug}</strong> tidak ada atau sudah dihapus.</p>
        <a href="/" className="btn btn-primary btn-sm">Kembali ke Beranda</a>
      </div>
    )
  }

  if (toko.aktif === false || toko.aktif === 'FALSE') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
        <TokoAvatar toko={toko} tema={tema} c={c} size={64} radius={18} fontSize={26} />
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: c.textPrimary }}>{toko.nama}</h2>
        <p style={{ color: c.textSecondary, maxWidth: 320 }}>Toko ini sedang tidak aktif sementara. Silakan cek kembali nanti.</p>
        {toko.wa && <a href={generateWALink(toko.wa)} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ background: '#25d366', color: '#fff', border: 'none' }}><MessageCircle size={14} /> Hubungi Penjual</a>}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: c.bgPrimary, paddingBottom: 56 }}>
      <style>{`
        .produk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 500px) { .produk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 700px) { .produk-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1000px) { .produk-grid { grid-template-columns: repeat(5, 1fr); } }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>

      {/* ========== TAMBAHAN: Parallax decorative blobs ========== */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 400, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <motion.div
          animate={{ x: parallaxOffset.x * 2, y: parallaxOffset.y * 2 }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          style={{
            position: 'absolute', top: -100, right: -100,
            width: 300, height: 300, borderRadius: '50%',
            background: `${accentColor}22`, filter: 'blur(60px)',
          }}
        />
        <motion.div
          animate={{ x: -parallaxOffset.x * 1.5, y: -parallaxOffset.y * 1.5 }}
          transition={{ type: 'spring', stiffness: 50, damping: 30 }}
          style={{
            position: 'absolute', top: 100, left: -80,
            width: 250, height: 250, borderRadius: '50%',
            background: `${tema.accent2}22`, filter: 'blur(60px)',
          }}
        />
      </div>
      {/* ========== AKHIR TAMBAHAN ========== */}

      <div style={{ position: 'relative', background: `linear-gradient(180deg, ${accentColor}22 0%, transparent 100%)`, borderBottom: `3px solid ${c.borderCard}`, padding: '20px 16px 16px', zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <TokoAvatar toko={toko} tema={tema} c={c} size={52} radius={14} fontSize={22} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(1rem, 5vw, 1.4rem)', letterSpacing: '-0.02em', lineHeight: 1.2, color: c.textPrimary }}>{toko.nama}</h1>
                {toko.plan === 'pro' && <span style={{ background: tema.gradient, color: '#fff', fontSize: '0.62rem', fontWeight: 800, padding: '2px 7px', borderRadius: 'var(--radius-full)', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>⭐ PRO</span>}
              </div>
              {toko.deskripsi && <p style={{ color: c.textSecondary, fontSize: '0.8rem', lineHeight: 1.4, marginBottom: 4 }}>{toko.deskripsi}</p>}
              <p style={{ color: c.textTertiary, fontSize: '0.72rem' }}>{produk.length} produk tersedia</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 15 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleTheme}
                title={theme === 'light' ? 'Tema gelap' : 'Tema terang'}
                style={{ width: 36, height: 36, borderRadius: '50%', background: c.surface, border: `2px solid ${c.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: c.textSecondary, flexShrink: 0 }}
              >
                {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
              </motion.button>
              {/* ========== TAMBAHAN: Magnetic Button pada Chat ========== */}
              <MagneticButton strength={0.35}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setChatOpen(null)}
                  className="btn btn-sm"
                  style={{ background: tema.gradient, color: '#fff', border: 'none', boxShadow: `0 4px 12px ${accentColor}44`, flexShrink: 0, padding: '7px 12px' }}
                >
                  <MessageCircle size={13} />
                </motion.button>
              </MagneticButton>
              {/* ========== AKHIR TAMBAHAN ========== */}
            </div>
          </div>

          {toko.pengumuman && (
            <div style={{ marginTop: 12, padding: '8px 12px', background: `${accentColor}15`, border: `2px solid ${accentColor}33`, borderRadius: 'var(--radius-md)', fontSize: '0.8rem', color: c.textSecondary, lineHeight: 1.5 }}>
              📢 {toko.pengumuman}
            </div>
          )}

          {liveSession && (
            <motion.a
              whileHover={{ scale: 1.02 }}
              href={`/${toko.slug}/live`}
              style={{ marginTop: 10, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#ef4444' }}>LIVE SEKARANG</span>
                <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>{liveSession.title}</span>
              </div>
              <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 700 }}>Tonton →</span>
            </motion.a>
          )}

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setTrackingOpen(true)}
            style={{ marginTop: 10, padding: '8px 12px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Truck size={14} color={accentColor} />
              <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>Lacak pesananmu</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700 }}>→</span>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            onClick={() => setOngkirOpen(true)}
            style={{ marginTop: 6, padding: '8px 12px', background: c.surface, border: `2px solid ${c.borderCard}`, borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <MapPin size={14} color={accentColor} />
              <span style={{ fontSize: '0.78rem', color: c.textSecondary }}>Estimasi ongkir</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: accentColor, fontWeight: 700 }}>→</span>
          </motion.div>
        </div>
      </div>

      <div style={{ position: 'relative', maxWidth: 900, margin: '0 auto', padding: '16px 16px 80px', zIndex: 1 }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.textTertiary, pointerEvents: 'none' }} />
            <input className="form-input" style={{ paddingLeft: 36, border: '2px solid var(--glass-border)' }} placeholder="Cari produk..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {flashProduk.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: '0 0 16px',
              background: 'linear-gradient(135deg, #FF4E4E, #FF8C00)',
              borderRadius: 12, padding: '12px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              border: '3px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>⚡</span>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Flash Sale Aktif</div>
                <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>
                  {flashProduk.length} produk diskon terbatas
                </div>
              </div>
            </div>
            {countdown[flashProduk[0]?.id] && (
              <div style={{
                background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                padding: '6px 10px', textAlign: 'center',
              }}>
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9, letterSpacing: '0.05em' }}>BERAKHIR</div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, fontFamily: 'monospace' }}>
                  {countdown[flashProduk[0].id]}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {kategoriList.length > 1 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap', overflowX: 'auto', marginBottom: '16px', paddingBottom: 4, scrollbarWidth: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilterKat('all')}
              className="btn btn-sm"
              style={{ background: filterKat === 'all' ? accentColor + '22' : c.surface, color: filterKat === 'all' ? accentColor : c.textSecondary, border: `2px solid ${filterKat === 'all' ? accentColor + '44' : c.glassBorder}`, borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
            >
              Semua
            </motion.button>
            {kategoriList.map(k => (
              <motion.button
                key={k}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterKat(k)}
                className="btn btn-sm"
                style={{ background: filterKat === k ? accentColor + '22' : c.surface, color: filterKat === k ? accentColor : c.textSecondary, border: `2px solid ${filterKat === k ? accentColor + '44' : c.glassBorder}`, borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}
              >
                {k}
              </motion.button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: c.textSecondary }}>
            <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>{search ? 'Produk tidak ditemukan' : 'Belum ada produk'}</p>
          </div>
        ) : (
          <div className="produk-grid">
            {filtered.map((p, index) => (
              <ProdukCard
                key={p.id}
                produk={p}
                toko={toko}
                tema={tema}
                accentColor={accentColor}
                c={c}
                index={index}
                onClick={() => setSelectedProduk(p)}
                onShare={() => setShareTarget(p)}
                flashProduk={flashProduk}
                countdown={countdown}
                getFlashInfo={getFlashInfo}
              />
            ))}
          </div>
        )}

        {bundles.length > 0 && (
          <div style={{ margin: '24px 0' }}>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 12 }}>
              🎁 Paket Bundle
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {bundles.map((bundle, i) => {
                const produkDiBundle = produk.filter(p => bundle.produkIds.includes(p.id))
                const totalNormal = produkDiBundle.reduce((s, p) => s + Number(p.harga), 0)
                const hemat = totalNormal - bundle.hargaBundle
                return (
                  <motion.div
                    key={bundle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    style={{
                      background: 'var(--surface)', border: `3px solid ${c.borderCard}`,
                      borderRadius: 12, padding: '14px 16px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
                          {bundle.nama}
                        </div>
                        {bundle.deskripsi && (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                            {bundle.deskripsi}
                          </div>
                        )}
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                          {produkDiBundle.map(p => p.nama).join(' + ')}
                        </div>
                        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                            Rp {Number(bundle.hargaBundle).toLocaleString('id-ID')}
                          </span>
                          {hemat > 0 && (
                            <>
                              <span style={{
                                fontSize: 11, color: 'var(--text-secondary)',
                                textDecoration: 'line-through',
                              }}>
                                Rp {totalNormal.toLocaleString('id-ID')}
                              </span>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: '#fff',
                                background: '#22c55e', padding: '2px 6px', borderRadius: 4,
                              }}>
                                Hemat Rp {hemat.toLocaleString('id-ID')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      {produkDiBundle.slice(0, 4).map(p => {
                        const fotoUrl = parseFotos(p.foto)[0]
                        return (
                          <div key={p.id} style={{
                            width: 44, height: 44, borderRadius: 8, overflow: 'hidden',
                            border: `2px solid ${c.borderCard}`, flexShrink: 0,
                            background: 'var(--surface)',
                          }}>
                            {fotoUrl ? (
                              <img src={fotoUrl} alt={p.nama} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* ========== TAMBAHAN: Magnetic Button pada Pesan Bundle ========== */}
                    <MagneticButton strength={0.25} style={{ width: '100%', marginTop: 12 }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const msg = `Halo ${toko.nama}, saya mau pesan bundle *${bundle.nama}*\n\nIsi bundle:\n${produkDiBundle.map(p => `- ${p.nama}`).join('\n')}\n\nTotal: Rp ${Number(bundle.hargaBundle).toLocaleString('id-ID')}\n\nMohon konfirmasi ya! 🙏`
                          const waClean = toko.wa.replace(/[^0-9]/g, '').replace(/^0/, '62').replace(/^8/, '628')
                          window.open(`https://wa.me/${waClean}?text=${encodeURIComponent(msg)}`, '_blank')
                        }}
                        style={{
                          width: '100%', padding: '10px',
                          borderRadius: 100, background: '#25D366', color: '#fff',
                          border: '2px solid rgba(255,255,255,0.2)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                      >
                        <span>💬</span> Pesan Bundle via WhatsApp
                      </motion.button>
                    </MagneticButton>
                    {/* ========== AKHIR TAMBAHAN ========== */}
                  </motion.div>
                )
              })}
            </div>
          </div>
        )}

        {toko.video && getYouTubeId(toko.video) && <div style={{ marginTop: 16 }}><VideoToko videoUrl={toko.video} c={c} /></div>}
      </div>

      <AnimatePresence>
        {selectedProduk && <ProdukModal produk={selectedProduk} toko={toko} tema={tema} accentColor={accentColor} c={c} onClose={() => setSelectedProduk(null)} onCheckout={(p) => { setSelectedProduk(null); setCheckoutOpen(p) }} onChat={(p) => { setSelectedProduk(null); setChatOpen(p) }} />}
      </AnimatePresence>
      <AnimatePresence>
        {checkoutOpen && <CheckoutModal produk={checkoutOpen} toko={toko} tema={tema} accentColor={accentColor} c={c} onClose={() => setCheckoutOpen(false)} getFlashInfo={getFlashInfo} />}
      </AnimatePresence>
      {chatOpen !== false && <ChatModal produk={chatOpen || null} toko={toko} tema={tema} onClose={() => setChatOpen(false)} onCheckout={(p) => { setChatOpen(false); setCheckoutOpen(p) }} semuaProduk={produk} />}
      <AnimatePresence>
        {trackingOpen && <TrackingModal onClose={() => { setTrackingOpen(false); setInitialResi('') }} initialResi={initialResi} c={c} />}
      </AnimatePresence>
      <AnimatePresence>
        {ongkirOpen && <OngkirModal onClose={() => setOngkirOpen(false)} c={c} />}
      </AnimatePresence>
      <AnimatePresence>
        {shareTarget && <ShareModal produk={shareTarget} toko={toko} onClose={() => setShareTarget(null)} c={c} />}
      </AnimatePresence>
      {toko.musik && <MusicPlayer musikUrl={toko.musik} tema={tema} c={c} />}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: c.footerBg, backdropFilter: 'blur(16px)', borderTop: `3px solid ${c.footerBorder}`, padding: '8px 16px', textAlign: 'center', fontSize: '0.72rem', color: c.textPrimary }}>
        Powered by <a href="/" style={{ color: '#3B82F6', fontWeight: 700 }}>Exora</a>
      </div>
    </div>
  )
}

function TokoAvatar({ toko, tema, c, size = 52, radius = 14, fontSize = 22 }) {
  if (toko.logo) return (
    <motion.img
      whileHover={{ scale: 1.1 }}
      src={toko.logo}
      alt={toko.nama}
      loading="lazy"
      style={{ width: size, height: size, borderRadius: radius, objectFit: 'cover', flexShrink: 0, border: `3px solid ${c.borderCard}`, boxShadow: `0 0 20px ${tema.accent}44` }}
    />
  )
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      style={{ width: size, height: size, borderRadius: radius, flexShrink: 0, background: tema.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 900, fontSize, color: '#fff', boxShadow: `0 0 20px ${tema.accent}44`, border: `3px solid ${c.borderCard}` }}
    >
      {toko.nama?.[0]?.toUpperCase()}
    </motion.div>
  )
}

function ProdukCard({ produk: p, toko, tema, accentColor, c, onClick, onShare, flashProduk, countdown, getFlashInfo, index }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null
  
  return (
    <motion.div
      className="produk-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      style={{ position: 'relative', background: c.glass, backdropFilter: 'blur(20px)', border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-xl)', overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-card)' }}
    >
      <div style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', background: c.surface }}>
        {thumbUrl ? (
          <img
            src={cloudinaryThumb(thumbUrl, 300, 400)}
            alt={p.nama}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.textTertiary }}>
            <Package size={32} />
          </div>
        )}
        {fotos.length > 1 && <div style={{ position: 'absolute', bottom: 5, right: 5, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', borderRadius: 'var(--radius-full)', padding: '1px 6px', fontSize: '0.6rem', fontWeight: 700, color: '#fff' }}>1/{fotos.length}</div>}
        {diskon && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            style={{ position: 'absolute', top: 6, left: 6, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: 'var(--radius-full)' }}
          >
            -{diskon}%
          </motion.div>
        )}
        {p.stok === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span className="badge badge-danger" style={{ fontSize: '0.65rem' }}>Habis</span></div>}

        {(() => {
          const flash = getFlashInfo(p.id)
          if (!flash || !countdown[p.id]) return null
          return (
            <motion.div
              initial={{ y: 50 }}
              animate={{ y: 0 }}
              style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'linear-gradient(135deg, #FF4E4E, #FF8C00)',
                padding: '4px 8px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '2px solid rgba(255,255,255,0.2)',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 11 }}>
                 Rp {Number(flash.hargaFlash).toLocaleString('id-ID')}
              </span>
              <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 10, fontFamily: 'monospace' }}>
                {countdown[p.id]}
              </span>
            </motion.div>
          )
        })()}
      </div>
      <div style={{ padding: '10px' }}>
        <p style={{ fontWeight: 700, fontSize: '0.78rem', marginBottom: 3, lineHeight: 1.3, color: c.textPrimary }}>{truncate(p.nama, 30)}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
          <p style={{ fontWeight: 800, color: accentColor, fontSize: '0.82rem' }}>{formatRupiah(p.harga)}</p>
          {p.hargaCoret && <p style={{ fontSize: '0.65rem', color: c.textTertiary, textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>}
        </div>
      </div>
      <motion.button
        whileHover={{ scale: 1.1, rotate: 15 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => { e.stopPropagation(); onShare() }}
        title="Bagikan produk ini"
        style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
      >
        <Share2 size={14} />
      </motion.button>
    </motion.div>
  )
}

function ProdukModal({ produk: p, toko, tema, accentColor, c, onClose, onCheckout, onChat }) {
  const fotos = parseFotos(p.foto)
  const diskon = p.hargaCoret ? Math.round((1 - p.harga / p.hargaCoret) * 100) : null
  const sold = p.stok === 0
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, margin: '0 auto', background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0', overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', aspectRatio: '4/3', overflow: 'hidden', background: c.surface, flexShrink: 0 }}>
          <PhotoCarousel fotos={fotos} nama={p.nama} c={c} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', border: '2px solid rgba(255,255,255,0.15)', borderRadius: 'var(--radius-full)', padding: '7px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
          >
            <X size={15} />
          </motion.button>
          {diskon && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ position: 'absolute', top: 10, left: 10, background: '#ef4444', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '3px 9px', borderRadius: 'var(--radius-full)', zIndex: 10 }}
            >
              -{diskon}%
            </motion.div>
          )}
        </div>
        <div style={{ padding: '20px 20px 0', overflowY: 'auto', flex: 1 }}>
          {p.kategori && <p style={{ fontSize: '0.7rem', color: c.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{p.kategori}</p>}
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem', marginBottom: 8, color: c.textPrimary }}>{p.nama}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', color: accentColor }}>{formatRupiah(p.harga)}</p>
            {p.hargaCoret && <p style={{ fontSize: '0.82rem', color: c.textTertiary, textDecoration: 'line-through' }}>{formatRupiah(p.hargaCoret)}</p>}
          </div>
          {p.stok !== null && <p style={{ fontSize: '0.78rem', color: p.stok === 0 ? 'var(--danger)' : p.stok < 5 ? 'var(--warning)' : 'var(--success)', marginBottom: 10 }}>{p.stok === 0 ? '✕ Stok habis' : p.stok < 5 ? `⚠ Sisa ${p.stok} stok` : `✓ Stok tersedia (${p.stok})`}</p>}
          {p.deskripsi && <p style={{ color: c.textSecondary, fontSize: '0.875rem', lineHeight: 1.7, marginBottom: 12, whiteSpace: 'pre-line' }}>{p.deskripsi}</p>}
          {p.berat && <p style={{ fontSize: '0.75rem', color: c.textTertiary, marginBottom: 8 }}>Berat: {p.berat}g</p>}
          <RatingSection produkId={p.id} tokoId={toko.id} tema={tema} c={c} />
          <div style={{ height: 20 }} />
        </div>
        <div style={{ padding: '12px 16px', borderTop: `3px solid ${c.borderCard}`, display: 'flex', gap: 10, alignItems: 'center', background: c.bgSecondary }}>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onChat(p)}
            className="btn btn-secondary btn-icon"
            style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 'var(--radius-md)', border: '2px solid var(--glass-border)' }}
            title="Tanya Penjual"
          >
            <MessageCircle size={18} />
          </motion.button>
          {/* ========== TAMBAHAN: Magnetic Button pada Beli Sekarang ========== */}
          <MagneticButton strength={0.2} style={{ flex: 1 }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !sold && onCheckout(p)}
              disabled={sold}
              style={{ width: '100%', height: 44, background: sold ? c.surface : tema.gradient, color: sold ? c.textTertiary : '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', cursor: sold ? 'not-allowed' : 'pointer', boxShadow: sold ? 'none' : `0 4px 20px ${accentColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <ShoppingBag size={16} />
              {sold ? 'Stok Habis' : 'Beli Sekarang'}
            </motion.button>
          </MagneticButton>
          {/* ========== AKHIR TAMBAHAN ========== */}
        </div>
      </motion.div>
    </motion.div>
  )
}

function CheckoutModal({ produk: p, toko, tema, accentColor, c, onClose, getFlashInfo }) {
  const fotos = parseFotos(p.foto)
  const thumbUrl = fotos[0] || null
  const [form, setForm] = useState({ nama: '', wa: '', alamat: '', catatan: '', qty: 1 })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const [voucherKode, setVoucherKode] = useState('')
  const [voucherApplied, setVoucherApplied] = useState(null)
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherError, setVoucherError] = useState('')

  const set = (field, val) => { setForm(f => ({ ...f, [field]: val })); if (errors[field]) setErrors(e => ({ ...e, [field]: null })) }
  const maxQty = p.stok || 99

  const flashInfo = getFlashInfo ? getFlashInfo(p.id) : null
  const hargaEfektif = flashInfo?.hargaFlash || p.harga

  const validate = () => {
    const e = {}
    if (!form.nama.trim()) e.nama = 'Nama wajib diisi'
    if (!form.wa.trim()) e.wa = 'Nomor WA wajib diisi'
    if (form.wa && !validateWA(String(form.wa))) e.wa = 'Format WA tidak valid'
    if (!form.alamat.trim()) e.alamat = 'Alamat wajib diisi'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleApplyVoucher = async () => {
    if (!voucherKode.trim()) return
    setVoucherLoading(true)
    setVoucherError('')
    setVoucherApplied(null)
    try {
      const totalBelanja = hargaEfektif * (form.qty || 1)
      const res = await voucherApi.validate(toko.id, voucherKode.trim(), totalBelanja)
      if (res.success) {
        setVoucherApplied(res.data)
        fireConfetti() // ========== TAMBAHAN: Confetti saat voucher berhasil ==========
      }
      else setVoucherError(res.message || 'Voucher tidak valid')
    } catch (e) {
      setVoucherError(e.message || 'Voucher tidak valid')
    }
    setVoucherLoading(false)
  }

  const handleCheckout = async () => {
    if (!validate()) return
    setSubmitting(true)
    try {
      await pesananApi.create({ tokoId: toko.id, produkId: p.id, produkNama: p.nama, harga: hargaEfektif, qty: form.qty, total: hargaEfektif * form.qty, buyerNama: form.nama, buyerWa: form.wa, buyerAlamat: form.alamat, catatan: form.catatan || '' })
      const message = generateCheckoutMessage(p, toko, form) + `${voucherApplied ? `\n🎟️ Voucher: ${voucherApplied.kode} (-Rp ${Number(voucherApplied.diskon).toLocaleString('id-ID')})\n💰 Total Bayar: Rp ${Number(voucherApplied.totalSetelahDiskon).toLocaleString('id-ID')}` : ''}`
      const link = generateWALink(toko.wa, message)
      fireConfetti() // ========== TAMBAHAN: Confetti saat checkout berhasil ==========
      window.open(link, '_blank')
      onClose()
    } catch (err) { alert('Gagal menyimpan pesanan: ' + err.message) }
    finally { setSubmitting(false) }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 600, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, margin: '0 auto', background: c.bgSecondary, border: `3px solid ${c.borderCard}`, borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0', maxHeight: '92vh', overflow: 'auto' }}
      >
        <div style={{ padding: '16px 20px', borderBottom: `3px solid ${c.borderCard}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: c.bgSecondary, zIndex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: c.textPrimary }}>Detail Pesanan</h3>
          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={onClose} className="btn btn-ghost btn-icon btn-sm"><X size={16} /></motion.button>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', padding: '12px', background: c.surface, borderRadius: 'var(--radius-lg)', border: `3px solid ${c.borderCard}` }}>
            {thumbUrl && <img src={thumbUrl} alt={p.nama} loading="lazy" style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3, color: c.textPrimary }}>{p.nama}</p>
              <p style={{ color: accentColor, fontWeight: 800, fontSize: '0.9rem' }}>{formatRupiah(hargaEfektif)}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => set('qty', Math.max(1, form.qty - 1))}
                style={{ width: 36, height: 36, borderRadius: '50%', background: c.surfaceHover, border: `2px solid ${c.glassBorder}`, cursor: 'pointer', color: c.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Minus size={12} />
              </motion.button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center', fontSize: '0.9rem', color: c.textPrimary }}>{form.qty}</span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => set('qty', Math.min(maxQty, form.qty + 1))}
                style={{ width: 36, height: 36, borderRadius: '50%', background: c.surfaceHover, border: `2px solid ${c.glassBorder}`, cursor: 'pointer', color: c.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Plus size={12} />
              </motion.button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Nama Lengkap *</label>
            <input className={`form-input ${errors.nama ? 'error' : ''}`} placeholder="Nama penerima" value={form.nama} onChange={e => set('nama', e.target.value)} style={{ border: '2px solid var(--glass-border)' }} />
            {errors.nama && <span className="form-error">{errors.nama}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WhatsApp *</label>
            <input className={`form-input ${errors.wa ? 'error' : ''}`} placeholder="081234567890" value={form.wa} onChange={e => set('wa', e.target.value)} style={{ border: '2px solid var(--glass-border)' }} />
            {errors.wa && <span className="form-error">{errors.wa}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Alamat Pengiriman *</label>
            <textarea className={`form-input form-textarea ${errors.alamat ? 'error' : ''}`} placeholder="Alamat lengkap pengiriman..." value={form.alamat} onChange={e => set('alamat', e.target.value)} rows={3} style={{ border: '2px solid var(--glass-border)' }} />
            {errors.alamat && <span className="form-error">{errors.alamat}</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Catatan (Opsional)</label>
            <input className="form-input" placeholder="Warna, ukuran, atau permintaan khusus..." value={form.catatan} onChange={e => set('catatan', e.target.value)} style={{ border: '2px solid var(--glass-border)' }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em' }}>
              KODE VOUCHER
            </label>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                value={voucherKode}
                onChange={e => { setVoucherKode(e.target.value.toUpperCase()); setVoucherApplied(null); setVoucherError('') }}
                placeholder="Masukkan kode voucher"
                disabled={!!voucherApplied}
                style={{
                  flex: 1, padding: '9px 12px',
                  background: 'var(--input-bg)', border: `2px solid ${voucherApplied ? '#22c55e' : 'var(--border)'}`,
                  borderRadius: 8, color: 'var(--text)', fontSize: 13,
                  fontFamily: 'monospace', letterSpacing: '0.05em',
                }}
              />
              {voucherApplied ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setVoucherApplied(null); setVoucherKode('') }}
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: 12,
                    background: 'transparent', border: '2px solid var(--border-danger)',
                    color: 'var(--danger)', cursor: 'pointer', whiteSpace: 'nowrap',
                  }}
                >Hapus</motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyVoucher}
                  disabled={voucherLoading || !voucherKode.trim()}
                  style={{
                    padding: '9px 14px', borderRadius: 8, fontSize: 12,
                    background: 'var(--accent)', color: '#fff',
                    border: '2px solid var(--accent)', cursor: 'pointer', whiteSpace: 'nowrap',
                    opacity: voucherLoading || !voucherKode.trim() ? 0.6 : 1,
                  }}
                >{voucherLoading ? '...' : 'Pakai'}</motion.button>
              )}
            </div>

            {voucherError && (
              <div style={{ fontSize: 11, color: 'var(--danger)', marginTop: 4 }}>{voucherError}</div>
            )}

            {voucherApplied && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  marginTop: 8, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                  ✓ Voucher {voucherApplied.kode} berhasil dipakai
                </span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                  -Rp {Number(voucherApplied.diskon).toLocaleString('id-ID')}
                </span>
              </motion.div>
            )}

            {voucherApplied && (
              <div style={{
                marginTop: 6, display: 'flex', justifyContent: 'space-between',
                padding: '8px 0', borderTop: '2px solid var(--border)',
              }}>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Total setelah diskon</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)' }}>
                  Rp {Number(voucherApplied.totalSetelahDiskon).toLocaleString('id-ID')}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px', background: `${accentColor}12`, border: `3px solid ${accentColor}22`, borderRadius: 'var(--radius-lg)' }}>
            <span style={{ fontWeight: 700, color: c.textPrimary }}>Total</span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.05rem', color: accentColor }}>{formatRupiah(hargaEfektif * form.qty)}</span>
          </div>
          {/* ========== TAMBAHAN: Magnetic Button pada tombol Checkout ========== */}
          <MagneticButton strength={0.2} style={{ width: '100%' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCheckout}
              disabled={submitting}
              style={{ width: '100%', height: 48, background: submitting ? c.surface : tema.gradient, color: submitting ? c.textTertiary : '#fff', border: 'none', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: submitting ? 'none' : `0 4px 24px ${accentColor}44` }}
            >
              <MessageCircle size={17} />
              {submitting ? 'Menyimpan...' : 'Lanjut ke WhatsApp Penjual'}
            </motion.button>
          </MagneticButton>
          {/* ========== AKHIR TAMBAHAN ========== */}
          <p style={{ textAlign: 'center', color: c.textTertiary, fontSize: '0.72rem' }}>Kamu akan diarahkan ke WhatsApp penjual dengan detail pesanan otomatis</p>
        </div>
      </motion.div>
    </motion.div>
  )
}

function StorefrontSkeleton({ c }) {
  return (
    <div style={{ minHeight: '100vh', background: c.bgPrimary }}>
      <style>{`
        .produk-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 500px) { .produk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 700px) { .produk-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1000px) { .produk-grid { grid-template-columns: repeat(5, 1fr); } }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      <div style={{ padding: '20px 16px', borderBottom: `3px solid ${c.borderCard}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '14px', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ height: 20, width: '40%', marginBottom: 8, borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '60%', borderRadius: 6 }} />
          </div>
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px' }}>
        <div className="produk-grid">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton" style={{ aspectRatio: '3/4', borderRadius: 'var(--radius-xl)', border: `3px solid ${c.borderCard}` }} />
          ))}
        </div>
      </div>
    </div>
  )
}
