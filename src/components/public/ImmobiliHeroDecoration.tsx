export default function ImmobiliHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[440px] overflow-hidden xl:block">
      <div
        className="absolute right-0 top-0 h-[440px] w-[920px] opacity-[0.2]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 24%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.3) 68%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.94) 24%, rgba(0,0,0,0.7) 46%, rgba(0,0,0,0.3) 68%, transparent 88%)',
        }}
      >
        <svg
          viewBox="0 0 920 440"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6f5a1a" stopOpacity="0.42" />
            </linearGradient>

            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.28" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="houseFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2c15a" stopOpacity="0.94" />
              <stop offset="100%" stopColor="#9a771d" stopOpacity="0.78" />
            </linearGradient>
          </defs>

          <circle cx="770" cy="130" r="165" fill="url(#goldGlow)" />
          <circle cx="666" cy="232" r="150" fill="url(#goldGlow)" />
          <circle cx="570" cy="190" r="110" fill="url(#goldGlow)" />

          <path
            d="M360 420C434 352 490 302 542 252C590 206 632 165 680 119C720 81 770 46 916 12"
            stroke="url(#goldLine)"
            strokeWidth="1.5"
            strokeOpacity="0.88"
          />
          <path
            d="M300 384C376 324 434 280 488 235C542 190 602 144 684 92C749 51 814 24 915 0"
            stroke="url(#goldLine)"
            strokeWidth="1.15"
            strokeOpacity="0.55"
          />
          <path
            d="M430 438C504 366 560 314 620 262C682 209 744 166 915 130"
            stroke="url(#goldLine)"
            strokeWidth="1.05"
            strokeOpacity="0.36"
          />
          <path
            d="M520 438C584 368 635 316 690 272C750 223 806 188 920 170"
            stroke="url(#goldLine)"
            strokeWidth="0.95"
            strokeOpacity="0.25"
          />

          <path
            d="M560 0C612 16 658 41 698 81C734 117 758 161 771 210C784 262 778 320 756 384"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.28"
          />
          <path
            d="M590 0C645 17 694 45 736 87C774 126 801 171 814 221C826 273 820 332 798 396"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.18"
          />
          <path
            d="M622 0C682 18 735 48 778 93C818 135 845 181 857 232C868 284 860 340 836 406"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.12"
          />

          <g transform="translate(620 56)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.8"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.88"
            />
          </g>

          <g transform="translate(720 104)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.72"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.78"
            />
          </g>

          <g transform="translate(820 182)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.62"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.68"
            />
          </g>

          <g transform="translate(660 215)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.56"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.62"
            />
          </g>
        </svg>
      </div>
    </div>
  )
}