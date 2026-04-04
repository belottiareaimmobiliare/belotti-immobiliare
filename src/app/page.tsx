export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1a]/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold tracking-[0.2em] uppercase text-white">
              Belotti
            </p>
            <p className="text-xs text-white/50">Real Estate Experience</p>
          </div>

          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <a href="#" className="transition hover:text-white">
              Acquista
            </a>
            <a href="#" className="transition hover:text-white">
              Affitta
            </a>
            <a href="#" className="transition hover:text-white">
              Servizi
            </a>
            <a href="#" className="transition hover:text-white">
              Chi siamo
            </a>
            <a href="#" className="transition hover:text-white">
              Contatti
            </a>
          </nav>

          <a
            href="#"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Valuta il tuo immobile
          </a>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_35%),linear-gradient(135deg,#0a0f1a_0%,#111a2e_55%,#1d2c46_100%)]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center opacity-20" />
        <div className="absolute inset-0 bg-black/35" />

        <div className="relative mx-auto flex min-h-[calc(100vh-73px)] max-w-7xl items-center px-6 py-16">
          <div className="max-w-4xl">
            <p className="mb-4 text-sm uppercase tracking-[0.35em] text-white/60">
              Sito immobiliare premium
            </p>

            <h1 className="max-w-4xl text-5xl font-semibold leading-tight md:text-7xl">
              Un nuovo modo di cercare, presentare e valorizzare gli immobili.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 md:text-xl">
              Una piattaforma moderna, dinamica e pensata per distinguersi dai
              classici siti immobiliari, con un’esperienza più elegante,
              coinvolgente e professionale.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <a
                href="#ricerca"
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black transition hover:bg-white/90"
              >
                Esplora gli immobili
              </a>
              <a
                href="#"
                className="rounded-full border border-white/20 px-6 py-3 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/5"
              >
                Richiedi una valutazione
              </a>
            </div>

            <div
              id="ricerca"
              className="mt-14 rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_1fr_1fr_auto]">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">
                    Contratto
                  </p>
                  <p className="mt-1 text-sm font-medium">Acquisto / Affitto</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">
                    Zona
                  </p>
                  <p className="mt-1 text-sm font-medium">
                    Comune, quartiere o area
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">
                    Mappa
                  </p>
                  <p className="mt-1 text-sm font-medium">Disegna area</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-white/45">
                    Prezzo
                  </p>
                  <p className="mt-1 text-sm font-medium">Fascia di prezzo</p>
                </div>

                <button className="rounded-2xl bg-white px-6 py-4 text-sm font-semibold text-black transition hover:bg-white/90">
                  Cerca
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/60">
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Appartamenti
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Ville
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Attici
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Box / Posto auto
                </span>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
                  Nuove proposte
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}