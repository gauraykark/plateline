import { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { LOCATION_DATA, uniqSorted } from '../lib/locationData'
import { supabase } from '../lib/supabase'
import { 
  X, 
  UploadCloud, 
  Check, 
  AlertCircle, 
  Trash2,
  Utensils,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

const FOOD_CATEGORIES = [
  { id: 'cooked', label: 'Cooked Food' },
  { id: 'raw', label: 'Raw Ingredients' },
  { id: 'bakery', label: 'Bakery Items' },
  { id: 'packaged', label: 'Packaged Goods' },
  { id: 'fruits', label: 'Fruits & Produce' },
  { id: 'dairy', label: 'Dairy Items' },
]

const VEG_TYPES = [
  { id: 'veg', label: 'Pure Veg' },
  { id: 'non-veg', label: 'Non-Vegetarian' },
  { id: 'mixed', label: 'Mixed Batch' },
]

export default function PostFoodModal({ onClose, onSuccess }) {
  const { user, profile } = useAuth()
  const [form, setForm] = useState({
    foodName: '',
    foodCategory: 'cooked',
    vegType: 'veg',
    quantity: '',
    unit: 'kg',
    expiryAt: '',
    pickupState: profile?.state || '',
    pickupDistrict: profile?.district || '',
    pickupCity: profile?.city || '',
    pickupAddressLine: '',
    description: '',
  })

  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const states = uniqSorted(Object.keys(LOCATION_DATA))
  const districts = form.pickupState ? uniqSorted(Object.keys(LOCATION_DATA[form.pickupState] || {})) : []
  const cities = form.pickupState && form.pickupDistrict ? uniqSorted(LOCATION_DATA[form.pickupState]?.[form.pickupDistrict] || []) : []

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB.')
      return
    }

    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = () => setPhotoPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const errors = []
    if (!form.foodName.trim()) errors.push('Food item name is required.')
    if (!form.foodCategory) errors.push('Food category is required.')
    if (!form.vegType) errors.push('Dietary type is required.')
    if (!(parseFloat(form.quantity) > 0)) errors.push('Quantity must be greater than 0.')
    
    if (!form.expiryAt) {
      errors.push('Expiry window is required.')
    } else {
      const expiry = new Date(form.expiryAt)
      const minValid = new Date(Date.now() + 15 * 60 * 1000)
      if (expiry <= new Date()) errors.push('Expiry must be in the future.')
      else if (expiry < minValid) errors.push('Expiry should be at least 15 minutes from now.')
    }

    if (!form.pickupState || !form.pickupDistrict || !form.pickupCity) {
      errors.push('State, district, and city are required.')
    }
    if (!form.pickupAddressLine.trim()) {
      errors.push('Exact pickup address/landmark is required.')
    }

    if (errors.length) {
      setError(errors.join(' '))
      return
    }

    setLoading(true)
    try {
      let uploadedUrl = null

      // Upload image to Supabase storage if file attached
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        let uploadRes = await supabase.storage
          .from('food-photos')
          .upload(fileName, photoFile, { cacheControl: '3600', upsert: false })

        if (uploadRes.error) {
          // Fallback attempt to donation-photos
          uploadRes = await supabase.storage
            .from('donation-photos')
            .upload(`donation-images/${fileName}`, photoFile, { cacheControl: '3600', upsert: false })
        }

        if (!uploadRes.error) {
          const bucketName = uploadRes.data?.fullPath?.split('/')?.[0] || 'food-photos'
          const { data } = supabase.storage.from(bucketName).getPublicUrl(uploadRes.data?.path || fileName)
          uploadedUrl = data?.publicUrl || null
        } else {
          console.warn('Storage upload note:', uploadRes.error.message)
        }
      }

      const { error: dbError } = await supabase.from('donations').insert({
        donor_id: user.id,
        donor_name: profile.name,
        donor_location: form.pickupCity || profile.city,
        food_name: form.foodName.trim(),
        food_category: form.foodCategory,
        veg_type: form.vegType,
        quantity: parseFloat(form.quantity),
        unit: form.unit,
        expiry_at: new Date(form.expiryAt).toISOString(),
        pickup_state: form.pickupState,
        pickup_district: form.pickupDistrict,
        pickup_city: form.pickupCity,
        pickup_address_line: form.pickupAddressLine.trim(),
        description: form.description.trim(),
        image_url: uploadedUrl,
        status: 'pending',
      })

      if (dbError) throw dbError

      toast.success('Food donation posted successfully!')
      onSuccess?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to post donation.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl relative my-8 border border-stone-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full mb-2">
            <Utensils size={13} />
            <span>Commercial Surplus Dispatch</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Post Food Donation</h2>
          <p className="text-xs text-slate-500 mt-1">Broadcast surplus meals to verified local shelter organizations.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Food Item Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Food Item / Dish Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Basmati Biryani & Paneer Butter Masala (Fresh Batch)"
              value={form.foodName}
              onChange={e => set('foodName', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Category Pill Selectors */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Food Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FOOD_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => set('foodCategory', cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                    form.foodCategory === cat.id
                      ? 'bg-[#0D3B2E] text-white border-[#0D3B2E] shadow-xs'
                      : 'bg-[#FBFBF9] text-slate-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <span>{cat.label}</span>
                  {form.foodCategory === cat.id && <Check size={14} className="text-emerald-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Type Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Dietary Classification *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {VEG_TYPES.map(vt => (
                <button
                  type="button"
                  key={vt.id}
                  onClick={() => set('vegType', vt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    form.vegType === vt.id
                      ? 'bg-[#0D3B2E] text-white border-[#0D3B2E]'
                      : 'bg-[#FBFBF9] text-slate-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {vt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="0.5"
                step="any"
                required
                placeholder="e.g. 50"
                value={form.quantity}
                onChange={e => set('quantity', e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Unit
              </label>
              <select
                value={form.unit}
                onChange={e => set('unit', e.target.value)}
                className="w-full border border-stone-300 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 font-medium"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="servings">Servings / Meals</option>
                <option value="packages">Boxes / Packages</option>
                <option value="liters">Liters (L)</option>
              </select>
            </div>
          </div>

          {/* Expiry Date & Time */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Safe Consumption Expiry Window *</span>
              <span className="text-[10px] text-amber-700 font-normal">Must be consumed before this time</span>
            </label>
            <input
              type="datetime-local"
              required
              value={form.expiryAt}
              onChange={e => set('expiryAt', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
            />
          </div>

          {/* Photo Upload with Preview */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Food Item Photograph (Optional)
            </label>
            
            {photoPreview ? (
              <div className="relative rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 p-2 flex items-center gap-4">
                <img 
                  src={photoPreview} 
                  alt="Food Preview" 
                  className="w-20 h-20 object-cover rounded-xl border border-stone-200" 
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">{photoFile?.name}</p>
                  <p className="text-[11px] text-slate-500">{(photoFile?.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={removePhoto}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-[#0D3B2E] rounded-2xl p-4 text-center cursor-pointer bg-[#FBFBF9] hover:bg-stone-50 transition-all"
              >
                <UploadCloud size={24} className="mx-auto mb-1 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Click to upload food photo</p>
                <p className="text-[10px] text-slate-400">PNG, JPG, WebP up to 5MB</p>
              </div>
            )}
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoSelect}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Pickup Address — Cascading Pickers */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Pickup Location & Landmark *
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <select
                required
                value={form.pickupState}
                onChange={e => { set('pickupState', e.target.value); set('pickupDistrict', ''); set('pickupCity', '') }}
                className="border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800"
              >
                <option value="">State</option>
                {states.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                required
                value={form.pickupDistrict}
                onChange={e => { set('pickupDistrict', e.target.value); set('pickupCity', '') }}
                disabled={!form.pickupState}
                className="border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
              >
                <option value="">District</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              <select
                required
                value={form.pickupCity}
                onChange={e => set('pickupCity', e.target.value)}
                disabled={!form.pickupDistrict}
                className="border border-stone-300 rounded-xl px-2.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
              >
                <option value="">City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <textarea
              required
              rows={2}
              placeholder="Building name, kitchen gate number, landmark for delivery vehicle..."
              value={form.pickupAddressLine}
              onChange={e => set('pickupAddressLine', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] resize-none"
            />
          </div>

          {/* Extra Handling Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Handling & Packaging Instructions (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Packed in stainless steel containers. Please bring container transfer boxes or foil bags."
              value={form.description}
              onChange={e => set('description', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3.5 rounded-xl">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles size={16} className="text-emerald-400" />
                <span>Broadcast Surplus Donation</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  )
}
