import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Link from 'next/link'

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
            <h2 className="text-2xl font-semibold text-white">
              1. Cosa sono i cookie
            </h2>
            <p className="mt-4 leading-8">
              I cookie sono piccoli file di testo che i siti visitati inviano al
              dispositivo dell’utente, dove vengono memorizzati per essere poi
              ritrasmessi agli stessi siti alla visita successiva.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Tipologie di cookie utilizzati
            </h2>

            <p className="mt-4 leading-8">
              Questo sito utilizza principalmente:
            </p>

            <ul className="mt-4 space-y-3 leading-8">
              <li>
                <strong>Cookie tecnici:</strong> necessari al funzionamento del
                sito, non richiedono consenso.
              </li>
              <li>
                <strong>Cookie facoltativi:</strong> attivati solo previo consenso
                dell’utente, per contenuti esterni o funzionalità aggiuntive.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Cookie di terze parti
            </h2>
            <p className="mt-4 leading-8">
              Il sito può integrare contenuti di terze parti, come mappe
              interattive. Tali contenuti vengono caricati solo dopo una scelta
              esplicita dell’utente e possono comportare il trattamento di dati da
              parte dei rispettivi fornitori.
            </p>

            <p className="mt-4 leading-8">
              Per maggiori informazioni si invita a consultare le informative
              privacy dei rispettivi servizi esterni.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Gestione del consenso
            </h2>
            <p className="mt-4 leading-8">
              Al primo accesso al sito, l’utente può scegliere se accettare o
              rifiutare i cookie facoltativi tramite il banner dedicato.
            </p>

            <p className="mt-4 leading-8">
              È sempre possibile modificare la propria scelta in qualsiasi momento
              attraverso il pulsante dedicato oppure dalla pagina{' '}
              <Link
                href="/preferenze-cookie"
                className="text-white underline underline-offset-4"
              >
                Preferenze cookie
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Conservazione delle preferenze
            </h2>
            <p className="mt-4 leading-8">
              Le preferenze sui cookie vengono memorizzate per consentire al sito
              di ricordare le scelte dell’utente e non riproporre il banner ad ogni
              visita, salvo modifiche manuali.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Come gestire o cancellare i cookie
            </h2>
            <p className="mt-4 leading-8">
              L’utente può gestire o disabilitare i cookie anche tramite le
              impostazioni del proprio browser. Di seguito alcuni link utili alle
              guide ufficiali dei principali browser:
            </p>

            <ul className="mt-4 space-y-2 leading-8">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/it-it/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4"
                >
                  Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/it-it/help/4027947"
                  target="_blank"
                  rel="noreferrer"
                  className="text-white underline underline-offset-4"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>

            <p className="mt-4 leading-8">
              La disattivazione dei cookie tecnici potrebbe compromettere il
              corretto funzionamento del sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Log tecnici e sicurezza
            </h2>
            <p className="mt-4 leading-8">
              Per esigenze tecniche e di sicurezza, i sistemi che ospitano il sito
              possono registrare informazioni tecniche di accesso e funzionamento,
              come log di sistema, indirizzi IP, dati di errore e richieste
              ricevute dal server. Tali informazioni vengono trattate per garantire
              stabilità, sicurezza e continuità del servizio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              8. Collegamenti utili
            </h2>
            <p className="mt-4 leading-8">
              Per ulteriori informazioni sul trattamento dei dati personali,
              consulta la{' '}
              <Link
                href="/privacy"
                className="text-white underline underline-offset-4"
              >
                Privacy Policy
              </Link>
              .
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