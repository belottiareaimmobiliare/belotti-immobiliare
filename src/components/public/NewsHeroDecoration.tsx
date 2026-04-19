export default function NewsHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[470px] overflow-hidden xl:block">
      <div
        className="absolute right-[120px] top-0 h-[470px] w-[1380px] opacity-[0.17]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.97) 22%, rgba(0,0,0,0.82) 44%, rgba(0,0,0,0.4) 66%, transparent 87%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.97) 22%, rgba(0,0,0,0.82) 44%, rgba(0,0,0,0.4) 66%, transparent 87%)',
        }}
      >
        <svg
          viewBox="0 0 1380 470"
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

          <circle cx="1030" cy="120" r="180" fill="url(#paperGlow)" />
          <circle cx="900" cy="216" r="138" fill="url(#paperGlow)" />
          <circle cx="742" cy="198" r="108" fill="url(#paperGlow)" />

          {/* giornale 1 - molto a sinistra */}
          <g transform="translate(500 118) rotate(-12 190 126)">
            <rect
              x="0"
              y="0"
              width="380"
              height="252"
              rx="18"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.1"
              strokeOpacity="0.24"
            />

            <rect x="32" y="26" width="216" height="18" rx="9" fill="#e6c867" fillOpacity="0.42" />
            <rect x="32" y="56" width="300" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.44" />

            <rect x="32" y="84" width="92" height="12" rx="6" fill="#e6c867" fillOpacity="0.32" />
            <rect x="136" y="84" width="74" height="12" rx="6" fill="#e6c867" fillOpacity="0.2" />

            <rect x="32" y="114" width="92" height="82" rx="8" fill="#e6c867" fillOpacity="0.14" />

            <rect x="140" y="114" width="190" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.28" />
            <rect x="140" y="128" width="190" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.24" />
            <rect x="140" y="142" width="190" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.21" />
            <rect x="140" y="156" width="174" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.18" />
            <rect x="140" y="170" width="164" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.15" />

            <rect x="32" y="214" width="286" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.18" />
          </g>

          {/* giornale 2 */}
          <g transform="translate(670 42) rotate(-4 210 142)">
            <rect
              x="24"
              y="28"
              width="388"
              height="260"
              rx="18"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeOpacity="0.22"
            />

            <rect
              x="0"
              y="0"
              width="436"
              height="308"
              rx="20"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.52"
            />

            <rect x="34" y="28" width="238" height="20" rx="10" fill="#e6c867" fillOpacity="0.58" />
            <rect x="34" y="60" width="336" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.62" />

            <rect x="34" y="88" width="100" height="12" rx="6" fill="#e6c867" fillOpacity="0.42" />
            <rect x="146" y="88" width="80" height="12" rx="6" fill="#e6c867" fillOpacity="0.25" />
            <rect x="236" y="88" width="62" height="12" rx="6" fill="#e6c867" fillOpacity="0.18" />

            <rect x="34" y="120" width="98" height="96" rx="8" fill="#e6c867" fillOpacity="0.18" />

            <rect x="148" y="120" width="220" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.42" />
            <rect x="148" y="134" width="220" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.36" />
            <rect x="148" y="148" width="220" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.3" />
            <rect x="148" y="162" width="204" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.24" />
            <rect x="148" y="176" width="196" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.2" />
            <rect x="148" y="190" width="184" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.16" />

            <rect x="34" y="238" width="334" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.3" />
            <rect x="34" y="252" width="296" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.24" />
          </g>

          {/* giornale 3 */}
          <g transform="translate(900 72) rotate(4 188 132)">
            <rect
              x="0"
              y="0"
              width="376"
              height="264"
              rx="18"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1.1"
              strokeOpacity="0.3"
            />

            <rect x="32" y="28" width="208" height="18" rx="9" fill="#e6c867" fillOpacity="0.44" />
            <rect x="32" y="58" width="296" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.44" />

            <rect x="32" y="88" width="108" height="12" rx="6" fill="#e6c867" fillOpacity="0.28" />
            <rect x="152" y="88" width="82" height="12" rx="6" fill="#e6c867" fillOpacity="0.18" />

            <rect x="32" y="122" width="88" height="84" rx="8" fill="#e6c867" fillOpacity="0.14" />

            <rect x="136" y="122" width="198" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.28" />
            <rect x="136" y="136" width="198" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.24" />
            <rect x="136" y="150" width="198" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.2" />
            <rect x="136" y="164" width="176" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.16" />
            <rect x="136" y="178" width="168" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.14" />

            <rect x="32" y="228" width="300" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.2" />
            <rect x="32" y="242" width="252" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.16" />
          </g>

          {/* giornale 4 - molto largo, arriva al centro */}
          <g transform="translate(1060 134) rotate(10 178 128)">
            <rect
              x="0"
              y="0"
              width="356"
              height="256"
              rx="18"
              fill="url(#paperFill)"
              stroke="url(#paperStroke)"
              strokeWidth="1"
              strokeOpacity="0.24"
            />

            <rect x="28" y="24" width="162" height="18" rx="9" fill="#e6c867" fillOpacity="0.34" />
            <rect x="28" y="56" width="266" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.28" />
            <rect x="28" y="70" width="266" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.23" />
            <rect x="28" y="84" width="266" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.19" />

            <rect x="28" y="110" width="212" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.17" />
            <rect x="28" y="124" width="212" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.15" />
            <rect x="28" y="138" width="194" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.13" />
            <rect x="28" y="152" width="176" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.11" />

            <rect x="28" y="184" width="236" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.12" />
            <rect x="28" y="198" width="220" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.1" />
          </g>
        </svg>
      </div>
    </div>
  )
}