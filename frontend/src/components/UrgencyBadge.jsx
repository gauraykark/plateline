import { useState, useEffect } from 'react'
import { Flame, AlertTriangle, Clock } from 'lucide-react'

export default function UrgencyBadge({ expiryAt, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiryAt))

  function calculateTimeLeft(expiry) {
    if (!expiry) return null
    const diffMs = new Date(expiry).getTime() - Date.now()
    return diffMs
  }

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(expiryAt))

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(expiryAt))
    }, 30000) // Recalculate every 30 seconds

    return () => clearInterval(interval)
  }, [expiryAt])

  if (timeLeft === null) return null

  if (timeLeft <= 0) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-slate-500 border border-stone-200 ${className}`}>
        <Clock size={13} className="text-slate-400" />
        <span>Expired</span>
      </span>
    )
  }

  const hours = Math.floor(timeLeft / (1000 * 60 * 60))
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60))

  // Critical: < 1 hour
  if (hours < 1) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 animate-pulse ${className}`}>
        <Flame size={13} className="text-red-600 flex-shrink-0" />
        <span>Expires in {minutes}m</span>
      </span>
    )
  }

  // Urgent: 1–3 hours
  if (hours < 3) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 ${className}`}>
        <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
        <span>Expires in {hours}h {minutes}m</span>
      </span>
    )
  }

  // Fresh: > 3 hours
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ${className}`}>
      <Clock size={13} className="text-emerald-600 flex-shrink-0" />
      <span>Expires in {hours}h {minutes}m</span>
    </span>
  )
}
