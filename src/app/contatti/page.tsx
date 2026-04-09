import Link from 'next/link'

const googleMapsQuery = encodeURIComponent('Via A. Locatelli 62, 24121 Bergamo')
const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`

export default function ContattiPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="block">
            <p className="text-lg font-semibold uppercase tracking-[0.2em]">
              Belotti
            </p>
            <p className="text-xs text-white/50">Area Immobiliare</p>
          </Link>

          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <Link href="/" className="transition hover:text-white">
              Home
            </Link>
            <Link href="/immobili" className="transition hover:text-white">
              Immobili
            </Link>
            <Link href="/chi-siamo" className="transition hover:text-white">
              Chi siamo
            </Link>
            <Link href="/contatti" className="text-white">
              Contatti
            </Link>
          </nav>

          <a
            href="tel:035221206"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/5"
          >
            035 221206
          </a>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#0d1321]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-white/45">
            Contatti
          </p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
            Siamo a disposizione per informazioni e appuntamenti
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
            Per richieste su immobili, valutazioni o approfondimenti, puoi
            contattare Area Immobiliare direttamente ai recapiti qui sotto.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                Recapiti
              </p>

              <div className="mt-5 space-y-4">
                <a
                  href="tel:035221206"
                  className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-white/5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Telefono
                  </p>
                  <p className="mt-2 text-sm text-white/80">035 221206</p>
                </a>

                <a
                  href="mailto:info@areaimmobiliare.com"
                  className="block rounded-2xl border border-white/10 bg-black/20 px-4 py-4 transition hover:bg-white/5"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm text-white/80">
                    info@areaimmobiliare.com
                  </p>
                </a>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Indirizzo
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/80">
                    Via A. Locatelli 62
                    <br />
                    24121 Bergamo
                  </p>
                </div>
              </div>

              <a
                href={googleMapsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Apri su Google Maps
              </a>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-xl font-semibold">Un contatto diretto e professionale</h2>
              <p className="mt-4 text-sm leading-7 text-white/65">
                Ogni richiesta viene valutata con attenzione, compatibilmente con
                le attività in corso e con le priorità operative dell’agenzia.
              </p>
            </div>
          </aside>

          <section className="rounded-[30px] border border-white/10 bg-white/[0.03] p-4 md:p-5">
            <div className="overflow-hidden rounded-[24px] border border-white/10">
              <iframe
                title="Mappa Area Immobiliare"
                src={`https://www.google.com/maps?q=${googleMapsQuery}&z=16&output=embed`}
                className="h-[620px] w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </section>
        </div>
      </section>
    </main>
  )
}