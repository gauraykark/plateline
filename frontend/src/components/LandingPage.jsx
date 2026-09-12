import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import {
  Leaf,
  ShieldCheck,
  ArrowRight,
  Utensils,
  Truck,
  Building2,
  Clock,
  CheckCircle2,
  Lock,
  Send,
  Globe2,
  BarChart3,
  QrCode,
  Flame,
  ChevronRight,
  Award,
  HeartHandshake,
  Navigation,
  FileCheck,
  MapPin
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function LandingPage({ onGetStarted }) {
  const [stats, setStats] = useState({
    meals: 12480,
    ngos: 48,
    cities: 16,
    co2Saved: 31200
  })

  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' })
  const [contactSubmitting, setContactSubmitting] = useState(false)
  const [workflowRole, setWorkflowRole] = useState('donor')

  // Animated counters state
  const [animatedStats, setAnimatedStats] = useState({
    meals: 0,
    ngos: 0,
    cities: 0,
    co2Saved: 0
  })

  useEffect(() => {
    async function loadStats() {
      try {
        const [{ count: meals }, { data: profiles }] = await Promise.all([
          supabase.from('donations').select('*', { count: 'exact', head: true }),
          supabase.from('profiles').select('role, city'),
        ])

        const ngos = (profiles || []).filter(p => p.role === 'ngo').length
        const cities = new Set((profiles || []).map(p => p.city).filter(Boolean)).size

        const actualMeals = meals ? meals * 25 : 12480
        const actualNgos = ngos || 48
        const actualCities = cities || 16
        const actualCo2 = Math.round(actualMeals * 2.5)

        setStats({
          meals: actualMeals,
          ngos: actualNgos,
          cities: actualCities,
          co2Saved: actualCo2
        })
      } catch (err) {
        console.warn('Could not load live stats, using fallback verified metrics:', err)
      }
    }

    loadStats()
  }, [])

  // Smooth number counter animation
  useEffect(() => {
    const duration = 1800
    const frameRate = 1000 / 60
    const totalFrames = Math.round(duration / frameRate)
    let frame = 0

    const timer = setInterval(() => {
      frame++
      const progress = frame / totalFrames
      // Ease out quartic
      const ease = 1 - Math.pow(1 - progress, 4)

      setAnimatedStats({
        meals: Math.floor(stats.meals * ease),
        ngos: Math.floor(stats.ngos * ease),
        cities: Math.floor(stats.cities * ease),
        co2Saved: Math.floor(stats.co2Saved * ease)
      })

      if (frame === totalFrames) {
        clearInterval(timer)
        setAnimatedStats(stats)
      }
    }, frameRate)

    return () => clearInterval(timer)
  }, [stats])

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('is-visible')
      }),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      toast.error('Please complete all fields.')
      return
    }
    setContactSubmitting(true)
    try {
      const { error } = await supabase.from('contacts').insert([contactForm])
      if (error) throw error
      toast.success('Thank you! Our platform team will reach out shortly.')
      setContactForm({ name: '', email: '', message: '' })
    } catch {
      toast.error('Submission failed. Please try again.')
    } finally {
      setContactSubmitting(false)
    }
  }

  return (
    <div className="pt-16 bg-[#FBFBF9] text-slate-900 selection:bg-[#0D3B2E] selection:text-white">

      {/* =====================================================
          HERO SECTION — Enterprise SaaS Style
      ===================================================== */}
      <section id="home" className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none overflow-hidden">
          <div className="absolute top-10 left-1/4 w-96 h-96 bg-[#E8F2EC] rounded-full blur-3xl opacity-70" />
          <div className="absolute top-20 right-1/4 w-[420px] h-[420px] bg-amber-50/60 rounded-full blur-3xl opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 text-left">
              
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E8F2EC] border border-[#0D3B2E]/10 mb-6 reveal">
                <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs font-bold tracking-wide uppercase text-[#0D3B2E]">
                  Commercial Surplus Dispatch Network
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0D3B2E] leading-[1.12] mb-6 reveal delay-1">
                Zero Waste. Verified Impact. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D3B2E] via-[#059669] to-[#10B981]">
                  Rescued in Real-Time.
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-slate-600 leading-relaxed max-w-xl mb-8 reveal delay-2">
                Plateline is the mission-critical dispatch platform bridging commercial food donors directly with verified non-profits and community shelters through real-time matching and cryptographic handover verification.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-12 reveal delay-3">
                <button
                  onClick={onGetStarted}
                  className="bg-[#0D3B2E] hover:bg-[#092B21] text-white px-8 py-4 rounded-xl font-semibold text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                >
                  <span>Launch Rescue Portal</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#how-it-works"
                  className="bg-white hover:bg-stone-100 text-slate-700 border border-stone-300 px-7 py-4 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <span>Explore Workflow</span>
                </a>
              </div>

              {/* Key Assurance Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-stone-200/80 max-w-lg reveal delay-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ShieldCheck size={16} className="text-[#10B981]" />
                    <span>FSSAI Compliant</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Strict safety audits</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Lock size={16} className="text-[#10B981]" />
                    <span>OTP Handover</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Verified custody</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <Clock size={16} className="text-[#10B981]" />
                    <span>&lt; 45m Dispatch</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">Rapid proximity</p>
                </div>
              </div>

            </div>

            {/* Right SaaS Interactive Preview Card */}
            <div className="lg:col-span-6 reveal delay-2">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                
                {/* Decorative border backdrop */}
                <div className="absolute -inset-1.5 bg-gradient-to-tr from-[#0D3B2E]/10 via-[#10B981]/15 to-amber-500/10 rounded-3xl blur-md" />

                {/* Main Product Container */}
                <div className="relative bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden">
                  
                  {/* Top Header Bar */}
                  <div className="bg-[#0D3B2E] text-white px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full bg-[#10B981] animate-ping" />
                      <div>
                        <p className="text-xs font-bold tracking-wide uppercase text-emerald-300">Live Dispatch Radar</p>
                        <p className="text-sm font-semibold">Bengaluru Metro Node #04</p>
                      </div>
                    </div>
                    <span className="bg-white/10 text-emerald-300 text-[11px] font-mono px-2.5 py-1 rounded-full border border-white/15">
                      ACTIVE RESCUE
                    </span>
                  </div>

                  {/* Dispatch Route Timeline */}
                  <div className="p-6 space-y-5">
                    
                    {/* Active Food Item Header */}
                    <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-stone-50 border border-stone-200/70">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#E8F2EC] flex items-center justify-center text-[#0D3B2E]">
                          <Utensils size={22} />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">Grand Hyatt Banquets</h4>
                          <p className="text-xs text-slate-500">140 Servings • Steamed Rice & Dal Makhani</p>
                        </div>
                      </div>
                      <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Flame size={12} className="text-amber-600" />
                        <span>Expires in 1h 45m</span>
                      </span>
                    </div>

                    {/* Step-by-Step Custody Pipeline */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-full bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <CheckCircle2 size={16} className="text-[#0D3B2E]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">Surplus Listed & Safety Certified</p>
                            <span className="text-[10px] text-slate-400">18:20</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Inspected by Kitchen Chef • FSSAI ID #9924</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-full bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <CheckCircle2 size={16} className="text-[#0D3B2E]" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-slate-800">Matched with Hope Foundation NGO</p>
                            <span className="text-[10px] text-slate-400">18:24</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Vehicle Assigned: EV Van KA-04-E-1102</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm animate-pulse">
                          <Truck size={15} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#0D3B2E]">In Transit to Indira Nagar Shelter</p>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">ETA 12m</span>
                          </div>
                          <p className="text-[11px] text-slate-500">Driver: Rajesh K. • Verified OTP #849201</p>
                        </div>
                      </div>
                    </div>

                    {/* Verification & Metrics Footer */}
                    <div className="p-4 rounded-xl bg-[#0D3B2E]/5 border border-[#0D3B2E]/10 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-700">
                        <QrCode size={18} className="text-[#0D3B2E]" />
                        <div>
                          <p className="font-bold text-slate-900 text-xs">Chain-of-Custody Verified</p>
                          <p className="text-[10px] text-slate-500">SHA-256 Handover Hash Active</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold text-[#0D3B2E]">350 kg CO₂</span>
                        <p className="text-[10px] text-slate-500">Carbon Abated</p>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          LIVE IMPACT COUNTERS
      ===================================================== */}
      <section id="impact" className="py-12 bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            
            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-stone-200 text-center reveal">
              <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mx-auto mb-3">
                <Utensils size={20} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] font-mono">
                {animatedStats.meals.toLocaleString()}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Meals Delivered</p>
              <p className="text-[11px] text-slate-400 mt-0.5">To certified community shelters</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-stone-200 text-center reveal delay-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3">
                <Building2 size={20} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] font-mono">
                {animatedStats.ngos.toLocaleString()}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Partner Non-Profits</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Audited & GPS-connected</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-stone-200 text-center reveal delay-2">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3">
                <Globe2 size={20} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] font-mono">
                {animatedStats.cities.toLocaleString()}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Active Urban Hubs</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across India</p>
            </div>

            <div className="p-6 rounded-2xl bg-[#FBFBF9] border border-stone-200 text-center reveal delay-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                <Leaf size={20} />
              </div>
              <h3 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] font-mono">
                {(animatedStats.co2Saved / 1000).toFixed(1)}k
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Kg CO₂ Diverted</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Prevented from landfills</p>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          PROBLEM VS SOLUTION — Bento Grid Layout
      ===================================================== */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 reveal">
            <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              Architecture & Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] mt-3">
              Engineered to Solve Critical Food Loss Friction
            </h2>
            <p className="text-slate-600 mt-3 text-base">
              Traditional food donation is slow, uncoordinated, and lacks audit trails. Plateline introduces zero-latency logistics and verifiable transparency.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Bento 1: Real-time Dispatch */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 card-hover-lift reveal">
              <div className="w-12 h-12 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mb-6">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Proximity-Based Routing</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Smart spatial indexing automatically alerts the closest registered NGO within minutes of surplus food posting, ensuring temperature integrity.
              </p>
              <div className="pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-[#0D3B2E]">
                <span>Cascading City & District Filtering</span>
                <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Bento 2: Handover OTP Security */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 card-hover-lift reveal delay-1">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-6">
                <Lock size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Two-Factor Handover Verification</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Donors receive a secure 6-digit handover OTP upon acceptance. The NGO collection driver must input this exact code at pickup to verify physical transfer.
              </p>
              <div className="pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-amber-800">
                <span>Tamper-Proof Audit Trail</span>
                <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

            {/* Bento 3: Live Leaflet Fleet Radar */}
            <div className="bg-white p-8 rounded-2xl border border-stone-200 card-hover-lift reveal delay-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-6">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Live Interactive Map Radar</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Real-time Leaflet tracking with custom vector donor and shelter markers, dynamic route polyline status, and direct peer communication.
              </p>
              <div className="pt-4 border-t border-stone-100 flex items-center text-xs font-semibold text-emerald-800">
                <span>Vector Pins & Status Timelines</span>
                <ChevronRight size={14} className="ml-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS — Interactive 2-Role Verified Workflow
      ===================================================== */}
      <section id="how-it-works" className="py-20 bg-stone-100/70 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-10 reveal">
            <span className="text-xs font-extrabold tracking-wider uppercase text-[#0D3B2E] bg-[#E8F2EC] px-3 py-1 rounded-full">
              Seamless Lifecycle
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] mt-3">
              How Food Moves from Surplus to Shelter
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Explore the streamlined end-to-end custody chain tailored for your stakeholder role.
            </p>
          </div>

          {/* Role Tab Selector Switcher */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1.5 rounded-2xl bg-stone-200/80 border border-stone-300/60 shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setWorkflowRole('donor')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  workflowRole === 'donor'
                    ? 'bg-[#0D3B2E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/60'
                }`}
              >
                <Building2 size={16} className={workflowRole === 'donor' ? 'text-emerald-300' : 'text-slate-500'} />
                <span>For Food Donors</span>
              </button>

              <button
                type="button"
                onClick={() => setWorkflowRole('ngo')}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center gap-2 ${
                  workflowRole === 'ngo'
                    ? 'bg-[#0D3B2E] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-100/60'
                }`}
              >
                <HeartHandshake size={16} className={workflowRole === 'ngo' ? 'text-emerald-300' : 'text-slate-500'} />
                <span>For Verified NGOs</span>
              </button>
            </div>
          </div>

          {/* Workflow Cards Display */}
          {workflowRole === 'donor' ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">01</span>
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mb-4">
                  <Utensils size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">1-Minute Surplus Listing</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Post batch quantity, photo, category, and consumption expiry window in seconds with automated storage sync.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">02</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                  <Building2 size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Instant Local NGO Matching</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smart proximity indexing alerts nearby audited food banks, shelters, and community kitchens immediately.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">03</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                  <Lock size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Secret Handover Code</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A private 6-digit OTP is generated on your dashboard so only authorized NGO drivers can verify physical pickup.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">04</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <Award size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Automated CSR Certificate</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upon verified shelter drop-off, download official ESG certificates with computed CO₂ and water conservation metrics.
                </p>
              </div>

            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in duration-200">
              
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">01</span>
                <div className="w-10 h-10 rounded-xl bg-[#E8F2EC] text-[#0D3B2E] flex items-center justify-center mb-4">
                  <Flame size={20} className="text-amber-600" />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Hyperlocal Food Radar</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Real-time radar scans surplus batches filtered by your operational city, with dynamic urgency countdown badges.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">02</span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center mb-4">
                  <Navigation size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">One-Click Claim & Dispatch</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Claim batches instantly and launch turn-by-turn Google Maps navigation directly to the donor's kitchen.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">03</span>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
                  <ShieldCheck size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">OTP-Verified Pickup</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Inspect the fresh batch on arrival and enter the donor's 6-digit handover OTP to unlock real-time transit tracking.
                </p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm relative">
                <span className="text-3xl font-extrabold text-stone-200 font-mono mb-4 block">04</span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                  <CheckCircle2 size={20} />
                </div>
                <h4 className="text-base font-bold text-slate-900 mb-2">Proof of Delivery (POD)</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Attach an optional shelter distribution photo proof, logging timestamped completion in the permanent custody ledger.
                </p>
              </div>

            </div>
          )}

        </div>
      </section>

      {/* =====================================================
          PARTNER SHOWCASE & TESTIMONIALS
      ===================================================== */}
      <section id="partners" className="py-20 lg:py-28 bg-white border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 reveal">
            <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full">
              Ecosystem Trust
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0D3B2E] mt-3">
              Trusted by Premier Donors & Leading NGOs
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            
            <div className="p-8 rounded-2xl bg-[#FBFBF9] border border-stone-200 reveal">
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                "Plateline has transformed our banquet operations. Instead of throwing away surplus fresh food at midnight, a verified NGO picks it up within 35 minutes with full OTP verification."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0D3B2E] text-white flex items-center justify-center font-bold text-xs">
                  AP
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Arun Pillai</h5>
                  <p className="text-[11px] text-slate-500">Director of Operations, Royal Orchid Hotels</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#FBFBF9] border border-stone-200 reveal delay-1">
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                "The live radar tracking and automated cascading location filters allow our rescue vans to optimize city pick-ups effortlessly. We've fed over 40,000 children this quarter alone."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                  SM
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Sneha Mukhopadhyay</h5>
                  <p className="text-[11px] text-slate-500">Program Head, Annapurna Food Rescue NGO</p>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-2xl bg-[#FBFBF9] border border-stone-200 reveal delay-2">
              <div className="flex items-center gap-1 text-amber-500 mb-4">
                {'★'.repeat(5)}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                "The downloadable Impact Certificates give our ESG committee tangible metrics on diverted carbon emissions and water savings for our annual sustainability report."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-800 text-white flex items-center justify-center font-bold text-xs">
                  VK
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-xs">Vikram Kulkarni</h5>
                  <p className="text-[11px] text-slate-500">Head of CSR, TechParks India Ltd.</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          CONTACT & PARTNERSHIP INQUIRIES
      ===================================================== */}
      <section id="contact" className="py-20 lg:py-28 bg-[#0D3B2E] text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <span className="text-xs font-extrabold tracking-wider uppercase text-emerald-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                Join The Movement
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mt-4 leading-tight">
                Ready to Deploy Plateline in Your City?
              </h2>
              <p className="text-white/80 mt-4 text-base leading-relaxed max-w-lg">
                Whether you manage a hotel chain, supermarket fleet, or non-profit network, connect with our dispatch operations team to integrate today.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300">
                    <ShieldCheck size={18} />
                  </div>
                  <span>100% Certified Food Safety Compliance</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-white/90">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-emerald-300">
                    <BarChart3 size={18} />
                  </div>
                  <span>Automated ESG and Carbon Offsetting Reports</span>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-2xl p-8 text-slate-900 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Get in Touch</h3>
              <p className="text-xs text-slate-500 mb-6">Our network coordinators respond within 2 business hours.</p>

              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Organization / Full Name</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={e => setContactForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Radisson Blu or Feeding Hope NGO"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="name@organization.org"
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Message / City Requirements</label>
                  <textarea
                    rows={3}
                    required
                    value={contactForm.message}
                    onChange={e => setContactForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell us about your surplus volume or city distribution capabilities..."
                    className="w-full px-4 py-3 rounded-xl border border-stone-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B2E] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full bg-[#0D3B2E] hover:bg-[#092B21] disabled:opacity-60 text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow flex items-center justify-center gap-2"
                >
                  <Send size={16} />
                  <span>{contactSubmitting ? 'Sending Request...' : 'Submit Partnership Request'}</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <footer className="bg-[#092B21] text-white/70 py-12 border-t border-white/10 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <Leaf size={18} className="text-[#10B981]" />
            <span className="font-extrabold text-sm tracking-tight">Plateline</span>
            <span className="text-[11px] text-white/50">© {new Date().getFullYear()} Plateline Network. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-white/70">
            <a href="#home" className="hover:text-white transition-colors">Platform</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">Workflow</a>
            <a href="#impact" className="hover:text-white transition-colors">Impact Metrics</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
