import React, { useState, useEffect, useRef } from 'react'
import {
  Search, Heart, MessageCircle, Image as ImageIcon, X, Send, Bookmark,
  Repeat2, Bell, ChevronLeft, Hash, Mail, Store, Lock, Loader, ChevronDown, ChevronUp,
} from 'lucide-react'
import DashboardLayout from './DashboardLayout.jsx'
import StreamImageUpload from './StreamImageUpload.jsx'
import { useAuthStore, useTokoStore, useStreamStore } from '../../lib/store.js'
import { isPro, getStorefrontUrl, getInitials } from '../../lib/utils.js'
import toast from 'react-hot-toast'

const PJS = "'Plus Jakarta Sans', sans-serif"

// ================================================
// ROOT
// ================================================
export default function StreamPage() {
  const { user, tokenSupabase, tokenGas } = useAuthStore()
  const { toko } = useTokoStore()
  const tokenObj = { tokenSupabase, tokenGas }
  const pro = isPro(user)

  const {
    feed, feedLoading, activeTag, searchQuery,
    postDetail, postDetailLoading,
    dmThreads, dmMessages, activeThreadId,
    notifs, unreadNotifCount,
    loadFeed, setActiveTag, setSearchQuery,
    loadPostDetail, clearPostDetail, addReply,
    toggleLike, toggleRepost, toggleBookmark,
    loadDmThreads, openDmThread, setActiveThreadId, loadDmMessages, sendDmMessage, clearDmThread,
    loadNotifs, markNotifsRead,
  } = useStreamStore()

  const [view, setView] = useState('feed')
  const [searchMode, setSearchMode] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [composing, setComposing] = useState(false)
  const [replyTarget, setReplyTarget] = useState(null)
  const [notifOpen, setNotifOpen] = useState(false)

  useEffect(() => {
    loadFeed(tokenObj, {})
  }, [])

  const requirePro = () => {
    toast.error('Fitur ini khusus seller Pro')
  }

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
    setNotifOpen(true)
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

  // ── DM list view ──
  if (view === 'dm-list') {
    return (
      <DashboardLayout>
        <DmListView
          threads={dmThreads}
          onBack={backToFeed}
          onOpen={openThread}
        />
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
        />
        {replyTarget && (
          <ReplySheet
            target={replyTarget}
            onClose={() => setReplyTarget(null)}
            onSubmit={async (teks) => {
              try {
                await addReply(tokenObj, { postId: replyTarget.postId, parentReplyId: replyTarget.parentReplyId, teks })
                setReplyTarget(null)
                toast.success('Balasan terkirim')
              } catch (err) {
                toast.error(err.message || 'Gagal membalas')
              }
            }}
          />
        )}
      </DashboardLayout>
    )
  }

  // ── Feed view (default) ──
  return (
    <DashboardLayout>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 20,
          background: 'var(--bg-secondary)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--glass-border)',
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
                      width: '100%', background: 'var(--surface)', border: '1px solid var(--glass-border)',
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
                <IconBtn onClick={openNotif} badge={unreadNotifCount}><Bell size={15} /></IconBtn>
              </>
            )}
          </div>
        </div>

        {!pro && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--accent-gradient-soft)', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-lg)', padding: '10px 14px', margin: '8px 4px 4px',
            fontFamily: PJS, fontSize: '0.78rem', color: 'var(--text-secondary)',
          }}>
            <Lock size={14} color="var(--accent-3)" />
            Kamu bisa melihat Stream, tapi posting/balas/like/DM khusus seller Pro.
          </div>
        )}

        {activeTag && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 8px 4px' }}>
            <Hash size={13} color="var(--accent)" />
            <span style={{ fontFamily: PJS, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent)' }}>{activeTag.replace('#', '')}</span>
            <button onClick={() => handleTag(activeTag)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={13} /></button>
          </div>
        )}

        {/* Feed list */}
        <div style={{ paddingBottom: 100 }}>
          {feedLoading && (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader size={20} color="var(--accent)" style={{ animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
          {!feedLoading && feed.length === 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', padding: 40 }}>
              Belum ada post di Stream.
            </p>
          )}
          {feed.map(post => (
            <PostCard
              key={post.id}
              post={post}
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
            />
          ))}
        </div>

        {/* FAB */}
        <button
          onClick={handleCompose}
          style={{
            position: 'fixed', bottom: 28, right: 28, width: 52, height: 52, borderRadius: 'var(--radius-full)',
            background: pro ? 'var(--accent-gradient)' : 'var(--surface)',
            border: pro ? 'none' : '1px solid var(--glass-border)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: pro ? '0 4px 24px var(--accent-glow, rgba(91,138,245,0.4))' : 'none',
            zIndex: 30,
          }}
        >
          {pro ? <span style={{ color: '#fff', fontSize: 24, lineHeight: 1, marginTop: -2 }}>+</span> : <Lock size={18} color="var(--text-tertiary)" />}
        </button>

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
            onSubmit={async (teks) => {
              try {
                await addReply(tokenObj, { postId: replyTarget.postId, parentReplyId: replyTarget.parentReplyId, teks })
                setReplyTarget(null)
                toast.success('Balasan terkirim')
              } catch (err) {
                toast.error(err.message || 'Gagal membalas')
              }
            }}
          />
        )}
        {notifOpen && (
          <NotifSheet
            notifs={notifs}
            onClose={() => setNotifOpen(false)}
            onOpenDm={(threadId) => { setNotifOpen(false); openThread(threadId) }}
            onOpenPost={(postId) => { setNotifOpen(false); openPostDetail(postId) }}
          />
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </DashboardLayout>
  )
}

// ================================================
// POST CARD (feed item)
// ================================================
function PostCard({ post, myTokoId, pro, onExpand, onLike, onRepost, onBookmark, onReply, onReplyToComment, onDm, onTag }) {
  const t = post.toko
  const isMine = myTokoId && t?.id === myTokoId
  const previewReplies = post.previewReplies || []
  const [commentsOpen, setCommentsOpen] = useState(false)

  return (
    <div style={{ borderBottom: '1px solid var(--glass-border)', padding: '14px 8px 0' }}>
      <div style={{ display: 'flex', gap: 12 }}>
        <SellerAvatar toko={t} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            {/* Nama toko bisa diklik → ke storefront */}
            <TokoNameLink toko={t} fontSize="0.875rem" />
            {t?.pro && <ProBadge />}
            <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <PostText text={post.teks} onTag={onTag} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={post.repliesCount}
            liked={post.liked} reposted={post.reposted} bookmarked={post.bookmarked}
            commentsOpen={commentsOpen}
            onLike={onLike} onRepost={onRepost} onBookmark={onBookmark} onReply={onReply}
            onToggleComments={() => setCommentsOpen(v => !v)}
            onDm={isMine ? null : onDm}
          />
        </div>
      </div>

      {/* Komentar toggle — hanya tampil kalau commentsOpen */}
      {commentsOpen && (
        <div style={{ paddingLeft: 52, paddingBottom: 4 }}>
          {previewReplies.length === 0 && (
            <p style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', padding: '8px 0' }}>
              Belum ada komentar.
            </p>
          )}
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
          {post.repliesCount > previewReplies.length && (
            <button onClick={onExpand} style={{
              display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none',
              padding: '6px 0 10px', cursor: 'pointer',
              fontFamily: PJS, fontSize: '0.78rem', color: 'var(--accent)', fontWeight: 600,
            }}>
              Lihat {post.repliesCount - previewReplies.length} balasan lainnya →
            </button>
          )}
          {post.repliesCount === 0 && <div style={{ height: 6 }} />}
        </div>
      )}

      {!commentsOpen && <div style={{ height: 6 }} />}
    </div>
  )
}

// Komentar di feed dengan tombol balas
function FeedReplyItem({ reply, postId, myTokoId, onReplyToComment, onDm }) {
  const t = reply.toko
  const isMine = myTokoId && t?.id === myTokoId

  return (
    <div style={{ display: 'flex', gap: 10, paddingTop: 8, paddingBottom: 4 }}>
      <SellerAvatar toko={t} size={28} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
          <TokoNameLink toko={t} fontSize="0.78rem" />
          {t?.pro && <ProBadge small />}
          <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)', marginLeft: 'auto' }}>{timeAgo(reply.createdAt)}</span>
        </div>
        <p style={{ fontFamily: PJS, fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{reply.teks}</p>
        {/* Tombol balas komentar */}
        <button
          onClick={() => onReplyToComment(reply.id, t?.nama)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: PJS, fontSize: '0.7rem', color: 'var(--accent)',
            fontWeight: 600, padding: '3px 0', marginTop: 2,
          }}
        >
          Balas
        </button>
      </div>
    </div>
  )
}

// ================================================
// POST DETAIL VIEW
// ================================================
function PostDetailView({ post, loading, myTokoId, pro, onBack, onLike, onRepost, onBookmark, onReply, onDm, onTag }) {
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
  const isMine = myTokoId && t?.id === myTokoId

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
          </div>
          <PostText text={post.teks} onTag={onTag} />
          <PostImages images={post.foto} />
          {post.shopLink && <ShopLinkCard link={post.shopLink} />}
          <HashtagPills tags={post.hashtags} onTag={onTag} />
          <div style={{ fontFamily: PJS, fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '10px 0', paddingBottom: 10, borderBottom: '1px solid var(--glass-border)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>{post.likesCount}</strong> suka · <strong style={{ color: 'var(--text-secondary)' }}>{post.repostsCount}</strong> repost
          </div>
          <PostActions
            likesCount={post.likesCount} repostsCount={post.repostsCount} repliesCount={post.replies?.length || 0}
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
        {(post.replies || []).map(r => (
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
  const isMine = myTokoId && t?.id === myTokoId
  const hasChildren = (reply.replies || []).length > 0

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, padding: `${depth === 0 ? 12 : 6}px 8px 0`, marginLeft: depth > 0 ? 32 : 0 }}>
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
      </div>
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
        <div
          key={t.id}
          onClick={() => onOpen(t.id)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 8px',
            borderBottom: '1px solid var(--glass-border)', cursor: 'pointer',
            background: t.unread > 0 ? 'var(--accent-gradient-soft)' : 'transparent',
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
        </div>
      ))}
    </div>
  )
}

function DmThreadView({ thread, messages, myTokoId, onBack, onSend }) {
  const [input, setInput] = useState('')
  const bottomRef = useRef()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 8px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.map((m, i) => (
          <div key={m.id || i} style={{ display: 'flex', justifyContent: m.isMine ? 'flex-end' : 'flex-start', gap: 8 }}>
            <div style={{
              maxWidth: '72%', padding: '10px 13px',
              borderRadius: m.isMine ? 'var(--radius-xl) var(--radius-xl) 4px var(--radius-xl)' : 'var(--radius-xl) var(--radius-xl) var(--radius-xl) 4px',
              background: m.isMine ? 'var(--accent-gradient)' : 'var(--surface)',
              border: m.isMine ? 'none' : '1px solid var(--glass-border)',
            }}>
              <p style={{ fontFamily: PJS, fontSize: '0.855rem', color: m.isMine ? '#fff' : 'var(--text-primary)', margin: 0, lineHeight: 1.55 }}>{m.teks}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '10px 8px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ketik pesan..."
          style={{
            flex: 1, background: 'var(--surface)', border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-full)', padding: '10px 16px', color: 'var(--text-primary)',
            fontSize: '0.855rem', outline: 'none', fontFamily: PJS,
          }}
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 'var(--radius-full)',
            background: input.trim() ? 'var(--accent-gradient)' : 'var(--surface)',
            border: '1px solid var(--glass-border)', cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Send size={14} color={input.trim() ? '#fff' : 'var(--text-tertiary)'} />
        </button>
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
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!teks.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit({ teks: teks.trim(), foto })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet onClose={onClose} title="Buat Post">
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
        <span style={{ fontFamily: PJS, fontSize: '0.7rem', color: teks.length > 450 ? 'var(--danger)' : 'var(--text-tertiary)' }}>{teks.length}/500</span>
        <button
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
        </button>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--glass-border)' }}>
        <button
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
        </button>
      </div>
    </Sheet>
  )
}

function NotifSheet({ notifs, onClose, onOpenDm, onOpenPost }) {
  const ICON = { like: '❤️', reply: '💬', repost: '🔁', dm: '✉️' }

  const handleClick = (n) => {
    if (n.type === 'dm' && n.refThreadId) return onOpenDm(n.refThreadId)
    if (n.refPostId) return onOpenPost(n.refPostId)
  }

  const labelFor = (n) => {
    const name = n.actor?.nama || 'Seller'
    if (n.type === 'like') return `${name} menyukai postmu`
    if (n.type === 'reply') return `${name} membalas postmu`
    if (n.type === 'repost') return `${name} merepost postmu`
    if (n.type === 'dm') return `${name} mengirim pesan baru`
    return name
  }

  return (
    <Sheet onClose={onClose} title="Notifikasi">
      {notifs.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: PJS, fontSize: '0.85rem', padding: 24 }}>
          Belum ada notifikasi.
        </p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {notifs.map(n => (
          <div
            key={n.id}
            onClick={() => handleClick(n)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
              borderRadius: 'var(--radius-md)', cursor: 'pointer',
              background: n.isRead ? 'transparent' : 'var(--accent-gradient-soft)',
            }}
          >
            <span style={{ fontSize: 18 }}>{ICON[n.type] || '🔔'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: PJS, fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>{labelFor(n)}</p>
              <span style={{ fontFamily: PJS, fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>{timeAgo(n.createdAt)}</span>
            </div>
            {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: 'var(--radius-full)', background: 'var(--accent)', flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </Sheet>
  )
}

// ================================================
// SHARED UI PIECES
// ================================================
function Sheet({ children, onClose, title }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 700,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 560, margin: '0 auto',
          background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-2xl) var(--radius-2xl) 0 0',
          padding: '18px 18px 28px', maxHeight: '85vh', overflowY: 'auto',
          animation: 'slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <style>{`
          @keyframes slideUp { from { transform: translateY(100%); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
          @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        `}</style>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <span style={{ fontFamily: PJS, fontSize: '0.95rem', fontWeight: 800 }}>{title}</span>
          <button
            onClick={onClose}
            style={{
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)', width: 30, height: 30,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-tertiary)',
            }}
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

function DetailHeader({ title, onBack, avatar }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 10,
      background: 'var(--bg-secondary)', backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--glass-border)',
      display: 'flex', alignItems: 'center', height: 52, gap: 10, padding: '0 4px',
    }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', display: 'flex' }}>
        <ChevronLeft size={20} />
      </button>
      {avatar && <SellerAvatar toko={avatar} size={28} />}
      <span style={{ fontFamily: PJS, fontSize: '1rem', fontWeight: 800 }}>{title}</span>
    </div>
  )
}

function SellerAvatar({ toko, size = 40 }) {
  if (toko?.logo) {
    return (
      <img
        src={toko.logo}
        alt={toko.nama}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--accent-gradient)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: PJS, fontSize: size * 0.32, fontWeight: 800, color: '#fff', flexShrink: 0,
    }}>
      {getInitials(toko?.nama)}
    </div>
  )
}

// Nama toko yang bisa diklik → ke storefront
function TokoNameLink({ toko, fontSize = '0.875rem', fontWeight = 800 }) {
  const url = toko?.slug ? getStorefrontUrl(toko.slug) : null
  const style = {
    fontFamily: PJS, fontSize, fontWeight,
    color: 'var(--text-primary)',
    textDecoration: 'none',
    cursor: url ? 'pointer' : 'default',
  }
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
  return (
    <span className="badge badge-pro" style={{ fontSize: small ? '0.55rem' : '0.6rem', padding: '1px 6px' }}>
      ⭐ Pro
    </span>
  )
}

function IconBtn({ children, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', background: 'var(--surface)', border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)', width: 36, height: 36,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', color: 'var(--text-tertiary)',
      }}
    >
      {children}
      {badge > 0 && (
        <div style={{
          position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%',
          background: 'var(--danger)', border: '2px solid var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9, fontWeight: 800, color: '#fff',
        }}>{badge}</div>
      )}
    </button>
  )
}

function ActionBtn({ icon, label, active, activeColor, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
        cursor: 'pointer', color: active ? activeColor : 'var(--text-tertiary)',
        fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
      }}
    >
      {icon}{label !== undefined && label}
    </button>
  )
}

function PostActions({ likesCount, repostsCount, repliesCount, liked, reposted, bookmarked, commentsOpen, onLike, onRepost, onBookmark, onReply, onToggleComments, onDm }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 4, marginBottom: 12 }}>
      <ActionBtn icon={<Heart size={15} fill={liked ? 'var(--danger)' : 'none'} />} label={likesCount} active={liked} activeColor="var(--danger)" onClick={onLike} />
      {/* Tombol komentar: toggle buka/tutup di feed, atau langsung reply di detail */}
      {onToggleComments ? (
        <button
          onClick={onToggleComments}
          style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            cursor: 'pointer', color: commentsOpen ? 'var(--accent)' : 'var(--text-tertiary)',
            fontFamily: PJS, fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', borderRadius: 'var(--radius-md)',
          }}
        >
          <MessageCircle size={15} />{repliesCount}
          {commentsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        </button>
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

function PostText({ text, onTag }) {
  return (
    <p style={{ fontFamily: PJS, fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 10px', whiteSpace: 'pre-line' }}>
      {String(text || '').split(/(\s+)/).map((w, i) =>
        w.startsWith('#')
          ? <span key={i} onClick={() => onTag(w)} style={{ color: 'var(--accent)', fontWeight: 600, cursor: 'pointer' }}>{w}</span>
          : w
      )}
    </p>
  )
}

function PostImages({ images }) {
  if (!images?.length) return null
  if (images.length === 1) {
    return (
      <div style={{ marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--surface)' }}>
        <img src={images[0]} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 480 }} />
      </div>
    )
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, marginBottom: 10, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--glass-border)', background: 'var(--surface)' }}>
      {images.map((img, i) => (
        <img key={i} src={img} alt="" style={{ width: '100%', display: 'block', objectFit: 'contain', maxHeight: 320, background: 'var(--surface)' }} />
      ))}
    </div>
  )
}

function ShopLinkCard({ link }) {
  return (
    <a
      href={getStorefrontUrl(link.slug)}
      target="_blank"
      rel="noreferrer"
      style={{
        width: '100%', marginBottom: 10, background: 'var(--surface)', border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-lg)', padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10,
        textDecoration: 'none', boxSizing: 'border-box',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--radius-md)', background: 'var(--accent-gradient)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Store size={16} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: PJS, fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{link.nama}</p>
        <p style={{ fontFamily: PJS, fontSize: '0.68rem', color: 'var(--text-tertiary)', margin: 0 }}>{getStorefrontUrl(link.slug)}</p>
      </div>
      <span style={{ fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-gradient-soft)', padding: '4px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
        Kunjungi →
      </span>
    </a>
  )
}

function HashtagPills({ tags, onTag }) {
  if (!tags?.length) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
      {tags.map(tag => (
        <span
          key={tag}
          onClick={() => onTag(tag)}
          style={{
            fontFamily: PJS, fontSize: '0.68rem', fontWeight: 700, color: 'var(--accent)', cursor: 'pointer',
            background: 'var(--accent-gradient-soft)', border: '1px solid var(--glass-border)', padding: '3px 9px', borderRadius: 'var(--radius-md)',
          }}
        >{tag}</span>
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
  if (diff < 60) return `${diff}d`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}j`
  return `${Math.floor(diff / 86400)}h`
}
