import React, { useEffect, useState } from 'react'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { liveApi } from '../lib/api/adminClient.js'
import toast from 'react-hot-toast'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react'

const EMOJIS = ['🔥', '❤️', '👏', '😍', '💰', '🎉']

const LIVEKIT_OPTIONS_HOST = {
  publishDefaults: {
    videoEncoding: {
      maxBitrate: 500_000,
      maxFramerate: 15,
    },
    videoSimulcastLayers: [],
    screenShareEncoding: {
      maxBitrate: 300_000,
      maxFramerate: 10,
    }
  },
  adaptiveStream: true,
  dynacast: true,
}

const LIVEKIT_OPTIONS_VIEWER = {
  adaptiveStream: true,
  dynacast: true,
}

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
  const [livekitToken, setLivekitToken] = useState(null)
  const [livekitUrl, setLivekitUrl] = useState(null)
  const [watchingRoom, setWatchingRoom] = useState(null)
  const [watchToken, setWatchToken] = useState(null)

  const isPro = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date()

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  async function loadSessions() {
    try {
      const res = await liveApi.getActiveSessions(token)
      setSessions(res.data || [])
      const mine = (res.data || []).find(s => s.toko_id === toko?.id)
      if (mine) {
        setMySession(mine)
        setIsLive(true)
        setViewerCount(mine.viewer_count || 0)
      }
    } catch {}
  }

  async function handleGoLive() {
    if (!title.trim()) return toast.error('Isi judul live dulu')
    setLoading(true)
    try {
      const res = await liveApi.goLive(token, { title })
      setIsLive(true)
      setLivekitToken(res.data.livekitToken)
      setLivekitUrl(res.data.livekitUrl)
      setMySession(res.data.session)
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
      await liveApi.endLive(token, { roomName: mySession.room_name })
      setIsLive(false)
      setMySession(null)
      setLivekitToken(null)
      setLivekitUrl(null)
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
      await liveApi.sendReaction(token, { roomName: mySession.room_name, emoji })
      const id = Date.now()
      setReactions(r => [...r, { id, emoji }])
      setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2000)
    } catch {}
  }

  async function handleWatch(session) {
    try {
      const res = await liveApi.joinLive(token, { roomName: session.room_name })
      setWatchingRoom(session)
      setWatchToken(res.data.livekitToken)
      setLivekitUrl(res.data.livekitUrl)
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleLeaveWatch() {
    if (!watchingRoom) return
    try {
      await liveApi.leaveRoom(token, { roomName: watchingRoom.room_name })
    } catch {}
    setWatchingRoom(null)
    setWatchToken(null)
  }

  // Mode nonton
  if (watchingRoom && watchToken) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700 }}>{watchingRoom.toko?.nama}</span>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{watchingRoom.title}</span>
          <button className="btn" onClick={handleLeaveWatch} style={{ marginLeft: 'auto', background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
            Keluar
          </button>
        </div>
        <LiveKitRoom
          token={watchToken}
          serverUrl={livekitUrl}
          connect={true}
          options={LIVEKIT_OPTIONS_VIEWER}
          style={{ flex: 1 }}
        >
          <VideoConference />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    )
  }

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
                <button className="btn btn-primary" onClick={handleGoLive} disabled={loading}>
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

                {livekitToken && livekitUrl && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, height: 400 }}>
                    <LiveKitRoom
                      token={livekitToken}
                      serverUrl={livekitUrl}
                      connect={true}
                      video={true}
                      audio={true}
                      options={LIVEKIT_OPTIONS_HOST}
                      style={{ height: '100%' }}
                    >
                      <VideoConference />
                      <RoomAudioRenderer />
                    </LiveKitRoom>
                  </div>
                )}

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

          <div style={{ position: 'fixed', bottom: 100, right: 24, pointerEvents: 'none' }}>
            {reactions.map(r => (
              <div key={r.id} style={{ fontSize: '2rem', animation: 'floatUp 2s ease-out forwards', marginBottom: 8 }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </>
      )}

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
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👁 {s.viewer_count}</span>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>LIVE</span>
                  {isPro && s.toko_id !== toko?.id && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleWatch(s)}>
                      Tonton
                    </button>
                  )}
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
