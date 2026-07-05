import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Heart, MessageCircle, Image as ImageIcon, X, Send, Bookmark,
  Repeat2, Bell, ChevronLeft, ChevronRight, Hash, Maximize2, Mail, Store, Lock, Loader, ChevronDown, ChevronUp,
  Trash2, ZoomIn,
} from 'lucide-react'
import DashboardLayout from './DashboardLayout.jsx'
import StreamImageUpload from './StreamImageUpload.jsx'
import { useRealtimeReplies } from '../../hooks/useRealtimeReplies'
import { useRealtimeNotifications } from '../../hooks/useRealtimeNotifications'
import { useAuthStore, useTokoStore, useStreamStore } from '../../lib/store.js'
import { isPro, getStorefrontUrl, getInitials } from '../../lib/utils.js'
import { useTheme } from '../../lib/useTheme.js'
import toast from 'react-hot-toast'
import { motion, useAnimation, useInView, AnimatePresence } from 'framer-motion'

const PJS = "'Plus Jakarta Sans', sans-serif"

// ================================================
// COLOR CONSTANTS
// ================================================
const NAVY = '#0C447C'
const BLUE = '#378ADD'

// ================================================
// CLOUDINARY HELPER
// ================================================
function cloudinaryMedium(url) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/q_60,w_800/')
}

function cloudinaryThumb(url) {
  if (!url || !url.includes('cloudinary.com')) return url
  return url.replace('/upload/', '/upload/q_60,w_120,h_120,c_fill/')
}

const POST_TYPES = [
  { value: 'produk_baru', label: 'Produk baru', emoji: '🔥', hashtag: '#ProdukBaru', public: true },
  { value: 'cari_reseller', label: 'Cari reseller', emoji: '🤝', hashtag: '#CariReseller', public: false },
  { value: 'supplier_info', label: 'Supplier info', emoji: '📦', hashtag: '#SupplierInfo', public: false },
  { value: 'penjualan', label: 'Penjualan', emoji: '📈', hashtag: '#Penjualan', public: true },
  { value: 'cari_partner_live', label: 'Partner live', emoji: '🎥', hashtag: '#PartnerLive', public: false },
  { value: 'tips_jualan', label: 'Tips jualan', emoji: '💡', hashtag: '#TipsJualan', public: true },
]

// ================================================
// THEME TOKENS ENHANCED
// ================================================
const THEME_TOKENS = {
  light: {
    borderCard: '#111111',
    borderCardSoft: '#d1d5db',
    cardShadow: '0 2px 8px rgba(0,0,0,0.08)',
    hoverShadow: '0 12px 32px rgba(0,0,0,0.12)',
    bubbleBorderMine: '#111111',
    bubbleBorderOther: '#d1d5db',
  },
  dark: {
    borderCard: '#ffffff',
    borderCardSoft: 'rgba(255,255,255,0.25)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.4)',
    hoverShadow: '0 12px 32px rgba(0,0,0,0.6)',
    bubbleBorderMine: '#ffffff',
    bubbleBorderOther: 'rgba(255,255,255,0.25)',
  },
}

// ================================================
// DELETE CONFIRM MODAL
// ================================================
function DeleteConfirmModal({ onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 20px',
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 360,
          background: 'var(--bg-secondary)',
          border: '3px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl)',
          padding: '28px 24px 24px',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius-full)',
          background: 'rgba(239,68,68,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Trash2 size={22} color="var(--danger, #ef4444)" />
        </div>

        <h3 style={{ fontFamily: PJS, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          Hapus post ini?
        </h3>
        <p style={{ fontFamily: PJS, fontSize: '0.82rem', color: 'var(--text-tertiary)', margin: '0 0 24px', lineHeight: 1.6 }}>
          Post beserta semua komentar, like, dan repost-nya akan dihapus permanen.
        </p>

        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCancel}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)',
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              fontFamily: PJS, fontSize: '0.84rem', fontWeight: 700,
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
          >
            Batal
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onConfirm}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius-lg)',
              background: 'var(--danger, #ef4444)', border: 'none',
              fontFamily: PJS, fontSize: '0.84rem', fontWeight: 700,
              color: '#fff', cursor: 'pointer',
            }}
          >
            Hapus
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ================================================
// SKELETON LOADING
// ================================================
function SkeletonPost() {
  return (
    <div style={{
      border: '3px solid var(--glass-border)',
      borderRadius: '16px',
      padding: '14px 8px',
      marginBottom: '8px',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface)', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, width: 120, background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, width: 80, background: 'var(--surface)', borderRadius: 4, marginBottom: 10 }} />
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ height: 12, background: 'var(--surface)', borderRadius: 4, marginBottom: 8, width: '80%' }} />
          <div style={{ height: 200, background: 'var(--surface)', borderRadius: 8, marginTop: 10 }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {[60, 60, 60, 60].map((w, i) => (
              <div key={i} style={{ height: 14, width: w, background: 'var(--surface)', borderRadius: 4 }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ================================================
// ROOT
// ================================================
export default function StreamPage() {
  const { user, token } = useAuthStore()
  const { toko, load: loadToko } = useTokoStore()
  const tokenObj = token
  const pro = isPro(user)

  const {
    feed, feedLoading, activeTag, searchQuery,
    postDetail, postDetailLoading,
    dmThreads, dmMessages, activeThreadId,
    notifs, unreadNotifCount,
    loadFeed, setActiveTag, setSearchQuery,
    loadPostDetail, clearPostDetail, addReply,
    toggleLike, toggleRepost, toggleBookmark,
    deletePost,
    loadDmThreads, openDmThread, setActiveThreadId, loadDmMessages, sendDmMessage, clearDmThread,
    loadNotifs, markNotifsRead,
  } = useStreamStore()

  const { unreadCount: realtimeUnread, markRead: realtimeMarkRead } = useRealtimeNotifications(toko?.id)

  const [view, setView] = useState('feed')
  const [searchMode, setSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [composing, setComposing] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [expandedPosts, setExpandedPosts] = useState({})

  useEffect(() => {
    loadFeed(tokenObj, {})
    loadNotifs(tokenObj)
    if (!toko) loadToko(tokenObj)
  }, [])

  // Scroll progress
  useEffect(() => {
    const fn = () => {
      const scrollY = window.scrollY
      const scrollTotal = document.documentElement.scrollHeight - window.innerHeight
      const progress = scrollTotal > 0 ? (scrollY / scrollTotal) * 100 : 0
      setScrollProgress(progress)
    }
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const requirePro = () => toast.error('Fitur ini khusus seller Pro')

  const handleTag = (tag) => {
    setActiveTag(activeTag === tag ? null : tag)
    setSearchMode(false)
    setSearchInput('')
    loadFeed(tokenObj, { tag: activeTag === tag ? null : tag })
  }

  const handleSearchSubmit = () => {
    setSearchQuery(searchInput)
    loadFeed(tokenObj, { search: searchInput })
  }

  const openPostDetail = async (postId) => {
    setView('post-detail')
    await loadPostDetail(tokenObj, postId)
  }

  const backToFeed = () => {
    setView('feed')
    clearPostDetail()
  }

  const openDm = async (otherTokoId) => {
    if (!pro) return requirePro()
    try {
      const threadId = await openDmThread(tokenObj, { otherTokoId })
      await loadDmMessages(tokenObj, threadId)
      setView('dm-thread')
      setNotifOpen(false)
    } catch (err) {
      toast.error(err.message || 'Gagal membuka percakapan')
    }
  }

  const openDmList = async () => {
    setView('dm-list')
    await loadDmThreads(tokenObj)
  }

  const openThread = async (threadId) => {
    setActiveThreadId(threadId)
    await loadDmMessages(tokenObj, threadId)
    setView('dm-thread')
  }

  const openNotif = async () => {
    setNotifOpen(v => !v)
    realtimeMarkRead()
    await loadNotifs(tokenObj)
    markNotifsRead(tokenObj)
  }

  const handleLike = (targetType, targetId) => {
    if (!pro) return requirePro()
    toggleLike(tokenObj, { targetType, targetId }).catch(err => toast.error(err.message))
  }

  const handleRepost = (postId) => {
    if (!pro) return requirePro()
    toggleRepost(tokenObj, { postId }).catch(err => toast.error(err.message))
  }

  const handleBookmark = (postId) => {
    if (!pro) return requirePro()
    toggleBookmark(tokenObj, { postId }).catch(err => toast.error(err.message))
  }

  const handleReply = (postId, parentReplyId, parentTokoNama) => {
    if (!pro) return requirePro()
    setReplyTarget({ postId, parentReplyId, parentTokoNama })
  }

  const handleCompose = () => {
    if (!pro) return requirePro()
    setComposing(true)
  }

  const handleDeletePost = (postId) => setDeleteTarget(postId)

  const confirmDelete = async () => {
    const postId = deleteTarget
    setDeleteTarget(null)
    try {
      await deletePost(tokenObj, postId)
      toast.success('Post berhasil dihapus')
      if (view === 'post-detail') setView('feed')
    } catch (err) {
      toast.error(err.message || 'Gagal menghapus post')
    }
  }

  const handleSubmitReply = async (teks) => {
    try {
      await addReply(tokenObj, {
        postId: replyTarget.postId,
        parentReplyId: replyTarget.parentReplyId,
        teks,
      })
      setReplyTarget(null)
      toast.success('Balasan terkirim')
    } catch (err) {
      toast.error(err.message || 'Gagal membalas')
    }
  }

  const toggleExpandPost = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  // ── DM thread view ──
  if (view === 'dm-thread' && activeThreadId) {
    const thread = dmThreads.find(t => t.id === activeThreadId)
    return (
      <DashboardLayout>
        <DmThreadView
          thread={thread}
          messages={dmMessages}
          myTokoId={toko?.id}
          onBack={() => { setView('dm-list'); clearDmThread() }}
          onSend={(teks) => sendDmMessage(tokenObj, { threadId: activeThreadId, teks }).catch(err => toast.error(err.message))}
        />
      </DashboardLayout>
    )
  }

  // ─ DM list view ──
  if (view === 'dm-list') {
    return (
      <DashboardLayout>
        <DmListView threads={dmThreads} onBack={backToFeed} onOpen={openThread} />
      </DashboardLayout>
    )
  }

  // ── Post detail view ──
  if (view === 'post-detail') {
    return (
      <DashboardLayout>
        <PostDetailView
          post={postDetail}
          loading={postDetailLoading}
          myTokoId={toko?.id}
          pro={pro}
          onBack={backToFeed}
          onLike={handleLike}
          onRepost={handleRepost}
          onBookmark={handleBookmark}
          onReply={handleReply}
          onDm={openDm}
          onTag={handleTag}
          onDelete={handleDeletePost}
          isExpanded={expandedPosts[postDetail?.id] || false}
          onToggleExpand={() => toggleExpandPost(postDetail?.id)}
        />
        {replyTarget && (
          <ReplySheet
            target={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={handleSubmitReply}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </DashboardLayout>
    )
  }

  // ── Feed view (default) ──
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Scroll Progress Bar */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '3px',
          background: 'var(--accent-gradient)',
          width: `${scrollProgress}%`,
          zIndex: 101,
          transition: 'width 0.1s ease-out',
          boxShadow: '0 0 10px var(--accent-glow, rgba(91,138,245,0.5))',
        }} />

        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(16px)',
          borderBottom: '3px solid var(--glass-border)',
          marginBottom: 4,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', height: 52, gap: 10, padding: '0 4px' }}>
            {searchMode ? (
              <>
                <IconBtn onClick={() => { setSearchMode(false); setSearchInput('') }}><ChevronLeft size={20} /></IconBtn>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                  <input
                    autoFocus
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchSubmit()}
                    placeholder="Cari post, seller, #hashtag..."
                    style={{
                      width: '100%', background: 'var(--surface)', border: '2px solid var(--glass-border)',
                      borderRadius: 'var(--radius-lg)', padding: '8px 12px 8px 32px',
                      color: 'var(--text-primary)', fontSize: '0.83rem', outline: 'none',
                      fontFamily: PJS, boxSizing: 'border-box',
                    }}
                  />
                </div>
              </>
            ) : (
              <>
                <h1 style={{ flex: 1, fontFamily: PJS, fontSize: '1.1rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>Stream</h1>
                <IconBtn onClick={() => setSearchMode(true)}><Search size={15} /></IconBtn>
                <IconBtn onClick={openDmList}><Mail size={15} /></IconBtn>
                <div style={{ position: 'relative' }}>
                  <IconBtn onClick={openNotif} badge={unreadNotifCount + realtimeUnread}><Bell size={15} /></IconBtn>
                  {notifOpen && (
                    <NotifDropdown
                      notifs={notifs}
                      onClose={() => setNotifOpen(false)}
                      onOpenDm={(threadId) => { setNotifOpen(false); openThread(threadId) }}
                      onOpenPost={(postId) => { setNotifOpen(false); openPostDetail(postId) }}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {!pro && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-gradient-soft)', border: '2px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', padding: '10px 14px', margin: '8px 4px 4px',
            fontFamily: PJS, fontSize: '0.78rem', color: 'var(--text-secondary)',
          }}>
            <Lock size={14} color="var(--accent-3)" />
            Kamu bisa melihat Stream, tapi posting/balas/like/DM khusus seller Pro.
          </div>
        )}

        {activeTag && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 8px 4px' }}
          >
            <Hash size={13} color="var(--accent)" />
            <span style={{ fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{activeTag.replace('#', '')}</span>
            <button onClick={() => handleTag(activeTag)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={13} /></button>
          </motion.div>
        )}

        <div style={{ paddingBottom: 100 }}>
          {feedLoading && (
            <div>
              {Array(3).fill(0).map((_, i) => <SkeletonPost key={i} />)}
            </div>
          )}
          {!feedLoading && feed.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{ textAlign: 'center', padding: 40 }}
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  width: 56, height: 56, borderRadius: '14px',
                  background: 'var(--accent-gradient-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', color: 'var(--accent)',
                  border: '2px solid var(--glass-border)',
                }}
              >
                <Store size={24} />
              </motion.div>
              <p style={{ color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', margin: 0 }}>
                Belum ada post di Stream.
              </p>
            </motion.div>
          )}
          {feed.map((post, index) => (
            <PostCard
              key={post.id}
              post={post}
              index={index}
              myTokoId={toko?.id}
              pro={pro}
              onExpand={() => openPostDetail(post.id)}
              onLike={() => handleLike('post', post.id)}
              onRepost={() => handleRepost(post.id)}
              onBookmark={() => handleBookmark(post.id)}
              onReply={() => handleReply(post.id, null, post.toko?.nama)}
              onReplyToComment={(replyId, replyNama) => handleReply(post.id, replyId, replyNama)}
              onDm={() => openDm(post.toko?.id)}
              onTag={handleTag}
              onDelete={() => handleDeletePost(post.id)}
              isExpanded={expandedPosts[post.id] || false}
              onToggleExpand={() => toggleExpandPost(post.id)}
            />
          ))}
        </div>

        <motion.button
          onClick={handleCompose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: 'var(--radius-full)',
            background: pro ? 'var(--accent-gradient)' : 'var(--surface)',
            border: pro ? 'none' : '2px solid var(--glass-border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: pro ? '0 4px 24px var(--accent-glow, rgba(91,138,245,0.4))' : 'none',
            zIndex: 30,
          }}
        >
          {pro ? <span style={{ color: '#fff', fontSize: 24, lineHeight: 1, marginTop: -2 }}>+</span> : <Lock size={18} color="var(--text-tertiary)" />}
        </motion.button>

        {composing && (
          <ComposeSheet
            tokenObj={tokenObj}
            onClose={() => setComposing(false)}
            onSubmit={async (data) => {
              try {
                await useStreamStore.getState().createPost(tokenObj, data)
                setComposing(false)
                toast.success('Post berhasil dibuat')
              } catch (err) {
                toast.error(err.message || 'Gagal membuat post')
              }
            }}
          />
        )}
        {replyTarget && (
          <ReplySheet
            target={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={handleSubmitReply}
          />
        )}
        {deleteTarget && (
          <DeleteConfirmModal
            onConfirm={confirmDelete}
            onCancel={() => setDeleteTarget(null)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// ================================================
// POST CARD
// ================================================
function PostCard({ post, index, myTokoId, pro, onExpand, onLike, onRepost, onBookmark, onReply, onReplyToComment, onDm, onTag, onDelete, isExpanded, onToggleExpand }) {
  const t = post.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)
  const previewReplies = post.previewReplies?.length
    ? post.previewReplies
    : (post.replies || []).slice(0, 2)
  const [commentsOpen, setCommentsOpen] = useState(false)
  
  const controls = useAnimation()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  useEffect(() => {
    if (isInView) controls.start('visible')
  }, [controls, isInView])

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  }

  return (
    <motion.div
      ref={ref}
      variants={cardVariants}
      initial="hidden"
      animate={controls}
      whileHover={{ y: -4 }}
      className="showcase-card"
      style={{
        border: '3px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '14px 8px 0',
        marginBottom: '8px',
        background: 'var(--bg-secondary)',
        boxShadow: 'var(--shadow-sm)',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <SellerAvatar toko={t} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <TokoNameLink toko={t} fontSize="0.875rem" />
            {t?.pro && <ProBadge />}
            <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {timeAgo(post.createdAt)}
            </span>
            {isMine && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                title="Hapus post"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', display: 'flex', padding: 4,
                  borderRadius: 'var(--radius-md)', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>
          <PostTypeBadge type={post.postType} />
          <PostText text={post.teks} onTag={onTag} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={countReplies(previewReplies)}
            liked={post.liked} reposted={post.reposted} bookmarked={post.bookmarked}
            commentsOpen={commentsOpen}
            onLike={onLike} onRepost={onRepost} onBookmark={onBookmark} onReply={onReply}
            onToggleComments={() => setCommentsOpen(v => !v)}
            onDm={isMine ? null : onDm}
          />
        </div>
      </div>

      {commentsOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ paddingLeft: 52, paddingBottom: 4, overflow: 'hidden' }}
        >
          {previewReplies.length === 0 && (
            <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', padding: '8px 0' }}>
              Belum ada komentar.
            </p>
          )}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReply}
            style={{
              display: 'block', background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: PJS, fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600,
              padding: '4px 0 10px',
            }}
          >
            Tulis komentar
          </motion.button>
          {previewReplies.map(r => (
            <FeedReplyItem
              key={r.id}
              reply={r}
              postId={post.id}
              myTokoId={myTokoId}
              onReplyToComment={onReplyToComment}
              onDm={onDm}
            />
          ))}
          {post.repliesCount > countReplies(previewReplies) && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onExpand}
              style={{
                display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
                padding: '6px 0 10px', cursor: 'pointer',
                fontFamily: PJS, fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600,
              }}
            >
              Lihat {post.repliesCount - countReplies(previewReplies)} balasan lainnya →
            </motion.button>
          )}
          {post.repliesCount === 0 && <div style={{ height: 6 }} />}
        </motion.div>
      )}

      {!commentsOpen && <div style={{ height: 6 }} />}
    </motion.div>
  )
}

function FeedReplyItem({ reply, postId, myTokoId, depth = 0, onReplyToComment, onDm }) {
  const t = reply.toko
  const hasChildren = (reply.replies || []).length > 0

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: 10, paddingTop: 8, paddingBottom: 4, marginLeft: depth > 0 ? 28 : 0 }}
      >
        <SellerAvatar toko={t} size={depth === 0 ? 28 : 24} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
            <TokoNameLink toko={t} fontSize="0.78rem" />
            {t?.pro && <ProBadge small />}
            <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(reply.createdAt)}</span>
          </div>
          <p style={{ fontFamily: PJS, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.teks}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onReplyToComment(reply.id, t?.nama)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: PJS, fontSize: '0.7rem', color: 'var(--accent)',
              fontWeight: 600, padding: '3px 0', marginTop: 2,
            }}
          >
            Balas
          </motion.button>
        </div>
      </motion.div>
      {hasChildren && reply.replies.map(child => (
        <FeedReplyItem
          key={child.id}
          reply={child}
          postId={postId}
          myTokoId={myTokoId}
          depth={depth + 1}
          onReplyToComment={onReplyToComment}
          onDm={onDm}
        />
      ))}
    </div>
  )
}

// ================================================
// POST DETAIL VIEW
// ================================================
function PostDetailView({ post, loading, myTokoId, pro, onBack, onLike, onRepost, onBookmark, onReply, onDm, onTag, onDelete, isExpanded, onToggleExpand }) {
  const liveReplies = post?.replies || []

  if (loading || !post) {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <DetailHeader title="Post" onBack={onBack} />
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
        </div>
      </div>
    )
  }

  const t = post.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <DetailHeader title="Post" onBack={onBack} />

      <div style={{ padding: '14px 8px 0', display: 'flex', gap: 12 }}>
        <SellerAvatar toko={t} size={42} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <TokoNameLink toko={t} fontSize="0.9rem" fontWeight={800} />
            {t?.pro && <ProBadge />}
            <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(post.createdAt)}</span>
            {isMine && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onDelete(post.id)}
                title="Hapus post"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-tertiary)', display: 'flex', padding: 4,
                  borderRadius: 'var(--radius-md)', flexShrink: 0,
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--danger, #ef4444)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
              >
                <Trash2 size={14} />
              </motion.button>
            )}
          </div>
          <PostTypeBadge type={post.postType} />
          <PostText text={post.teks} onTag={onTag} isExpanded={isExpanded} onToggleExpand={onToggleExpand} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <div style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '10px 0', paddingBottom: 10, borderBottom: '2px solid var(--glass-border)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{post.likesCount}</strong> suka · <strong style={{ color: 'var(--text-secondary)' }}>{post.repostsCount}</strong> repost
          </div>
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={countReplies(liveReplies)}
            liked={post.liked} reposted={post.reposted} bookmarked={post.bookmarked}
            commentsOpen={true}
            onLike={() => onLike('post', post.id)}
            onRepost={() => onRepost(post.id)}
            onBookmark={() => onBookmark(post.id)}
            onReply={() => onReply(post.id, null, t?.nama)}
            onToggleComments={null}
            onDm={isMine ? null : () => onDm(t?.id)}
          />
        </div>
      </div>

      <div style={{ paddingBottom: 100 }}>
        {liveReplies.map(r => (
          <ReplyThread
            key={r.id}
            reply={r}
            postId={post.id}
            depth={0}
            myTokoId={myTokoId}
            onLike={(replyId) => onLike('reply', replyId)}
            onReply={onReply}
            onDm={onDm}
          />
        ))}
      </div>
    </div>
  )
}

function ReplyThread({ reply, postId, depth, myTokoId, onLike, onReply, onDm }) {
  const t = reply.toko
  const isMine = myTokoId != null && t?.id != null && String(t.id) === String(myTokoId)
  const hasChildren = (reply.replies || []).length > 0

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: 'flex', gap: 12, padding: `${depth === 0 ? 12 : 6}px 8px 0`, marginLeft: depth > 0 ? 32 : 0 }}
      >
        <SellerAvatar toko={t} size={depth === 0 ? 34 : 28} />
        <div style={{ flex: 1, minWidth: 0, paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
            <TokoNameLink toko={t} fontSize={depth === 0 ? '0.82rem' : '0.78rem'} />
            {t?.pro && <ProBadge small />}
            <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(reply.createdAt)}</span>
          </div>
          <p style={{ fontFamily: PJS, fontSize: depth === 0 ? '0.855rem' : '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.teks}</p>
          <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
            <ActionBtn icon={<Heart size={13} fill={reply.liked ? 'var(--danger)' : 'none'} />} label={reply.likesCount} active={reply.liked} activeColor="var(--danger)" onClick={() => onLike(reply.id)} />
            <ActionBtn icon={<MessageCircle size={13} />} label="Balas" onClick={() => onReply(postId, reply.id, t?.nama)} />
            {!isMine && <ActionBtn icon={<Mail size={13} />} onClick={() => onDm(t?.id)} />}
          </div>
        </div>
      </motion.div>
      {hasChildren && reply.replies.map(child => (
        <ReplyThread key={child.id} reply={child} postId={postId} depth={depth + 1} myTokoId={myTokoId} onLike={onLike} onReply={onReply} onDm={onDm} />
      ))}
    </div>
  )
}

// ================================================
// DM LIST + THREAD
// ================================================
function DmListView({ threads, onBack, onOpen }) {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <DetailHeader title="Pesan" onBack={onBack} />
      {threads.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', padding: 40 }}>
          Belum ada percakapan.
        </p>
      )}
      {threads.map(t => (
        <motion.div
          key={t.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.01 }}
          onClick={() => onOpen(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px',
            borderBottom: '2px solid var(--glass-border)', cursor: 'pointer',
            background: t.unread > 0 ? 'var(--accent-gradient-soft)' : 'transparent',
            transition: 'background 0.15s ease',
          }}
        >
          <SellerAvatar toko={t.toko} size={46} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontFamily: PJS, fontSize: '0.875rem', fontWeight: t.unread > 0 ? 800 : 600 }}>{t.toko?.nama}</span>
                {t.toko?.pro && <ProBadge />}
              </div>
            </div>
            <p style={{
              fontFamily: PJS, fontSize: '0.78rem', margin: 0,
              color: t.unread > 0 ? 'var(--text-secondary)' : 'var(--text-tertiary)',
              fontWeight: t.unread > 0 ? 600 : 400,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{t.lastMessage}</p>
          </div>
          {t.unread > 0 && (
            <div style={{
              width: 20, height: 20, borderRadius: 'var(--radius-full)', background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.6rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>{t.unread}</div>
          )}
        </motion.div>
      ))}
    </div>
  )
}

function DmThreadView({ thread, messages, myTokoId, onBack, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef()
  const messagesContainerRef = useRef()
  const { theme } = useTheme()

  useEffect(() => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    onSend(text)
    setInput('')
  }

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)' }}>
      <DetailHeader title={thread?.toko?.nama || 'Pesan'} onBack={onBack} avatar={thread?.toko} />
      
      {/* ✅ MESSAGES CONTAINER - BORDER DYNAMIC BERDASARKAN TEMA */}
      <div
        ref={messagesContainerRef}
        style={{
          flex: 1, 
          overflowY: 'auto', 
          padding: '14px 8px',
          display: 'flex', 
          flexDirection: 'column', 
          gap: 10,
          scrollBehavior: 'smooth',
          border: theme === 'dark' 
            ? `4px solid ${THEME_TOKENS.dark.bubbleBorderMine}`
            : `3px solid ${NAVY}`,
        }}
      >
        {messages.map((m, i) => (
          <motion.div
            key={m.id || i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.05 }}
            style={{ display: 'flex', justifyContent: m.isMine ? 'flex-end' : 'flex-start', gap: 8 }}
          >
            {/* ✅ BUBBLE CHAT - BORDER TIPIS */}
            <div style={{
              maxWidth: '72%', padding: '10px 13px',
              borderRadius: m.isMine ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
              background: m.isMine ? 'var(--accent-gradient)' : 'var(--surface)',
              border: '1px solid var(--glass-border)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}>
              <p style={{ fontFamily: PJS, fontSize: '0.855rem', color: m.isMine ? '#fff' : 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>{m.teks}</p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* ✅ INPUT CONTAINER - BORDER ATAS AJA */}
      <div style={{ 
        padding: '10px 8px', 
        borderTop: '3px solid var(--glass-border)',
        display: 'flex', 
        gap: 8 
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ketik pesan..."
          style={{
            flex: 1, background: 'var(--surface)', border: '2px solid var(--glass-border)',
            borderRadius: 'var(--radius-full)', padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: '0.855rem', outline: 'none', fontFamily: PJS,
            transition: 'border-color 0.2s ease',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent)'}
          onBlur={e => e.target.style.borderColor = 'var(--glass-border)'}
        />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={send}
          disabled={!input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'var(--accent-gradient)' : 'var(--surface)',
            border: '2px solid var(--glass-border)', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <Send size={14} color={input.trim() ? '#fff' : 'var(--text-tertiary)'} />
        </motion.button>
      </div>
    </div>
  )
}

// ================================================
// COMPOSE / REPLY SHEETS
// ================================================
function ComposeSheet({ tokenObj, onClose, onSubmit }) {
  const [teks, setTeks] = useState('')
  const [foto, setFoto] = useState([])
  const [postType, setPostType] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!teks.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ teks: teks.trim(), foto, postType })
    } finally {
      setSubmitting(false)
    }
  }

  const handlePostType = (pt) => {
    const prev = POST_TYPES.find(p => p.value === postType)
    let next = teks
    if (prev) next = next.replace(new RegExp(`\\s*${prev.hashtag}\\b`, 'i'), '').trim()
    if (postType === pt.value) {
      setPostType(null)
      setTeks(next)
    } else {
      setPostType(pt.value)
      setTeks(next ? `${next} ${pt.hashtag}` : pt.hashtag)
    }
  }

  return (
    <Sheet onClose={onClose} title="Buat Post">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {POST_TYPES.map(pt => (
          <motion.button
            key={pt.value}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handlePostType(pt)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 11px', borderRadius: 'var(--radius-full)',
              background: postType === pt.value ? 'var(--accent-gradient)' : 'var(--surface)',
              border: '2px solid var(--glass-border)',
              color: postType === pt.value ? '#fff' : 'var(--text-secondary)',
              fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{pt.emoji}</span>{pt.label}
          </motion.button>
        ))}
      </div>
      {postType && (() => {
        const selected = POST_TYPES.find(p => p.value === postType)
        const isPublic = selected?.public
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: isPublic ? 'rgba(52,211,153,0.1)' : 'var(--surface)',
            border: `2px solid ${isPublic ? 'rgba(52,211,153,0.3)' : 'var(--glass-border)'}`,
            borderRadius: 'var(--radius-md)', padding: '7px 11px', marginBottom: 12,
            fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600,
            color: isPublic ? 'var(--success, #34d399)' : 'var(--text-tertiary)',
          }}>
            {isPublic
              ? '🌐 Post ini tampil di Showcase publik — buyer non-login bisa lihat'
              : '🔒 Post ini cuma kelihatan sesama seller di komunitas'}
          </div>
        )
      })()}
      <textarea
        value={teks}
        onChange={e => setTeks(e.target.value)}
        placeholder={'Bagikan tips, promo, update toko...\nGunakan #hashtag untuk kategorisasi'}
        rows={5}
        maxLength={500}
        style={{
          width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
          fontSize: '0.875rem', lineHeight: 1.65, resize: 'none', outline: 'none', fontFamily: PJS,
          boxSizing: 'border-box', marginBottom: 12,
        }}
      />
      <StreamImageUpload value={foto} onChange={setFoto} tokenObj={tokenObj} disabled={submitting} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '2px solid var(--glass-border)' }}>
        <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: teks.length > 450 ? 'var(--danger)' : 'var(--text-tertiary)' }}>{teks.length}/500</span>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!teks.trim() || submitting}
          style={{
            padding: '9px 22px', borderRadius: 'var(--radius-full)', border: 'none',
            background: teks.trim() && !submitting ? 'var(--accent-gradient)' : 'var(--surface)',
            color: teks.trim() && !submitting ? '#fff' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700,
            cursor: teks.trim() && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Mengirim...' : 'Post'}
        </motion.button>
      </div>
    </Sheet>
  )
}

function ReplySheet({ target, onClose, onSubmit }) {
  const [teks, setTeks] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!teks.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(teks.trim())
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet onClose={onClose} title="Balas">
      {target.parentTokoNama && (
        <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: 12 }}>
          Membalas <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{target.parentTokoNama}</span>
        </p>
      )}
      <textarea
        value={teks}
        onChange={e => setTeks(e.target.value)}
        placeholder="Tulis balasan..."
        rows={4}
        autoFocus
        maxLength={500}
        style={{
          width: '100%', background: 'transparent', border: 'none', color: 'var(--text-primary)',
          fontSize: '0.875rem', lineHeight: 1.65, resize: 'none', outline: 'none', fontFamily: PJS,
          boxSizing: 'border-box',
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '2px solid var(--glass-border)' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={!teks.trim() || submitting}
          style={{
            padding: '9px 22px', borderRadius: 'var(--radius-full)', border: 'none',
            background: teks.trim() && !submitting ? 'var(--accent-gradient)' : 'var(--surface)',
            color: teks.trim() && !submitting ? '#fff' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.82rem', fontWeight: 700,
            cursor: teks.trim() && !submitting ? 'pointer' : 'not-allowed',
          }}
        >
          {submitting ? 'Mengirim...' : 'Balas'}
        </motion.button>
      </div>
    </Sheet>
  )
}

// ================================================
// NOTIF DROPDOWN
// ================================================
function NotifDropdown({ notifs, onClose, onOpenDm, onOpenPost }) {
  const ICON = { like: '❤️', reply: '💬', repost: '', dm: '✉️' }
  const ref = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleClick = (n) => {
    if (n.type === 'dm' && n.refThreadId) return onOpenDm(n.refThreadId)
    if (n.refPostId) return onOpenPost(n.refPostId)
  }

  const labelFor = (n) => {
    const name = n.actor?.nama || 'Seller'
    switch (n.type) {
      case 'like': return n.postExcerpt ? `${name} menyukai postmu: "${n.postExcerpt}"` : `${name} menyukai postmu`
      case 'reply':
        if (n.replyExcerpt && n.postExcerpt) return `${name} membalas postmu "${n.postExcerpt}": "${n.replyExcerpt}"`
        if (n.replyExcerpt) return `${name} membalas: "${n.replyExcerpt}"`
        return `${name} membalas postmu`
      case 'repost': return n.postExcerpt ? `${name} merepost postmu: "${n.postExcerpt}"` : `${name} merepost postmu`
      case 'dm': return `${name} mengirim pesan baru`
      default: return name
    }
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 50,
        width: 320, maxWidth: '90vw', maxHeight: 420, overflowY: 'auto',
        background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.35))',
        padding: '10px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 6px 10px', borderBottom: '2px solid var(--glass-border)', marginBottom: 6 }}>
        <span style={{ fontFamily: PJS, fontSize: '0.85rem', fontWeight: 800 }}>Notifikasi</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', display: 'flex', padding: 2 }}>
          <X size={14} />
        </button>
      </div>

      {notifs.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.8rem', padding: '20px 12px' }}>
          Belum ada notifikasi.
        </p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {notifs.map(n => (
          <motion.div
            key={n.id}
            whileHover={{ scale: 1.02 }}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 8px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: n.isRead ? 'transparent' : 'var(--accent-gradient-soft)',
              transition: 'background 0.15s ease',
            }}
          >
            <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON[n.type] || '🔔'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontFamily: PJS, fontSize: '0.76rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>{labelFor(n)}</p>
              <span style={{ fontFamily: PJS, fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{timeAgo(n.createdAt)}</span>
            </div>
            {!n.isRead && <div style={{ width: 6, height: 6, borderRadius: 'var(--radius-full)', background: 'var(--accent)', flexShrink: 0 }} />}
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ================================================
// SHARED UI
// ================================================
function Sheet({ children, onClose, title }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
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
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: 'var(--bg-secondary)', border: '2px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          padding: '18px 18px 28px', maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: PJS, fontSize: '0.95rem', fontWeight: 800 }}>{title}</span>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            style={{
              background: 'var(--surface)', border: '2px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-tertiary)',
            }}
          >
            <X size={14} />
          </motion.button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}

function DetailHeader({ title, onBack, avatar }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--bg-secondary)', backdropFilter: 'blur(16px)',
      borderBottom: '3px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', height: 52, gap: 10, padding: '0 4px',
    }}>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}
      >
        <ChevronLeft size={20} />
      </motion.button>
      {avatar && <SellerAvatar toko={avatar} size={28} />}
      <span style={{ fontFamily: PJS, fontSize: '1rem', fontWeight: 800 }}>{title}</span>
    </div>
  )
}

function SellerAvatar({ toko, size = 40 }) {
  const [isHovered, setIsHovered] = useState(false)
  
  if (toko?.logo) {
    return (
      <motion.img
        src={cloudinaryThumb(toko.logo)}
        alt={toko.nama}
        whileHover={{ scale: 1.1 }}
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          border: `2px solid ${isHovered ? 'var(--accent)' : 'var(--glass-border)'}`,
          transition: 'border-color 0.2s ease',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    )
  }
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      style={{
        width: size, height: size, borderRadius: '50%', background: 'var(--accent-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
        border: '2px solid var(--glass-border)',
      }}
    >
      {getInitials(toko?.nama)}
    </motion.div>
  )
}

function TokoNameLink({ toko, fontSize = '0.875rem', fontWeight = 800 }) {
  const url = toko?.slug ? getStorefrontUrl(toko.slug) : null
  const style = { fontFamily: PJS, fontSize, fontWeight, color: 'var(--text-primary)', textDecoration: 'none', cursor: url ? 'pointer' : 'default', transition: 'color 0.15s ease' }
  if (url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" style={style}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-primary)'}
      >
        {toko?.nama || 'Toko'}
      </a>
    )
  }
  return <span style={style}>{toko?.nama || 'Toko'}</span>
}

function ProBadge({ small }) {
  return <span className="badge badge-pro" style={{ fontSize: small ? '0.55rem' : '0.6rem', padding: '1px 6px' }}>⭐ Pro</span>
}

function PostTypeBadge({ type }) {
  const meta = POST_TYPES.find(pt => pt.value === type)
  if (!meta) return null
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--accent-gradient-soft)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)', padding: '3px 9px', marginBottom: 8,
        fontFamily: PJS, fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent)',
      }}
    >
      <span>{meta.emoji}</span>{meta.label}
    </motion.span>
  )
}

function IconBtn({ children, onClick, badge }) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        position: 'relative', background: 'var(--surface)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)', width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-tertiary)',
      }}
    >
      {children}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
          background: 'var(--danger, #ef4444)', border: '2px solid var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color: '#fff',
        }}>{badge}</div>
      )}
    </motion.button>
  )
}

function ActionBtn({ icon, label, active, activeColor, onClick }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
        cursor: 'pointer', color: active ? activeColor : 'var(--text-tertiary)',
        fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
        transition: 'color 0.15s ease',
      }}
    >
      {icon}{label !== undefined && label}
    </motion.button>
  )
}

function PostActions({ likesCount, repostsCount, repliesCount, liked, reposted, bookmarked, commentsOpen, onLike, onRepost, onBookmark, onReply, onToggleComments, onDm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4, marginBottom: 12 }}>
      <ActionBtn icon={<Heart size={15} fill={liked ? 'var(--danger)' : 'none'} />} label={likesCount} active={liked} activeColor="var(--danger)" onClick={onLike} />
      {onToggleComments ? (
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            cursor: 'pointer', color: commentsOpen ? 'var(--accent)' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
          }}
        >
          <MessageCircle size={15} />{repliesCount}
          {commentsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </motion.button>
      ) : (
        <ActionBtn icon={<MessageCircle size={15} />} label={repliesCount} onClick={onReply} />
      )}
      <ActionBtn icon={<Repeat2 size={15} />} label={repostsCount} active={reposted} activeColor="var(--success, #34d399)" onClick={onRepost} />
      {onDm && <ActionBtn icon={<Mail size={15} />} onClick={onDm} />}
      <div style={{ marginLeft: 'auto' }}>
        <ActionBtn icon={<Bookmark size={15} fill={bookmarked ? 'var(--accent)' : 'none'} />} active={bookmarked} activeColor="var(--accent)" onClick={onBookmark} />
      </div>
    </div>
  )
}

// PostText dengan fitur See More
function PostText({ text, onTag, isExpanded, onToggleExpand }) {
  const MAX_CHARS = 200
  const teks = text || ''
  const shouldTruncate = teks.length > MAX_CHARS
  const displayText = isExpanded || !shouldTruncate ? teks : teks.slice(0, MAX_CHARS)
  
  return (
    <div>
      <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 5px', whiteSpace: 'pre-line' }}>
        {displayText.split(/(\s+)/).map((w, i) =>
          w.startsWith('#')
            ? <motion.span
                key={i}
                whileHover={{ scale: 1.05 }}
                onClick={() => onTag(w)}
                style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer', display: 'inline-block' }}
              >
                {w}
              </motion.span>
            : w
        )}
        {shouldTruncate && !isExpanded && '...'}
      </p>
      
      {shouldTruncate && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleExpand}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent)',
            fontFamily: PJS,
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            padding: '4px 0 10px',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          {isExpanded ? (
            <>
              Lihat lebih sedikit
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              Lihat selengkapnya
              <ChevronDown size={14} />
            </>
          )}
        </motion.button>
      )}
    </div>
  )
}

// PostImages — gambar post pakai cloudinaryMedium (q_60,w_800)
// Lightbox tetap pakai URL original supaya bisa zoom full-res
function PostImages({ images }) {
  const [lightboxIdx, setLightboxIdx] = useState(null)
  if (!images?.length) return null

  return (
    <>
      {images.length === 1 ? (
        <motion.div
          whileHover={{ scale: 1.01 }}
          onClick={() => setLightboxIdx(0)}
          style={{ position: 'relative', marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', background: 'var(--surface)', cursor: 'pointer' }}
        >
          <img src={cloudinaryMedium(images[0])} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }} />
          <ZoomBadge />
        </motion.div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '2px solid var(--glass-border)', background: 'var(--surface)' }}>
          {images.map((img, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              onClick={() => setLightboxIdx(i)}
              style={{ position: 'relative', cursor: 'pointer', overflow: 'hidden' }}
            >
              <img src={cloudinaryMedium(img)} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, background: 'var(--surface)' }} />
              <ZoomBadge />
            </motion.div>
          ))}
        </div>
      )}
      {/* Lightbox pakai URL original untuk kualitas penuh */}
      {lightboxIdx !== null && <ImageLightbox images={images} index={lightboxIdx} onClose={() => setLightboxIdx(null)} />}
    </>
  )
}

function ZoomBadge() {
  return (
    <div style={{ position: 'absolute', bottom: 8, right: 8, width: 28, height: 28, borderRadius: 'var(--radius-full)', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <Maximize2 size={13} color="#fff" />
    </div>
  )
}

function ImageLightbox({ images, index, onClose }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length)
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [images.length, onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.button
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClose}
        style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2 }}
      >
        <X size={18} color="#fff" />
      </motion.button>
      {/* Lightbox URL original — full resolution */}
      <motion.img
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        src={images[current]}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8 }}
      />
      {images.length > 1 && (
        <>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length) }}
            style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronLeft size={20} color="#fff" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length) }}
            style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', width: 40, height: 40, borderRadius: 'var(--radius-full)', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ChevronRight size={20} color="#fff" />
          </motion.button>
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: '#fff', fontFamily: PJS, fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', padding: '4px 12px', borderRadius: 'var(--radius-full)' }}>
            {current + 1} / {images.length}
          </div>
        </>
      )}
    </motion.div>
  )
}

function ShopLinkCard({ link }) {
  return (
    <motion.a
      href={getStorefrontUrl(link.slug)}
      target="_blank"
      rel="noreferrer"
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      style={{
        width: '100%', marginBottom: 10, background: 'var(--surface)', border: '2px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', boxSizing: 'border-box',
      }}
    >
      <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Store size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{link.nama}</p>
        <p style={{ fontFamily: PJS, fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: 0 }}>{getStorefrontUrl(link.slug)}</p>
      </div>
      <motion.span
        animate={{ x: [0, 3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
        style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-gradient-soft)', padding: '4px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}
      >
        Kunjungi →
      </motion.span>
    </motion.a>
  )
}

function HashtagPills({ tags, onTag }) {
  if (!tags?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
      {tags.map(tag => (
        <motion.span
          key={tag}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onTag(tag)}
          style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer', background: 'var(--accent-gradient-soft)', border: '2px solid var(--glass-border)', padding: '3px 9px', borderRadius: 'var(--radius-md)', display: 'inline-block' }}
        >
          {tag}
        </motion.span>
      ))}
    </div>
  )
}

// ================================================
// HELPERS
// ================================================
function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return `${diff}dtk`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  return `${Math.floor(diff / 86400)}h`
}

function countReplies(replies) {
  if (!replies?.length) return 0
  return replies.reduce((sum, r) => sum + 1 + countReplies(r.replies), 0)
}
