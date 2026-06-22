import React, { useEffect, useState, useRef } from 'react'
import { useAuthStore, useTokoStore } from '../lib/store.js'
import { liveApi } from '../lib/api/adminClient.js'
import { createClient } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const EMOJIS = ['🔥', '❤️', '👏', '😍', '💰', '🎉']

const LIVEKIT_OPTIONS_HOST = {
  publishDefaults: {
    videoEncoding: { maxBitrate: 500_000, maxFramerate: 15 },
    videoSimulcastLayers: [],
    screenShareEncoding: { maxBitrate: 300_000, maxFramerate: 10 },
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
          autoPlay playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ))}
    </div>
  )
}

// Panel komentar untuk host
function HostCommentPanel({ comments, roomName, senderName }) {
  const [message, setMessage] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function sendComment() {
    if (!message.trim() || !roomName) return
    const text = message.trim()
    setMessage('')
    await supabase.from('live_comments').insert({
      room_name: roomName,
      sender_name: senderName || 'Host',
      message: text,
      type: 'chat',
    })
  }

  const chatComments = comments.filter(c => c.type === 'chat')

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%',
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(12px)',
      borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ fontSize: '0.8rem' }}>💬</span>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.78rem', fontWeight: 600 }}>
          Komentar Live
        </span>
        <span style={{
          marginLeft: 'auto',
          background: 'rgba(239,68,68,0.2)', color: '#ef4444',
          borderRadius: 10, padding: '1px 7px',
          fontSize: '0.68rem', fontWeight: 700,
        }}>
          {chatComments.length}
        </span>
      </div>

      {/* List komentar */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '10px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {chatComments.length === 0 && (
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem', textAlign: 'center', marginTop: 20 }}>
            Belum ada komentar
          </p>
        )}
        {chatComments.map(c => (
          <div key={c.id} style={{ animation: 'fadeInComment 0.2s ease' }}>
            <span style={{ color: '#facc15', fontWeight: 700, fontSize: '0.78rem' }}>{c.sender_name} </span>
            <span style={{ color: '#fff', fontSize: '0.78rem' }}>{c.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input balas */}
      <div style={{
        padding: '8px 10px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', gap: 6,
      }}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendComment()}
          placeholder="Balas komentar..."
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '7px 12px',
            color: '#fff', fontSize: '0.78rem', outline: 'none',
          }}
        />
        <button
          onClick={sendComment}
          disabled={!message.trim()}
          style={{
            background: message.trim() ? '#ef4444' : 'rgba(255,255,255,0.1)',
            border: 'none', borderRadius: 20,
            padding: '7px 12px', color: '#fff',
            fontWeight: 700, fontSize: '0.78rem',
            cursor: message.trim() ? 'pointer' : 'default',
            transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          →
        </button>
      </div>
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
  const [comments, setComments] = useState([])

  const isPro = user?.plan === 'pro' && user?.planExpiry && new Date(user.planExpiry) > new Date()

  useEffect(() => {
    loadSessions()
    const interval = setInterval(loadSessions, 10000)
    return () => clearInterval(interval)
  }, [])

  // Subscribe komentar saat live
  useEffect(() => {
    if (!mySession?.room_name) return

    supabase
      .from('live_comments')
      .select('*')
      .eq('room_name', mySession.room_name)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setComments(data || []))

    const channel = supabase
      .channel(`host_comments_${mySession.room_name}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_comments',
        filter: `room_name=eq.${mySession.room_name}`,
      }, payload => {
        setComments(prev => [...prev, payload.new])
        if (payload.new.type === 'reaction') {
          const id = Date.now() + Math.random()
          setReactions(r => [...r, { id, emoji: payload.new.message }])
          setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2000)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [mySession?.room_name])

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
      setComments([])
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
    try { await liveApi.leaveRoom(token, { roomName: watchingRoom.room_name }) } catch {}
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
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.9)', color: '#fff', padding: '3px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.72rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livePulse 1.2s infinite' }} />
            LIVE
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{watchingRoom.toko?.nama}</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{watchingRoom.title}</p>
          </div>
          <button onClick={handleLeaveWatch} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
            Keluar
          </button>
        </div>
        <LiveKitRoom token={watchToken} serverUrl={livekitUrl} connect={true} options={LIVEKIT_OPTIONS_VIEWER} style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: 48 }}>
          <ViewerVideo />
          <RoomAudioRenderer />
        </LiveKitRoom>
        <style>{`@keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
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
                  className="form-input"
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
                {/* Status bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.15)', color: '#ef4444', padding: '5px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem' }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1s infinite' }} />
                    LIVE
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>👁 {viewerCount}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mySession?.title}</span>
                  <button className="btn" onClick={handleEndLive} disabled={loading} style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.8rem' }}>
                    {loading ? '...' : 'Akhiri'}
                  </button>
                </div>

                {/* Video + komentar side by side */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  {/* Video host */}
                  {livekitToken && livekitUrl && (
                    <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', height: 280 }}>
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

                  {/* Panel komentar */}
                  <div style={{ width: 220, height: 280, flexShrink: 0, position: 'relative' }}>
                    <HostCommentPanel
                      comments={comments}
                      roomName={mySession?.room_name}
                      senderName={toko?.nama || 'Host'}
                    />
                    {/* Floating reactions */}
                    <div style={{ position: 'absolute', bottom: 60, right: 8, pointerEvents: 'none' }}>
                      {reactions.map(r => (
                        <div key={r.id} style={{ fontSize: '1.6rem', animation: 'floatUp 2s ease-out forwards', marginBottom: 4 }}>
                          {r.emoji}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Emoji reactions */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {EMOJIS.map(e => (
                    <button key={e} onClick={() => sendReaction(e)} style={{
                      fontSize: '1.3rem',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 10, padding: '6px 10px', cursor: 'pointer',
                    }}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Daftar live aktif */}
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
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes floatUp {
          0%   { opacity:1; transform: translateY(0) scale(1); }
          100% { opacity:0; transform: translateY(-80px) scale(1.5); }
        }
        @keyframes fadeInComment {
          from { opacity:0; transform: translateY(4px); }
          to   { opacity:1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.4) !important; }
        .form-input::placeholder { color: var(--text-tertiary) !important; }
      `}</style>
    </div>
  )
}
