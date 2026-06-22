import React, { useEffect, useState, useRef } from 'react'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { liveApi } from '../lib/api/adminClient.js'
import toast from 'react-hot-toast'

const EMOJIS = ['🔥', '❤️', '👏', '😍', '💰', '🎉']

export default function LivePage() {
  const { token, user } = useAuthStore()
  const { toko } = useTokoStore()
  const [sessions, setSessions] = useState([])
  const [mySession, setMySession] = useState(null)
  const [isLive, setIsLive] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [reactions, setReactions] = useState([])
  const [viewerCount, setViewerCount] = useState(0)
  const reactionTimer = useRef(null)

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadSessions() {
    try {
      const res = await liveApi.getActiveSessions(token)
      setSessions(res.data || [])
      const mine = (res.data || []).find(s => s.toko?.id === toko?.id)
      if (mine) {
        setMySession(mine)
        setIsLive(true)
        setViewerCount(mine.viewerCount || 0)
      }
    } catch {}
  }

  async function handleGoLive() {
    if (!title.trim()) return toast.error('Isi judul live dulu')
    setLoading(true)
    try {
      await liveApi.goLive(token, { title })
      setIsLive(true)
      toast.success('Live dimulai!')
      loadSessions()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleEndLive() {
    if (!mySession) return
    setLoading(true)
    try {
      await liveApi.endLive(token, { roomName: mySession.roomName })
      setIsLive(false)
      setMySession(null)
      setSessions(s => s.filter(x => x.id !== mySession.id))
      toast.success('Live selesai')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function sendReaction(emoji) {
    if (!mySession) return
    try {
      await liveApi.sendReaction(token, { roomName: mySession.roomName, emoji })
      const id = Date.now()
      setReactions(r => [...r, { id, emoji }])
      setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2000)
    } catch {}
  }

  const isPro = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date()

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>🎥 Live Stream</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>Jual produk secara langsung ke pembeli</p>

      {!isPro && (
        <div className="glass-card" style={{ padding: 20, marginBottom: 24, borderColor: 'rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Fitur Live Stream khusus seller <strong>Pro</strong></p>
          <a href="/dashboard/upgrade" style={{ color: 'var(--accent)', fontWeight: 600 }}>Upgrade sekarang →</a>
        </div>
      )}

      {isPro && (
        <>
          {/* Panel seller */}
          <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Studio Live Kamu</h2>

            {!isLive ? (
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  className="input"
                  placeholder="Judul live stream..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleGoLive}
                  disabled={loading}
                >
                  {loading ? '...' : '🔴 Mulai Live'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: '0.85rem' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    LIVE
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>👁 {viewerCount} penonton</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1 }}>{mySession?.title}</span>
                  <button className="btn" onClick={handleEndLive} disabled={loading} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
                    {loading ? '...' : 'Akhiri Live'}
                  </button>
                </div>

                {/* Reaction buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 12, padding: '8px 12px', cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Floating reactions */}
          <div style={{ position: 'fixed', bottom: 100, right: 24, pointerEvents: 'none' }}>
            {reactions.map(r => (
              <div key={r.id} style={{ fontSize: '2rem', animation: 'floatUp 2s ease-out forwards', marginBottom: 8 }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Daftar live aktif */}
      <div>
        <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Live Sekarang</h2>
        {sessions.length === 0 ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Belum ada yang live saat ini
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {sessions.map(s => (
              <div key={s.id} className="glass-card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
                <img src={s.toko?.logo || '/icon-192.png'} alt="" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700 }}>{s.toko?.nama}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{s.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👁 {s.viewerCount}</span>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>LIVE</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
        }
      `}</style>
    </div>
  )
}
