import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'

export default function CookiePage() {
  return (
    <main className="min-h-screen bg-[#050b16] text-white">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-sm uppercase tracking-[0.3em] text-white/40">
          Informativa
        </p>
        <h1 className="mt-3 text-4xl font-semibold">Cookie Policy</h1>

        <div className="mt-10 space-y-10 text-white/72">
          <section>
            <h2 className="text-2xl font-semibold text-white">1. Cosa sono i cookie</h2>
            <p className="mt-4 leading-8">
              I cookie sono piccoli file di testo che il sito può memorizzare sul dispositivo
              dell’utente per consentire funzioni tecniche, memorizzare preferenze o, ove previsto,
              raccogliere informazioni statistiche o di profilazione.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">2. Cookie tecnici</h2>
            <p className="mt-4 leading-8">
              Il sito utilizza cookie tecnici o strumenti equivalenti necessari al funzionamento
              della navigazione, alla sicurezza del servizio e alla memorizzazione delle preferenze
              essenziali, inclusa la gestione della scelta sui cookie.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">3. Cookie analitici e marketing</h2>
            <p className="mt-4 leading-8">
              Eventuali cookie analitici non anonimizzati o strumenti di marketing non vengono attivati
              in modo predefinito e richiedono una scelta positiva dell’utente tramite banner o area
              preferenze, quando presenti nel sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">4. Gestione del consenso</h2>
            <p className="mt-4 leading-8">
              L’utente può accettare tutti i cookie facoltativi, rifiutarli o personalizzare le preferenze.
              Le preferenze possono essere riviste successivamente dall’apposita area dedicata.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">5. Come modificare le preferenze</h2>
            <p className="mt-4 leading-8">
              Le preferenze possono essere modificate dalla pagina “Preferenze cookie” oppure intervenendo
              direttamente sulle impostazioni del browser, tenendo conto che la disattivazione dei cookie
              tecnici può compromettere il corretto funzionamento del sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">6. Aggiornamenti</h2>
            <p className="mt-4 leading-8">
              La presente Cookie Policy può essere aggiornata nel tempo in caso di modifiche tecniche,
              normative o di nuovi strumenti utilizzati sul sito.
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