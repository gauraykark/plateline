import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../hooks/useNotifications'
import { 
  Menu, 
  X, 
  Bell, 
  Check, 
  LogOut, 
  User, 
  ShieldCheck, 
  ChevronDown,
  ArrowRight
} from 'lucide-react'
import { PlatelineLogo } from './PlatelineLogo'

export default function Navbar({ onLoginClick, onRegisterClick, onTabChange }) {
  const { profile, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications({ userId: profile?.id })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false)
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const publicLinks = [
    { label: 'Platform', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact', href: '#impact' },
    { label: 'Partners', href: '#partners' },
    { label: 'Contact', href: '#contact' },
  ]

  const roleLabelMap = {
    donor: 'Food Donor',
    ngo: 'Verified NGO',
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-stone-200/80 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            onClick={() => { if (profile) onTabChange('overview') }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0D3B2E] to-[#08241C] flex items-center justify-center text-white shadow-sm transition-transform duration-200 group-hover:scale-105 border border-emerald-900/30">
              <PlatelineLogo size={22} className="text-emerald-400 transition-transform duration-200 group-hover:rotate-6" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-[#0D3B2E] block leading-tight">Plateline</span>
              <p className="text-[11px] text-slate-500 font-medium hidden sm:block">Commercial Surplus Dispatch</p>
            </div>
          </div>

          {/* Public Desktop Nav */}
          {!profile && (
            <ul className="hidden md:flex items-center gap-8">
              {publicLinks.map(link => (
                <li key={link.label}>
                  <a 
                    href={link.href} 
                    className="text-sm font-medium text-slate-600 hover:text-[#0D3B2E] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}

          {/* Right Action Buttons & Profile Controls */}
          <div className="flex items-center gap-3">
            {profile ? (
              <>
                {/* Notification Dropdown */}
                <div className="relative" ref={notifRef}>
                  <button 
                    onClick={() => setNotifOpen(!notifOpen)}
                    className="relative p-2 rounded-xl text-slate-600 hover:text-[#0D3B2E] hover:bg-stone-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#D97706] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Center Popover */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-stone-200 py-3 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-stone-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[#0D3B2E]">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-[#E8F2EC] text-[#0D3B2E] text-xs px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-slate-500 hover:text-[#0D3B2E] font-medium flex items-center gap-1"
                          >
                            <Check size={13} /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-stone-50">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-slate-400 text-xs">
                            <Bell size={28} className="mx-auto mb-2 opacity-30 text-slate-400" />
                            No notifications right now
                          </div>
                        ) : (
                          notifications.map(notif => (
                            <div 
                              key={notif.id}
                              onClick={() => {
                                markAsRead(notif.id)
                                if (notif.link_tab) onTabChange(notif.link_tab)
                                setNotifOpen(false)
                              }}
                              className={`p-3.5 hover:bg-stone-50 transition-colors cursor-pointer text-left ${!notif.read ? 'bg-emerald-50/40' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-xs font-semibold ${!notif.read ? 'text-[#0D3B2E]' : 'text-slate-700'}`}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] flex-shrink-0 mt-1" />
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <span className="text-[10px] text-slate-400 mt-1.5 block">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Controls Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button 
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 p-1.5 pl-2 pr-3 rounded-xl hover:bg-stone-100 transition-colors border border-transparent hover:border-stone-200"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#E8F2EC] text-[#0D3B2E] font-bold text-xs flex items-center justify-center">
                      {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-xs font-bold text-slate-800 leading-tight">{profile.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{roleLabelMap[profile.role] || profile.role}</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-stone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-xs font-semibold text-slate-800">{profile.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{profile.email}</p>
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full w-fit">
                          <ShieldCheck size={12} />
                          <span>{roleLabelMap[profile.role] || profile.role}</span>
                        </div>
                      </div>

                      <div className="p-1">
                        <button 
                          onClick={() => { onTabChange('overview'); setProfileOpen(false) }}
                          className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-stone-50 rounded-lg flex items-center gap-2"
                        >
                          <User size={14} className="text-slate-500" />
                          Dashboard Overview
                        </button>
                        <button 
                          onClick={() => { logout(); setProfileOpen(false) }}
                          className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                        >
                          <LogOut size={14} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <button 
                  onClick={onLoginClick} 
                  className="text-slate-700 hover:text-[#0D3B2E] px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={onRegisterClick} 
                  className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center gap-1.5"
                >
                  <span>Join Network</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}

            {/* Mobile Nav Toggle */}
            {!profile && (
              <button 
                className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-stone-100" 
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Drawer for Public Landing */}
      {!profile && mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 px-4 py-5 space-y-3 shadow-lg">
          {publicLinks.map(link => (
            <a 
              key={link.label}
              href={link.href} 
              onClick={() => setMobileOpen(false)}
              className="block text-slate-700 hover:text-[#0D3B2E] py-2 text-sm font-semibold"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            <button 
              onClick={() => { onLoginClick(); setMobileOpen(false) }}
              className="w-full border border-stone-300 text-slate-800 py-2.5 rounded-xl font-semibold text-sm"
            >
              Log In
            </button>
            <button 
              onClick={() => { onRegisterClick(); setMobileOpen(false) }}
              className="w-full bg-[#0D3B2E] text-white py-2.5 rounded-xl font-semibold text-sm"
            >
              Join Network
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
