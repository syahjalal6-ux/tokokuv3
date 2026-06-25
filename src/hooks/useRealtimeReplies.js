// src/hooks/useRealtimeReplies.js
import { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeReplies(postId, initialReplies = []) {
  const [replies, setReplies] = useState(initialReplies)
  const prevLengthRef = useRef(initialReplies.length)

  // Sync ke initialReplies HANYA kalau jumlah reply bertambah dari luar
  // (misal optimistic insert dari store). Pakai length sebagai sinyal,
  // bukan reference array, supaya tidak infinite loop.
  useEffect(() => {
    if (initialReplies.length !== prevLengthRef.current) {
      prevLengthRef.current = initialReplies.length
      setReplies(initialReplies)
    }
  }, [initialReplies])

  // Reset kalau pindah post
  useEffect(() => {
    setReplies(initialReplies)
    prevLengthRef.current = initialReplies.length
  }, [postId])

  // Supabase Realtime subscription
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
            if (prev.find((r) => r.id === newReply.id)) return prev

            const mapped = {
              id: newReply.id,
              postId: newReply.post_id,
              parentReplyId: newReply.parent_reply_id,
              toko: null,
              teks: newReply.teks,
              likesCount: newReply.likes_count || 0,
              createdAt: newReply.created_at,
              liked: false,
              replies: [],
            }

            if (!newReply.parent_reply_id) {
              return [...prev, mapped]
            }

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
