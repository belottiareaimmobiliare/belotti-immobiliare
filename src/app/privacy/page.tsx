import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Informativa
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Privacy Policy</h1>

        <div className="mt-10 space-y-10 text-white/72">
          <section>
            <h2 className="text-2xl font-semibold text-white">1. Titolare del trattamento</h2>
            <p className="mt-4 leading-8">
              Il titolare del trattamento è AREA IMMOBILIARE SAS di Belotti Gianfederico &amp; C.,
              con sede in Via Antonio Locatelli 62, 24121 Bergamo, C.F. e P.IVA 02610660165,
              PEC areaimmobiliaresas@legalmail.it, contatto email info@areaimmobiliare.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Dati trattati</h2>
            <p className="mt-4 leading-8">
              Possiamo trattare dati di navigazione, dati tecnici del dispositivo, informazioni
              trasmesse attraverso eventuali moduli di contatto o richieste immobiliari, oltre ai dati
              necessari a gestire il consenso cookie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Finalità del trattamento</h2>
            <p className="mt-4 leading-8">
              I dati possono essere trattati per consentire la navigazione del sito, rispondere a richieste
              inviate dall’utente, gestire appuntamenti o contatti commerciali relativi a immobili e,
              se autorizzato, misurare l’uso del sito tramite strumenti analitici.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Base giuridica</h2>
            <p className="mt-4 leading-8">
              La base giuridica dipende dalla finalità: esecuzione di misure precontrattuali o richiesta
              dell’interessato per i contatti, obblighi di legge ove applicabili, legittimo interesse per
              la sicurezza tecnica del sito, consenso per eventuali cookie o strumenti non tecnici.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Modalità di trattamento</h2>
            <p className="mt-4 leading-8">
              I dati sono trattati con strumenti elettronici e misure organizzative adeguate a tutelarne
              riservatezza, integrità e disponibilità.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Conservazione</h2>
            <p className="mt-4 leading-8">
              I dati sono conservati per il tempo strettamente necessario alle finalità per cui sono stati
              raccolti e, se richiesto dalla normativa, per i tempi ulteriori previsti dagli obblighi di legge.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">7. Comunicazione a terzi</h2>
            <p className="mt-4 leading-8">
              I dati possono essere trattati da fornitori tecnici che supportano il sito o la gestione delle
              richieste, nominati se necessario responsabili del trattamento. Non vengono diffusi indiscriminatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">8. Diritti dell’interessato</h2>
            <p className="mt-4 leading-8">
              L’interessato può chiedere accesso, rettifica, cancellazione, limitazione, opposizione e,
              nei casi previsti, portabilità dei dati, scrivendo a info@areaimmobiliare.com. Resta salvo
              il diritto di proporre reclamo all’Autorità Garante per la protezione dei dati personali.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">9. Cookie e strumenti di tracciamento</h2>
            <p className="mt-4 leading-8">
              Per il dettaglio sui cookie tecnici e sugli eventuali strumenti attivabili previo consenso,
              consulta la Cookie Policy dedicata.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">10. Aggiornamenti</h2>
            <p className="mt-4 leading-8">
              La presente informativa può essere aggiornata nel tempo per modifiche normative, tecniche
              o organizzative del sito.
            </p>
          </section>
        </div>
      </section>
      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}