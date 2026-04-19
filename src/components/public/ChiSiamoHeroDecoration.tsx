export default function ChiSiamoHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[430px] overflow-hidden xl:block">
      <div
        className="absolute right-[-20px] top-0 h-[430px] w-[980px] opacity-[0.15]"
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
            <linearGradient id="belottiStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#666666" stopOpacity="0.32" />
            </linearGradient>

            <radialGradient id="belottiGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.14" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="760" cy="168" r="150" fill="url(#belottiGlow)" />
          <circle cx="700" cy="238" r="104" fill="url(#belottiGlow)" />

          {/* testa / capelli */}
          <path
            d="M695 146
               C696 118 716 96 746 92
               C777 88 804 106 812 134
               C818 154 813 176 800 190
               C787 205 767 214 746 213
               C724 212 706 202 697 185
               C690 173 694 160 695 146Z"
            stroke="url(#belottiStroke)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* attaccatura/lati capelli */}
          <path
            d="M705 128
               C716 110 734 99 754 98
               C775 97 793 106 804 123"
            stroke="url(#belottiStroke)"
            strokeWidth="1.5"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />

          {/* occhiali */}
          <rect
            x="722"
            y="142"
            width="24"
            height="14"
            rx="5"
            stroke="url(#belottiStroke)"
            strokeWidth="1.7"
          />
          <rect
            x="762"
            y="142"
            width="24"
            height="14"
            rx="5"
            stroke="url(#belottiStroke)"
            strokeWidth="1.7"
          />
          <path
            d="M746 149H762"
            stroke="url(#belottiStroke)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />

          {/* naso e bocca leggeri */}
          <path
            d="M754 156
               C751 167 751 176 755 184"
            stroke="url(#belottiStroke)"
            strokeWidth="1.2"
            strokeOpacity="0.75"
            strokeLinecap="round"
          />
          <path
            d="M743 193
               C750 197 759 197 766 193"
            stroke="url(#belottiStroke)"
            strokeWidth="1.2"
            strokeOpacity="0.7"
            strokeLinecap="round"
          />

          {/* collo */}
          <path
            d="M736 214
               C739 228 741 242 741 255"
            stroke="url(#belottiStroke)"
            strokeWidth="1.6"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />
          <path
            d="M770 214
               C767 228 765 242 765 255"
            stroke="url(#belottiStroke)"
            strokeWidth="1.6"
            strokeOpacity="0.8"
            strokeLinecap="round"
          />

          {/* spalle + cardigan/busto */}
          <path
            d="M655 350
               C661 330 668 310 680 294
               C693 277 710 266 728 259
               C746 252 765 251 783 256
               C803 261 822 274 835 292
               C847 309 854 329 860 350"
            stroke="url(#belottiStroke)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* linea centrale camicia/cardigan */}
          <path
            d="M754 252
               C753 272 754 292 756 312
               C758 327 759 339 758 350"
            stroke="url(#belottiStroke)"
            strokeWidth="1.5"
            strokeOpacity="0.72"
            strokeLinecap="round"
          />

          {/* bavero camicia */}
          <path
            d="M742 230
               C747 239 752 248 754 258"
            stroke="url(#belottiStroke)"
            strokeWidth="1.4"
            strokeOpacity="0.78"
            strokeLinecap="round"
          />
          <path
            d="M765 230
               C760 239 756 248 754 258"
            stroke="url(#belottiStroke)"
            strokeWidth="1.4"
            strokeOpacity="0.78"
            strokeLinecap="round"
          />

          {/* braccia incrociate più realistiche */}
          <path
            d="M686 313
               C706 302 726 295 748 293
               C770 291 791 295 815 306"
            stroke="url(#belottiStroke)"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeOpacity="0.88"
          />
          <path
            d="M690 332
               C712 323 732 319 754 319
               C776 320 796 326 817 338"
            stroke="url(#belottiStroke)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeOpacity="0.72"
          />

          {/* polsino/orologio hint */}
          <path
            d="M699 339
               C706 341 712 341 718 338"
            stroke="url(#belottiStroke)"
            strokeWidth="1.2"
            strokeOpacity="0.6"
            strokeLinecap="round"
          />

          {/* curva bassa molto leggera */}
          <path
            d="M560 392
               C626 381 690 381 748 389
               C804 396 855 397 900 392"
            stroke="url(#belottiStroke)"
            strokeWidth="1.1"
            strokeOpacity="0.18"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}