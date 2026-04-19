export default function ChiSiamoHeroDecoration() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 hidden h-[430px] overflow-hidden xl:block">
      <div
        className="absolute right-[-40px] top-0 h-[430px] w-[980px] opacity-[0.17]"
        style={{
          maskImage:
            'radial-gradient(circle at 82% 24%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.78) 46%, rgba(0,0,0,0.34) 68%, transparent 88%)',
          WebkitMaskImage:
            'radial-gradient(circle at 82% 24%, rgba(0,0,0,1) 0%, rgba(0,0,0,0.96) 22%, rgba(0,0,0,0.78) 46%, rgba(0,0,0,0.34) 68%, transparent 88%)',
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
            <linearGradient id="belottiLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#6e6e6e" stopOpacity="0.34" />
            </linearGradient>

            <radialGradient id="belottiGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d4af37" stopOpacity="0.16" />
              <stop offset="55%" stopColor="#d4af37" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#d4af37" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx="760" cy="166" r="150" fill="url(#belottiGlow)" />
          <circle cx="672" cy="236" r="110" fill="url(#belottiGlow)" />

          {/* silhouette busto / testa stilizzata */}
          <path
            d="M660 366
               C640 340 631 318 629 298
               C626 270 635 246 648 229
               C658 215 670 206 683 199
               C676 189 672 178 671 165
               C669 143 676 123 691 109
               C707 94 729 87 751 90
               C771 93 789 104 801 120
               C812 134 817 152 815 171
               C814 185 809 198 801 208
               C816 216 830 228 839 245
               C849 264 854 288 853 314
               C852 332 849 349 843 366"
            stroke="url(#belottiLine)"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* testa */}
          <path
            d="M692 166
               C692 132 718 106 751 106
               C784 106 809 132 809 166
               C809 198 784 224 751 224
               C718 224 692 198 692 166Z"
            stroke="url(#belottiLine)"
            strokeWidth="2.2"
          />

          {/* spalle / busto */}
          <path
            d="M667 366
               C678 327 699 304 723 292
               C741 284 761 282 780 286
               C805 291 826 305 840 328
               C847 340 852 353 855 366"
            stroke="url(#belottiLine)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* braccia incrociate stilizzate */}
          <path
            d="M694 332
               C719 322 739 318 760 319
               C782 321 799 327 816 339"
            stroke="url(#belottiLine)"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d="M693 346
               C716 337 735 333 756 334
               C776 336 794 343 811 354"
            stroke="url(#belottiLine)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeOpacity="0.8"
          />

          {/* occhiali */}
          <rect
            x="716"
            y="151"
            width="24"
            height="14"
            rx="5"
            stroke="url(#belottiLine)"
            strokeWidth="1.6"
          />
          <rect
            x="762"
            y="151"
            width="24"
            height="14"
            rx="5"
            stroke="url(#belottiLine)"
            strokeWidth="1.6"
          />
          <path
            d="M740 158H762"
            stroke="url(#belottiLine)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />

          {/* naso / bocca molto leggeri */}
          <path
            d="M752 166
               C749 176 749 184 753 191"
            stroke="url(#belottiLine)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M740 201
               C747 205 757 205 764 201"
            stroke="url(#belottiLine)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />

          {/* dettagli collo / maglia */}
          <path
            d="M736 228
               C742 238 746 248 748 260"
            stroke="url(#belottiLine)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />
          <path
            d="M766 228
               C760 238 756 248 754 260"
            stroke="url(#belottiLine)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.7"
          />

          {/* firma / curve decorative morbide */}
          <path
            d="M565 392
               C621 380 676 380 726 389
               C773 397 819 398 874 390"
            stroke="url(#belottiLine)"
            strokeWidth="1.2"
            strokeOpacity="0.22"
            strokeLinecap="round"
          />
          <path
            d="M603 66
               C660 45 731 42 797 58
               C840 69 873 88 900 116"
            stroke="url(#belottiLine)"
            strokeWidth="1"
            strokeOpacity="0.16"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </div>
  )
}