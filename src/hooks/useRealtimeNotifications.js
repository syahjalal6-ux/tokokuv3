// src/hooks/useRealtimeNotifications.js
// Listen INSERT baru di stream_notifications untuk tokoId tertentu.
// Pakai ini di layout utama / navbar supaya notif badge update otomatis.
//
// Cara pakai:
//   const { unreadCount, notifications, markRead } = useRealtimeNotifications(tokoId)
//
// - tokoId: id toko yang sedang login (ambil dari auth state)
// - unreadCount: jumlah notif belum dibaca (untuk badge)
// - notifications: array notif terbaru (opsional, untuk dropdown preview)
// - markRead: panggil ini saat user buka panel notif

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

export function useRealtimeNotifications(tokoId) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!tokoId) return

    const channel = supabase
      .channel(`notif-${tokoId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stream_notifications',
          filter: `toko_id=eq.${tokoId}`,
        },
        (payload) => {
          const notif = payload.new

          setNotifications((prev) => {
            if (prev.find((n) => n.id === notif.id)) return prev
            return [
              {
                id: notif.id,
                type: notif.type,
                actor: null, // join tidak tersedia di realtime payload
                refPostId: notif.ref_post_id,
                refReplyId: notif.ref_reply_id,
                refThreadId: notif.ref_thread_id,
                isRead: false,
                createdAt: notif.created_at,
              },
              ...prev,
            ]
          })

          // Tambah unread count langsung
          setUnreadCount((prev) => prev + 1)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [tokoId])

  // Panggil ini saat user buka panel notif
  // Setelah ini, lanjutkan fetch ulang dari streamApi.getNotifications
  // supaya data actor (nama toko, foto) ikut ter-load
  const markRead = useCallback(() => {
    setUnreadCount(0)
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }, [])

  return { notifications, unreadCount, markRead, setNotifications, setUnreadCount }
}
