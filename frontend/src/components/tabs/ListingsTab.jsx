import { useState, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useDonations } from '../../hooks/useDonations'
import { LOCATION_DATA, uniqSorted } from '../../lib/locationData'
import UrgencyBadge from '../UrgencyBadge'
import VerifiedBadge from '../VerifiedBadge'
import { 
  MapPin, 
  CheckCircle2, 
  Search, 
  Utensils, 
  Image as ImageIcon,
  X,
  MessageSquare
} from 'lucide-react'

const CATEGORIES = [
  { id: 'all', label: 'All Items' },
  { id: 'cooked', label: 'Cooked Food' },
  { id: 'raw', label: 'Raw Ingredients' },
  { id: 'bakery', label: 'Bakery' },
  { id: 'packaged', label: 'Packaged' },
  { id: 'fruits', label: 'Fruits & Veg' },
  { id: 'dairy', label: 'Dairy' },
]

export default function ListingsTab({ onStartChat }) {
  const { profile } = useAuth()
  const { donations, loading, acceptDonation, refreshDonations } = useDonations({ role: 'ngo' })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [filters, setFilters] = useState({ state: '', district: '', city: '' })
  const [previewImage, setPreviewImage] = useState(null)
  const [acceptingId, setAcceptingId] = useState(null)

  const states = uniqSorted(Object.keys(LOCATION_DATA))
  const districts = filters.state ? uniqSorted(Object.keys(LOCATION_DATA[filters.state] || {})) : []
  const cities = filters.state && filters.district ? uniqSorted(LOCATION_DATA[filters.state]?.[filters.district] || []) : []

  const setFilter = (field, val) => {
    setFilters(p => {
      const next = { ...p, [field]: val }
      if (field === 'state') { next.district = ''; next.city = '' }
      if (field === 'district') { next.city = '' }
      return next
    })
  }

  // Filtered and sorted listings
  const filteredDonations = useMemo(() => {
    let list = donations.filter(d => d.status === 'pending')

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(d => 
        (d.food_name && d.food_name.toLowerCase().includes(q)) ||
        (d.donor_name && d.donor_name.toLowerCase().includes(q)) ||
        (d.pickup_city && d.pickup_city.toLowerCase().includes(q)) ||
        (d.description && d.description.toLowerCase().includes(q))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      list = list.filter(d => d.food_category === categoryFilter)
    }

    // Location filter
    if (filters.state) list = list.filter(d => d.pickup_state === filters.state)
    if (filters.district) list = list.filter(d => d.pickup_district === filters.district)
    if (filters.city) list = list.filter(d => d.pickup_city === filters.city)

    // Sort by proximity to NGO's city first, then by urgency
    const myCity = profile?.city || ''
    list.sort((a, b) => {
      const aNear = a.pickup_city === myCity ? 1 : 0
      const bNear = b.pickup_city === myCity ? 1 : 0
      if (aNear !== bNear) return bNear - aNear
      
      const aExpiry = a.expiry_at ? new Date(a.expiry_at).getTime() : Infinity
      const bExpiry = b.expiry_at ? new Date(b.expiry_at).getTime() : Infinity
      return aExpiry - bExpiry
    })

    return list
  }, [donations, searchQuery, categoryFilter, filters, profile?.city])

  const handleAccept = async (donation) => {
    if (!profile) return
    setAcceptingId(donation.id)
    try {
      await acceptDonation(donation.id, profile)
      await refreshDonations()
    } catch (err) {
      console.error('Error claiming donation in ListingsTab:', err)
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
            <Utensils size={13} />
            <span>Regional Food Radar</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Available Surplus Batches</h1>
          <p className="text-xs text-slate-500">Claim pending donations and dispatch collection vehicles.</p>
        </div>

        <div className="text-xs font-semibold text-slate-600 bg-white border border-stone-200 px-3.5 py-2 rounded-xl shadow-xs self-start sm:self-auto">
          <span>{filteredDonations.length} batches available</span>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200 shadow-xs space-y-4">
        
        {/* Search Bar + Cascading Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Text Search */}
          <div className="md:col-span-5 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by food dish, donor, or landmark..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
            />
          </div>

          {/* State */}
          <div className="md:col-span-2">
            <select
              value={filters.state}
              onChange={e => setFilter('state', e.target.value)}
              className="w-full py-2.5 px-3 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800"
            >
              <option value="">All States</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* District */}
          <div className="md:col-span-2">
            <select
              value={filters.district}
              onChange={e => setFilter('district', e.target.value)}
              disabled={!filters.state}
              className="w-full py-2.5 px-3 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
            >
              <option value="">All Districts</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* City */}
          <div className="md:col-span-3">
            <select
              value={filters.city}
              onChange={e => setFilter('city', e.target.value)}
              disabled={!filters.district}
              className="w-full py-2.5 px-3 text-xs border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
            >
              <option value="">All Cities</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                categoryFilter === cat.id
                  ? 'bg-[#0D3B2E] text-white shadow-xs'
                  : 'bg-[#FBFBF9] text-slate-600 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

      </div>

      {/* Listings Stream */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-stone-200 skeleton-shimmer h-40" />
          ))}
        </div>
      ) : filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-stone-200">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search size={22} />
          </div>
          <h3 className="text-base font-bold text-slate-800">No surplus batches found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search filters or check back in a few minutes for new commercial donor dispatches.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDonations.map(donation => {
            const isNear = donation.pickup_city === profile?.city

            return (
              <div 
                key={donation.id} 
                className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs card-hover-lift"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  
                  {/* Item Details */}
                  <div className="flex items-start gap-4 flex-1">
                    
                    {/* Thumbnail with Modal Expand or Fallback Placeholder */}
                    {donation.image_url ? (
                      <div 
                        onClick={() => setPreviewImage(donation.image_url)}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-stone-200 cursor-pointer flex-shrink-0 group relative bg-stone-100"
                      >
                        <img 
                          src={donation.image_url} 
                          alt={donation.food_name} 
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <ImageIcon size={18} />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-[#E8F2EC] flex flex-col items-center justify-center text-[#0D3B2E] flex-shrink-0 border border-emerald-100">
                        <Utensils size={24} />
                        <span className="text-[9px] font-semibold text-emerald-800/70 mt-1">Surplus</span>
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        {/* Integrated Urgency Countdown Badge */}
                        <UrgencyBadge expiryAt={donation.expiry_at} />
                        
                        {isNear && (
                          <span className="text-[11px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            Near You
                          </span>
                        )}

                        <span className="text-[11px] font-semibold bg-stone-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                          {donation.food_category || 'General'}
                        </span>
                        <span className="text-[11px] font-semibold bg-stone-100 text-slate-600 px-2 py-0.5 rounded-full capitalize">
                          {donation.veg_type || 'Veg'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                        {donation.food_name}
                      </h3>
                      
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                        <span>Quantity: <strong className="text-[#0D3B2E] font-mono text-sm">{donation.quantity} {donation.unit}</strong></span>
                        <span>•</span>
                        <span>Donor: <strong>{donation.donor_name}</strong></span>
                        <VerifiedBadge role="donor" isVerified={true} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-medium text-slate-700">
                          <MapPin size={13} className="text-slate-400" />
                          {donation.pickup_city}, {donation.pickup_district}, {donation.pickup_state}
                        </span>
                        {donation.pickup_address_line && (
                          <span className="text-slate-400 truncate max-w-xs">
                            ({donation.pickup_address_line})
                          </span>
                        )}
                      </div>

                      {donation.description && (
                        <p className="text-xs text-slate-500 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          {donation.description}
                        </p>
                      )}

                    </div>
                  </div>

                  {/* Actions Right Side */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <button
                      onClick={() => handleAccept(donation)}
                      disabled={acceptingId === donation.id}
                      className="bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-60 text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow flex items-center gap-2 whitespace-nowrap"
                    >
                      {acceptingId === donation.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="text-emerald-400" />
                          <span>Claim & Dispatch</span>
                        </>
                      )}
                    </button>

                    {donation.donor_id && (
                      <button
                        onClick={() => onStartChat(donation.donor_id, donation.donor_name)}
                        className="text-xs font-semibold text-slate-600 hover:text-[#0D3B2E] bg-stone-100 hover:bg-stone-200 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                      >
                        <MessageSquare size={14} />
                        <span>Message Donor</span>
                      </button>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden bg-white p-3 shadow-2xl">
            <button 
              onClick={() => setPreviewImage(null)}
              className="absolute top-5 right-5 z-10 bg-black/60 text-white p-2.5 rounded-full hover:bg-black/80 transition-colors"
            >
              <X size={18} />
            </button>
            <img 
              src={previewImage} 
              alt="Food Enlarged Preview" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  )
}
