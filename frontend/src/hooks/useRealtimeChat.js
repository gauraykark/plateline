import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'

export function useRealtimeChat({ currentUserId, currentUserName, activePeerId } = {}) {
  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const messagesEndRef = useRef(null)

  const getConvKey = useCallback((peerId) => {
    if (!currentUserId || !peerId) return ''
    return [currentUserId, peerId].sort().join('_')
  }, [currentUserId])

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!currentUserId) return
    try {
      setLoadingConversations(true)
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, sender_name, message, created_at, conversation_key, read')
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (!data || data.length === 0) {
        setConversations([])
        return
      }

      const seen = new Set()
      const peerIds = []
      const latestMessages = []

      for (const msg of data) {
        const peerId = msg.sender_id === currentUserId ? msg.receiver_id : msg.sender_id
        if (!peerId || seen.has(peerId)) continue
        seen.add(peerId)
        peerIds.push(peerId)
        latestMessages.push({ peerId, msg })
      }

      // Fetch all peer profiles in one single query
      const { data: peerProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', peerIds)

      const profileMap = new Map((peerProfiles || []).map(p => [p.id, p]))

      const convList = latestMessages.map(({ peerId, msg }) => {
        const peerProfile = profileMap.get(peerId)
        return {
          peerId,
          peerName: peerProfile?.name || msg.sender_name || 'Community Member',
          role: peerProfile?.role || 'user',
          city: peerProfile?.city || '',
          registration_number: peerProfile?.registration_number || '',
          is_verified: peerProfile?.is_verified ?? true,
          lastMessage: msg.message,
          lastMessageAt: msg.created_at,
          unread: msg.receiver_id === currentUserId && !msg.read,
        }
      })

      setConversations(convList)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setConversations([])
    } finally {
      setLoadingConversations(false)
    }
  }, [currentUserId])

  // Load messages for the active conversation
  const loadMessages = useCallback(async (peerId) => {
    if (!currentUserId || !peerId) {
      setMessages([])
      return
    }
    const convKey = getConvKey(peerId)
    try {
      setLoadingMessages(true)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_key', convKey)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])

      // Mark received messages as read
      try {
        await supabase
          .from('messages')
          .update({ read: true })
          .eq('conversation_key', convKey)
          .eq('receiver_id', currentUserId)
          .eq('read', false)
      } catch (markErr) {
        console.warn('Could not mark messages read:', markErr)
      }

    } catch (err) {
      console.error('Error loading messages:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [currentUserId, getConvKey])

  // Auto scroll to bottom
  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Send message
  const sendMessage = async (messageText) => {
    if (!messageText.trim() || !activePeerId || !currentUserId) return false
    const convKey = getConvKey(activePeerId)
    const newMsg = {
      conversation_key: convKey,
      sender_id: currentUserId,
      sender_name: currentUserName || 'You',
      receiver_id: activePeerId,
      message: messageText.trim(),
      read: false,
    }

    try {
      const { data, error } = await supabase.from('messages').insert(newMsg).select()
      if (error) throw error

      const inserted = (data && data[0]) || newMsg
      setMessages(prev => [...prev, inserted])
      scrollToBottom()
      loadConversations()
      return true
    } catch (err) {
      console.error('Failed to send message:', err)
      return false
    }
  }

  // Load initial conversations
  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Load active messages when activePeerId changes
  useEffect(() => {
    if (activePeerId) {
      loadMessages(activePeerId)
    } else {
      setMessages([])
    }
  }, [activePeerId, loadMessages])

  // Realtime subscription for incoming messages
  useEffect(() => {
    const channelName = `chat_rt_${currentUserId}_${Math.random().toString(36).slice(2, 7)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const incoming = payload.new
        const isCurrentConv = activePeerId && incoming.conversation_key === getConvKey(activePeerId)

        if (isCurrentConv) {
          setMessages(prev => {
            if (prev.some(m => m.id === incoming.id)) return prev
            return [...prev, incoming]
          })
          scrollToBottom()
        }

        if (incoming.receiver_id === currentUserId || incoming.sender_id === currentUserId) {
          loadConversations()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUserId, activePeerId, getConvKey, loadConversations])

  return {
    conversations,
    messages,
    loadingConversations,
    loadingMessages,
    sendMessage,
    loadConversations,
    loadMessages,
    messagesEndRef,
    scrollToBottom,
  }
}
