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
    <div style={{ width: '100%', height: '100%', background: '#000', position: 'relative' }}>
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
  const commentsEndRef = useRef(null)

  useEffect(() => {
    loadAndJoin()
  }, [slug])

  useEffect(() => {
    if (!session?.room_name) return

    // Load komentar awal
    supabase
      .from('live_comments')
      .select('*')
      .eq('room_name', session.room_name)
      .order('created_at', { ascending: true })
      .limit(100)
      .then(({ data }) => setComments(data || []))

    // Subscribe realtime
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
          const id = Date.now()
          setReactions(r => [...r, { id, emoji: payload.new.message }])
          setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 2500)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [session?.room_name])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
    await supabase.from('live_comments').insert({
      room_name: session.room_name,
      sender_name: name,
      message: message.trim(),
      type: 'chat',
    })
    setMessage('')
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Bergabung ke live...</p>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, textAlign: 'center' }}>
      <span style={{ fontSize: '3rem' }}>📴</span>
      <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{error}</p>
      <button className="btn btn-primary" onClick={() => navigate(`/${slug}`)}>Kembali ke Toko</button>
    </div>
  )

  // Modal nama
  if (!nameSet) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24, background: '#000' }}>
      <p style={{ color: '#fff', fontWeight: 700, fontSize: '1.1rem' }}>Siapa namamu?</p>
      <input
        className="input"
        placeholder="Nama kamu (opsional)"
        value={senderName}
        onChange={e => setSenderName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && setNameSet(true)}
        style={{ width: '100%', maxWidth: 300 }}
        autoFocus
      />
      <button className="btn btn-primary" onClick={() => setNameSet(true)} style={{ width: '100%', maxWidth: 300 }}>
        Masuk Live
      </button>
    </div>
  )

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
        zIndex: 10, flexShrink: 0,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '3px 8px', borderRadius: 20, fontWeight: 700, fontSize: '0.72rem' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          LIVE
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{session?.toko?.nama}</p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', margin: 0 }}>{session?.title}</p>
        </div>
        <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>👁 {session?.viewer_count || 0}</span>
        <button onClick={handleLeave} style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700, flexShrink: 0 }}>
          Keluar
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* Video */}
        <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
          {livekitToken && livekitUrl && (
            <LiveKitRoom
              token={livekitToken}
              serverUrl={livekitUrl}
              connect={true}
              video={false}
              audio={false}
              options={LIVEKIT_OPTIONS_VIEWER}
              style={{ width: '100%', height: '100%' }}
            >
              <ViewerVideo />
              <RoomAudioRenderer />
            </LiveKitRoom>
          )}

          {/* Floating reactions */}
          <div style={{ position: 'absolute', bottom: 80, right: 16, pointerEvents: 'none', zIndex: 20 }}>
            {reactions.map(r => (
              <div key={r.id} style={{ fontSize: '2rem', animation: 'floatUp 2.5s ease-out forwards', marginBottom: 4 }}>
                {r.emoji}
              </div>
            ))}
          </div>
        </div>

        {/* Panel komentar — desktop */}
        <div style={{
          width: 280,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(0,0,0,0.7)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
          className="comment-panel-desktop"
        >
          <CommentPanel
            comments={comments}
            message={message}
            setMessage={setMessage}
            sendComment={sendComment}
            sendReaction={sendReaction}
            commentsEndRef={commentsEndRef}
          />
        </div>
      </div>

      {/* Komentar mobile — overlay bawah */}
      <div className="comment-panel-mobile" style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        zIndex: 30,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 80%, transparent)',
        padding: '8px 12px 12px',
      }}>
        {/* Komentar scroll */}
        <div style={{ maxHeight: 140, overflowY: 'auto', marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {comments.filter(c => c.type === 'chat').slice(-20).map(c => (
            <div key={c.id} style={{ fontSize: '0.78rem', color: '#fff' }}>
              <span style={{ color: '#facc15', fontWeight: 700 }}>{c.sender_name}: </span>
              {c.message}
            </div>
          ))}
          <div ref={commentsEndRef} />
        </div>

        {/* Emoji row */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {EMOJIS.map(e => (
            <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: '1.3rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, padding: '4px 8px', cursor: 'pointer' }}>
              {e}
            </button>
          ))}
        </div>

        {/* Input komentar */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendComment()}
            placeholder="Tulis komentar..."
            style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 20, padding: '8px 14px', color: '#fff', fontSize: '0.82rem', outline: 'none' }}
          />
          <button onClick={sendComment} style={{ background: '#ef4444', border: 'none', borderRadius: 20, padding: '8px 14px', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
            Kirim
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes floatUp {
          0% { opacity:1; transform:translateY(0) scale(1); }
          100% { opacity:0; transform:translateY(-100px) scale(1.5); }
        }
        .comment-panel-desktop { display: flex; }
        .comment-panel-mobile { display: none; }
        @media (max-width: 640px) {
          .comment-panel-desktop { display: none !important; }
          .comment-panel-mobile { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function CommentPanel({ comments, message, setMessage, sendComment, sendReaction, commentsEndRef }) {
  return (
    <>
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600 }}>
        💬 Komentar
      </div>

      {/* List komentar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comments.filter(c => c.type === 'chat').map(c => (
          <div key={c.id}>
            <span style={{ color: '#facc15', fontWeight: 700, fontSize: '0.78rem' }}>{c.sender_name}: </span>
            <span style={{ color: '#fff', fontSize: '0.78rem' }}>{c.message}</span>
          </div>
        ))}
        <div ref={commentsEndRef} />
      </div>

      {/* Emoji */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => sendReaction(e)} style={{ fontSize: '1.1rem', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, padding: '4px 6px', cursor: 'pointer' }}>
            {e}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 6 }}>
        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendComment()}
          placeholder="Tulis komentar..."
          style={{ flex: 1, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 16, padding: '7px 12px', color: '#fff', fontSize: '0.8rem', outline: 'none' }}
        />
        <button onClick={sendComment} style={{ background: '#ef4444', border: 'none', borderRadius: 16, padding: '7px 12px', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
          →
        </button>
      </div>
    </>
  )
}
