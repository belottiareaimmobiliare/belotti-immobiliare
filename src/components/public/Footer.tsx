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
            className="flex min-h-[96px] items-center justify-center border-b border-white/10 pb-4 md:border-b-0 md:pb-0"
          >
            <img
              src={partner.src}
              alt={partner.label}
              className="max-h-[70px] w-auto max-w-[200px] object-contain opacity-95"
            />
          </div>
        ))}
      </div>

      <div className="mt-12 h-px w-full bg-white/10" />

      <div className="mt-12 grid gap-12 xl:grid-cols-4">
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