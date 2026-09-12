import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useRealtimeChat } from '../../hooks/useRealtimeChat'
import { 
  Send, 
  MessageSquare, 
  Search, 
  CheckCheck
} from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

// Helper to group messages by date
function formatMessageDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function ChatTab({ initialUserId, initialUserName }) {
  const { user, profile } = useAuth()
  const [activePeer, setActivePeer] = useState(
    initialUserId ? { id: initialUserId, name: initialUserName || 'Peer' } : null
  )
  const [inputText, setInputText] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    conversations,
    messages,
    loadingConversations,
    loadingMessages,
    sendMessage,
    messagesEndRef,
  } = useRealtimeChat({
    currentUserId: user?.id,
    currentUserName: profile?.name,
    activePeerId: activePeer?.id,
  })

  // Set active peer when navigated from other tabs
  useEffect(() => {
    if (initialUserId) {
      setActivePeer({ id: initialUserId, name: initialUserName || 'Peer' })
    }
  }, [initialUserId, initialUserName])

  const handleSend = async (e) => {
    e?.preventDefault()
    if (!inputText.trim() || !activePeer) return
    const text = inputText
    setInputText('')
    await sendMessage(text)
  }

  // Filter conversations list
  const filteredConversations = conversations.filter(c => 
    c.peerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMessage && c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
          <MessageSquare size={13} />
          <span>Real-time Peer Communication</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Message Desk</h1>
        <p className="text-xs text-slate-500">Coordinate pickup logistics, food packing specs, and arrival timing.</p>
      </div>

      {/* Main Chat Interface Container */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden h-[calc(100vh-16rem)] min-h-[500px] flex">
        
        {/* Left: Conversations Sidebar */}
        <div className="w-80 border-r border-stone-200 flex flex-col bg-[#FBFBF9]/50">
          
          {/* Search Box */}
          <div className="p-3.5 border-b border-stone-200 bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-stone-50"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {loadingConversations ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-xl skeleton-shimmer" />
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <MessageSquare size={28} className="mx-auto mb-2 opacity-30" />
                <p>No active conversations found.</p>
                <p className="text-[11px] text-slate-400 mt-1">Visit the NGOs or Donors tab to start chatting with verified members.</p>
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = activePeer?.id === conv.peerId
                return (
                  <button
                    key={conv.peerId}
                    onClick={() => setActivePeer({ 
                      id: conv.peerId, 
                      name: conv.peerName, 
                      role: conv.role, 
                      city: conv.city,
                      registration_number: conv.registration_number,
                      is_verified: conv.is_verified
                    })}
                    className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 relative ${
                      isActive 
                        ? 'bg-white border-l-4 border-l-[#0D3B2E] shadow-xs' 
                        : 'hover:bg-stone-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] font-bold text-xs flex items-center justify-center flex-shrink-0">
                      {conv.peerName.charAt(0).toUpperCase()}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {conv.peerName}
                        </p>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-[11px] text-slate-500 capitalize">{conv.role || 'Member'} • {conv.city || 'Hub'}</p>
                      </div>
                      
                      <p className="text-xs text-slate-600 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {conv.unread && (
                      <span className="w-2 h-2 rounded-full bg-[#10B981] absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </button>
                )
              })
            )}
          </div>

        </div>

        {/* Right: Message Window */}
        <div className="flex-1 flex flex-col bg-white">
          
          {activePeer ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0D3B2E] text-white font-bold text-xs flex items-center justify-center">
                    {activePeer.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-slate-900">{activePeer.name}</h3>
                      <VerifiedBadge 
                        role={activePeer.role || 'donor'} 
                        isVerified={activePeer.is_verified ?? true} 
                        registrationNumber={activePeer.registration_number} 
                      />
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                      <span>Verified Stakeholder • Active Channel</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#FBFBF9]">
                {loadingMessages ? (
                  <div className="text-center py-12 text-xs text-slate-400">Loading message stream...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-slate-400">
                    <MessageSquare size={36} className="mx-auto mb-2 opacity-30 text-[#0D3B2E]" />
                    <p className="font-semibold text-slate-600">Encrypted peer channel opened</p>
                    <p className="text-[11px] mt-1">Say hello to coordinate dispatch instructions.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isMine = msg.sender_id === user?.id
                    const prevMsg = messages[idx - 1]
                    const showDateDivider = !prevMsg || formatMessageDate(msg.created_at) !== formatMessageDate(prevMsg.created_at)

                    return (
                      <div key={msg.id || idx}>
                        {showDateDivider && (
                          <div className="flex items-center justify-center my-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-stone-100 px-3 py-1 rounded-full border border-stone-200">
                              {formatMessageDate(msg.created_at)}
                            </span>
                          </div>
                        )}

                        <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-md rounded-2xl px-4 py-2.5 text-xs shadow-xs ${
                            isMine
                              ? 'bg-[#0D3B2E] text-white rounded-br-xs'
                              : 'bg-white border border-stone-200 text-slate-800 rounded-bl-xs'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            
                            <div className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                              isMine ? 'text-emerald-200' : 'text-slate-400'
                            }`}>
                              <span>
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isMine && (
                                <CheckCheck size={12} className="text-emerald-300" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Message ${activePeer.name}...`}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  className="flex-1 border border-stone-300 rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-[#FBFBF9]"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-xs flex items-center justify-center"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#FBFBF9]">
              <div className="w-16 h-16 rounded-3xl bg-[#E8F2EC] flex items-center justify-center text-[#0D3B2E] mb-3">
                <MessageSquare size={28} />
              </div>
              <h3 className="text-base font-bold text-slate-900">Select a Conversation</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Pick a partner NGO or commercial donor from the left sidebar to coordinate dispatch.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  )
}
