import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'

export default function ChiSiamoPage() {
  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative h-[270px] w-[270px] overflow-hidden rounded-full border-2 border-[var(--site-border-strong)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]">
              <Image
                src="/images/gianfederico-belotti.jpg"
                alt="Gianfederico Belotti"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              Chi siamo
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight text-[var(--site-text)] md:text-5xl">
              Gianfederico Belotti,
              <br />
              una storia immobiliare costruita su esperienza e trasparenza
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
              Area Immobiliare affianca da decenni chi desidera acquistare,
              vendere o locare un immobile con un metodo fondato su conoscenza
              del territorio, valutazione corretta e attenzione concreta alla
              qualità dell’operazione.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-8">
            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Una presenza storica a Bergamo
              </h2>

              <div className="mt-5 space-y-5 text-[var(--site-text-muted)]">
                <p className="leading-8">
                  Il mercato immobiliare è un ambito complesso, fatto di
                  opportunità ma anche di aspetti tecnici, economici e
                  documentali che richiedono esperienza. Area Immobiliare nasce
                  con l’idea di accompagnare il cliente con sobrietà, metodo e
                  visione concreta.
                </p>

                <p className="leading-8">
                  Dal 1980, l’agenzia opera a Bergamo aiutando famiglie, privati
                  e investitori nella scelta di abitazioni, uffici, negozi e
                  altre soluzioni immobiliari, con attenzione alla reale
                  commerciabilità dell’immobile e alla sostenibilità
                  dell’operazione.
                </p>

                <p className="leading-8">
                  Gianfederico Belotti ha costruito negli anni una realtà
                  riconosciuta per la conoscenza del territorio, per la
                  sensibilità nel leggere il mercato e per l’attenzione al
                  valore corretto degli immobili.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Un metodo fondato su valutazione, verifica e tutela
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5">
                  <h3 className="text-lg font-medium text-[var(--site-text)]">
                    Valutazione corretta
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                    Ogni immobile viene letto con attenzione per comprenderne il
                    valore reale e il suo posizionamento di mercato.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5">
                  <h3 className="text-lg font-medium text-[var(--site-text)]">
                    Controlli documentali
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                    Provenienze, conformità, libertà da criticità e aspetti
                    essenziali vengono verificati con metodo.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5">
                  <h3 className="text-lg font-medium text-[var(--site-text)]">
                    Conoscenza del territorio
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                    Bergamo, Città Alta, Città Bassa, Colli e hinterland vengono
                    interpretati con esperienza maturata sul campo.
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5">
                  <h3 className="text-lg font-medium text-[var(--site-text)]">
                    Rete di professionisti
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                    Quando serve, il cliente può contare anche su notai, tecnici,
                    istituti di credito e partner selezionati.
                  </p>
                </div>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                La cultura del prezzo giusto
              </h2>

              <div className="mt-5 space-y-5 text-[var(--site-text-muted)]">
                <p className="leading-8">
                  Uno degli aspetti distintivi dell’approccio di Gianfederico
                  Belotti è l’attenzione alla trasparenza del mercato. La
                  valutazione dell’immobile non è solo una cifra: è un lavoro di
                  equilibrio tra desiderio, realtà e prospettiva futura.
                </p>

                <p className="leading-8">
                  Questo approccio ha contribuito a costruire un profilo
                  professionale autorevole, orientato a tutelare chi compra, chi
                  vende e chi cerca una soluzione in affitto con maggiore
                  consapevolezza.
                </p>
              </div>
            </div>

            <div className="theme-panel rounded-[30px] border p-8">
              <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                Uno stile di lavoro sobrio e concreto
              </h2>

              <p className="mt-5 leading-8 text-[var(--site-text-muted)]">
                Area Immobiliare si rivolge a chi cerca non soltanto un immobile,
                ma un interlocutore affidabile. L’obiettivo è accompagnare il
                cliente in un percorso serio, ordinato e ben seguito, senza
                eccessi comunicativi ma con attenzione reale alla qualità della
                scelta.
              </p>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="theme-panel rounded-[30px] border p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                Riferimenti
              </p>

              <div className="mt-5 space-y-4 text-sm text-[var(--site-text-soft)]">
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Sede
                  </p>
                  <p className="mt-2 leading-6">
                    Via A. Locatelli 62
                    <br />
                    24121 Bergamo
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Telefono
                  </p>
                  <p className="mt-2">035 221206</p>
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Email
                  </p>
                  <p className="mt-2 break-all">info@areaimmobiliare.com</p>
                </div>
              </div>

              <Link
                href="/contatti"
                className="theme-button-primary liquid-button mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>Contattaci</span>
              </Link>
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