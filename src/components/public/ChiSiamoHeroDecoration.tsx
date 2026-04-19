export default function ChiSiamoHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[430px] overflow-hidden xl:block">
      <div
        className="absolute right-[-120px] top-0 h-[430px] w-[980px] opacity-[0.16]"
        style={{
          maskImage:
            'radial-gradient(circle at 84% 24%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.8) 46%, rgba(0,0,0,0.34) 68%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at 84% 24%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.8) 46%, rgba(0,0,0,0.34) 68%, transparent 88%)',
        }}
      >
        <svg
          viewBox="0 0 980 430"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="docStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#666666" stopOpacity="0.34" />
            </linearGradient>

            <linearGradient id="docFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8b54a" stopOpacity="0.16" />
              <stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.06" />
            </linearGradient>

            <radialGradient id="docGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.14" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="760" cy="160" r="142" fill="url(#docGlow)" />
          <circle cx="684" cy="228" r="108" fill="url(#docGlow)" />

          {/* documento dietro */}
          <g transform="translate(650 74) rotate(-4 130 132)">
            <rect
              x="0"
              y="0"
              width="248"
              height="292"
              rx="18"
              fill="url(#docFill)"
              stroke="url(#docStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.42"
            />

            <path
              d="M188 0H248V60"
              stroke="url(#docStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.34"
            />
            <path
              d="M188 0V42C188 52 196 60 206 60H248"
              stroke="url(#docStroke)"
              strokeWidth="1.2"
              strokeOpacity="0.34"
            />

            <rect x="28" y="34" width="118" height="14" rx="7" fill="#e6c867" fillOpacity="0.42" />
            <rect x="28" y="62" width="164" height="4" rx="2" fill="#e6c867" fillOpacity="0.34" />

            <rect x="28" y="96" width="188" height="4" rx="2" fill="#e6c867" fillOpacity="0.26" />
            <rect x="28" y="112" width="188" height="4" rx="2" fill="#e6c867" fillOpacity="0.24" />
            <rect x="28" y="128" width="188" height="4" rx="2" fill="#e6c867" fillOpacity="0.2" />
            <rect x="28" y="144" width="170" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />

            <rect x="28" y="182" width="188" height="4" rx="2" fill="#e6c867" fillOpacity="0.22" />
            <rect x="28" y="198" width="188" height="4" rx="2" fill="#e6c867" fillOpacity="0.19" />
            <rect x="28" y="214" width="168" height="4" rx="2" fill="#e6c867" fillOpacity="0.16" />

            <rect x="28" y="252" width="132" height="4" rx="2" fill="#e6c867" fillOpacity="0.14" />
          </g>

          {/* lente */}
          <g transform="translate(566 118)">
            <circle
              cx="108"
              cy="108"
              r="78"
              stroke="url(#docStroke)"
              strokeWidth="6"
              strokeOpacity="0.56"
            />
            <circle
              cx="108"
              cy="108"
              r="56"
              stroke="url(#docStroke)"
              strokeWidth="1.8"
              strokeOpacity="0.24"
            />

            <path
              d="M162 162L232 232"
              stroke="url(#docStroke)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeOpacity="0.5"
            />
            <path
              d="M226 226L256 256"
              stroke="url(#docStroke)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeOpacity="0.42"
            />

            {/* linee documento viste nella lente */}
            <rect x="74" y="82" width="66" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.34" />
            <rect x="66" y="98" width="84" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.32" />
            <rect x="70" y="114" width="76" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.26" />
            <rect x="78" y="130" width="58" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.2" />
          </g>

          {/* linea bassa molto leggera */}
          <path
            d="M566 386
               C626 377 683 378 734 386
               C787 394 841 395 892 389"
            stroke="url(#docStroke)"
            strokeWidth="1.1"
            strokeOpacity="0.16"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}