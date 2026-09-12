import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { LOCATION_DATA, uniqSorted } from '../lib/locationData'
import { 
  X, 
  Leaf, 
  Utensils, 
  Building2, 
  AlertCircle, 
  Lock, 
  Mail, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react'
import toast from 'react-hot-toast'

function Modal({ children, onClose }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl relative my-8 border border-stone-200 animate-in fade-in zoom-in-95 duration-150">
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-stone-100 transition-colors"
        >
          <X size={18} />
        </button>
        {children}
      </div>
    </div>
  )
}

export function LoginModal({ onClose, onSwitchToRegister, onAuthSuccess }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login({ email, password })
      const userProfile = res?.profile
      const role = userProfile?.role || 'donor'
      const name = userProfile?.name || 'Partner'

      let defaultTab = 'overview'
      if (role === 'ngo') {
        defaultTab = 'listings'
        toast.success(`Welcome, ${name}! Your NGO dispatch radar is ready.`)
      } else {
        defaultTab = 'overview'
        toast.success(`Welcome, ${name}! Your food donor dashboard is ready.`)
      }

      if (onAuthSuccess) {
        onAuthSuccess(userProfile, defaultTab)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mx-auto mb-3">
          <Leaf size={24} className="text-[#10B981]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0D3B2E]">Sign In</h2>
        <p className="text-xs text-slate-500 mt-1">Access your food rescue dispatch dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="email" 
              placeholder="name@organization.com" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]" 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="password" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-stone-300 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]" 
            />
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3 rounded-xl">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Network</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 pt-4 border-t border-stone-100 text-xs text-slate-600">
        Don't have an account?{' '}
        <button 
          onClick={() => { onClose(); onSwitchToRegister() }} 
          className="text-[#0D3B2E] font-bold hover:underline"
        >
          Join Network
        </button>
      </div>
    </Modal>
  )
}

const ROLES = [
  { id: 'donor', label: 'Food Donor', sub: 'Restaurant, Caterer, Hotel', Icon: Utensils },
  { id: 'ngo', label: 'Verified NGO', sub: 'Food Bank, Community Shelter', Icon: Building2 },
]

export function RegisterModal({ onClose, onAuthSuccess }) {
  const { register } = useAuth()
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'donor', 
    state: '', 
    district: '', 
    city: '',
    phone: '',
    registration_number: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (field, val) => setForm(p => ({ ...p, [field]: val }))

  const states = uniqSorted(Object.keys(LOCATION_DATA))
  const districts = form.state ? uniqSorted(Object.keys(LOCATION_DATA[form.state] || {})) : []
  const cities = form.state && form.district ? uniqSorted(LOCATION_DATA[form.state]?.[form.district] || []) : []

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.state || !form.district || !form.city) {
      setError('Please select your state, district, and city.')
      return
    }

    setLoading(true)
    try {
      const res = await register(form)
      const userProfile = res?.profile || form
      const role = userProfile?.role || form.role || 'donor'
      const name = userProfile?.name || form.name || 'Partner'

      let defaultTab = 'overview'
      if (role === 'ngo') {
        defaultTab = 'listings'
        toast.success(`Welcome, ${name}! Your NGO dispatch radar is ready.`)
      } else {
        defaultTab = 'overview'
        toast.success(`Welcome, ${name}! Your food donor dashboard is ready.`)
      }

      if (onAuthSuccess) {
        onAuthSuccess(userProfile, defaultTab)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal onClose={onClose}>
      <div className="mb-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mx-auto mb-3">
          <ShieldCheck size={24} className="text-[#10B981]" />
        </div>
        <h2 className="text-2xl font-extrabold text-[#0D3B2E]">Join Plateline</h2>
        <p className="text-xs text-slate-500 mt-1">Register as a verified network partner</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Role Cards (2 Roles: Donor & NGO) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">Select Account Type *</label>
          <div className="grid grid-cols-2 gap-2.5">
            {ROLES.map(({ id, label, sub, Icon }) => {
              const selected = form.role === id
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => set('role', id)}
                  className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                    selected 
                      ? 'bg-[#0D3B2E] text-white border-[#0D3B2E] shadow-sm' 
                      : 'bg-[#FBFBF9] text-slate-700 border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  <Icon size={20} className={selected ? 'text-emerald-300' : 'text-slate-500'} />
                  <span className="text-xs font-bold leading-tight">{label}</span>
                  <span className={`text-[10px] truncate max-w-full ${selected ? 'text-white/75' : 'text-slate-400'}`}>{sub}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {form.role === 'ngo' ? 'NGO / Organization Name *' : 'Restaurant / Business Name *'}
          </label>
          <input 
            type="text" 
            placeholder={form.role === 'ngo' ? 'Enter NGO or organization name' : 'Enter restaurant or business name'} 
            required 
            value={form.name} 
            onChange={e => set('name', e.target.value)}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]" 
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <input 
              type="email" 
              placeholder="Enter email address" 
              required 
              value={form.email} 
              onChange={e => set('email', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
            <input 
              type="password" 
              placeholder="Enter password (min 6 chars)" 
              required 
              minLength={6} 
              value={form.password} 
              onChange={e => set('password', e.target.value)}
              className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]" 
            />
          </div>
        </div>

        {/* Dynamic Trust / License Registration Input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">
            {form.role === 'ngo' 
              ? 'NGO Darpan ID / Trust Registration No. (Optional)' 
              : 'FSSAI License / GSTIN (Optional)'}
          </label>
          <input 
            type="text" 
            placeholder={form.role === 'ngo' ? 'Enter Darpan ID or Registration No.' : 'Enter FSSAI License or GSTIN'} 
            value={form.registration_number || ''} 
            onChange={e => set('registration_number', e.target.value)}
            className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] placeholder:text-slate-400 font-mono" 
          />
        </div>

        {/* Cascading Location Selectors */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Primary Operational Hub *</label>
          <div className="grid grid-cols-3 gap-2">
            <select 
              required 
              value={form.state} 
              onChange={e => { set('state', e.target.value); set('district', ''); set('city', '') }}
              className="border border-stone-300 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800"
            >
              <option value="">State</option>
              {states.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <select 
              required 
              value={form.district} 
              onChange={e => { set('district', e.target.value); set('city', '') }}
              disabled={!form.state}
              className="border border-stone-300 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
            >
              <option value="">District</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            <select 
              required 
              value={form.city} 
              onChange={e => set('city', e.target.value)}
              disabled={!form.district}
              className="border border-stone-300 rounded-xl px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] bg-white text-slate-800 disabled:opacity-50"
            >
              <option value="">City</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-rose-700 text-xs bg-rose-50 border border-rose-200 p-3 rounded-xl">
            <AlertCircle size={15} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-60 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Create Stakeholder Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>
    </Modal>
  )
}
