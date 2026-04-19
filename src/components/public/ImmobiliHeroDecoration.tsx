export default function ImmobiliHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[420px] overflow-hidden xl:block">
      <div
        className="absolute right-0 top-0 h-[420px] w-[760px] opacity-[0.22]"
        style={{
          maskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.18) 72%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at top right, rgba(0,0,0,1) 0%, rgba(0,0,0,0.92) 28%, rgba(0,0,0,0.55) 52%, rgba(0,0,0,0.18) 72%, transparent 88%)',
        }}
      >
        <svg
          viewBox="0 0 760 420"
          className="h-full w-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="goldLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6f5a1a" stopOpacity="0.45" />
            </linearGradient>

            <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.32" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>

            <linearGradient id="houseFill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#e2c15a" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#a27d1f" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <circle cx="645" cy="118" r="150" fill="url(#goldGlow)" />
          <circle cx="565" cy="210" r="120" fill="url(#goldGlow)" />

          <path
            d="M398 382C455 319 487 267 538 224C594 176 638 146 674 102C700 71 718 46 756 33"
            stroke="url(#goldLine)"
            strokeWidth="1.5"
            strokeOpacity="0.9"
          />
          <path
            d="M360 353C418 295 460 258 503 216C561 159 620 121 694 78"
            stroke="url(#goldLine)"
            strokeWidth="1.2"
            strokeOpacity="0.65"
          />
          <path
            d="M446 398C488 333 522 292 566 250C609 208 660 176 742 146"
            stroke="url(#goldLine)"
            strokeWidth="1.1"
            strokeOpacity="0.45"
          />

          <path
            d="M477 8C520 20 563 42 598 79C631 113 654 160 661 208C669 261 656 311 628 351"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.35"
          />
          <path
            d="M498 0C544 14 588 40 626 77C662 111 688 156 698 210C707 262 697 316 669 360"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.22"
          />
          <path
            d="M522 0C571 14 618 40 657 80C694 118 720 162 732 214C742 266 734 319 706 364"
            stroke="url(#goldLine)"
            strokeWidth="1"
            strokeOpacity="0.14"
          />

          <g transform="translate(520 58)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.82"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.9"
            />
          </g>

          <g transform="translate(610 102)">
            <path
              d="M0 22L24 0L48 22V54C48 56.2 46.2 58 44 58H30V39H18V58H4C1.8 58 0 56.2 0 54V22Z"
              fill="url(#houseFill)"
              fillOpacity="0.74"
            />
            <path
              d="M-4 24L24 -2L52 24"
              stroke="#f1d887"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.82"
            />
          </g>

          <g transform="translate(675 182)">
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
              strokeOpacity="0.72"
            />
          </g>
        </svg>
      </div>
    </div>
  )
}