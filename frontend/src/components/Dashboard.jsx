import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { 
  LayoutDashboard, 
  PlusCircle, 
  UtensilsCrossed, 
  Building2, 
  Users2, 
  MessageSquare, 
  BarChart3, 
  Navigation,
  ShieldCheck,
  ChevronRight,
  LogOut,
  MapPin,
  Menu,
  X
} from 'lucide-react'

import Overview from './tabs/Overview'
import DonationsTab from './tabs/DonationsTab'
import ListingsTab from './tabs/ListingsTab'
import NGOsTab from './tabs/NGOsTab'
import DonorsTab from './tabs/DonorsTab'
import ChatTab from './tabs/ChatTab'
import AnalyticsTab from './tabs/AnalyticsTab'
import TrackingTab from './tabs/TrackingTab'

const ALL_TABS = [
  { id: 'overview', label: 'Overview', Icon: LayoutDashboard, roles: ['donor', 'ngo'] },
  { id: 'donations', label: 'My Donations', Icon: PlusCircle, roles: ['donor'] },
  { id: 'listings', label: 'Available Food', Icon: UtensilsCrossed, roles: ['ngo'] },
  { id: 'tracking', label: 'Live Tracking', Icon: Navigation, roles: ['donor', 'ngo'] },
  { id: 'chat', label: 'Messages', Icon: MessageSquare, roles: ['donor', 'ngo'] },
  { id: 'ngos', label: 'NGO Directory', Icon: Building2, roles: ['donor'] },
  { id: 'donors', label: 'Donor Directory', Icon: Users2, roles: ['ngo'] },
  { id: 'analytics', label: 'Impact Analytics', Icon: BarChart3, roles: ['donor', 'ngo'] },
]

export default function Dashboard({ activeTab, setActiveTab }) {
  const { profile, logout } = useAuth()
  const { unreadCount } = useNotifications({ userId: profile?.id })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [chatTarget, setChatTarget] = useState(null)

  const userRole = profile?.role || 'donor'
  const visibleTabs = ALL_TABS.filter(t => t.roles.includes(userRole))

  // Role-based tab guard: ensure the active tab is permitted for this role
  useEffect(() => {
    if (!profile) return
    const isTabAllowed = visibleTabs.some(t => t.id === activeTab)
    if (!isTabAllowed) {
      if (userRole === 'ngo') setActiveTab('listings')
      else setActiveTab('overview')
    }
  }, [profile, activeTab, visibleTabs, userRole, setActiveTab])

  function startChat(id, name) {
    setChatTarget({ id, name })
    setActiveTab('chat')
  }

  function renderTab() {
    switch (activeTab) {
      case 'overview': return <Overview onTabChange={setActiveTab} />
      case 'donations': return <DonationsTab />
      case 'listings': return <ListingsTab onStartChat={startChat} />
      case 'ngos': return <NGOsTab onStartChat={startChat} />
      case 'donors': return <DonorsTab onStartChat={startChat} />
      case 'chat': return <ChatTab initialUserId={chatTarget?.id} initialUserName={chatTarget?.name} />
      case 'analytics': return <AnalyticsTab />
      case 'tracking': return <TrackingTab onStartChat={startChat} />
      default: return <Overview onTabChange={setActiveTab} />
    }
  }

  const roleLabelMap = {
    donor: 'FSSAI Certified Donor',
    ngo: 'Verified NGO Partner',
  }

  return (
    <div className="flex h-screen pt-16 bg-[#FBFBF9] text-slate-900 overflow-hidden">
      
      {/* =====================================================
          SIDEBAR NAVIGATION
      ===================================================== */}
      <aside className={`fixed md:static top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-stone-200/90 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out shadow-sm md:shadow-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        
        {/* Navigation Items */}
        <div className="space-y-1">
          <div className="px-3 py-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
            Workspace
          </div>

          {visibleTabs.map(({ id, label, Icon }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => { setActiveTab(id); setSidebarOpen(false) }}
                className={`flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive 
                    ? 'bg-[#0D3B2E] text-white shadow-sm' 
                    : 'text-slate-600 hover:bg-stone-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={17} className={isActive ? 'text-[#10B981]' : 'text-slate-400 group-hover:text-slate-600'} />
                  <span>{label}</span>
                </div>
                {id === 'chat' && unreadCount > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-amber-400 text-slate-900' : 'bg-amber-100 text-amber-800'}`}>
                    {unreadCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} className="text-white/60" />}
              </button>
            )
          })}
        </div>

        {/* User Card Drawer in Sidebar */}
        <div className="pt-4 border-t border-stone-100 space-y-3">
          <div className="bg-[#FBFBF9] p-3 rounded-xl border border-stone-200/80 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{profile?.name}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700">
                <ShieldCheck size={11} />
                <span className="truncate">{roleLabelMap[profile?.role] || profile?.role}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <span className="flex items-center gap-1 truncate">
              <MapPin size={12} className="text-slate-400" />
              {profile?.city || 'Urban Hub'}
            </span>
            <button
              onClick={logout}
              className="text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 p-1 hover:bg-rose-50 rounded"
            >
              <LogOut size={13} />
              <span>Exit</span>
            </button>
          </div>
        </div>

      </aside>

      {/* Backdrop for Mobile Sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-xs md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* =====================================================
          MAIN CONTENT VIEWPORT
      ===================================================== */}
      <main className="flex-1 overflow-y-auto bg-[#FBFBF9]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          {/* Mobile Sidebar Toggle Button */}
          <div className="md:hidden flex items-center justify-between mb-4 pb-3 border-b border-stone-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-white border border-stone-200 px-3.5 py-2 rounded-xl shadow-xs"
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
              <span>Menu Navigation</span>
            </button>
            <span className="text-xs font-bold text-[#0D3B2E] uppercase tracking-wide">
              {visibleTabs.find(t => t.id === activeTab)?.label || 'Dashboard'}
            </span>
          </div>

          {/* Render Active View */}
          <div className="min-h-[calc(100vh-10rem)]">
            {renderTab()}
          </div>

        </div>
      </main>

    </div>
  )
}
