export default function NewsHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[430px] overflow-hidden xl:block">
      <div
        className="absolute right-[-20px] top-0 h-[430px] w-[1040px] opacity-[0.17]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.78) 44%, rgba(0,0,0,0.34) 66%, transparent 86%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.78) 44%, rgba(0,0,0,0.34) 66%, transparent 86%)',
        }}
      >
        <svg
          viewBox="0 0 1040 430"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="paperStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6f6f6f" stopOpacity="0.36" />
            </linearGradient>

            <linearGradient id="paperFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8b54a" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.08" />
            </linearGradient>

            <radialGradient id="paperGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="830" cy="118" r="160" fill="url(#paperGlow)" />
          <circle cx="730" cy="210" r="120" fill="url(#paperGlow)" />
          <circle cx="620" cy="180" r="90" fill="url(#paperGlow)" />

          <g transform="translate(560 30) rotate(5 155 120)">
            <rect
              x="24"
              y="28"
              width="286"
              height="188"
              rx="12"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.22"
            />

            <rect
              x="0"
              y="0"
              width="324"
              height="226"
              rx="16"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.52"
            />

            <rect x="28" y="24" width="194" height="16" rx="8" fill="#e6c867" fillOpacity="0.56" />
            <rect x="28" y="50" width="258" height="4" rx="2" fill="#e6c867" fillOpacity="0.64" />

            <rect x="28" y="70" width="84" height="10" rx="5" fill="#e6c867" fillOpacity="0.42" />
            <rect x="122" y="70" width="68" height="10" rx="5" fill="#e6c867" fillOpacity="0.25" />
            <rect x="198" y="70" width="52" height="10" rx="5" fill="#e6c867" fillOpacity="0.18" />

            <rect x="28" y="94" width="82" height="70" rx="8" fill="#e6c867" fillOpacity="0.18" />

            <rect x="124" y="96" width="164" height="4" rx="2" fill="#e6c867" fillOpacity="0.42" />
            <rect x="124" y="108" width="164" height="4" rx="2" fill="#e6c867" fillOpacity="0.36" />
            <rect x="124" y="120" width="164" height="4" rx="2" fill="#e6c867" fillOpacity="0.3" />
            <rect x="124" y="132" width="150" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
            <rect x="124" y="144" width="144" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="124" y="156" width="134" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />

            <rect x="28" y="182" width="260" height="4" rx="2" fill="#e6c867" fillOpacity="0.3" />
            <rect x="28" y="194" width="232" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
          </g>

          <g transform="translate(760 120) rotate(9 96 82)">
            <rect
              x="0"
              y="0"
              width="192"
              height="164"
              rx="14"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.24"
            />

            <rect x="20" y="20" width="96" height="12" rx="6" fill="#e6c867" fillOpacity="0.34" />
            <rect x="20" y="46" width="146" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="20" y="58" width="146" height="4" rx="2" fill="#e6c867" fillOpacity="0.23" />
            <rect x="20" y="70" width="146" height="4" rx="2" fill="#e6c867" fillOpacity="0.19" />
            <rect x="20" y="90" width="120" height="4" rx="2" fill="#e6c867" fillOpacity="0.17" />
            <rect x="20" y="102" width="120" height="4" rx="2" fill="#e6c867" fillOpacity="0.15" />
            <rect x="20" y="114" width="108" height="4" rx="2" fill="#e6c867" fillOpacity="0.13" />
          </g>
        </svg>
      </div>
    </div>
  )
}