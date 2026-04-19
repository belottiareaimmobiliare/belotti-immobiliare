export default function NewsHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[440px] overflow-hidden xl:block">
      <div
        className="absolute right-[-40px] top-0 h-[440px] w-[1120px] opacity-[0.17]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.8) 44%, rgba(0,0,0,0.36) 66%, transparent 86%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.8) 44%, rgba(0,0,0,0.36) 66%, transparent 86%)',
        }}
      >
        <svg
          viewBox="0 0 1120 440"
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

          <circle cx="865" cy="116" r="165" fill="url(#paperGlow)" />
          <circle cx="756" cy="210" r="128" fill="url(#paperGlow)" />
          <circle cx="642" cy="186" r="92" fill="url(#paperGlow)" />

          {/* giornale 1 - più a sinistra */}
          <g transform="translate(500 88) rotate(-9 150 102)">
            <rect
              x="0"
              y="0"
              width="300"
              height="204"
              rx="16"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.1"
              strokeOpacity="0.26"
            />

            <rect x="26" y="24" width="170" height="14" rx="7" fill="#e6c867" fillOpacity="0.42" />
            <rect x="26" y="48" width="236" height="4" rx="2" fill="#e6c867" fillOpacity="0.44" />

            <rect x="26" y="72" width="74" height="10" rx="5" fill="#e6c867" fillOpacity="0.3" />
            <rect x="110" y="72" width="62" height="10" rx="5" fill="#e6c867" fillOpacity="0.2" />

            <rect x="26" y="98" width="78" height="60" rx="8" fill="#e6c867" fillOpacity="0.14" />

            <rect x="116" y="98" width="150" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="116" y="110" width="150" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
            <rect x="116" y="122" width="150" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="116" y="134" width="134" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />

            <rect x="26" y="172" width="232" height="4" rx="2" fill="#e6c867" fillOpacity="0.18" />
          </g>

          {/* giornale 2 */}
          <g transform="translate(600 42) rotate(-3 170 116)">
            <rect
              x="18"
              y="24"
              width="312"
              height="210"
              rx="14"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.2"
            />

            <rect
              x="0"
              y="0"
              width="344"
              height="238"
              rx="18"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.5"
            />

            <rect x="28" y="24" width="194" height="16" rx="8" fill="#e6c867" fillOpacity="0.58" />
            <rect x="28" y="50" width="270" height="4" rx="2" fill="#e6c867" fillOpacity="0.62" />

            <rect x="28" y="72" width="84" height="10" rx="5" fill="#e6c867" fillOpacity="0.42" />
            <rect x="122" y="72" width="68" height="10" rx="5" fill="#e6c867" fillOpacity="0.25" />
            <rect x="198" y="72" width="52" height="10" rx="5" fill="#e6c867" fillOpacity="0.18" />

            <rect x="28" y="98" width="84" height="74" rx="8" fill="#e6c867" fillOpacity="0.18" />

            <rect x="124" y="98" width="174" height="4" rx="2" fill="#e6c867" fillOpacity="0.42" />
            <rect x="124" y="110" width="174" height="4" rx="2" fill="#e6c867" fillOpacity="0.36" />
            <rect x="124" y="122" width="174" height="4" rx="2" fill="#e6c867" fillOpacity="0.3" />
            <rect x="124" y="134" width="160" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
            <rect x="124" y="146" width="154" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="124" y="158" width="144" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />

            <rect x="28" y="188" width="270" height="4" rx="2" fill="#e6c867" fillOpacity="0.3" />
            <rect x="28" y="200" width="236" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
          </g>

          {/* giornale 3 */}
          <g transform="translate(760 74) rotate(5 156 108)">
            <rect
              x="0"
              y="0"
              width="312"
              height="216"
              rx="16"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.1"
              strokeOpacity="0.3"
            />

            <rect x="26" y="24" width="168" height="14" rx="7" fill="#e6c867" fillOpacity="0.44" />
            <rect x="26" y="48" width="244" height="4" rx="2" fill="#e6c867" fillOpacity="0.44" />

            <rect x="26" y="72" width="90" height="10" rx="5" fill="#e6c867" fillOpacity="0.28" />
            <rect x="126" y="72" width="74" height="10" rx="5" fill="#e6c867" fillOpacity="0.18" />

            <rect x="26" y="100" width="72" height="68" rx="8" fill="#e6c867" fillOpacity="0.14" />

            <rect x="112" y="100" width="166" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="112" y="112" width="166" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
            <rect x="112" y="124" width="166" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="112" y="136" width="146" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />
            <rect x="112" y="148" width="138" height="4" rx="2" fill="#e6c867" fillOpacity="0.14" />

            <rect x="26" y="184" width="252" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="26" y="196" width="212" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />
          </g>

          {/* giornale 4 - più a destra */}
          <g transform="translate(902 126) rotate(10 108 82)">
            <rect
              x="0"
              y="0"
              width="216"
              height="166"
              rx="14"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1"
              strokeOpacity="0.24"
            />

            <rect x="22" y="20" width="106" height="12" rx="6" fill="#e6c867" fillOpacity="0.34" />
            <rect x="22" y="46" width="160" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />
            <rect x="22" y="58" width="160" height="4" rx="2" fill="#e6c867" fillOpacity="0.23" />
            <rect x="22" y="70" width="160" height="4" rx="2" fill="#e6c867" fillOpacity="0.19" />
            <rect x="22" y="92" width="130" height="4" rx="2" fill="#e6c867" fillOpacity="0.17" />
            <rect x="22" y="104" width="130" height="4" rx="2" fill="#e6c867" fillOpacity="0.15" />
            <rect x="22" y="116" width="118" height="4" rx="2" fill="#e6c867" fillOpacity="0.13" />
          </g>
        </svg>
      </div>
    </div>
  )
}