import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { useDonations } from '../../hooks/useDonations'
import { getCityCoordinates } from '../../lib/locationData'
import UrgencyBadge from '../UrgencyBadge'
import VerifiedBadge from '../VerifiedBadge'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import { 
  MapPin, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Truck, 
  ShieldCheck, 
  Lock, 
  MessageSquare, 
  Navigation,
  Building2,
  Utensils,
  Image as ImageIcon,
  Camera,
  Trash2,
  UploadCloud,
  X
} from 'lucide-react'

// Custom Vector Leaflet Markers (No emojis)
function createSvgMarker(type, color = '#0D3B2E') {
  const isDonor = type === 'donor'
  const svgIcon = isDonor
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v14"/><path d="M14 10h6"/><path d="M10 2v20"/><path d="M3 2v20"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M16 18h.01"/></svg>`

  const html = `
    <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
      ${!isDonor ? '<div class="leaflet-radar-ring"></div>' : ''}
      <div style="background:${color};width:32px;height:32px;border-radius:50%;border:2.5px solid white;box-shadow:0 4px 12px rgba(13,59,46,0.3);display:flex;align-items:center;justify-content:center;position:relative;z-index:2;">
        ${svgIcon}
      </div>
    </div>
  `

  return L.divIcon({
    className: 'custom-vector-pin',
    html,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

const STATUS_PIPELINE = [
  { key: 'pending', label: 'Broadcasted', step: 0 },
  { key: 'accepted', label: 'NGO Matched', step: 1 },
  { key: 'collected', label: 'Verified Pickup', step: 2 },
  { key: 'in-transit', label: 'In Transit', step: 3 },
  { key: 'delivered', label: 'Distributed', step: 4 },
]

function TrackingCard({ donation, profile, allProfiles, onStatusChange, onStartChat, onVerifyOtpClick, onDeliverClick, onPreviewImage }) {
  const [expanded, setExpanded] = useState(true)
  
  const currentStepIndex = STATUS_PIPELINE.findIndex(s => s.key === donation.status)
  const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0

  const ngo = donation.accepted_by ? allProfiles.find(p => p.id === donation.accepted_by) : null
  const donor = allProfiles.find(p => p.id === donation.donor_id)

  const donorCity = donation.pickup_city || donation.donor_location || 'Urban Center'
  const ngoCity = ngo?.city || ''

  const donorCoords = getCityCoordinates(donorCity)
  const ngoCoords = ngoCity ? getCityCoordinates(ngoCity) : null
  const showMap = ngo && ngoCoords && donation.status !== 'pending'
  
  const center = showMap
    ? [(donorCoords[0] + ngoCoords[0]) / 2, (donorCoords[1] + ngoCoords[1]) / 2]
    : donorCoords

  const isDelivered = donation.status === 'delivered' || donation.status === 'completed'
  const destinationAddress = donation.status === 'collected' || donation.status === 'in-transit'
    ? (ngo?.city ? `${ngo.name || 'Shelter'}, ${ngo.city}` : donorCity)
    : `${donation.pickup_address_line || ''}, ${donorCity}, ${donation.pickup_state || ''}`

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
      
      {/* Header Info */}
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4 flex-1">
            {/* Thumbnail or Fallback */}
            {donation.image_url ? (
              <div 
                onClick={() => onPreviewImage(donation.image_url)}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-stone-200 cursor-pointer flex-shrink-0 group relative bg-stone-100"
              >
                <img 
                  src={donation.image_url} 
                  alt={donation.food_name} 
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
                <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                  <ImageIcon size={16} />
                </div>
              </div>
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#E8F2EC] flex flex-col items-center justify-center text-[#0D3B2E] flex-shrink-0 border border-emerald-100">
                <Utensils size={20} />
                <span className="text-[9px] font-semibold text-emerald-800/70 mt-1">Batch</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-mono font-bold text-[#0D3B2E] bg-[#E8F2EC] px-2.5 py-0.5 rounded-full">
                  ID #{donation.id.substring(0, 8)}
                </span>
                <UrgencyBadge expiryAt={donation.expiry_at} />
                <span className="text-xs font-semibold text-slate-500">
                  • {new Date(donation.created_at).toLocaleDateString()}
                </span>
                
                {donation.proof_image_url && (
                  <button
                    onClick={() => onPreviewImage(donation.proof_image_url)}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    <Camera size={12} className="text-emerald-700" />
                    <span>View POD Proof</span>
                  </button>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {donation.food_name}
              </h3>

              <p className="text-xs font-semibold text-slate-600 mt-1">
                Quantity: <span className="text-[#0D3B2E] font-mono text-sm">{donation.quantity} {donation.unit}</span>
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <div className="flex items-center gap-1 font-medium text-slate-700">
                  <MapPin size={13} className="text-[#0D3B2E]" />
                  <span>Origin: {donorCity}</span>
                  {donor && <VerifiedBadge role="donor" isVerified={true} registrationNumber={donor.registration_number} />}
                </div>

                {ngo && (
                  <div className="flex items-center gap-1 font-medium text-slate-700">
                    <Building2 size={13} className="text-blue-600" />
                    <span>Shelter: {ngo.name}</span>
                    <VerifiedBadge role="ngo" isVerified={true} registrationNumber={ngo.registration_number} />
                  </div>
                )}
              </div>

              {/* OTP Handover Badge for Donor */}
              {profile?.role === 'donor' && donation.pickup_otp && donation.status === 'accepted' && (
                <div className="mt-3 inline-flex items-center gap-2 bg-[#E8F2EC] border border-[#0D3B2E]/20 text-[#0D3B2E] px-3 py-1.5 rounded-xl text-xs font-bold">
                  <Lock size={14} />
                  <span>Handover Code for Driver: <span className="font-mono text-sm tracking-widest">{donation.pickup_otp}</span></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border capitalize ${
              donation.status === 'pending' ? 'bg-amber-100 text-amber-800 border-amber-200' :
              donation.status === 'accepted' ? 'bg-blue-100 text-blue-800 border-blue-200' :
              donation.status === 'collected' ? 'bg-purple-100 text-purple-800 border-purple-200' :
              donation.status === 'in-transit' ? 'bg-orange-100 text-orange-800 border-orange-200' :
              'bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}>
              {donation.status.replace('-', ' ')}
            </span>

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
            >
              {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>

        </div>

        {/* Step-by-Step Progress Pipeline */}
        <div className="mt-6 pt-4 border-t border-stone-100">
          <div className="grid grid-cols-5 gap-1 items-center">
            {STATUS_PIPELINE.map((pipe, idx) => {
              const isCompleted = idx <= activeStep
              const isCurrent = idx === activeStep

              return (
                <div key={pipe.key} className="flex flex-col items-center text-center">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted 
                      ? 'bg-[#0D3B2E] text-white shadow-xs' 
                      : 'bg-stone-100 text-slate-400'
                  } ${isCurrent ? 'ring-2 ring-offset-2 ring-[#0D3B2E]' : ''}`}>
                    {idx < activeStep ? <CheckCircle2 size={15} /> : idx + 1}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-semibold mt-1.5 hidden sm:block ${
                    isCompleted ? 'text-[#0D3B2E]' : 'text-slate-400'
                  }`}>
                    {pipe.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Expanded Map & Actions Section */}
      {expanded && (
        <div className="border-t border-stone-200 bg-stone-50/50">
          
          {/* Map View */}
          {showMap ? (
            <div className="h-64 sm:h-72 w-full relative">
              <MapContainer 
                center={center} 
                zoom={10} 
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer 
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                  attribution="&copy; OpenStreetMap contributors" 
                />
                
                {/* Donor Origin Pin */}
                <Marker position={donorCoords} icon={createSvgMarker('donor', '#0D3B2E')}>
                  <Popup>
                    <div className="p-1">
                      <p className="font-bold text-xs text-[#0D3B2E]">Pickup Location (Donor)</p>
                      <p className="text-xs text-slate-600">{donor?.name || donation.donor_name}</p>
                      <p className="text-[10px] text-slate-500">{donorCity}</p>
                    </div>
                  </Popup>
                </Marker>

                {/* NGO Destination Pin */}
                {ngoCoords && (
                  <>
                    <Marker position={ngoCoords} icon={createSvgMarker('ngo', '#0284C7')}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-bold text-xs text-blue-700">Destination Shelter (NGO)</p>
                          <p className="text-xs text-slate-600">{ngo.name}</p>
                          <p className="text-[10px] text-slate-500">{ngoCity}</p>
                        </div>
                      </Popup>
                    </Marker>

                    <Polyline 
                      positions={[donorCoords, ngoCoords]}
                      color={isDelivered ? '#10B981' : '#0D3B2E'}
                      weight={4}
                      dashArray={donation.status === 'in-transit' ? '8 8' : undefined}
                    />
                  </>
                )}
              </MapContainer>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500 bg-stone-100">
              <Navigation size={18} className="mx-auto mb-1 text-slate-400" />
              Route tracking initializes once an NGO claims and maps pickup coordinates.
            </div>
          )}

          {/* Action Bar */}
          <div className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 bg-white border-t border-stone-200">
            
            {/* Peer Chat & Turn-by-turn Navigation Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destinationAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-700 hover:text-[#0D3B2E] bg-stone-100 hover:bg-stone-200 px-3.5 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <MapPin size={14} className="text-[#0D3B2E]" />
                <span>Navigate (Maps)</span>
              </a>

              {profile?.role === 'donor' && ngo && (
                <button
                  onClick={() => onStartChat(ngo.id, ngo.name)}
                  className="text-xs font-semibold text-slate-700 hover:text-[#0D3B2E] bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Chat with NGO ({ngo.name})</span>
                </button>
              )}

              {profile?.role === 'ngo' && donor && (
                <button
                  onClick={() => onStartChat(donor.id, donor.name)}
                  className="text-xs font-semibold text-slate-700 hover:text-[#0D3B2E] bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>Chat with Donor ({donor.name})</span>
                </button>
              )}
            </div>

            {/* NGO Direct Dispatch Status Advancement Actions */}
            {profile?.role === 'ngo' && (
              <div className="flex items-center gap-2">
                {donation.status === 'accepted' && (
                  <button
                    onClick={() => onVerifyOtpClick(donation)}
                    className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Lock size={14} className="text-emerald-400" />
                    <span>Verify Handover OTP & Collect</span>
                  </button>
                )}

                {donation.status === 'collected' && (
                  <button
                    onClick={() => onStatusChange(donation.id, 'in-transit', donation.donor_id, donation.food_name)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <Truck size={14} />
                    <span>Mark as In Transit to Shelter</span>
                  </button>
                )}

                {donation.status === 'in-transit' && (
                  <button
                    onClick={() => onDeliverClick(donation)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 size={14} />
                    <span>Complete Delivery & Proof</span>
                  </button>
                )}
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}

export default function TrackingTab({ onStartChat }) {
  const { user, profile } = useAuth()
  const { updateDonationStatus, verifyAndCollect } = useDonations()
  const [donations, setDonations] = useState([])
  const [allProfiles, setAllProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [previewImage, setPreviewImage] = useState(null)

  // OTP Verification Modal State
  const [otpModalDonation, setOtpModalDonation] = useState(null)
  const [otpInput, setOtpInput] = useState('')
  const [otpVerifying, setOtpVerifying] = useState(false)

  // Proof of Delivery (POD) Modal State
  const [podModalDonation, setPodModalDonation] = useState(null)
  const [podPhotoFile, setPodPhotoFile] = useState(null)
  const [podPhotoPreview, setPodPhotoPreview] = useState(null)
  const [podDelivering, setPodDelivering] = useState(false)
  const podFileInputRef = useRef(null)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      let query = supabase.from('donations').select('*')
      if (profile?.role === 'donor') query = query.eq('donor_id', user.id)
      else if (profile?.role === 'ngo') query = query.eq('accepted_by', user.id)
      query = query.order('created_at', { ascending: false })

      const [{ data: dons }, { data: profiles }] = await Promise.all([
        query,
        supabase.from('profiles').select('*'),
      ])

      setDonations(dons || [])
      setAllProfiles(profiles || [])
    } catch (err) {
      console.error('Error loading tracking data:', err)
    } finally {
      setLoading(false)
    }
  }, [user.id, profile?.role])

  useEffect(() => {
    loadData()

    const channelName = `tracking_rt_${Math.random().toString(36).slice(2, 7)}`
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donations' }, () => loadData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData])

  const handleStatusChange = async (donationId, newStatus, donorId, foodName, podFile = null) => {
    await updateDonationStatus(donationId, newStatus, donorId, foodName, podFile)
    loadData()
  }

  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault()
    if (!otpInput.trim() || !otpModalDonation) return
    setOtpVerifying(true)
    try {
      await verifyAndCollect(otpModalDonation.id, otpInput, otpModalDonation)
      setOtpModalDonation(null)
      setOtpInput('')
      loadData()
    } catch {
      // Handled in hook
    } finally {
      setOtpVerifying(false)
    }
  }

  const handlePodPhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPodPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPodPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleDeliverSubmit = async (e) => {
    e.preventDefault()
    if (!podModalDonation) return
    setPodDelivering(true)
    try {
      await handleStatusChange(
        podModalDonation.id, 
        'delivered', 
        podModalDonation.donor_id, 
        podModalDonation.food_name, 
        podPhotoFile
      )
      setPodModalDonation(null)
      setPodPhotoFile(null)
      setPodPhotoPreview(null)
    } catch {
      // Handled in hook
    } finally {
      setPodDelivering(false)
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-1.5">
          <Navigation size={13} />
          <span>Live Dispatch Radar</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Track Rescued Batches</h1>
        <p className="text-xs text-slate-500">Monitor vehicle routes, custody transfers, and physical verification.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-3xl p-6 border border-stone-200 skeleton-shimmer h-64" />
          ))}
        </div>
      ) : donations.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-stone-200 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F2EC] flex items-center justify-center mx-auto mb-4 text-[#0D3B2E]">
            <Navigation size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No active tracking routes</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {profile?.role === 'donor' 
              ? 'Post surplus food to start tracking delivery routes in real-time.' 
              : 'Claim available food from the Listings tab to dispatch pickup vehicles.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {donations.map(donation => (
            <TrackingCard
              key={donation.id}
              donation={donation}
              profile={profile}
              allProfiles={allProfiles}
              onStatusChange={handleStatusChange}
              onStartChat={onStartChat}
              onVerifyOtpClick={d => { setOtpModalDonation(d); setOtpInput('') }}
              onDeliverClick={d => { setPodModalDonation(d); setPodPhotoFile(null); setPodPhotoPreview(null) }}
              onPreviewImage={url => setPreviewImage(url)}
            />
          ))}
        </div>
      )}

      {/* OTP Verification Handover Dialog for NGOs */}
      {otpModalDonation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={e => e.target === e.currentTarget && setOtpModalDonation(null)}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setOtpModalDonation(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100"
            >
              <X size={18} />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mx-auto mb-3">
                <Lock size={24} className="text-[#10B981]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Handover OTP Verification</h3>
              <p className="text-xs text-slate-500 mt-1">
                Enter the 6-digit code provided by the donor at pickup for <span className="font-semibold text-slate-700">{otpModalDonation.food_name}</span>.
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 text-center">
                  6-Digit Handover Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="e.g. 849201"
                  value={otpInput}
                  onChange={e => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center text-2xl font-mono font-extrabold tracking-widest border border-stone-300 rounded-xl py-3 focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                />
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                This securely logs custody transfer with tamper-proof timestamps.
              </p>

              <button
                type="submit"
                disabled={otpVerifying || otpInput.length < 6}
                className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {otpVerifying ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>Verify & Confirm Pickup</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Proof of Delivery (POD) Dialog for NGOs/Volunteers */}
      {podModalDonation && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
          onClick={e => e.target === e.currentTarget && setPodModalDonation(null)}
        >
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-stone-200 relative animate-in fade-in zoom-in-95 duration-150">
            <button 
              onClick={() => setPodModalDonation(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100"
            >
              <X size={18} />
            </button>

            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 size={24} className="text-emerald-600" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">Proof of Delivery (POD)</h3>
              <p className="text-xs text-slate-500 mt-1">
                Complete distribution for <span className="font-semibold text-slate-700">{podModalDonation.food_name}</span>.
              </p>
            </div>

            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              
              {/* Optional Drop-off Photo */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Drop-off Photograph (Optional)
                </label>

                {podPhotoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 p-2 flex items-center gap-3">
                    <img 
                      src={podPhotoPreview} 
                      alt="POD Preview" 
                      className="w-16 h-16 object-cover rounded-xl border border-stone-200" 
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{podPhotoFile?.name}</p>
                      <p className="text-[11px] text-slate-500">{(podPhotoFile?.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setPodPhotoFile(null); setPodPhotoPreview(null) }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => podFileInputRef.current?.click()}
                    className="border-2 border-dashed border-stone-300 hover:border-[#0D3B2E] rounded-2xl p-4 text-center cursor-pointer bg-[#FBFBF9] hover:bg-stone-50 transition-all"
                  >
                    <UploadCloud size={22} className="mx-auto mb-1 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Attach Shelter Drop-off Photo</p>
                    <p className="text-[10px] text-slate-400">Verifiable delivery proof</p>
                  </div>
                )}

                <input
                  type="file"
                  ref={podFileInputRef}
                  onChange={handlePodPhotoSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <p className="text-[11px] text-slate-400 text-center">
                Completing will log the final timestamp, notify the donor, and update ESG impact records.
              </p>

              <button
                type="submit"
                disabled={podDelivering}
                className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {podDelivering ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    <span>Confirm & Complete Drop-off</span>
                  </>
                )}
              </button>
            </form>
          </div>
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
              alt="Tracking Food Enlarged" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

    </div>
  )
}
