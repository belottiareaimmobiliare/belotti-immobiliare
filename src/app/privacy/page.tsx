import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import Link from 'next/link'

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
            <h2 className="text-2xl font-semibold text-white">
              1. Titolare del trattamento
            </h2>
            <p className="mt-4 leading-8">
              Il titolare del trattamento è <strong>AREA IMMOBILIARE SAS di Belotti Gianfederico &amp; C.</strong>,
              con sede in Via Antonio Locatelli 62, 24121 Bergamo, C.F. e P.IVA 02610660165,
              PEC areaimmobiliaresas@legalmail.it, email di contatto info@areaimmobiliare.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Tipologie di dati trattati
            </h2>
            <p className="mt-4 leading-8">
              Il sito può trattare dati di navigazione, dati tecnici del dispositivo e del browser,
              dati conferiti volontariamente dall’utente attraverso moduli di contatto o richieste
              relative agli immobili, oltre alle informazioni strettamente necessarie a memorizzare
              le preferenze sui cookie e sui contenuti esterni.
            </p>
            <p className="mt-4 leading-8">
              In caso di invio di una richiesta, possono essere trattati dati identificativi e di contatto
              come nome, cognome, email, numero di telefono e ogni ulteriore informazione inserita
              volontariamente nel messaggio.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Finalità del trattamento
            </h2>
            <p className="mt-4 leading-8">
              I dati possono essere trattati per consentire la navigazione del sito, garantire la sicurezza
              tecnica del servizio, rispondere alle richieste inviate dall’utente, gestire contatti commerciali,
              appuntamenti, richieste di informazioni e richieste relative a immobili in vendita o in affitto.
            </p>
            <p className="mt-4 leading-8">
              Ove l’utente lo consenta, il sito può inoltre attivare contenuti di terze parti o strumenti
              facoltativi collegati ai cookie, come contenuti esterni incorporati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Base giuridica del trattamento
            </h2>
            <p className="mt-4 leading-8">
              Il trattamento si fonda, a seconda dei casi, su una o più delle seguenti basi giuridiche:
              esecuzione di misure precontrattuali richieste dall’interessato, adempimento di obblighi
              di legge, legittimo interesse del titolare alla sicurezza e corretta gestione tecnica del sito,
              nonché consenso dell’utente per cookie o strumenti non tecnici e per contenuti esterni
              attivati su base facoltativa.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Modalità del trattamento
            </h2>
            <p className="mt-4 leading-8">
              I dati sono trattati con strumenti elettronici e organizzativi idonei a garantirne riservatezza,
              integrità, disponibilità e sicurezza, in misura adeguata alla natura dei dati trattati e alle finalità
              perseguite.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Conservazione dei dati
            </h2>
            <p className="mt-4 leading-8">
              I dati sono conservati per il tempo strettamente necessario al raggiungimento delle finalità
              per cui sono stati raccolti e, ove richiesto, per i tempi ulteriori previsti dalla normativa applicabile
              o necessari alla tutela dei diritti del titolare.
            </p>
            <p className="mt-4 leading-8">
              Le preferenze relative ai cookie e ai contenuti facoltativi sono conservate per il periodo tecnico
              necessario a ricordare la scelta dell’utente, salvo successiva modifica o revoca.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Comunicazione dei dati e soggetti coinvolti
            </h2>
            <p className="mt-4 leading-8">
              I dati possono essere trattati da fornitori di servizi tecnici, hosting, infrastruttura cloud,
              strumenti di gestione del sito, sistemi di posta o gestione richieste, nei limiti necessari al corretto
              funzionamento del servizio e, se del caso, in qualità di responsabili del trattamento o soggetti
              autorizzati. I dati non vengono diffusi indiscriminatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              8. Contenuti di terze parti e Google Maps
            </h2>
            <p className="mt-4 leading-8">
              La pagina contatti può mostrare una mappa incorporata di Google solo dopo una scelta positiva
              dell’utente sui cookie o contenuti facoltativi. In assenza di tale scelta, il contenuto esterno resta
              bloccato e l’utente può aprire la posizione direttamente sul sito di Google Maps tramite collegamento esterno.
            </p>
            <p className="mt-4 leading-8">
              L’utilizzo di servizi Google Maps comporta il coinvolgimento di Google come fornitore terzo.
              Per maggiori dettagli sul trattamento effettuato da Google, l’utente può consultare la relativa
              informativa privacy disponibile sui siti Google.
            </p>
            <p className="mt-4 leading-8">
              Per informazioni generali sul funzionamento dei cookie e dei contenuti esterni utilizzati dal sito,
              consulta anche la <Link href="/cookie" className="text-white underline underline-offset-4">Cookie Policy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              9. Natura del conferimento
            </h2>
            <p className="mt-4 leading-8">
              Il conferimento dei dati richiesti nei moduli di contatto è facoltativo, ma il mancato inserimento
              delle informazioni indicate come necessarie può impedire la gestione della richiesta o il successivo
              ricontatto da parte dell’agenzia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              10. Diritti dell’interessato
            </h2>
            <p className="mt-4 leading-8">
              L’interessato può esercitare, nei casi previsti dalla normativa, i diritti di accesso, rettifica,
              cancellazione, limitazione del trattamento, opposizione e portabilità dei dati, contattando
              il titolare all’indirizzo info@areaimmobiliare.com.
            </p>
            <p className="mt-4 leading-8">
              Resta salvo il diritto di proporre reclamo all’Autorità Garante per la protezione dei dati personali
              secondo le modalità previste dalla normativa vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              11. Cookie e preferenze
            </h2>
            <p className="mt-4 leading-8">
              Il sito utilizza cookie tecnici necessari al funzionamento del servizio. Eventuali cookie o strumenti
              facoltativi vengono attivati solo secondo la scelta dell’utente. Le preferenze possono essere aggiornate
              in qualsiasi momento dal banner richiamabile dal sito oppure dalla pagina{' '}
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
              12. Aggiornamenti dell’informativa
            </h2>
            <p className="mt-4 leading-8">
              La presente informativa può essere modificata o aggiornata nel tempo per esigenze normative,
              tecniche, organizzative o funzionali del sito. La versione pubblicata su questa pagina è quella
              attualmente in vigore.
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