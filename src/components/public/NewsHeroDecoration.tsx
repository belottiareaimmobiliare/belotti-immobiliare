export default function NewsHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[420px] overflow-hidden xl:block">
      <div
        className="absolute right-0 top-0 h-[420px] w-[900px] opacity-[0.16]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 24%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.28) 68%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.95) 24%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.28) 68%, transparent 88%)',
        }}
      >
        <svg
          viewBox="0 0 900 420"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="paperStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6f6f6f" stopOpacity="0.34" />
            </linearGradient>

            <linearGradient id="paperFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8b54a" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.08" />
            </linearGradient>

            <radialGradient id="paperGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="760" cy="120" r="150" fill="url(#paperGlow)" />
          <circle cx="690" cy="205" r="110" fill="url(#paperGlow)" />

          <g transform="translate(600 44) rotate(6 120 110)">
            <rect
              x="18"
              y="26"
              width="222"
              height="156"
              rx="12"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.22"
            />

            <rect
              x="0"
              y="0"
              width="246"
              height="176"
              rx="14"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />

            <rect x="24" y="22" width="152" height="14" rx="7" fill="#e6c867" fillOpacity="0.52" />
            <rect x="24" y="44" width="198" height="4" rx="2" fill="#e6c867" fillOpacity="0.62" />

            <rect x="24" y="64" width="64" height="10" rx="5" fill="#e6c867" fillOpacity="0.48" />
            <rect x="98" y="64" width="58" height="10" rx="5" fill="#e6c867" fillOpacity="0.24" />

            <rect x="24" y="88" width="56" height="52" rx="8" fill="#e6c867" fillOpacity="0.2" />

            <rect x="92" y="88" width="130" height="4" rx="2" fill="#e6c867" fillOpacity="0.42" />
            <rect x="92" y="100" width="130" height="4" rx="2" fill="#e6c867" fillOpacity="0.35" />
            <rect x="92" y="112" width="130" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="92" y="124" width="112" height="4" rx="2" fill="#e6c867" fillOpacity="0.22" />

            <rect x="24" y="152" width="198" height="4" rx="2" fill="#e6c867" fillOpacity="0.3" />
          </g>

          <g transform="translate(718 120) rotate(10 78 68)">
            <rect
              x="0"
              y="0"
              width="156"
              height="136"
              rx="12"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.22"
            />

            <rect x="18" y="18" width="84" height="10" rx="5" fill="#e6c867" fillOpacity="0.34" />
            <rect x="18" y="40" width="120" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="18" y="52" width="120" height="4" rx="2" fill="#e6c867" fillOpacity="0.23" />
            <rect x="18" y="64" width="120" height="4" rx="2" fill="#e6c867" fillOpacity="0.19" />
            <rect x="18" y="88" width="96" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />
          </g>
        </svg>
      </div>
    </div>
  )
}