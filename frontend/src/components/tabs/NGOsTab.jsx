import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { MessageSquare, MapPin, Building2, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import VerifiedBadge from '../VerifiedBadge'

export default function NGOsTab({ onStartChat }) {
  const { profile } = useAuth()
  const [ngos, setNGOs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').eq('role', 'ngo').then(({ data }) => {
      setNGOs(data || [])
      setLoading(false)
    })
  }, [])

  const filtered = ngos.filter(ngo => 
    ngo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (ngo.city && ngo.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (ngo.state && ngo.state.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
            <Building2 size={13} />
            <span>Verified Non-Profit Partners</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">NGO Partner Directory</h1>
          <p className="text-xs text-slate-500">Audited food banks and community feeding organizations ready for rapid pickup.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search NGOs by name or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-stone-200 skeleton-shimmer h-24" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <Building2 size={36} className="text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No NGOs matched your search</h3>
          <p className="text-xs text-slate-400 mt-1">Try another city name or clear your search query.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ngo => {
            const isNear = ngo.city && profile?.city && ngo.city.toLowerCase() === profile.city.toLowerCase()

            return (
              <div
                key={ngo.id}
                className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs card-hover-lift flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-900 text-sm">{ngo.name}</h3>
                      <VerifiedBadge role="ngo" isVerified={ngo.is_verified ?? true} registrationNumber={ngo.registration_number} />
                    </div>
                    
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={13} className="text-slate-400" />
                      <span>{ngo.city}{ngo.district ? `, ${ngo.district}` : ''}{ngo.state ? `, ${ngo.state}` : ''}</span>
                      {isNear && (
                        <span className="ml-2 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Near You
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {ngo.id !== profile?.id && (
                  <button
                    onClick={() => onStartChat(ngo.id, ngo.name)}
                    className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    <MessageSquare size={14} />
                    <span>Direct Message</span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}
