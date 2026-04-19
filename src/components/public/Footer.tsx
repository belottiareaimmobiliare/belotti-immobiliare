'use client'

import Link from 'next/link'

const partnerLogos = [
  {
    label: 'Immobiliare.it',
    src: '/images/partners/transparent-logo-immobiliareit.png',
  },
  {
    label: 'Casa.it',
    src: '/images/partners/transparent-logo-casait.png',
  },
  {
    label: 'Idealista',
    src: '/images/partners/transparent-logo-idealista.png',
  },
  {
    label: 'BergamoNews',
    src: '/images/partners/transparent-logo-bergamonews.png',
  },
]

export default function Footer() {
  const handleOpenCookieBanner = () => {
    window.dispatchEvent(new Event('open-cookie-banner'))
  }

  return (
    <footer className="site-footer-force-dark w-full px-6 py-14 xl:px-10 2xl:px-14">
      <p className="text-xs uppercase tracking-[0.3em] text-white/30">
        Partners
      </p>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
  {partnerLogos.map((partner) => (
    <div
      key={partner.label}
      className="flex min-h-[96px] items-center justify-start border-b border-white/10 pb-4 md:justify-center md:border-b-0 md:pb-0"
    >
      <img
        src={partner.src}
        alt={partner.label}
        className="max-h-[70px] w-auto max-w-[200px] object-contain opacity-95"
      />
    </div>
  ))}
</div>

      <div className="mt-10 block xl:hidden">
        <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
          Social
        </p>

        <div className="mt-4 flex flex-col gap-4 text-base text-white/72">
          <a
            href="https://www.facebook.com/profile.php?id=61569251094453"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 transition hover:text-white"
            aria-label="Facebook AreaImmobiliare_BG"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5 fill-current"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
              </svg>
            </span>
            <span>/AreaImmobiliare_BG</span>
          </a>

          <a
            href="https://www.tiktok.com/@consigli.immobili"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 transition hover:text-white"
            aria-label="TikTok @AreaImmobiliare_BG"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5 fill-current"
              >
                <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
              </svg>
            </span>
            <span>/@AreaImmobiliare_BG</span>
          </a>
        </div>
      </div>

      <div className="mt-12 h-px w-full bg-white/10" />

      <div className="mt-12 grid gap-12 xl:grid-cols-5">
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
            Brand
          </p>
          <div className="mt-4">
            <img
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              className="max-h-[120px] w-auto object-contain brightness-0 invert opacity-95"
            />
          </div>
          <p className="mt-5 max-w-[420px] text-base leading-8 text-white/58">
            Un modo più chiaro, solido e leggibile di cercare, valutare e
            scegliere casa a Bergamo e provincia.
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
            Navigazione
          </p>
          <div className="mt-4 flex flex-col gap-4 text-base text-white/72">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/immobili" className="transition hover:text-white">
              Immobili
            </Link>
            <Link href="/news" className="transition hover:text-white">
              News
            </Link>
            <Link href="/chi-siamo" className="transition hover:text-white">
              Chi siamo
            </Link>
            <Link href="/contatti" className="transition hover:text-white">
              Contatti
            </Link>
            <Link href="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/cookie" className="transition hover:text-white">
              Cookie Policy
            </Link>
            <Link
              href="/preferenze-cookie"
              className="transition hover:text-white"
            >
              Preferenze cookie
            </Link>
            <button
              type="button"
              onClick={handleOpenCookieBanner}
              className="text-left text-white/72 transition hover:text-white"
            >
              Modifica preferenze cookie
            </button>
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
            Social
          </p>
          <div className="mt-4 hidden flex-col gap-4 text-base text-white/72 xl:flex">
            <a
              href="https://www.facebook.com/profile.php?id=61569251094453"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 transition hover:text-white"
              aria-label="Facebook AreaImmobiliare_BG"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 fill-current"
                >
                  <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
                </svg>
              </span>
              <span>/AreaImmobiliare_BG</span>
            </a>

            <a
              href="https://www.tiktok.com/@consigli.immobili"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 transition hover:text-white"
              aria-label="TikTok @AreaImmobiliare_BG"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-4.5 w-4.5 fill-current"
                >
                  <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
                </svg>
              </span>
              <span>/@AreaImmobiliare_BG</span>
            </a>
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
            Servizi
          </p>
          <div className="mt-4 flex flex-col gap-4 text-base text-white/72">
            <Link
              href="/immobili?contractType=vendita"
              className="transition hover:text-white"
            >
              Vendita
            </Link>
            <Link
              href="/immobili?contractType=affitto"
              className="transition hover:text-white"
            >
              Affitto
            </Link>
            <Link
              href="/immobili/mappa-area"
              className="transition hover:text-white"
            >
              Ricerca su mappa
            </Link>
            <Link href="/immobili" className="transition hover:text-white">
              Ricerca avanzata
            </Link>
          </div>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
            Contatti
          </p>
          <div className="mt-4 space-y-4 text-base leading-8 text-white/72">
            <p>AREA IMMOBILIARE SAS di Belotti Gianfederico &amp; C.</p>
            <p>Via Antonio Locatelli 62, 24121 Bergamo</p>
            <p>C.F. e P.IVA: 02610660165</p>
            <p>PEC: areaimmobiliaresas@legalmail.it</p>
            <p>REA: BG-308620</p>
            <p>info@areaimmobiliare.com</p>
            <p>035 221206</p>
          </div>
        </div>
      </div>

      <div className="mt-14 h-px w-full bg-white/10" />

      <div className="mt-6 flex flex-col gap-4 text-sm text-white/42 md:flex-row md:items-center md:justify-between">
        <p>Area Immobiliare · Tutti i diritti riservati</p>
        <p>Bergamo · Lombardia · Italia</p>
      </div>
    </footer>
  )
}