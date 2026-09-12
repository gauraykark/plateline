import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useDonations } from '../../hooks/useDonations'
import PostFoodModal from '../PostFoodModal'
import UrgencyBadge from '../UrgencyBadge'
import { 
  PlusCircle, 
  MapPin, 
  Calendar, 
  Clock, 
  Lock, 
  ShieldCheck, 
  Utensils, 
  CheckCircle2, 
  Truck, 
  Package, 
  X,
  Image as ImageIcon
} from 'lucide-react'

const STATUS_BADGES = {
  pending: { label: 'Pending Claim', color: 'bg-amber-100 text-amber-800 border-amber-200', Icon: Clock },
  accepted: { label: 'Accepted & Assigned', color: 'bg-blue-100 text-blue-800 border-blue-200', Icon: CheckCircle2 },
  collected: { label: 'Picked Up & Verified', color: 'bg-purple-100 text-purple-800 border-purple-200', Icon: ShieldCheck },
  'in-transit': { label: 'In Transit to Shelter', color: 'bg-orange-100 text-orange-800 border-orange-200', Icon: Truck },
  delivered: { label: 'Delivered & Distributed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: Package },
  completed: { label: 'Delivered & Distributed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', Icon: Package },
}

export default function DonationsTab() {
  const { user } = useAuth()
  const { donations, loading, refreshDonations } = useDonations({ role: 'donor', userId: user?.id })
  const [showModal, setShowModal] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
            <Utensils size={13} />
            <span>Donor Operations</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Food Donations</h1>
          <p className="text-xs text-slate-500">Track status, manage live batches, and verify handover OTPs.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-5 py-3 rounded-xl font-bold text-xs transition-all shadow-sm hover:shadow flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle size={16} className="text-emerald-400" />
          <span>Post New Surplus Batch</span>
        </button>
      </div>

      {/* List Container */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-stone-200 skeleton-shimmer h-40" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F2EC] flex items-center justify-center mx-auto mb-4 text-[#0D3B2E]">
            <Utensils size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No active donations yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-6">
            When your commercial kitchen or household has edible surplus, broadcast it here to connect with nearby shelters in minutes.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#0D3B2E] text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-[#092B21] transition-all shadow-sm inline-flex items-center gap-2"
          >
            <PlusCircle size={16} />
            <span>Post First Donation</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map(donation => {
            const statusConfig = STATUS_BADGES[donation.status] || STATUS_BADGES.pending
            const StatusIcon = statusConfig.Icon

            return (
              <div
                key={donation.id}
                className="bg-white rounded-2xl p-5 sm:p-6 border border-stone-200 shadow-xs card-hover-lift"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  
                  {/* Left Info */}
                  <div className="flex items-start gap-4 flex-1">
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

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.color}`}>
                          <StatusIcon size={12} />
                          <span>{statusConfig.label}</span>
                        </span>
                        
                        <UrgencyBadge expiryAt={donation.expiry_at} />

                        <span className="text-[11px] font-semibold bg-stone-100 text-slate-600 px-2.5 py-0.5 rounded-full capitalize">
                          {donation.food_category}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-tight">
                        {donation.food_name}
                      </h3>

                      <p className="text-xs font-semibold text-slate-600 mt-1">
                        Batch Quantity: <span className="text-[#0D3B2E] font-mono text-sm">{donation.quantity} {donation.unit}</span>
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                        <span className="flex items-center gap-1 font-medium">
                          <MapPin size={13} className="text-slate-400" />
                          {donation.pickup_city}, {donation.pickup_state}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(donation.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      {donation.description && (
                        <p className="text-xs text-slate-500 mt-2 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                          {donation.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: OTP Handover Badge or Status Detail */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    
                    {donation.pickup_otp && (
                      <div className="bg-[#E8F2EC] border border-[#0D3B2E]/20 rounded-2xl p-3 text-center w-full sm:w-auto min-w-[150px]">
                        <div className="flex items-center justify-center gap-1 text-[10px] uppercase font-bold text-[#0D3B2E] mb-0.5">
                          <Lock size={12} />
                          <span>Pickup Handover OTP</span>
                        </div>
                        <div className="text-xl font-extrabold font-mono tracking-widest text-[#0D3B2E]">
                          {donation.pickup_otp}
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Share with driver at pickup</p>
                      </div>
                    )}

                    {donation.status === 'pending' && (
                      <div className="text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 font-semibold">
                        <span>Awaiting NGO claim</span>
                      </div>
                    )}

                    {donation.status === 'collected' && (
                      <div className="text-xs text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 flex items-center gap-1.5 font-semibold">
                        <ShieldCheck size={14} />
                        <span>Handover Verified</span>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Post Food Modal */}
      {showModal && (
        <PostFoodModal
          onClose={() => setShowModal(false)}
          onSuccess={() => refreshDonations()}
        />
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
              alt="Donation Enlarged" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  )
}
