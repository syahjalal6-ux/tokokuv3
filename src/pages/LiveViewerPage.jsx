import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { liveApi } from '../lib/api/adminClient.js'
import { createClient } from '@supabase/supabase-js'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const EMOJIS = ['🔥', '❤️', '👏', '😍', '💰', '🎉']

const LIVEKIT_OPTIONS_VIEWER = {
  adaptiveStream: true,
  dynacast: true,
}

function ViewerVideo() {
  const tracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
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

export default function LiveViewerPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [livekitToken, setLivekitToken] = useState(null)
  const [livekitUrl, setLivekitUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [comments, setComments] = useState([])
  const [message, setMessage] = useState('')
  const [senderName, setSenderName] = useState('')
  const [nameSet, setNameSet] = useState(false)
  const [reactions, setReactions] = useState([])
  const [inputFocused, setInputFocused] = useState(false)
  const commentsEndRef = useRef(null)
  const commentsBoxRef = useRef(null)

  useEffect(() => { loadAndJoin() }, [slug])

  useEffect(() => {
    if (!session?.room_name) return

    supabase
      .from('live_comments')
      .select('*')
      .eq('room_name', session.room_name)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setComments(data || []))

    const channel = supabase
      .channel(`live_comments_${session.room_name}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_comments',
        filter: `room_name=eq.${session.room_name}`,
      }, payload => {
        setComments(prev => [...prev, payload.new])
        if (payload.new.type === 'reaction') {
          const id = Date.now() + Math.random()
          const xPos = 60 + Math.random() * 30 // 60-90% dari kiri
          setReactions(r => [...r, { id, emoji: payload.new.message, xPos }])
          setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2800)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session?.room_name])

  useEffect(() => {
    // Auto scroll ke bawah
    const box = commentsBoxRef.current
    if (!box) return
    box.scrollTop = box.scrollHeight
  }, [comments])

  async function loadAndJoin() {
    setLoading(true)
    try {
      const res = await liveApi.getActiveSessions(null)
      const sesi = (res.data || []).find(s => s.toko?.slug === slug)
      if (!sesi) {
        setError('Seller ini tidak sedang live')
        setLoading(false)
        return
      }
      setSession(sesi)
      const joinRes = await liveApi.joinLive(null, { roomName: sesi.room_name })
      setLivekitToken(joinRes.data.livekitToken)
      setLivekitUrl(joinRes.data.livekitUrl)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLeave() {
    if (session) {
      try { await liveApi.leaveRoom(null, { roomName: session.room_name }) } catch {}
    }
    navigate(`/${slug}`)
  }

  async function sendComment() {
    if (!message.trim() || !session) return
    const name = senderName.trim() || 'Pembeli'
    const text = message.trim()
    setMessage('')
    await supabase.from('live_comments').insert({
      room_name: session.room_name,
      sender_name: name,
      message: text,
      type: 'chat',
    })
  }

  async function sendReaction(emoji) {
    if (!session) return
    const name = senderName.trim() || 'Pembeli'
    await supabase.from('live_comments').insert({
      room_name: session.room_name,
      sender_name: name,
      message: emoji,
      type: 'reaction',
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, background: '#000' }}>
      <div className="spinner" />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>Bergabung ke live...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center', background: '#000' }}>
      <span style={{ fontSize: '3rem' }}>📴</span>
      <p style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate(`/${slug}`)}>Kembali ke Toko</button>
    </div>
  )

  if (!nameSet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, background: '#000' }}>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Siapa namamu?</p>
      <input
        placeholder="Nama kamu (opsional)"
        value={senderName}
        onChange={e => setSenderName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && setNameSet(true)}
        autoFocus
        style={{
          width: '100%', maxWidth: 300,
          background: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 12, padding: '12px 16px',
          color: '#fff', fontSize: '0.9rem', outline: 'none',
        }}
      />
      <button className="btn btn-primary" onClick={() => setNameSet(true)} style={{ width: '100%', maxWidth: 300 }}>
        Masuk Live
      </button>
      <style>{`.input-name::placeholder { color: rgba(255,255,255,0.4) !important; }`}</style>
    </div>
  )

  const chatComments = comments.filter(c => c.type === 'chat')

  return (
    <div style={{ height: '100vh', width: '100vw', position: 'relative', background: '#000', overflow: 'hidden' }}>

      {/* Video layer — full screen */}
      {livekitToken && livekitUrl && (
        <LiveKitRoom
          token={livekitToken}
          serverUrl={livekitUrl}
          connect={true}
          video={false}
          audio={false}
          options={LIVEKIT_OPTIONS_VIEWER}
          style={{ position: 'absolute', inset: 0 }}
        >
          <ViewerVideo />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}

      {/* Gradient overlay bawah — biar komentar keliatan */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '65%',
        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 5,
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '12px 16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 20,
      }}>
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: 'rgba(239,68,68,0.9)', color: '#fff',
          padding: '3px 10px', borderRadius: 20,
          fontWeight: 700, fontSize: '0.72rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block', animation: 'livePulse 1.2s infinite' }} />
          LIVE
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {session?.toko?.nama}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>{session?.title}</p>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.8)', flexShrink: 0 }}>
          👁 {session?.viewer_count || 0}
        </span>
        <button onClick={handleLeave} style={{
          background: 'rgba(0,0,0,0.4)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '5px 12px',
          cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
        }}>
          Keluar
        </button>
      </div>

      {/* Floating reactions */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 15, overflow: 'hidden' }}>
        {reactions.map(r => (
          <div key={r.id} style={{
            position: 'absolute',
            bottom: 120,
            left: `${r.xPos}%`,
            fontSize: '2rem',
            animation: 'floatUp 2.8s ease-out forwards',
          }}>
            {r.emoji}
          </div>
        ))}
      </div>

      {/* Komentar + input — overlay bawah */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        zIndex: 20,
        padding: '0 12px 16px',
      }}>
        {/* List komentar */}
        <div
          ref={commentsBoxRef}
          style={{
            maxHeight: inputFocused ? 120 : 200,
            overflowY: 'auto',
            marginBottom: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            transition: 'max-height 0.2s ease',
          }}
        >
          {chatComments.slice(-30).map(c => (
            <div key={c.id} style={{
              display: 'inline-flex', alignSelf: 'flex-start',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(8px)',
              borderRadius: 20,
              padding: '5px 12px',
              maxWidth: '85%',
              animation: 'fadeInComment 0.2s ease',
            }}>
              <span style={{ color: '#facc15', fontWeight: 700, fontSize: '0.78rem', marginRight: 5, flexShrink: 0 }}>
                {c.sender_name}
              </span>
              <span style={{ color: '#fff', fontSize: '0.78rem', lineHeight: 1.4 }}>{c.message}</span>
            </div>
          ))}
        </div>

        {/* Emoji row */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
          {EMOJIS.map(e => (
            <button
              key={e}
              onClick={() => sendReaction(e)}
              style={{
                fontSize: '1.25rem',
                background: 'rgba(0,0,0,0.4)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 12, padding: '5px 8px',
                cursor: 'pointer', transition: 'transform 0.1s',
              }}
              onMouseDown={e => e.currentTarget.style.transform = 'scale(0.88)'}
              onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {e}
            </button>
          ))}
        </div>

        {/* Input komentar */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendComment()}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            placeholder="Tulis komentar..."
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 24,
              padding: '10px 16px',
              color: '#fff',
              fontSize: '0.85rem',
              outline: 'none',
            }}
          />
          <button
            onClick={sendComment}
            disabled={!message.trim()}
            style={{
              background: message.trim() ? '#ef4444' : 'rgba(255,255,255,0.15)',
              border: 'none', borderRadius: 24,
              padding: '10px 16px', color: '#fff',
              fontWeight: 700, fontSize: '0.85rem',
              cursor: message.trim() ? 'pointer' : 'default',
              transition: 'background 0.2s',
              flexShrink: 0,
            }}
          >
            Kirim
          </button>
        </div>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes floatUp {
          0%   { opacity:1; transform: translateY(0) scale(1); }
          80%  { opacity:0.8; }
          100% { opacity:0; transform: translateY(-180px) scale(1.6); }
        }
        @keyframes fadeInComment {
          from { opacity:0; transform: translateY(6px); }
          to   { opacity:1; transform: translateY(0); }
        }
        input::placeholder { color: rgba(255,255,255,0.45) !important; }
        ::-webkit-scrollbar { width: 0; }
      `}</style>
    </div>
  )
}
