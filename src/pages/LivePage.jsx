import React, { useEffect, useState } from 'react'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { liveApi } from '../lib/api/adminClient.js'
import toast from 'react-hot-toast'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

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

function ViewerVideo() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  return (
    <div style={{ flex: 1, width: '100%', height: '100%', background: '#000', position: 'relative' }}>
      {tracks.length === 0 && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>Menunggu video...</p>
        </div>
      )}
      {tracks.map(track => (
        <video
          key={track.participant.identity}
          ref={el => { if (el) track.publication.track?.attach(el) }}
          autoPlay
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ))}
    </div>
  )
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
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
        <div style={{
          padding: '10px 16px',
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 10,
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: 20, fontWeight: 700, fontSize: '0.72rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
            LIVE
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{watchingRoom.toko?.nama}</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{watchingRoom.title}</p>
          </div>
          <button
            onClick={handleLeaveWatch}
            style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}
          >
            Keluar
          </button>
        </div>
        <LiveKitRoom
          token={watchToken}
          serverUrl={livekitUrl}
          connect={true}
          options={LIVEKIT_OPTIONS_VIEWER}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 48 }}
        >
          <ViewerVideo />
          <RoomAudioRenderer />
        </LiveKitRoom>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px', maxWidth: 800, margin: '0 auto', fontFamily: 'var(--font-body)' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 4 }}>🎥 Live Stream</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.85rem' }}>Jual produk secara langsung ke pembeli</p>

      {!isPro && (
        <div className="glass-card" style={{ padding: 16, marginBottom: 20, borderColor: 'rgba(239,68,68,0.3)', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 6 }}>Fitur Live Stream khusus seller <strong>Pro</strong></p>
          <a href="/dashboard/upgrade" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: '0.9rem' }}>Upgrade sekarang →</a>
        </div>
      )}

      {isPro && (
        <>
          <div className="glass-card" style={{ padding: 16, marginBottom: 20 }}>
            <h2 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Studio Live Kamu</h2>

            {!isLive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <input
                  className="input"
                  placeholder="Judul live stream..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleGoLive} disabled={loading} style={{ width: '100%' }}>
                  {loading ? '...' : '🔴 Mulai Live'}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '5px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
                    LIVE
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👁 {viewerCount}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mySession?.title}</span>
                  <button className="btn" onClick={handleEndLive} disabled={loading} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.8rem' }}>
                    {loading ? '...' : 'Akhiri'}
                  </button>
                </div>

                {livekitToken && livekitUrl && (
                  <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 12, height: 280 }}>
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

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: '1.3rem', background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)', borderRadius: 10, padding: '6px 10px', cursor: 'pointer' }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ position: 'fixed', bottom: 100, right: 16, pointerEvents: 'none', zIndex: 50 }}>
            {reactions.map(r => (
              <div key={r.id} style={{ fontSize: '1.8rem', animation: 'floatUp 2s ease-out forwards', marginBottom: 6 }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </>
      )}

      <div>
        <h2 style={{ fontWeight: 700, marginBottom: 12, fontSize: '1rem' }}>Live Sekarang</h2>
        {sessions.length === 0 ? (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Belum ada yang live saat ini
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {sessions.map(s => (
              <div key={s.id} className="glass-card" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={s.toko?.logo || '/icon-192.png'} alt="" style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.toko?.nama}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>👁 {s.viewer_count}</span>
                  <span style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '3px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 700 }}>LIVE</span>
                  {isPro && s.toko_id !== toko?.id && (
                    <button className="btn btn-primary btn-sm" onClick={() => handleWatch(s)} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
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
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes floatUp {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-80px) scale(1.5); }
        }
      `}</style>
    </div>
  )
}
