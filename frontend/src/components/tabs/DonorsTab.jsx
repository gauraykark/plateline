import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { MessageSquare, MapPin, Users2, Utensils, Search } from 'lucide-react'
import VerifiedBadge from '../VerifiedBadge'

export default function DonorsTab({ onStartChat }) {
  const { user, profile } = useAuth()
  const [donors, setDonors] = useState([])
  const [donorStats, setDonorStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        const [{ data: profiles }, { data: donations }] = await Promise.all([
          supabase.from('profiles').select('*').eq('role', 'donor'),
          supabase.from('donations').select('donor_id, food_name, quantity, unit, status').eq('status', 'pending'),
        ])
        setDonors((profiles || []).filter(p => p.id !== user?.id))
        const stats = {}
        ;(donations || []).forEach(d => {
          if (!stats[d.donor_id]) stats[d.donor_id] = []
          stats[d.donor_id].push(d)
        })
        setDonorStats(stats)
      } catch (err) {
        console.error('Error loading donors:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user?.id])

  const filtered = donors.filter(donor => 
    donor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (donor.city && donor.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (donor.state && donor.state.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
            <Users2 size={13} />
            <span>Commercial & Community Donors</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Food Donor Directory</h1>
          <p className="text-xs text-slate-500">Partner hotels, banquet halls, corporate kitchens, and supermarkets.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search donors by name or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 skeleton-shimmer h-28" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <Users2 size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No donors matched your search</h3>
          <p className="text-xs text-slate-400 mt-1">Try another keyword or city name.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(donor => {
            const items = donorStats[donor.id] || []
            const isNear = donor.city && profile?.city && donor.city.toLowerCase() === profile.city.toLowerCase()

            return (
              <div
                key={donor.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs card-hover-lift flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Utensils size={20} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm truncate">{donor.name}</h3>
                      <VerifiedBadge role="donor" isVerified={donor.is_verified ?? true} registrationNumber={donor.registration_number} />
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{donor.city}{donor.district ? `, ${donor.district}` : ''}{donor.state ? `, ${donor.state}` : ''}</span>
                      {isNear && (
                        <span className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Near You
                        </span>
                      )}
                    </p>

                    {items.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        {items.map((item, idx) => (
                          <span key={idx} className="text-[11px] font-semibold bg-stone-100 text-slate-700 px-2.5 py-0.5 rounded-lg border border-stone-200">
                            {item.food_name} ({item.quantity} {item.unit})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">No pending active batches currently</p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onStartChat(donor.id, donor.name)}
                  className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto whitespace-nowrap"
                >
                  <MessageSquare size={14} />
                  <span>Direct Message</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
