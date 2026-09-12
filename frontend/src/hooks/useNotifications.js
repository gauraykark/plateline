import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export function useNotifications({ userId } = {}) {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)

      if (error) {
        // Table might not exist yet if migration hasn't run on Supabase project
        console.warn('Could not fetch notifications from Supabase:', error.message)
        setNotifications([])
      } else {
        setNotifications(data || [])
      }
    } catch (err) {
      console.warn('Notifications fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const markAsRead = async (notificationId) => {
    try {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n))
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
    } catch (err) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllAsRead = async () => {
    try {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()

    const channelName = `user_notifications_${userId}_${Math.random().toString(36).slice(2, 7)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userId}` 
      }, (payload) => {
        const newNotif = payload.new
        setNotifications(prev => [newNotif, ...prev])
        toast(newNotif.title, {
          icon: '🔔',
          style: {
            borderRadius: '12px',
            background: '#0D3B2E',
            color: '#fff',
            fontSize: '14px',
          },
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    unreadCount,
    loading,
    refreshNotifications: fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}
