import React, { useState, useRef, useEffect, useCallback } from 'react'
import { X, Send, Bot, User, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { showcaseChatApi } from '../../lib/api/groqClient.js'

const NAVY = '#0C447C'
const BLUE = '#378ADD'
const GRADIENT = `linear-gradient(90deg, ${NAVY}, ${BLUE})`
const INTERNAL_DOMAINS = ['exorav2.vercel.app', 'exora.id']

function renderMarkdown(text) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" class="chat-link" rel="noreferrer" style="color:#378ADD;text-decoration:underline">$1</a>'
    )
  return { __html: html }
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
  const messagesRef = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { inputRef.current?.focus() }, [])

  // Intercept link clicks inside chat bubbles — handle internal PWA navigation
  const handleMessageClick = useCallback((e) => {
    const anchor = e.target.closest('a.chat-link')
    if (!anchor) return
    e.preventDefault()
    e.stopPropagation()

    const href = anchor.getAttribute('href')
    if (!href) return

    try {
      const url = new URL(href)
      const isInternal = INTERNAL_DOMAINS.some(d => url.hostname === d || url.hostname.endsWith('.' + d))

      if (isInternal) {
        // Navigate inside PWA — no full reload, no blank tab
        onClose()
        navigate(url.pathname + url.search + url.hash)
      } else {
        // External link — open in browser outside PWA
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    } catch {
      // Fallback jika URL tidak valid
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
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: '#ffffff', borderRadius: '20px 20px 0 0',
          height: '100dvh', maxHeight: '100dvh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>

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
        <div
          ref={messagesRef}
          style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}
        >
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
              <div
                dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                onClick={msg.role === 'assistant' ? handleMessageClick : undefined}
                style={{
                  maxWidth: '78%', padding: '9px 12px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? GRADIENT : '#f7f7f7',
                  border: msg.role === 'user' ? 'none' : '1px solid #ececec',
                  color: msg.role === 'user' ? '#fff' : '#1a1a1a',
                  fontSize: '0.845rem', lineHeight: 1.55, whiteSpace: 'pre-wrap',
                  cursor: 'text',
                }}
              />
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
      </div>
    </div>
  )
}
