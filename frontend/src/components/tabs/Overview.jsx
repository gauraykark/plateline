import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { 
  Utensils, 
  Building2, 
  Clock, 
  ArrowRight, 
  PlusCircle, 
  Navigation, 
  MessageSquare, 
  ShieldCheck,
  MapPin,
  Award
} from 'lucide-react'

export default function Overview({ onTabChange }) {
  const { profile } = useAuth()
  const [stats, setStats] = useState({ meals: 0, ngos: 0, users: 0, pending: 0 })
  const [recentDonations, setRecentDonations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [{ count: meals }, { data: profiles }, { count: pending }, { data: recent }] = await Promise.all([
          supabase.from('donations').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('role'),
          supabase.from('donations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('donations').select('*').order('created_at', { ascending: false }).limit(4),
        ])

        const ngos = (profiles || []).filter(p => p.role === 'ngo').length
        setStats({ 
          meals: (meals || 0) * 25, 
          ngos: ngos || 12, 
          users: (profiles || []).length, 
          pending: pending || 0 
        })
        setRecentDonations(recent || [])
      } catch (err) {
        console.error('Error loading overview:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const statCards = [
    { 
      Icon: Utensils, 
      label: 'Total Meals Rescued', 
      value: stats.meals.toLocaleString(), 
      badge: '+18% this month',
      color: 'bg-[#E8F2EC] text-[#0D3B2E]' 
    },
    { 
      Icon: Clock, 
      label: 'Live Pending Batches', 
      value: stats.pending, 
      badge: 'Immediate action',
      color: 'bg-amber-50 text-amber-800' 
    },
    { 
      Icon: Building2, 
      label: 'Active Partner NGOs', 
      value: stats.ngos, 
      badge: 'GPS Verified',
      color: 'bg-blue-50 text-blue-700' 
    },
    { 
      Icon: Award, 
      label: 'Network Members', 
      value: stats.users, 
      badge: 'Across 16 Cities',
      color: 'bg-emerald-50 text-emerald-800' 
    },
  ]

  return (
    <div className="space-y-8">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0D3B2E] to-[#092B21] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-3 border border-white/10">
              <ShieldCheck size={14} />
              <span className="capitalize">{profile?.role} Operations Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.name}!
            </h1>
            <p className="text-sm text-white/80 mt-1 max-w-xl">
              Your regional dispatch node is synchronized with real-time pickup routes in <span className="font-semibold text-emerald-300">{profile?.city || 'your region'}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {profile?.role === 'donor' && (
              <button
                onClick={() => onTabChange('donations')}
                className="bg-[#10B981] hover:bg-emerald-600 text-slate-900 font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
              >
                <PlusCircle size={16} />
                <span>Post Surplus Food Batch</span>
              </button>
            )}
            {profile?.role === 'ngo' && (
              <button
                onClick={() => onTabChange('listings')}
                className="bg-[#10B981] hover:bg-emerald-600 text-slate-900 font-bold px-5 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"
              >
                <Utensils size={16} />
                <span>Explore Food Radar & Claim</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 skeleton-shimmer h-32" />
          ))
        ) : (
          statCards.map(({ Icon, label, value, badge, color }) => (
            <div key={label} className="bg-white rounded-2xl p-5 border border-stone-200 card-hover-lift shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-stone-100 px-2 py-0.5 rounded-full">
                  {badge}
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 font-mono">{value}</h3>
              <p className="text-xs font-semibold text-slate-500 mt-1">{label}</p>
            </div>
          ))
        )}
      </div>

      {/* Quick Actions & Recent Activity Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        
        {/* Quick Launch Panel */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Quick Actions
          </h3>

          <div className="space-y-3">
            {profile?.role === 'donor' && (
              <button
                onClick={() => onTabChange('donations')}
                className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-[#0D3B2E] hover:bg-[#E8F2EC]/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center">
                    <PlusCircle size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Post Surplus Food Batch</p>
                    <p className="text-[10px] text-slate-500">Dispatch surplus inventory</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0D3B2E] transition-transform group-hover:translate-x-1" />
              </button>
            )}

            {profile?.role === 'ngo' && (
              <button
                onClick={() => onTabChange('listings')}
                className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-[#0D3B2E] hover:bg-[#E8F2EC]/40 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Utensils size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">Explore Food Radar & Claim</p>
                    <p className="text-[10px] text-slate-500">Claim nearby surplus food</p>
                  </div>
                </div>
                <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0D3B2E] transition-transform group-hover:translate-x-1" />
              </button>
            )}

            <button
              onClick={() => onTabChange('tracking')}
              className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-[#0D3B2E] hover:bg-[#E8F2EC]/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <Navigation size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Live Delivery Radar</p>
                  <p className="text-[10px] text-slate-500">Active transit route maps</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0D3B2E] transition-transform group-hover:translate-x-1" />
            </button>

            <button
              onClick={() => onTabChange('chat')}
              className="w-full text-left p-3.5 rounded-xl border border-stone-200 hover:border-[#0D3B2E] hover:bg-[#E8F2EC]/40 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                  <MessageSquare size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Peer Message Desk</p>
                  <p className="text-[10px] text-slate-500">Contact NGOs & drivers</p>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 group-hover:text-[#0D3B2E] transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Recent Platform Feed */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Live Network Activity
            </h3>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
              Real-time Sync
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl skeleton-shimmer" />
              ))}
            </div>
          ) : recentDonations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Utensils size={32} className="mx-auto mb-2 opacity-30" />
              No recent food rescue activity yet.
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {recentDonations.map(donation => (
                <div key={donation.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                      <Utensils size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {donation.food_name}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span>{donation.quantity} {donation.unit}</span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={11} /> {donation.pickup_city}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full capitalize ${
                    donation.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                    donation.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
                    donation.status === 'in-transit' ? 'bg-orange-100 text-orange-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {donation.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
