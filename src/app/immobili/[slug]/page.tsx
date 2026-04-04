const gallery = [
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80",
];

const features = [
  "145 mq",
  "4 locali",
  "2 bagni",
  "Terrazza panoramica",
  "Box auto",
  "Ascensore",
  "Cantina",
  "Classe energetica A2",
];

const similarProperties = [
  {
    title: "Quadrilocale con terrazzo",
    location: "Zona centrale",
    price: "€ 420.000",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Attico moderno con vista",
    location: "Quartiere residenziale",
    price: "€ 510.000",
    image:
      "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=1200&q=80",
  },
];

export default function PropertyDetailPage() {
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
            <a href="/immobili" className="transition hover:text-white">
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
            href="#contatto"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/5"
          >
            Richiedi informazioni
          </a>
        </div>
      </header>

      <section className="border-b border-white/10 bg-[#0d1321]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <a
            href="/immobili"
            className="text-sm text-white/45 transition hover:text-white"
          >
            ← Torna agli immobili
          </a>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs uppercase tracking-[0.2em] text-white/55">
                Esclusiva
              </span>
              <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-5xl">
                Attico con terrazza panoramica
              </h1>
              <p className="mt-3 text-base text-white/60 md:text-lg">
                Centro città · zona servita e ben collegata
              </p>
            </div>

            <div className="md:text-right">
              <p className="text-sm uppercase tracking-[0.25em] text-white/40">
                Prezzo
              </p>
              <p className="mt-2 text-3xl font-semibold md:text-5xl">
                € 495.000
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div
            className="min-h-[420px] rounded-[34px] border border-white/10 bg-cover bg-center"
            style={{ backgroundImage: `url('${gallery[0]}')` }}
          />
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {gallery.slice(1).map((image) => (
              <div
                key={image}
                className="min-h-[130px] rounded-[28px] border border-white/10 bg-cover bg-center"
                style={{ backgroundImage: `url('${image}')` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-8">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-2xl font-semibold">Dettagli principali</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {features.map((feature) => (
                  <div
                    key={feature}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm text-white/80"
                  >
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <h2 className="text-2xl font-semibold">Descrizione</h2>
              <div className="mt-5 space-y-4 text-sm leading-8 text-white/65 md:text-base">
                <p>
                  Una scheda immobile moderna deve valorizzare la proprietà con
                  una gerarchia visiva forte, immagini grandi, dettagli chiari e
                  una presentazione molto più curata rispetto ai classici siti
                  immobiliari.
                </p>
                <p>
                  Questo spazio conterrà la descrizione completa dell’immobile,
                  le informazioni distintive, il contesto della zona, i punti di
                  forza e tutti gli elementi utili per trasmettere valore e
                  qualità percepita.
                </p>
                <p>
                  La struttura è già pensata per integrarsi in seguito con i
                  dati reali caricati dal pannello admin, così da far aggiornare
                  automaticamente la scheda in base all’annuncio inserito.
                </p>
              </div>
            </div>

            <div className="grid gap-8 xl:grid-cols-2">
              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <h2 className="text-2xl font-semibold">Planimetria</h2>
                <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 text-sm text-white/40">
                  Anteprima planimetria / PDF
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
                <h2 className="text-2xl font-semibold">Posizione</h2>
                <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[24px] border border-dashed border-white/15 bg-black/20 text-sm text-white/40">
                  Mappa immobile
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/40">
                    Immobili simili
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold md:text-3xl">
                    Potrebbero interessarti anche
                  </h2>
                </div>
              </div>

              <div className="mt-8 grid gap-6 md:grid-cols-2">
                {similarProperties.map((item) => (
                  <article
                    key={item.title}
                    className="overflow-hidden rounded-[28px] border border-white/10 bg-black/20"
                  >
                    <div
                      className="h-52 bg-cover bg-center"
                      style={{ backgroundImage: `url('${item.image}')` }}
                    />
                    <div className="p-5">
                      <p className="text-sm text-white/45">{item.location}</p>
                      <h3 className="mt-2 text-xl font-semibold">{item.title}</h3>
                      <p className="mt-4 text-xl font-semibold">{item.price}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <aside
            id="contatto"
            className="h-fit rounded-[30px] border border-white/10 bg-white/[0.03] p-7 lg:sticky lg:top-24"
          >
            <h2 className="text-2xl font-semibold">Richiedi informazioni</h2>
            <p className="mt-3 text-sm leading-7 text-white/60">
              Questa area diventerà il box contatto reale collegato al form
              lead, con invio richiesta e gestione da pannello admin.
            </p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                Nome e cognome
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                Email
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                Telefono
              </div>
              <div className="min-h-[130px] rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/50">
                Messaggio
              </div>

              <button className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-white/90">
                Invia richiesta
              </button>

              <button className="w-full rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/[0.04]">
                Prenota visita
              </button>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}