import React from 'react'

export function PlatelineLogo({ size = 22, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer subtle concentric dish rim */}
      <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.3" />
      {/* Inner plate track */}
      <circle cx="16" cy="16" r="8.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="30 14" strokeLinecap="round" />
      {/* Dynamic diagonal dispatch / transit vector */}
      <path
        d="M8 24L24 8M24 8H15.5M24 8V16.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center logistics waypoint dot */}
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />
    </svg>
  )
}
