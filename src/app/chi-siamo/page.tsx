import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Image from 'next/image'
import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'

export default function ChiSiamoPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[#0d1321]">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-center">
          <div className="flex items-center justify-center lg:justify-start">
            <div className="relative h-[270px] w-[270px] overflow-hidden rounded-full border-2 border-white/15 bg-white/[0.03] shadow-[0_0_50px_rgba(255,255,255,0.06)]">
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
            <p className="text-sm uppercase tracking-[0.3em] text-white/45">
              Chi siamo
            </p>

            <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
              Gianfederico Belotti,
              <br />
              una storia immobiliare costruita su esperienza e trasparenza
            </h1>

            <p className="mt-6 max-w-3xl text-base leading-8 text-white/65 md:text-lg">
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
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-2xl font-semibold">Una presenza storica a Bergamo</h2>

              <div className="mt-5 space-y-5 text-white/70">
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

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-2xl font-semibold">
                Un metodo fondato su valutazione, verifica e tutela
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-medium">Valutazione corretta</h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Ogni immobile viene letto con attenzione per comprenderne il
                    valore reale e il suo posizionamento di mercato.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-medium">Controlli documentali</h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Provenienze, conformità, libertà da criticità e aspetti
                    essenziali vengono verificati con metodo.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-medium">Conoscenza del territorio</h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Bergamo, Città Alta, Città Bassa, Colli e hinterland vengono
                    interpretati con esperienza maturata sul campo.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
                  <h3 className="text-lg font-medium">Rete di professionisti</h3>
                  <p className="mt-3 text-sm leading-7 text-white/65">
                    Quando serve, il cliente può contare anche su notai, tecnici,
                    istituti di credito e partner selezionati.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-2xl font-semibold">
                La cultura del prezzo giusto
              </h2>

              <div className="mt-5 space-y-5 text-white/70">
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

            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-8">
              <h2 className="text-2xl font-semibold">Uno stile di lavoro sobrio e concreto</h2>

              <p className="mt-5 text-white/70 leading-8">
                Area Immobiliare si rivolge a chi cerca non soltanto un immobile,
                ma un interlocutore affidabile. L’obiettivo è accompagnare il
                cliente in un percorso serio, ordinato e ben seguito, senza
                eccessi comunicativi ma con attenzione reale alla qualità della
                scelta.
              </p>
            </div>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            <div className="rounded-[30px] border border-white/10 bg-white/[0.03] p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-white/35">
                Riferimenti
              </p>

              <div className="mt-5 space-y-4 text-sm text-white/75">
                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Sede
                  </p>
                  <p className="mt-2 leading-6">
                    Via A. Locatelli 62
                    <br />
                    24121 Bergamo
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Telefono
                  </p>
                  <p className="mt-2">035 221206</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                    Email
                  </p>
                  <p className="mt-2 break-all">info@areaimmobiliare.com</p>
                </div>
              </div>

              <Link
                href="/contatti"
                className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Contattaci
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