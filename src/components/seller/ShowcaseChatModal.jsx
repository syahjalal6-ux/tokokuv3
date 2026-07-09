import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, User, Loader, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { showcaseChatApi } from '../../lib/api/groqClient.js'
import { getStorefrontUrl } from '../../lib/utils.js'

const NAVY = '#0C447C'
const BLUE = '#378ADD'
const GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`
const INTERNAL_DOMAINS = ['exorashop.vercel.app', 'exora.id']

// Parse teks menjadi array token: paragraf, bullet list, bold, link tombol
function parseMessage(text) {
  const lines = text.split('\n')
  const tokens = []
  let bulletBuffer = []

  const flushBullets = () => {
    if (bulletBuffer.length > 0) {
      tokens.push({ type: 'bullets', items: [...bulletBuffer] })
      bulletBuffer = []
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushBullets()
      continue
    }

    // Baris bullet: * item atau - item
    const bulletMatch = line.match(/^[*\-]\s+(.+)/)
    if (bulletMatch) {
      bulletBuffer.push(bulletMatch[1])
      continue
    }

    flushBullets()
    tokens.push({ type: 'line', content: line })
  }

  flushBullets()
  return tokens
}

function normalizeKey(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Validasi & perbaiki link yang ditulis LLM menggunakan data produkList asli.
// LLM kadang menulis ulang slug dari memori (typo, kepotong, atau ngarang),
// jadi link mentah dari teks TIDAK boleh dipercaya langsung — harus dicocokkan
// ke daftar tokoSlug yang valid dari database sebelum dirender sebagai tombol.
function resolveValidUrl(rawUrl, produkList) {
  let slug = ''
  try {
    const u = new URL(rawUrl)
    slug = u.pathname.replace(/^\/+|\/+$/g, '')
  } catch {
    return null
  }
  if (!slug) return null

  const list = produkList || []
  const validSlugs = new Set(list.map(p => p.tokoSlug).filter(Boolean))

  // Kasus 1: slug yang ditulis LLM sudah persis sama dengan slug asli
  if (validSlugs.has(slug)) return getStorefrontUrl(slug)

  // Kasus 2: slug tidak cocok persis -> coba cocokkan ke nama toko
  // (mis. LLM nulis "mavara wear" padahal slug asli "mavara-wear-official")
  const normSlug = normalizeKey(slug)
  for (const p of list) {
    if (p.tokoSlug && p.tokoNama && normalizeKey(p.tokoNama) === normSlug) {
      return getStorefrontUrl(p.tokoSlug)
    }
  }

  // Tidak ada match valid -> jangan dirender sebagai link supaya tidak 404
  return null
}

// Render satu baris teks: bold, italic, URL jadi tombol chip (sudah divalidasi)
function InlineContent({ text, onLinkClick, produkList }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part)) {
          const validUrl = resolveValidUrl(part, produkList)

          if (!validUrl) {
            // Link tidak bisa divalidasi -> tampilkan sebagai teks biasa,
            // jangan jadi tombol yang akan 404 saat diklik.
            return <span key={i}>{part}</span>
          }

          let label = 'Kunjungi Toko'
          try {
            const slugPath = new URL(validUrl).pathname.replace(/^\//, '').replace(/\/$/, '')
            if (slugPath) label = slugPath.replace(/-/g, ' ')
          } catch {}

          return (
            <a
              key={i}
              href={validUrl}
              className="chat-link"
              onClick={onLinkClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: '#e8f0fb', color: BLUE,
                padding: '3px 9px', borderRadius: 20,
                fontSize: '0.78rem', fontWeight: 600,
                textDecoration: 'none', margin: '2px 2px',
                border: `1px solid ${BLUE}22`,
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <ExternalLink size={11} />
              {label}
            </a>
          )
        }
        // Render bold & italic inline
        const boldItalic = part
          .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
          .map((chunk, j) => {
            if (chunk.startsWith('**') && chunk.endsWith('**')) {
              return <strong key={j}>{chunk.slice(2, -2)}</strong>
            }
            if (chunk.startsWith('*') && chunk.endsWith('*')) {
              return <em key={j}>{chunk.slice(1, -1)}</em>
            }
            return chunk
          })
        return <span key={i}>{boldItalic}</span>
      })}
    </>
  )
}

function MessageBubble({ msg, onLinkClick, produkList }) {
  const isUser = msg.role === 'user'

  if (isUser) {
    return (
      <div style={{
        maxWidth: '78%', padding: '9px 12px',
        borderRadius: '16px 16px 4px 16px',
        background: GRADIENT, color: '#fff',
        fontSize: '0.845rem', lineHeight: 1.55,
      }}>
        {msg.content}
      </div>
    )
  }

  const tokens = parseMessage(msg.content)

  return (
    <div style={{
      maxWidth: '82%', padding: '10px 13px',
      borderRadius: '16px 16px 16px 4px',
      background: '#f7f7f7', border: '1px solid #ececec',
      color: '#1a1a1a', fontSize: '0.845rem', lineHeight: 1.6,
      display: 'flex', flexDirection: 'column', gap: 6,
    }}>
      {tokens.map((token, i) => {
        if (token.type === 'bullets') {
          return (
            <ul key={i} style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {token.items.map((item, j) => (
                <li key={j} style={{ lineHeight: 1.55 }}>
                  <InlineContent text={item} onLinkClick={onLinkClick} produkList={produkList} />
                </li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} style={{ margin: 0, lineHeight: 1.6 }}>
            <InlineContent text={token.content} onLinkClick={onLinkClick} produkList={produkList} />
          </p>
        )
      })}
    </div>
  )
}

export default function ShowcaseChatModal({ onClose, posts = [], produkList = [] }) {
  const navigate = useNavigate()
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Tanya apa saja tentang produk atau toko di Showcase Exora 😊' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [])

  const handleLinkClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    const href = e.currentTarget.getAttribute('href')
    if (!href) return
    try {
      const url = new URL(href)
      const isInternal = INTERNAL_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith('.' + d))
      if (isInternal) {
        onClose()
        const pathname = url.pathname.replace(/^\/toko\//, '/')
        navigate(pathname + url.search + url.hash)
      } else {
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    } catch {
      window.open(href, '_blank', 'noopener,noreferrer')
    }
  }, [navigate, onClose])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)
    try {
      const data = await showcaseChatApi.send({ messages: newMessages, posts, produkList })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Maaf, terjadi kesalahan. Silakan coba lagi.' }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
      }}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        drag="y"
        dragConstraints={{ top: 0 }}
        dragElastic={0.2}
        onDragEnd={(e, info) => {
          if (info.offset.y > 100) onClose()
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: '#ffffff', borderRadius: '20px 20px 0 0',
          height: '100dvh', maxHeight: '100dvh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

        {/* Header */}
        <div style={{
          padding: '14px 16px', borderBottom: '1px solid #ececec',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: GRADIENT,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', margin: 0, color: '#1a1a1a' }}>Asisten Showcase Exora</p>
            <p style={{ fontSize: '0.7rem', color: '#8a8a8a', margin: 0 }}>Cari produk & toko dengan AI</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8a8a8a', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 7 }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: '50%',
                background: msg.role === 'user' ? GRADIENT : '#f7f7f7',
                border: '1px solid #ececec',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {msg.role === 'user' ? <User size={12} color="#fff" /> : <Bot size={12} color={BLUE} />}
              </div>
              <MessageBubble msg={msg} onLinkClick={handleLinkClick} produkList={produkList} />
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f7f7f7', border: '1px solid #ececec', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={12} color={BLUE} />
              </div>
              <div style={{ padding: '9px 12px', background: '#f7f7f7', border: '1px solid #ececec', borderRadius: '16px 16px 16px 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader size={13} color={BLUE} style={{ animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.78rem', color: '#8a8a8a' }}>Mengetik...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '8px 14px 10px', borderTop: '1px solid #ececec', flexShrink: 0, background: '#fff' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Cari produk, tanya toko..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1, padding: '9px 12px',
                background: '#f7f7f7', border: '1px solid #ececec',
                borderRadius: 12, color: '#1a1a1a', fontSize: '0.875rem',
                resize: 'none', outline: 'none', fontFamily: 'inherit',
                lineHeight: 1.5, maxHeight: 80, overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                background: !input.trim() || loading ? '#f7f7f7' : GRADIENT,
                border: '1px solid #ececec', cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: !input.trim() || loading ? '#8a8a8a' : '#fff', transition: 'all 0.2s',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
