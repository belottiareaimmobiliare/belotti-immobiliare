export default function Home() {
  const featuredProperties = [
    {
      title: "Attico panoramico con terrazza",
      location: "Centro città",
      price: "€ 495.000",
      details: "145 mq · 4 locali · 2 bagni",
      tag: "Esclusiva",
    },
    {
      title: "Villa moderna con giardino",
      location: "Zona residenziale",
      price: "€ 780.000",
      details: "230 mq · 6 locali · 3 bagni",
      tag: "Nuovo",
    },
    {
      title: "Trilocale elegante con balcone",
      location: "Quartiere servito",
      price: "€ 265.000",
      details: "98 mq · 3 locali · 2 bagni",
      tag: "Ribasso",
    },
  ];

  const values = [
    {
      title: "Selezione più curata",
      text: "Ogni immobile viene presentato con maggiore attenzione visiva, chiarezza e valorizzazione.",
    },
    {
      title: "Esperienza più moderna",
      text: "Una navigazione dinamica, elegante e pensata per distinguersi dai portali immobiliari più classici.",
    },
    {
      title: "Più controllo nella gestione",
      text: "Annunci, immagini, planimetrie e dettagli gestiti in un sistema unico, semplice da aggiornare.",
    },
  ];

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
                href="/immobili"
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

            <div className="mt-14 rounded-[28px] border border-white/10 bg-white/10 p-4 shadow-2xl backdrop-blur-xl">
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

      <section className="border-t border-white/10 bg-[#0d1321]">
        <div className="mx-auto grid max-w-7xl gap-5 px-6 py-14 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20 hover:bg-white/[0.05]">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/40">
              Compra
            </p>
            <h2 className="text-2xl font-semibold">Trova la casa giusta</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Appartamenti, ville, attici e soluzioni selezionate con una
              presentazione più curata e moderna.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20 hover:bg-white/[0.05]">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/40">
              Affitta
            </p>
            <h2 className="text-2xl font-semibold">Cerca con più precisione</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Filtri evoluti, ricerca per area e un’esperienza visiva più chiara
              rispetto ai classici portali immobiliari.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-8 transition hover:border-white/20 hover:bg-white/[0.05]">
            <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/40">
              Valuta
            </p>
            <h2 className="text-2xl font-semibold">Dai valore al tuo immobile</h2>
            <p className="mt-4 text-sm leading-7 text-white/65">
              Un approccio più forte nella presentazione dell’immobile, con
              contenuti, immagini e percezione più premium.
            </p>
          </div>
        </div>
      </section>

      <section id="immobili" className="bg-[#0a0f1a]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/45">
                In evidenza
              </p>
              <h2 className="mt-3 text-3xl font-semibold md:text-5xl">
                Immobili selezionati
              </h2>
            </div>

            <p className="max-w-xl text-sm leading-7 text-white/60 md:text-base">
              Un’anteprima di come il sito potrà valorizzare gli immobili con
              card più eleganti, leggibili e visivamente più forti.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {featuredProperties.map((property, index) => (
              <article
                key={index}
                className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05]"
              >
                <div className="relative h-72 overflow-hidden">
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage:
                        index === 0
                          ? "url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80')"
                          : index === 1
                            ? "url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80')"
                            : "url('https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                  <span className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {property.tag}
                  </span>
                </div>

                <div className="p-6">
                  <p className="text-sm text-white/45">{property.location}</p>
                  <h3 className="mt-2 text-2xl font-semibold leading-tight">
                    {property.title}
                  </h3>
                  <p className="mt-4 text-2xl font-semibold text-white">
                    {property.price}
                  </p>
                  <p className="mt-2 text-sm text-white/60">{property.details}</p>

                  <div className="mt-6 flex items-center justify-between">
                    <button className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-white/90">
                      Scopri di più
                    </button>
                    <span className="text-sm text-white/35">Scheda immobile</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0d1321]">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-white/45">
                Perché scegliere Belotti
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight md:text-5xl">
                Un’esperienza più attuale, più forte, più riconoscibile.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/65">
                Il progetto punta a superare l’aspetto dei soliti siti
                immobiliari, con una presenza più elegante, moderna e pensata
                per valorizzare sia gli immobili sia il brand.
              </p>
            </div>

            <div className="grid gap-5">
              {values.map((item, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-white/10 bg-white/[0.03] p-7"
                >
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}