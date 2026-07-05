import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Store, ArrowRight, Bot, Sun, Moon, X, ZoomIn, Loader2 } from 'lucide-react'
import { useStreamStore } from '../lib/store.js'
import { getStorefrontUrl, getInitials } from '../lib/utils.js'
import { useTheme } from '../lib/useTheme.js'
import { produkApi } from '../lib/api/adminClient.js'
import ShowcaseChatModal from '../components/seller/ShowcaseChatModal.jsx'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'

const PJS = "'Plus Jakarta Sans', sans-serif"

// Theme tokens with enhanced borders
const THEMES = {
  light: {
    bgPage: '#ffffff',
    bgHeader: 'rgba(255,255,255,0.85)',
    bgSurface: '#f7f7f7',
    bgCard: '#ffffff',
    border: '#d1d5db',
    borderStrong: '#9ca3af',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#8a8a8a',
    accentSoftBg: 'rgba(55,138,221,0.1)',
    accentSoftBorder: 'rgba(55,138,221,0.3)',
    proBg: 'rgba(251,191,36,0.15)',
    proBorder: 'rgba(251,191,36,0.35)',
    proText: '#92400e',
    ctaShadow: '0 4px 14px rgba(12,68,124,0.18)',
    hoverShadow: '0 8px 24px rgba(12,68,124,0.08)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  dark: {
    bgPage: '#0b0b10',
    bgHeader: 'rgba(11,11,16,0.85)',
    bgSurface: '#15151c',
    bgCard: '#15151c',
    border: 'rgba(255,255,255,0.15)',
    borderStrong: 'rgba(255,255,255,0.25)',
    textPrimary: '#f5f5f7',
    textSecondary: '#c2c2c8',
    textTertiary: '#7a7a85',
    accentSoftBg: 'rgba(55,138,221,0.16)',
    accentSoftBorder: 'rgba(55,138,221,0.35)',
    proBg: 'rgba(251,191,36,0.18)',
    proBorder: 'rgba(251,191,36,0.4)',
    proText: '#fbbf24',
    ctaShadow: '0 4px 18px rgba(55,138,221,0.3)',
    hoverShadow: '0 8px 28px rgba(55,138,221,0.16)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
}

const NAVY = '#0C447C'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

// Skeleton Loading Component
function SkeletonCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        border: '2px solid var(--border)',
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        background: 'var(--bg-card)',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-surface)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 120, background: 'var(--bg-surface)', borderRadius: 4, marginBottom: 6 }} />
          <div style={{ height: 10, width: 80, background: 'var(--bg-surface)', borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ height: 12, background: 'var(--bg-surface)', borderRadius: 4, marginBottom: 8 }} />
      <div style={{ height: 12, background: 'var(--bg-surface)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
      <div style={{ height: 200, background: 'var(--bg-surface)', borderRadius: 8, marginTop: 12 }} />
    </motion.div>
  )
}

export default function ShowcasePage() {
  const navigate = useNavigate()
  const { showcase, showcaseLoading, loadShowcase } = useStreamStore()
  const { theme, toggleTheme } = useTheme()
  const c = THEMES[theme]
  const [lightboxImg, setLightboxImg] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [produkList, setProdukList] = useState([])
  const [scrollProgress, setScrollProgress] = useState(0)
  const [skeletonCount, setSkeletonCount] = useState(3)

  useEffect(() => {
    loadShowcase(activeTag ? { tag: activeTag } : {})
  }, [activeTag])

  // Scroll progress
  useEffect(() => {
    const fn = () => {
      const scrollY = window.scrollY
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTotal > 0 ? (scrollY / scrollTotal) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  // Update skeleton count based on viewport
  useEffect(() => {
    const updateSkeletonCount = () => {
      const height = window.innerHeight
      setSkeletonCount(Math.max(2, Math.floor(height / 300)))
    }
    updateSkeletonCount()
    window.addEventListener('resize', updateSkeletonCount)
    return () => window.removeEventListener('resize', updateSkeletonCount)
  }, [])

  const handleTagClick = (tag) => {
    setActiveTag(prev => (prev === tag ? null : tag))
  }

  // Close lightbox on Escape
  useEffect(() => {
    if (!lightboxImg) return
    const onKey = (e) => { if (e.key === 'Escape') setLightboxImg(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxImg])

  useEffect(() => {
    if (!showcase.length) return
    const tokoMap = {}
    showcase.forEach(p => {
      if (p.toko?.id) tokoMap[p.toko.id] = { slug: p.toko.slug, nama: p.toko.nama }
    })
    const tokoIds = Object.keys(tokoMap)
    Promise.all(tokoIds.map(id => produkApi.getByToko(id)))
      .then(results => {
        const all = results.flatMap((r, i) =>
          (r.data || []).map(p => ({ ...p, tokoSlug: tokoMap[tokoIds[i]].slug, tokoNama: tokoMap[tokoIds[i]].nama }))
        )
        setProdukList(all)
      })
      .catch(() => {})
  }, [showcase])

  return (
    <div style={{ minHeight: '100vh', background: c.bgPage, fontFamily: PJS, transition: 'background 0.25s ease' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 ${theme === 'light' ? 'rgba(55,138,221,0.4)' : 'rgba(55,138,221,0.6)'}; }
          50% { box-shadow: 0 0 0 12px ${theme === 'light' ? 'rgba(55,138,221,0)' : 'rgba(55,138,221,0)'}; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .pulse-animation { animation: pulse-glow 2s ease-in-out infinite; }
        .float-animation { animation: float 3s ease-in-out infinite; }
        .theme-transition { transition: all 0.25s ease; }
      `}</style>

      {/* Scroll Progress Bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '3px',
        background: ACCENT_GRADIENT,
        width: `${scrollProgress}%`,
        zIndex: 101,
        transition: 'width 0.1s ease-out',
        boxShadow: '0 0 10px rgba(55, 138, 221, 0.5)',
      }} />

      {/* Header */}
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: c.bgHeader, backdropFilter: 'blur(20px)',
          borderBottom: `2px solid ${c.border}`,
          padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          transition: 'background 0.25s ease, border-color 0.25s ease',
        }}
      >
        <motion.h1
          whileHover={{ scale: 1.02 }}
          style={{ fontFamily: PJS, fontSize: '1.2rem', fontWeight: 800, margin: 0, color: c.textPrimary, letterSpacing: '-0.02em', cursor: 'pointer' }}
        >
          Showcase <span style={{ color: theme === 'light' ? NAVY : BLUE }}>Exora</span>
        </motion.h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            whileHover={{ scale: 1.1, rotate: 15 }}
            whileTap={{ scale: 0.95 }}
            aria-label={theme === 'light' ? 'Ganti ke tema gelap' : 'Ganti ke tema terang'}
            title={theme === 'light' ? 'Tema gelap' : 'Tema terang'}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: `2px solid ${c.border}`,
              background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: c.textSecondary, transition: 'all 0.15s ease',
            }}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </motion.button>

          <motion.button
            onClick={() => navigate('/login')}
            whileHover={{ scale: 1.05, boxShadow: c.hoverShadow }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: ACCENT_GRADIENT, border: 'none', color: '#ffffff',
              padding: '8px 16px', borderRadius: '999px', fontFamily: PJS,
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: c.ctaShadow, transition: 'all 0.2s ease',
            }}
          >
            Gabung Exora
          </motion.button>
        </div>
      </motion.div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 8px 60px' }}>
        {activeTag && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: c.accentSoftBg, border: `2px solid ${c.accentSoftBorder}`,
              borderRadius: '12px', padding: '10px 14px', marginBottom: 16,
            }}
          >
            <span style={{ fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, color: theme === 'light' ? NAVY : BLUE }}>
              Menampilkan post dengan {activeTag}
            </span>
            <motion.button
              onClick={() => setActiveTag(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c.textTertiary, fontFamily: PJS, fontSize: '0.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <X size={13} /> Hapus filter
            </motion.button>
          </motion.div>
        )}

        {showcaseLoading && (
          <div>
            {Array(skeletonCount).fill(0).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {!showcaseLoading && showcase.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            style={{ textAlign: 'center', padding: '60px 20px' }}
          >
            <motion.div
              className="float-animation"
              style={{
                width: 56, height: 56, borderRadius: '14px',
                background: c.accentSoftBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', color: theme === 'light' ? NAVY : BLUE,
              }}
            >
              <Store size={24} />
            </motion.div>
            <p style={{ color: c.textTertiary, fontFamily: PJS, fontSize: '0.9rem', margin: 0 }}>
              {activeTag ? `Belum ada post dengan ${activeTag}.` : 'Belum ada produk yang ditampilkan.'}
            </p>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {showcase.map((post, index) => (
            <ShowcaseCard
              key={post.id}
              post={post}
              theme={theme}
              c={c}
              index={index}
              onAuthRequired={() => navigate('/login')}
              onImageClick={setLightboxImg}
              onTagClick={handleTagClick}
              activeTag={activeTag}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Lightbox / zoom overlay */}
      <AnimatePresence>
        {lightboxImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setLightboxImg(null)}
            style={{
              position: 'fixed', inset: 0, zIndex: 100,
              background: 'rgba(0,0,0,0.95)',
              backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 24, cursor: 'zoom-out',
            }}
          >
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.1, background: 'rgba(255,255,255,0.2)' }}
              whileTap={{ scale: 0.95 }}
              className="lightbox-close"
              onClick={(e) => { e.stopPropagation(); setLightboxImg(null) }}
              aria-label="Tutup"
              style={{
                position: 'absolute', top: 18, right: 18,
                width: 44, height: 44, borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <X size={22} />
            </motion.button>
            <motion.img
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              src={lightboxImg}
              alt=""
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain',
                borderRadius: 12, cursor: 'default',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button with Pulse */}
      <motion.button
        onClick={() => setShowChat(true)}
        className="pulse-animation"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.5 }}
        style={{
          position: 'fixed', bottom: 24, right: 20, zIndex: 50,
          width: 56, height: 56, borderRadius: '50%',
          background: ACCENT_GRADIENT, border: '3px solid rgba(255,255,255,0.2)',
          boxShadow: c.ctaShadow, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease',
        }}
      >
        <Bot size={24} color="#fff" />
      </motion.button>

      {showChat && (
        <ShowcaseChatModal
          onClose={() => setShowChat(false)}
          posts={showcase}
          produkList={produkList}
        />
      )}
    </div>
  )
}

function ShowcaseCard({ post, theme, c, index, onAuthRequired, onImageClick, onTagClick, activeTag }) {
  const t = post.toko
  const accent = theme === 'light' ? NAVY : BLUE
  
  const controls = useAnimation()
  const ref = React.useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  React.useEffect(() => {
    if (isInView) {
      controls.start('visible')
    }
  }, [controls, isInView])

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={{ y: -2, boxShadow: c.hoverShadow }}
      className="showcase-card theme-transition"
      style={{
        border: `2px solid ${c.borderStrong}`,
        borderRadius: '16px',
        padding: '16px',
        marginBottom: '16px',
        background: c.bgCard,
        boxShadow: c.cardShadow,
        transition: 'all 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar toko={t} size={40} theme={theme} c={c} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <a
              href={t?.slug ? getStorefrontUrl(t.slug) : '#'}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: PJS, fontSize: '0.875rem', fontWeight: 800, color: c.textPrimary, textDecoration: 'none', transition: 'color 0.15s ease' }}
              onMouseEnter={(e) => e.target.style.color = accent}
              onMouseLeave={(e) => e.target.style.color = c.textPrimary}
            >
              {t?.nama || 'Toko'}
            </a>
            {t?.pro && (
              <motion.span
                whileHover={{ scale: 1.05 }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 3,
                  fontFamily: PJS, fontSize: '0.62rem', fontWeight: 700,
                  color: c.proText, background: c.proBg,
                  border: `1px solid ${c.proBorder}`,
                  padding: '2px 8px', borderRadius: '999px',
                }}
              >⭐ Pro</motion.span>
            )}
          </div>

          <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: c.textSecondary, lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
            {post.teks}
          </p>

          <ShowcaseImages images={post.foto} c={c} onImageClick={onImageClick} theme={theme} />

          {post.shopLink && (
            <motion.a
              className="showcase-shoplink"
              href={getStorefrontUrl(post.shopLink.slug)}
              target="_blank" rel="noreferrer"
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              style={{
                width: '100%', marginBottom: 10, background: c.bgSurface, border: `2px solid ${c.border}`,
                borderRadius: '14px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
                textDecoration: 'none', boxSizing: 'border-box', transition: 'all 0.2s ease',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '10px', background: ACCENT_GRADIENT,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Store size={16} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: c.textPrimary, margin: 0 }}>{post.shopLink.nama}</p>
                <p style={{ fontFamily: PJS, fontSize: '0.68rem', color: c.textTertiary, margin: 0 }}>{getStorefrontUrl(post.shopLink.slug)}</p>
              </div>
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                style={{
                  fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: accent,
                  background: c.accentSoftBg, padding: '4px 10px', borderRadius: '8px',
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
                }}
              >
                Kunjungi <ArrowRight size={11} />
              </motion.span>
            </motion.a>
          )}

          {post.hashtags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {post.hashtags.map(tag => {
                const isActive = activeTag === tag
                return (
                  <motion.button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700,
                      color: isActive ? '#ffffff' : accent,
                      background: isActive ? ACCENT_GRADIENT : c.accentSoftBg,
                      border: `2px solid ${isActive ? 'transparent' : c.accentSoftBorder}`,
                      padding: '4px 10px', borderRadius: '8px',
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {tag}
                  </motion.button>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <ActionButton icon={Heart} count={post.likesCount} c={c} onClick={onAuthRequired} />
            <ActionButton icon={MessageCircle} count={post.repliesCount} c={c} onClick={onAuthRequired} />
            <ActionButton icon={Repeat2} count={post.repostsCount} c={c} onClick={onAuthRequired} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ActionButton({ icon: Icon, count, c, onClick }) {
  return (
    <motion.button
      className="showcase-action"
      onClick={onClick}
      whileHover={{ scale: 1.08, y: -1 }}
      whileTap={{ scale: 0.95 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
        cursor: 'pointer', fontFamily: PJS, fontSize: '0.78rem', fontWeight: 600, padding: '4px 8px',
        color: c.textTertiary, transition: 'all 0.15s ease', borderRadius: '8px',
      }}
    >
      <Icon size={16} />
      <span>{count}</span>
    </motion.button>
  )
}

function ShowcaseImages({ images, c, onImageClick, theme }) {
  if (!images?.length) return null
  
  const [loadedImages, setLoadedImages] = useState({})

  const handleImageLoad = (index) => {
    setLoadedImages(prev => ({ ...prev, [index]: true }))
  }

  if (images.length === 1) {
    return (
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        style={{ marginBottom: 10, borderRadius: '14px', overflow: 'hidden', border: `2px solid ${c.border}`, background: c.bgSurface, position: 'relative' }}
      >
        {!loadedImages[0] && (
          <div style={{ width: '100%', height: 200, background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: theme === 'light' ? NAVY : BLUE }} />
          </div>
        )}
        <motion.img
          initial={{ opacity: 0 }}
          animate={{ opacity: loadedImages[0] ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          className="showcase-img"
          src={images[0]} alt=""
          onLoad={() => handleImageLoad(0)}
          onClick={() => onImageClick?.(images[0])}
          style={{ 
            width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480,
            cursor: 'zoom-in', transition: 'opacity 0.3s ease, transform 0.2s ease',
          }}
          onMouseEnter={(e) => e.target.style.transform = 'scale(1.02)'}
          onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        />
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', color: '#fff',
          }}
        >
          <ZoomIn size={24} />
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: '14px', overflow: 'hidden', border: `2px solid ${c.border}`, background: c.bgSurface }}
    >
      {images.map((img, i) => (
        <div key={i} style={{ position: 'relative', overflow: 'hidden' }}>
          {!loadedImages[i] && (
            <div style={{ width: '100%', height: 160, background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: theme === 'light' ? NAVY : BLUE }} />
            </div>
          )}
          <motion.img
            initial={{ opacity: 0 }}
            animate={{ opacity: loadedImages[i] ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="showcase-img"
            src={img} alt=""
            onLoad={() => handleImageLoad(i)}
            onClick={() => onImageClick?.(img)}
            style={{ 
              width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, 
              background: c.bgSurface, cursor: 'zoom-in',
              transition: 'opacity 0.3s ease, transform 0.2s ease',
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          />
        </div>
      ))}
    </motion.div>
  )
}

function Avatar({ toko, size = 40, theme, c }) {
  const [isHovered, setIsHovered] = useState(false)

  if (toko?.logo) {
    return (
      <motion.img
        src={toko.logo} alt={toko.nama}
        whileHover={{ scale: 1.1 }}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${isHovered ? (theme === 'light' ? NAVY : BLUE) : c.border}`,
          transition: 'all 0.2s ease',
          boxShadow: isHovered ? `0 0 0 3px ${theme === 'light' ? 'rgba(55,138,221,0.3)' : 'rgba(55,138,221,0.5)'}` : 'none',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    )
  }

  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      style={{
        width: size, height: size, borderRadius: '50%', background: ACCENT_GRADIENT,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
        border: `2px solid ${isHovered ? '#fff' : 'transparent'}`,
        boxShadow: isHovered ? '0 0 0 3px rgba(55,138,221,0.4)' : 'none',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {getInitials(toko?.nama)}
    </motion.div>
  )
}
