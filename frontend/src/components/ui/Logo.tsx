export function Logo({ size = 32, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={glow ? 'drop-shadow-[0_0_6px_rgba(0,212,255,0.65)]' : ''}
    >
      <defs>
        <linearGradient id="crimegpt-logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#1a6cf6" />
        </linearGradient>
      </defs>

      {/* Outer hex shield */}
      <path
        d="M32 3 L57 17.5 V46.5 L32 61 L7 46.5 V17.5 Z"
        stroke="url(#crimegpt-logo-grad)"
        strokeWidth="2.5"
        fill="rgba(0,212,255,0.06)"
      />

      {/* Circuit nodes */}
      <path d="M20 24 H28 M36 24 H44" stroke="url(#crimegpt-logo-grad)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="20" cy="24" r="2" fill="#00d4ff" />
      <circle cx="44" cy="24" r="2" fill="#00d4ff" />

      {/* Central scan-eye */}
      <path
        d="M18 34c4-6 10-9 14-9s10 3 14 9c-4 6-10 9-14 9s-10-3-14-9Z"
        stroke="url(#crimegpt-logo-grad)"
        strokeWidth="2"
      />
      <circle cx="32" cy="34" r="4.5" fill="url(#crimegpt-logo-grad)" />
      <circle cx="32" cy="34" r="1.6" fill="#031018" />

      {/* Base circuit line */}
      <path d="M24 47 H40" stroke="url(#crimegpt-logo-grad)" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    </svg>
  )
}
