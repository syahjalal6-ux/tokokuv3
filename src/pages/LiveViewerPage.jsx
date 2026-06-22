import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { liveApi } from '../lib/api/adminClient.js'
import toast from 'react-hot-toast'
import '@livekit/components-styles'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRemoteParticipants,
} from '@livekit/components-react'
import { VideoTrack } from '@livekit/components-react'
import { Track } from 'livekit-client'

const LIVEKIT_OPTIONS_VIEWER = {
  adaptiveStream: true,
  dynacast: true,
}

function ViewerVideo() {
  const participants = useRemoteParticipants()
  return (
    <div style={{ flex: 1, width: '100%', height: '100%', background: '#000' }}>
      {participants.map(p => (
        <VideoTrack
          key={p.identity}
          participant={p}
          source={Track.Source.Camera}
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

  useEffect(() => {
    loadAndJoin()
  }, [slug])

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

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#000' }}>
      <div style={{
        padding: '12px 16px',
        background: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: 20, fontWeight: 700, fontSize: '0.78rem' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse 1s infinite' }} />
          LIVE
        </span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{session?.toko?.nama}</p>
          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{session?.title}</p>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>👁 {session?.viewer_count || 0}</span>
        <button
          onClick={handleLeave}
          style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}
        >
          Keluar
        </button>
      </div>

      {livekitToken && livekitUrl && (
        <LiveKitRoom
          token={livekitToken}
          serverUrl={livekitUrl}
          connect={true}
          options={LIVEKIT_OPTIONS_VIEWER}
          style={{ flex: 1, paddingTop: 56 }}
        >
          <ViewerVideo />
          <RoomAudioRenderer />
        </LiveKitRoom>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
