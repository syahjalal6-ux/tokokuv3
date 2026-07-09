import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader, ShoppingBag } from 'lucide-react'
import { motion } from 'framer-motion'
import { chatApi } from '../../lib/api/groqClient.js'

function renderMarkdown(text) {
  const html = text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
  return { __html: html }
}

export default function ChatModal({ produk, toko, tema, onClose, onCheckout, semuaProduk = [] }) {
  const isUmum = !produk

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: isUmum
        ? `Halo! Saya asisten toko **${toko.nama}**. Tanya apa saja tentang toko atau produk kami 😊`
        : `Halo! Saya asisten toko **${toko.nama}**. Ada yang ingin kamu tanyakan tentang **${produk.nama}**?`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [vpHeight, setVpHeight] = useState(window.visualViewport?.height || window.innerHeight)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const sold = produk ? produk.stok === 0 : false

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const vv = window.visualViewport

    const onVVResize = () => {
      setVpHeight(vv.height)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }

    const onWindowResize = () => {
      const h = window.visualViewport?.height || window.innerHeight
      setVpHeight(h)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }

    if (vv) {
      vv.addEventListener('resize', onVVResize)
      vv.addEventListener('scroll', onVVResize)
    }

    window.addEventListener('resize', onWindowResize)

    return () => {
      if (vv) {
        vv.removeEventListener('resize', onVVResize)
        vv.removeEventListener('scroll', onVVResize)
      }
      window.removeEventListener('resize', onWindowResize)
    }
  }, [])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const data = await chatApi.send({
        messages: newMessages,
        produk: produk ? {
          nama: produk.nama,
          deskripsi: produk.deskripsi,
          harga: produk.harga,
          hargaCoret: produk.hargaCoret,
          stok: produk.stok,
          kategori: produk.kategori,
          berat: produk.berat,
        } : null,
        semuaProduk: semuaProduk.map(p => ({
          nama: p.nama,
          harga: p.harga,
          hargaCoret: p.hargaCoret,
          stok: p.stok,
          kategori: p.kategori,
          deskripsi: p.deskripsi ? p.deskripsi.slice(0, 200) : '',
        })),
        toko: {
          id: toko.id,
          nama: toko.nama,
          deskripsi: toko.deskripsi,
        },
      })
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Maaf, terjadi kesalahan. Silakan coba lagi.',
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
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
          width: '100%', maxWidth: 640,
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          height: vpHeight,
          maxHeight: vpHeight,
          display: 'flex', flexDirection: 'column',
          transition: 'height 0.15s ease',
          overflow: 'hidden',
        }}
      >
        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: 10,
          flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 'var(--radius-full)',
            background: tema.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Asisten {toko.nama}</p>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
              {isUmum ? 'Tanya apa saja tentang toko ini' : `Tanya soal ${produk.nama}`}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px',
          display: 'flex', flexDirection: 'column', gap: 10,
          minHeight: 0,
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 7,
              }}
            >
              <div style={{
                width: 26, height: 26, borderRadius: 'var(--radius-full)',
                background: msg.role === 'user' ? tema.gradient : 'var(--surface)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {msg.role === 'user'
                  ? <User size={12} color="#fff" />
                  : <Bot size={12} color={tema.accent} />
                }
              </div>
              <div
                dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                style={{
                  maxWidth: '78%',
                  padding: '9px 12px',
                  borderRadius: msg.role === 'user'
                    ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)'
                    : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
                  background: msg.role === 'user' ? tema.gradient : 'var(--surface)',
                  border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                  fontSize: '0.845rem',
                  lineHeight: 1.55,
                  whiteSpace: 'pre-wrap',
                }}
              />
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7 }}>
              <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-full)', background: 'var(--surface)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Bot size={12} color={tema.accent} />
              </div>
              <div style={{ padding: '9px 12px', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader size={13} color={tema.accent} style={{ animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>Mengetik...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Bottom: tombol beli + input */}
        <div style={{
          padding: '8px 14px 10px',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
          background: 'var(--bg-secondary)',
        }}>
          {!isUmum && (
            <button
              onClick={() => !sold && onCheckout(produk)}
              disabled={sold}
              style={{
                width: '100%', padding: '9px',
                background: sold ? 'var(--surface)' : tema.gradient,
                border: 'none', borderRadius: 'var(--radius-lg)',
                color: sold ? 'var(--text-tertiary)' : '#fff',
                fontWeight: 700, fontSize: '0.82rem',
                cursor: sold ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                boxShadow: sold ? 'none' : `0 3px 12px ${tema.accent}44`,
                marginBottom: 8,
              }}
            >
              <ShoppingBag size={14} />
              {sold ? 'Stok Habis' : 'Lanjut Beli via WhatsApp'}
            </button>
          )}

          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pertanyaanmu..."
              disabled={loading}
              rows={1}
              style={{
                flex: 1,
                padding: '9px 12px',
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 80,
                overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 'var(--radius-lg)',
                background: !input.trim() || loading ? 'var(--surface)' : tema.gradient,
                border: '1px solid var(--glass-border)',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: !input.trim() || loading ? 'var(--text-tertiary)' : '#fff',
                flexShrink: 0, transition: 'all 0.2s',
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
