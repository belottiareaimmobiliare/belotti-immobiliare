import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import SiteHeader from '@/components/public/SiteHeader'

export const metadata: Metadata = {
  title: 'Gianfederico Belotti | Area Immobiliare Bergamo',
  description:
    'Gianfederico Belotti, fondatore di Area Immobiliare dal 1980 e ideatore della Borsa del mattone a Bergamo.',
}

const highlights = [
  {
    label: 'Dal 1980',
    text: 'Area Immobiliare opera a Bergamo con sede in Via Locatelli 62.',
  },
  {
    label: 'Borsa del mattone',
    text: 'Un metodo nato per leggere il mercato con maggiore trasparenza.',
  },
  {
    label: 'Bergamo e provincia',
    text: 'Esperienza diretta su Città Alta, Città Bassa, Colli e hinterland.',
  },
]

const methodCards = [
  {
    title: 'Valutare prima di proporre',
    text: 'Ogni immobile deve essere letto nel suo contesto: posizione, stato, commerciabilità, prospettive di rivendita e coerenza del prezzo richiesto.',
  },
  {
    title: 'Verificare prima di acquistare',
    text: 'La bellezza di una casa non basta. Provenienze, conformità, vincoli, ipoteche e documentazione devono essere controllati con attenzione.',
  },
  {
    title: 'Accompagnare fino alla firma',
    text: 'Comprare casa significa prendere una decisione importante. Il cliente deve essere guidato con chiarezza, senza pressioni e senza zone d’ombra.',
  },
]

export default function GianfedericoBelottiPage() {
  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)]">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-[-12%] top-[-20%] h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-25%] right-[-10%] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto w-full max-w-[340px] lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[34px] border border-[var(--site-border-strong)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]">
              <Image
                src="/images/gianfederico-belotti.jpg"
                alt="Gianfederico Belotti"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              Gianfederico Belotti
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--site-text)] md:text-6xl">
              L’agente che ha creato la Borsa del mattone
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
              Il mercato immobiliare è un terreno vastissimo, ricco di opportunità ma anche di insidie.
              Per questo acquistare casa non dovrebbe mai diventare un salto nel buio: dovrebbe restare
              uno dei momenti più importanti, emozionanti e consapevoli della vita.
            </p>

            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
              Da questa convinzione nasce il percorso di Gianfederico Belotti: leggere il mercato,
              interpretarne i valori, proteggere chi compra e dare all’immobile una valutazione
              corretta, non soltanto conveniente.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/immobili"
                className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>Vedi immobili</span>
              </Link>

              <Link
                href="/contatti"
                className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>Contatta Area Immobiliare</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.label}
              className="theme-panel rounded-[28px] border p-6"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                {item.label}
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="space-y-8">
            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Acquistare casa è un sogno che non deve svanire
              </h2>

              <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                <p>
                  Casa non è una parola qualunque. È il luogo in cui si progetta una vita,
                  si custodiscono risparmi, si immagina il futuro. Proprio per questo
                  l’acquisto di un immobile non può essere affrontato soltanto guardando
                  una facciata, una metratura o una fotografia ben riuscita.
                </p>

                <p>
                  Serve una guida capace di distinguere il valore reale dall’apparenza,
                  l’occasione dalla trappola, il prezzo corretto da quello semplicemente
                  desiderato. È questo il lavoro che Area Immobiliare svolge dal 1980:
                  accompagnare chi compra e chi vende dentro una scelta importante,
                  con metodo, prudenza e responsabilità.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                La Borsa del mattone
              </h2>

              <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                <p>
                  A Gianfederico Belotti si deve l’intuizione di portare anche nel mercato
                  immobiliare bergamasco uno strumento di lettura più chiaro, più concreto
                  e più utile: una vera Borsa del mattone, pensata per aiutare cittadini,
                  proprietari e operatori a capire se il valore richiesto per una casa,
                  un ufficio, un negozio o un terreno fosse davvero coerente con il mercato.
                </p>

                <p>
                  Da quella impostazione sono nate pubblicazioni e strumenti di consultazione
                  che negli anni hanno contribuito a rendere più trasparente il rapporto tra
                  prezzo, zona, qualità dell’immobile e prospettive future. Perché il prezzo
                  giusto non è soltanto quello che permette di comprare oggi: è anche quello
                  che conserva equilibrio nel tempo, nel caso di una futura rivendita.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Dietro una buona compravendita ci sono controlli, non improvvisazione
              </h2>

              <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                <p>
                  Ogni immobile racconta una storia. Ma prima di trasformare quella storia
                  in un rogito, occorre leggerla con attenzione: provenienza, conformità allo
                  stato di fatto, eventuali ipoteche, vincoli, documenti tecnici, situazione
                  urbanistica e commerciale.
                </p>

                <p>
                  Solo così l’acquisto torna a essere ciò che dovrebbe essere: non una corsa
                  ansiosa verso una firma, ma un passaggio importante affrontato con le
                  informazioni giuste. La consulenza immobiliare, quando è seria, non vende
                  soltanto metri quadrati. Riduce i rischi, chiarisce i dubbi e protegge il
                  valore dell’investimento.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Un metodo costruito sul territorio
              </h2>

              <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                <p>
                  Bergamo non è un mercato uniforme. Città Alta, Città Bassa, i Colli,
                  il centro, i quartieri residenziali e l’hinterland hanno dinamiche diverse,
                  valori diversi, domande diverse. Conoscerli significa avere memoria delle
                  compravendite, sensibilità sul territorio e capacità di interpretare ciò
                  che i soli numeri non dicono.
                </p>

                <p>
                  È in questa esperienza che si inserisce il lavoro di Area Immobiliare:
                  selezionare immobili, valutarli con attenzione, presentarli con serietà e
                  accompagnare il cliente fino alla scelta finale, senza perdere di vista
                  ciò che conta davvero: acquistare bene, vendere correttamente, costruire
                  fiducia.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Il meglio di consulenti, tecnici e professionisti
              </h2>

              <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                <p>
                  Una compravendita immobiliare non si esaurisce nell’incontro tra chi vende
                  e chi compra. Attorno a una casa si muovono banche, notai, tecnici,
                  architetti, imprese, artigiani e professionisti chiamati a rendere sicuro
                  e conveniente ogni passaggio.
                </p>

                <p>
                  L’esperienza maturata nel tempo consente di orientare il cliente anche in
                  queste scelte, indicando interlocutori affidabili e soluzioni adeguate.
                  Perché quando si affronta uno degli investimenti più importanti della vita,
                  la qualità delle persone coinvolte non è un dettaglio: è una garanzia.
                </p>
              </div>
            </div>
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="theme-panel rounded-[30px] border p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                Metodo Belotti
              </p>

              <div className="mt-5 space-y-4">
                {methodCards.map((card) => (
                  <div
                    key={card.title}
                    className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
                  >
                    <h3 className="text-sm font-semibold text-[var(--site-text)]">
                      {card.title}
                    </h3>
                    <p className="mt-2 text-xs leading-6 text-[var(--site-text-muted)]">
                      {card.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                Area Immobiliare
              </p>

              <h2 className="mt-3 text-xl font-semibold text-[var(--site-text)]">
                Dal 1980 a Bergamo
              </h2>

              <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                Via A. Locatelli 62
                <br />
                24121 Bergamo
              </p>

              <div className="mt-5 grid gap-3">
                <a
                  href="tel:+39035221206"
                  className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
                >
                  <span>Chiama 035 221206</span>
                </a>

                <Link
                  href="/contatti"
                  className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
                >
                  <span>Richiedi una consulenza</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}
