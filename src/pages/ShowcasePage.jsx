import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Store, Loader, ArrowRight, Bot, Sun, Moon, X } from 'lucide-react'
import { useStreamStore } from '../lib/store.js'
import { getStorefrontUrl, getInitials } from '../lib/utils.js'
import { useTheme } from '../lib/useTheme.js'
import { produkApi } from '../lib/api/adminClient.js'
import ShowcaseChatModal from '../components/seller/ShowcaseChatModal.jsx'

const PJS = "'Plus Jakarta Sans', sans-serif"

// Theme tokens — light mirrors LandingPage.jsx exactly, dark mirrors the original ShowcasePage.
const THEMES = {
  light: {
    bgPage: '#ffffff',
    bgHeader: 'rgba(255,255,255,0.85)',
    bgSurface: '#f7f7f7',
    border: '#ececec',
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
  },
  dark: {
    bgPage: '#0b0b10',
    bgHeader: 'rgba(11,11,16,0.85)',
    bgSurface: '#15151c',
    border: 'rgba(255,255,255,0.08)',
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
  },
}

const NAVY = '#0C447C'
const BLUE = '#378ADD'
const ACCENT_GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`

export default function ShowcasePage() {
  const navigate = useNavigate()
  const { showcase, showcaseLoading, loadShowcase } = useStreamStore()
  const { theme, toggleTheme } = useTheme()
  const c = THEMES[theme]
  const [lightboxImg, setLightboxImg] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [showChat, setShowChat] = useState(false)
  const [produkList, setProdukList] = useState([])

  useEffect(() => {
    loadShowcase(activeTag ? { tag: activeTag } : {})
  }, [activeTag])

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
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes lightboxFadeIn { from { opacity: 0 } to { opacity: 1 } }
        .showcase-card { animation: fadeIn 0.4s ease; }
        .showcase-action:hover { color: ${theme === 'light' ? NAVY : BLUE} !important; }
        .showcase-shoplink:hover { border-color: ${c.accentSoftBorder} !important; box-shadow: ${c.hoverShadow}; }
        .theme-toggle-btn:hover { transform: scale(1.06); }
        .showcase-img { cursor: zoom-in; transition: opacity 0.15s ease; }
        .showcase-img:hover { opacity: 0.92; }
        .lightbox-close:hover { background: rgba(255,255,255,0.15) !important; }
      `}</style>

      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: c.bgHeader, backdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${c.border}`,
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}>
        <h1 style={{ fontFamily: PJS, fontSize: '1.2rem', fontWeight: 800, margin: 0, color: c.textPrimary, letterSpacing: '-0.02em' }}>
          Showcase <span style={{ color: theme === 'light' ? NAVY : BLUE }}>Exora</span>
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'light' ? 'Ganti ke tema gelap' : 'Ganti ke tema terang'}
            title={theme === 'light' ? 'Tema gelap' : 'Tema terang'}
            style={{
              width: 34, height: 34, borderRadius: '50%', border: `1px solid ${c.border}`,
              background: c.bgSurface, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: c.textSecondary, transition: 'transform 0.15s ease',
            }}
          >
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          <button
            onClick={() => navigate('/login')}
            style={{
              background: ACCENT_GRADIENT, border: 'none', color: '#ffffff',
              padding: '8px 16px', borderRadius: '999px', fontFamily: PJS,
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
              boxShadow: c.ctaShadow,
            }}
          >
            Gabung Exora
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 8px 60px' }}>
        {activeTag && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: c.accentSoftBg, border: `1px solid ${c.accentSoftBorder}`,
            borderRadius: '10px', padding: '8px 12px', marginBottom: 12,
          }}>
            <span style={{ fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, color: theme === 'light' ? NAVY : BLUE }}>
              Menampilkan post dengan {activeTag}
            </span>
            <button
              onClick={() => setActiveTag(null)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: c.textTertiary, fontFamily: PJS, fontSize: '0.75rem', fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <X size={13} /> Hapus filter
            </button>
          </div>
        )}

        {showcaseLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader size={20} color={theme === 'light' ? NAVY : BLUE} style={{ animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {!showcaseLoading && showcase.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 48, height: 48, borderRadius: '12px',
              background: c.accentSoftBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px', color: theme === 'light' ? NAVY : BLUE,
            }}>
              <Store size={20} />
            </div>
            <p style={{ color: c.textTertiary, fontFamily: PJS, fontSize: '0.9rem', margin: 0 }}>
              {activeTag ? `Belum ada post dengan ${activeTag}.` : 'Belum ada produk yang ditampilkan.'}
            </p>
          </div>
        )}

        {showcase.map(post => (
          <ShowcaseCard
            key={post.id}
            post={post}
            theme={theme}
            c={c}
            onAuthRequired={() => navigate('/login')}
            onImageClick={setLightboxImg}
            onTagClick={handleTagClick}
            activeTag={activeTag}
          />
        ))}
      </div>

      {/* Lightbox / zoom overlay */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, animation: 'lightboxFadeIn 0.2s ease', cursor: 'zoom-out',
          }}
        >
          <button
            className="lightbox-close"
            onClick={(e) => { e.stopPropagation(); setLightboxImg(null) }}
            aria-label="Tutup"
            style={{
              position: 'absolute', top: 18, right: 18,
              width: 40, height: 40, borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)', border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', transition: 'background 0.15s ease',
            }}
          >
            <X size={20} />
          </button>
          <img
            src={lightboxImg}
            alt=""
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain',
              borderRadius: 8, cursor: 'default',
            }}
          />
        </div>
      )}
      <button
  onClick={() => setShowChat(true)}
  style={{
    position: 'fixed', bottom: 24, right: 20, zIndex: 50,
    width: 52, height: 52, borderRadius: '50%',
    background: ACCENT_GRADIENT, border: 'none',
    boxShadow: c.ctaShadow, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }}
>
  <Bot size={22} color="#fff" />
</button>
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

function ShowcaseCard({ post, theme, c, onAuthRequired, onImageClick, onTagClick, activeTag }) {
  const t = post.toko
  const accent = theme === 'light' ? NAVY : BLUE

  return (
    <div className="showcase-card" style={{ borderBottom: `1px solid ${c.border}`, padding: '16px 8px' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar toko={t} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <a
              href={t?.slug ? getStorefrontUrl(t.slug) : '#'}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: PJS, fontSize: '0.875rem', fontWeight: 800, color: c.textPrimary, textDecoration: 'none' }}
            >
              {t?.nama || 'Toko'}
            </a>
            {t?.pro && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 3,
                fontFamily: PJS, fontSize: '0.62rem', fontWeight: 700,
                color: c.proText, background: c.proBg,
                border: `1px solid ${c.proBorder}`,
                padding: '2px 8px', borderRadius: '999px',
              }}>⭐ Pro</span>
            )}
          </div>

          <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: c.textSecondary, lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
            {post.teks}
          </p>

          <ShowcaseImages images={post.foto} c={c} onImageClick={onImageClick} />

          {post.shopLink && (
            <a
              className="showcase-shoplink"
              href={getStorefrontUrl(post.shopLink.slug)}
              target="_blank" rel="noreferrer"
              style={{
                width: '100%', marginBottom: 10, background: c.bgSurface, border: `1px solid ${c.border}`,
                borderRadius: '14px', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
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
              <span style={{
                fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: accent,
                background: c.accentSoftBg, padding: '4px 10px', borderRadius: '8px',
                flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3,
              }}>
                Kunjungi <ArrowRight size={11} />
              </span>
            </a>
          )}

          {post.hashtags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {post.hashtags.map(tag => {
                const isActive = activeTag === tag
                return (
                  <button
                    key={tag}
                    onClick={() => onTagClick?.(tag)}
                    style={{
                      fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700,
                      color: isActive ? '#ffffff' : accent,
                      background: isActive ? ACCENT_GRADIENT : c.accentSoftBg,
                      border: `1px solid ${isActive ? 'transparent' : c.accentSoftBorder}`,
                      padding: '3px 9px', borderRadius: '8px',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 4 }}>
            <button className="showcase-action" onClick={onAuthRequired} style={{ ...actionStyle, color: c.textTertiary }}>
              <Heart size={15} />{post.likesCount}
            </button>
            <button className="showcase-action" onClick={onAuthRequired} style={{ ...actionStyle, color: c.textTertiary }}>
              <MessageCircle size={15} />{post.repliesCount}
            </button>
            <button className="showcase-action" onClick={onAuthRequired} style={{ ...actionStyle, color: c.textTertiary }}>
              <Repeat2 size={15} />{post.repostsCount}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const actionStyle = {
  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: PJS, fontSize: '0.78rem', fontWeight: 600, padding: 0,
  transition: 'color 0.15s ease',
}

function ShowcaseImages({ images, c, onImageClick }) {
  if (!images?.length) return null
  if (images.length === 1) {
    return (
      <div style={{ marginBottom: 10, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${c.border}`, background: c.bgSurface }}>
        <img
          className="showcase-img"
          src={images[0]} alt=""
          onClick={() => onImageClick?.(images[0])}
          style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }}
        />
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${c.border}`, background: c.bgSurface }}>
      {images.map((img, i) => (
        <img
          key={i}
          className="showcase-img"
          src={img} alt=""
          onClick={() => onImageClick?.(img)}
          style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, background: c.bgSurface }}
        />
      ))}
    </div>
  )
}

function Avatar({ toko, size = 40 }) {
  if (toko?.logo) {
    return <img src={toko.logo} alt={toko.nama} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: ACCENT_GRADIENT,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {getInitials(toko?.nama)}
    </div>
  )
}
