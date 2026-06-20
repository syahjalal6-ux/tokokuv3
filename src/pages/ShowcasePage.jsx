import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Repeat2, Store, Loader } from 'lucide-react'
import { useStreamStore } from '../lib/store.js'
import { getStorefrontUrl, getInitials } from '../lib/utils.js'

const PJS = "'Plus Jakarta Sans', sans-serif"

export default function ShowcasePage() {
  const navigate = useNavigate()
  const { showcase, showcaseLoading, loadShowcase } = useStreamStore()

  useEffect(() => {
    loadShowcase()
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)',
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ fontFamily: PJS, fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Showcase Exora</h1>
        <button
          onClick={() => navigate('/login')}
          style={{
            background: 'var(--accent-gradient)', border: 'none', color: '#fff',
            padding: '8px 16px', borderRadius: 'var(--radius-full)', fontFamily: PJS,
            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
          }}
        >
          Gabung Exora
        </button>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '12px 8px 60px' }}>
        {showcaseLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
          </div>
        )}

        {!showcaseLoading && showcase.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', padding: 60 }}>
            Belum ada produk yang ditampilkan.
          </p>
        )}

        {showcase.map(post => (
          <ShowcaseCard key={post.id} post={post} onAuthRequired={() => navigate('/login')} />
        ))}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function ShowcaseCard({ post, onAuthRequired }) {
  const t = post.toko

  return (
    <div style={{ borderBottom: '1px solid var(--glass-border)', padding: '14px 8px' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <Avatar toko={t} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            
              href={t?.slug ? getStorefrontUrl(t.slug) : '#'}
              target="_blank" rel="noreferrer"
              style={{ fontFamily: PJS, fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)', textDecoration: 'none' }}
            >
              {t?.nama || 'Toko'}
            </a>
            {t?.pro && (
              <span className="badge badge-pro" style={{ fontSize: '0.6rem', padding: '1px 6px' }}>⭐ Pro</span>
            )}
          </div>

          <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
            {post.teks}
          </p>

          <ShowcaseImages images={post.foto} />

          {post.shopLink && (
            
              href={getStorefrontUrl(post.shopLink.slug)}
              target="_blank" rel="noreferrer"
              style={{
                width: '100%', marginBottom: 10, background: 'var(--surface)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
                textDecoration: 'none', boxSizing: 'border-box',
              }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Store size={16} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{post.shopLink.nama}</p>
                <p style={{ fontFamily: PJS, fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: 0 }}>{getStorefrontUrl(post.shopLink.slug)}</p>
              </div>
              <span style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-gradient-soft)', padding: '4px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
                Kunjungi →
              </span>
            </a>
          )}

          {post.hashtags?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {post.hashtags.map(tag => (
                <span key={tag} style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-gradient-soft)', border: '1px solid var(--glass-border)', padding: '3px 9px', borderRadius: 'var(--radius-md)' }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 4 }}>
            <button onClick={onAuthRequired} style={actionStyle}>
              <Heart size={15} />{post.likesCount}
            </button>
            <button onClick={onAuthRequired} style={actionStyle}>
              <MessageCircle size={15} />{post.repliesCount}
            </button>
            <button onClick={onAuthRequired} style={actionStyle}>
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
  cursor: 'pointer', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.78rem', fontWeight: 600, padding: 0,
}

function ShowcaseImages({ images }) {
  if (!images?.length) return null
  if (images.length === 1) {
    return (
      <div style={{ marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--surface)' }}>
        <img src={images[0]} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }} />
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--surface)' }}>
      {images.map((img, i) => (
        <img key={i} src={img} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, background: 'var(--surface)' }} />
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
      width: size, height: size, borderRadius: '50%', background: 'var(--accent-gradient)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {getInitials(toko?.nama)}
    </div>
  )
}
