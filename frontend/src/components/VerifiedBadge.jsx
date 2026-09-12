import { ShieldCheck } from 'lucide-react'

export default function VerifiedBadge({ role = 'donor', isVerified = true, registrationNumber = '', className = '' }) {
  if (!isVerified) return null

  const isNgo = role === 'ngo'
  const title = isNgo 
    ? (registrationNumber ? `NGO Darpan ID: ${registrationNumber}` : 'Verified NGO Partner')
    : (registrationNumber ? `FSSAI: ${registrationNumber}` : 'FSSAI Certified Donor')

  return (
    <span 
      title={title}
      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all ${
        isNgo
          ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100/70'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100/70'
      } ${className}`}
    >
      <ShieldCheck size={12} className={isNgo ? 'text-blue-600' : 'text-emerald-600'} />
      <span>{isNgo ? 'Verified NGO' : 'FSSAI Certified'}</span>
      {registrationNumber && (
        <span className="text-[10px] opacity-75 font-mono ml-0.5 max-w-[100px] truncate">
          #{registrationNumber}
        </span>
      )}
    </span>
  )
}
