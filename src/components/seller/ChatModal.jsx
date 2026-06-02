import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader, ShoppingBag, MessageCircle } from 'lucide-react'

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNFrArQcqL7BUh_uv3z2tNG0OoYI0EXZhsFGTrt0IfmxKTG4ascHDbUJ8CSjCXPnT1/exec'

export default function ChatModal({ produk, toko, tema, onClose, onCheckout }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Halo! Saya asisten toko **${toko.nama}**. Ada yang ingin kamu tanyakan tentang **${produk.nama}**?`,
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const sold = produk.stok === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
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
      const res = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'chat',
          messages: newMessages,
          produk: {
            nama: produk.nama,
            deskripsi: produk.deskripsi,
            harga: produk.harga,
            hargaCoret: produk.hargaCoret,
            stok: produk.stok,
            kategori: produk.kategori,
            berat: produk.berat,
          },
          toko: {
            nama: toko.nama,
            deskripsi: toko.deskripsi,
          },
        }),
      })

      const data = await res.json()
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
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 640,
          margin: '0 auto',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          maxHeight: '85vh',
          display: 'flex', flexDirection: 'column',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <style>{`@keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }`}</style>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--glass-border)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-full)',
            background: tema.gradient,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={18} color="#fff" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>Asisten {toko.nama}</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)' }}>Tanya soal {produk.nama}</p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent', border: 'none',
              color: 'var(--text-tertiary)', cursor: 'pointer',
              display: 'flex', padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 16px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8,
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: msg.role === 'user' ? tema.gradient : 'var(--surface)',
                border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {msg.role === 'user'
                  ? <User size={13} color="#fff" />
                  : <Bot size={13} color={tema.accent} />
                }
              </div>
              <div style={{
                maxWidth: '75%',
                padding: '10px 14px',
                borderRadius: msg.role === 'user'
                  ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)'
                  : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
                background: msg.role === 'user' ? tema.gradient : 'var(--surface)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--glass-border)',
                color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 'var(--radius-full)',
                background: 'var(--surface)', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Bot size={13} color={tema.accent} />
              </div>
              <div style={{
                padding: '10px 14px',
                background: 'var(--surface)', border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Loader size={14} color={tema.accent} style={{ animation: 'spin 0.7s linear infinite' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Mengetik...</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Checkout CTA */}
        <div style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          <button
            onClick={() => !sold && onCheckout(produk)}
            disabled={sold}
            style={{
              width: '100%',
              padding: '10px',
              background: sold ? 'var(--surface)' : tema.gradient,
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              color: '#fff',
              fontWeight: 700, fontSize: '0.85rem',
              cursor: sold ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: sold ? 'none' : `0 4px 16px ${tema.accent}44`,
              marginBottom: 10,
            }}
          >
            <ShoppingBag size={15} />
            {sold ? 'Stok Habis' : 'Lanjut Beli via WhatsApp'}
          </button>

          {/* Input */}
          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-end',
          }}>
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
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                resize: 'none',
                outline: 'none',
                fontFamily: 'inherit',
                lineHeight: 1.5,
                maxHeight: 100,
                overflowY: 'auto',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              style={{
                width: 40, height: 40, borderRadius: 'var(--radius-lg)',
                background: !input.trim() || loading ? 'var(--surface)' : tema.gradient,
                border: '1px solid var(--glass-border)',
                cursor: !input.trim() || loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: !input.trim() || loading ? 'var(--text-tertiary)' : '#fff',
                flexShrink: 0,
                transition: 'all 0.2s',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
