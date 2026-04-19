export default function ContattiHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[430px] overflow-hidden xl:block">
      <div
        className="absolute right-[180px] top-0 h-[430px] w-[980px] opacity-[0.16]"
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
            <linearGradient id="bookStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#666666" stopOpacity="0.34" />
            </linearGradient>

            <linearGradient id="bookFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d8b54a" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.06" />
            </linearGradient>

            <radialGradient id="bookGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.14" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="756" cy="158" r="148" fill="url(#bookGlow)" />
          <circle cx="682" cy="234" r="110" fill="url(#bookGlow)" />

          {/* rubrica */}
          <g transform="translate(622 54)">
            <rect
              x="0"
              y="0"
              width="234"
              height="304"
              rx="22"
              fill="url(#bookFill)"
              stroke="url(#bookStroke)"
              strokeWidth="1.3"
              strokeOpacity="0.46"
            />

            {/* spirale/lato */}
            <path
              d="M34 0V304"
              stroke="url(#bookStroke)"
              strokeWidth="1.4"
              strokeOpacity="0.34"
            />

            {Array.from({ length: 8 }).map((_, i) => {
              const y = 34 + i * 32
              return (
                <circle
                  key={i}
                  cx="34"
                  cy={y}
                  r="6"
                  stroke="url(#bookStroke)"
                  strokeWidth="1.2"
                  opacity="0.35"
                />
              )
            })}

            {/* tabs alfabetiche */}
            <rect x="210" y="30" width="24" height="26" rx="8" fill="#e6c867" fillOpacity="0.26" />
            <rect x="210" y="68" width="24" height="26" rx="8" fill="#e6c867" fillOpacity="0.2" />
            <rect x="210" y="106" width="24" height="26" rx="8" fill="#e6c867" fillOpacity="0.17" />
            <rect x="210" y="144" width="24" height="26" rx="8" fill="#e6c867" fillOpacity="0.14" />
            <rect x="210" y="182" width="24" height="26" rx="8" fill="#e6c867" fillOpacity="0.11" />

            {/* titolo */}
            <rect x="58" y="28" width="88" height="14" rx="7" fill="#e6c867" fillOpacity="0.4" />
            <rect x="58" y="54" width="126" height="4" rx="2" fill="#e6c867" fillOpacity="0.28" />

            {/* contatti */}
            <circle cx="74" cy="100" r="14" stroke="url(#bookStroke)" strokeWidth="1.4" strokeOpacity="0.42" />
            <rect x="98" y="92" width="72" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.28" />
            <rect x="98" y="106" width="90" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.22" />

            <circle cx="74" cy="148" r="14" stroke="url(#bookStroke)" strokeWidth="1.4" strokeOpacity="0.36" />
            <rect x="98" y="140" width="78" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.24" />
            <rect x="98" y="154" width="96" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.18" />

            <circle cx="74" cy="196" r="14" stroke="url(#bookStroke)" strokeWidth="1.4" strokeOpacity="0.3" />
            <rect x="98" y="188" width="68" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.2" />
            <rect x="98" y="202" width="86" height="5" rx="2.5" fill="#e6c867" fillOpacity="0.15" />

            {/* linea bassa */}
            <rect x="58" y="246" width="138" height="4" rx="2" fill="#e6c867" fillOpacity="0.14" />
            <rect x="58" y="260" width="112" height="4" rx="2" fill="#e6c867" fillOpacity="0.11" />
          </g>

          <path
            d="M560 390
               C622 381 681 381 735 389
               C790 396 844 396 896 390"
            stroke="url(#bookStroke)"
            strokeWidth="1.1"
            strokeOpacity="0.16"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}