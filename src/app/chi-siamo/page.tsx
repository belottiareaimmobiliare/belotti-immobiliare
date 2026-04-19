import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'
import ChiSiamoHeroDecoration from '@/components/public/ChiSiamoHeroDecoration'

export default function ChiSiamoPage() {
  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <ChiSiamoHeroDecoration />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <div className="flex flex-col items-center justify-center lg:items-start lg:justify-start">
            <div className="relative h-[270px] w-[270px] overflow-hidden rounded-full border-2 border-[var(--site-border-strong)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]">
              <Image
                src="/images/gianfederico-belotti.jpg"
                alt="Gianfederico Belotti"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="mt-5 flex w-[270px] items-center justify-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61569251094453"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Area Immobiliare | Consigli Immobiliari e dintorni"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-strong)] text-[var(--site-text)] transition hover:scale-[1.04] hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface)]"
                title="Area Immobiliare | Consigli Immobiliari e dintorni"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
                </svg>
              </a>

              <span className="text-base text-[var(--site-text-faint)]">|</span>

              <a
                href="https://www.tiktok.com/@consigli.immobili"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok Consigli Immobiliari AI"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-strong)] text-[var(--site-text)] transition hover:scale-[1.04] hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface)]"
                title="Consigli Immobiliari AI"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
                </svg>
              </a>
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