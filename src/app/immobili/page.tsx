const properties = [
  {
    id: 1,
    title: "Attico con terrazza panoramica",
    location: "Centro città",
    price: "€ 495.000",
    details: "145 mq · 4 locali · 2 bagni",
    tag: "Esclusiva",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Villa moderna con giardino",
    location: "Zona residenziale",
    price: "€ 780.000",
    details: "230 mq · 6 locali · 3 bagni",
    tag: "Nuovo",
    image:
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Trilocale elegante con balcone",
    location: "Quartiere servito",
    price: "€ 265.000",
    details: "98 mq · 3 locali · 2 bagni",
    tag: "Ribasso",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "Quadrilocale luminoso con box",
    location: "Zona semicentrale",
    price: "€ 340.000",
    details: "120 mq · 4 locali · 2 bagni",
    tag: "Nuovo",
    image:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function ImmobiliPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0a0f1a]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="/" className="block">
            <p className="text-lg font-semibold uppercase tracking-[0.2em]">
              Belotti
            </p>
            <p className="text-xs text-white/50">Real Estate Experience</p>
          </a>

          <nav className="hidden gap-8 text-sm text-white/70 md:flex">
            <a href="/" className="transition hover:text-white">
              Home
            </a>
            <a href="/immobili" className="text-white">
              Immobili
            </a>
            <a href="#" className="transition hover:text-white">
              Servizi
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

      <section className="border-b border-white/10 bg-[#0d1321]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <p className="text-sm uppercase tracking-[0.3em] text-white/45">
            Ricerca immobili
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-5xl">
            Trova la soluzione giusta con un’esperienza più moderna.
          </h1>

          <div className="mt-8 rounded-[28px] border border-white/10 bg-white/[0.05] p-4">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_1.4fr_1fr_1fr_auto]">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-white/45">
                  Contratto
                </p>
                <p className="mt-1 text-sm font-medium">Affitto / Acquisto</p>
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
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[30px] border border-white/10 bg-white/[0.03] p-6 lg:sticky lg:top-24">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Filtri</h2>
              <button className="text-sm text-white/45 transition hover:text-white">
                Azzera
              </button>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Tipologia
                </label>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                  Appartamento, villa, attico...
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Prezzo min / max
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    Min
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    Max
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">Mq</label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    Min
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                    Max
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Locali
                </label>
                <div className="flex flex-wrap gap-2">
                  {["1+", "2+", "3+", "4+", "5+"].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Caratteristiche
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Terrazzo",
                    "Balcone",
                    "Giardino",
                    "Box",
                    "Ascensore",
                    "Arredato",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/55">
                  Classe energetica
                </label>
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/80">
                  A4 → G
                </div>
              </div>

              <button className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Applica filtri
              </button>
            </div>
          </aside>

          <div>
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-white/45">12 immobili trovati</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Acquisto", "Centro città", "€ 250k - € 800k", "Terrazzo"].map(
                    (filter) => (
                      <span
                        key={filter}
                        className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-white/70"
                      >
                        {filter}
                      </span>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button className="rounded-full border border-white/10 bg-black/20 px-4 py-2 text-sm text-white/80">
                  Lista
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/45">
                  Mappa
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {properties.map((property) => (
                <article
                  key={property.id}
                  className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05]"
                >
                  <div className="grid lg:grid-cols-[360px_minmax(0,1fr)]">
                    <div className="relative min-h-[260px]">
                      <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url('${property.image}')` }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                        {property.tag}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between p-6">
                      <div>
                        <p className="text-sm text-white/45">{property.location}</p>
                        <h2 className="mt-2 text-2xl font-semibold leading-tight md:text-3xl">
                          {property.title}
                        </h2>
                        <p className="mt-4 text-3xl font-semibold">
                          {property.price}
                        </p>
                        <p className="mt-3 text-sm text-white/60">
                          {property.details}
                        </p>

                        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/65">
                          Una presentazione più pulita e moderna dell’immobile,
                          con gerarchia visiva migliore, badge, dettagli più
                          leggibili e spazio per contenuti di valore.
                        </p>
                      </div>

                      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-3">
                          <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90">
                            Scopri di più
                          </button>
                          <button className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-white/75 transition hover:border-white/20 hover:bg-white/[0.04]">
                            Salva
                          </button>
                        </div>

                        <span className="text-sm text-white/35">
                          Scheda immobile
                        </span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}