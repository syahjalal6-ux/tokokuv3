// src/hooks/useRealtimeReplies.js
// Listen INSERT baru di stream_replies untuk postId tertentu.
// Pakai ini di halaman detail post / live comment section.
//
// Cara pakai:
//   const { replies, setReplies } = useRealtimeReplies(postId, initialReplies)
//
// - initialReplies: array reply yang sudah di-fetch sebelumnya (dari streamApi.getPostDetail)
// - Setiap ada reply baru masuk, otomatis append ke state tanpa refresh
//
// FIX: dependency array useEffect sync diubah dari [postId] -> [postId, initialReplies].
// Sebelumnya, kalau initialReplies berubah (misal store re-fetch lewat loadPostDetail
// setelah user kirim reply) tapi postId tetap sama, state lokal `replies` di hook ini
// tidak ikut ter-update -> reply baru tidak muncul sampai halaman di-refresh.
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeReplies(postId, initialReplies = []) {
  const [replies, setReplies] = useState(initialReplies)

  // Sync kalau initialReplies berubah dari luar (misal re-fetch dari store),
  // ATAU kalau pindah ke post lain (postId berubah).
  useEffect(() => {
    setReplies(initialReplies)
  }, [postId, initialReplies])

  useEffect(() => {
    if (!postId) return
    const channel = supabase
      .channel(`replies-${postId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_replies',
          filter: `post_id=eq.${postId}`,
        },
        (payload) => {
          const newReply = payload.new
          setReplies((prev) => {
            // Hindari duplikat kalau optimistic update sudah ada
            if (prev.find((r) => r.id === newReply.id)) return prev
            // Map ke shape yang sama dengan mapStreamReply di adminClient
            const mapped = {
              id: newReply.id,
              postId: newReply.post_id,
              parentReplyId: newReply.parent_reply_id,
              toko: null, // realtime payload tidak include join — toko akan null dulu
              teks: newReply.teks,
              likesCount: newReply.likes_count || 0,
              createdAt: newReply.created_at,
              liked: false,
              replies: [],
            }
            // Kalau top-level reply (tidak punya parent), append ke root
            if (!newReply.parent_reply_id) {
              return [...prev, mapped]
            }
            // Kalau nested reply, sisipkan ke dalam parent yang tepat
            function insertNested(nodes) {
              return nodes.map((node) => {
                if (node.id === newReply.parent_reply_id) {
                  return { ...node, replies: [...(node.replies || []), mapped] }
                }
                if (node.replies?.length) {
                  return { ...node, replies: insertNested(node.replies) }
                }
                return node
              })
            }
            return insertNested(prev)
          })
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [postId])

  return { replies, setReplies }
}
