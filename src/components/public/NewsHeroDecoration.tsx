export default function NewsHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[420px] overflow-hidden xl:block">
      <div
        className="absolute right-0 top-0 h-[420px] w-[900px] opacity-[0.17]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 24%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.28) 68%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 24%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.28) 68%, transparent 88%)',
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
            <linearGradient id="newsLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#545454" stopOpacity="0.34" />
            </linearGradient>

            <radialGradient id="newsGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.2" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="paperFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e0c76c" stopOpacity="0.88" />
              <stop offset="100%" stopColor="#7a7a7a" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          <circle cx="760" cy="126" r="155" fill="url(#newsGlow)" />
          <circle cx="660" cy="214" r="120" fill="url(#newsGlow)" />

          <path
            d="M392 394C463 333 520 286 573 240C628 193 684 141 758 90C808 56 850 34 898 18"
            stroke="url(#newsLine)"
            strokeWidth="1.4"
            strokeOpacity="0.8"
          />
          <path
            d="M446 420C518 356 574 307 629 262C690 213 753 176 900 136"
            stroke="url(#newsLine)"
            strokeWidth="1.05"
            strokeOpacity="0.42"
          />
          <path
            d="M566 418C621 354 666 311 714 276C768 237 826 208 900 188"
            stroke="url(#newsLine)"
            strokeWidth="0.95"
            strokeOpacity="0.24"
          />

          <path
            d="M612 0C665 15 714 40 754 79C789 113 813 156 824 205C834 251 829 307 809 368"
            stroke="url(#newsLine)"
            strokeWidth="1"
            strokeOpacity="0.2"
          />
          <path
            d="M644 0C700 17 750 44 792 86C828 123 853 166 865 215C876 263 870 319 848 382"
            stroke="url(#newsLine)"
            strokeWidth="1"
            strokeOpacity="0.12"
          />

          <g transform="translate(650 70)">
            <rect
              x="0"
              y="0"
              width="116"
              height="146"
              rx="14"
              fill="url(#paperFill)"
              fillOpacity="0.36"
            />
            <rect
              x="16"
              y="22"
              width="56"
              height="40"
              rx="8"
              fill="#f0d98b"
              fillOpacity="0.45"
            />
            <rect x="78" y="24" width="22" height="6" rx="3" fill="#f0d98b" fillOpacity="0.65" />
            <rect x="78" y="38" width="22" height="6" rx="3" fill="#f0d98b" fillOpacity="0.55" />
            <rect x="16" y="78" width="84" height="6" rx="3" fill="#f0d98b" fillOpacity="0.56" />
            <rect x="16" y="94" width="84" height="6" rx="3" fill="#f0d98b" fillOpacity="0.48" />
            <rect x="16" y="110" width="68" height="6" rx="3" fill="#f0d98b" fillOpacity="0.42" />
            <rect x="16" y="126" width="56" height="6" rx="3" fill="#f0d98b" fillOpacity="0.34" />
          </g>

          <g transform="translate(770 126)">
            <rect
              x="0"
              y="0"
              width="90"
              height="116"
              rx="12"
              fill="url(#paperFill)"
              fillOpacity="0.22"
            />
            <rect x="14" y="18" width="62" height="6" rx="3" fill="#f0d98b" fillOpacity="0.48" />
            <rect x="14" y="34" width="62" height="6" rx="3" fill="#f0d98b" fillOpacity="0.4" />
            <rect x="14" y="50" width="62" height="6" rx="3" fill="#f0d98b" fillOpacity="0.34" />
            <rect x="14" y="72" width="48" height="6" rx="3" fill="#f0d98b" fillOpacity="0.28" />
          </g>
        </svg>
      </div>
    </div>
  )
}