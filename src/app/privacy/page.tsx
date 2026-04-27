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

        <p className="mt-5 max-w-3xl text-sm leading-7 text-white/56">
          Informativa sul trattamento dei dati personali ai sensi della normativa
          applicabile in materia di protezione dei dati personali. La presente
          informativa descrive come vengono trattati i dati raccolti tramite il sito,
          i moduli di contatto, le richieste sugli immobili e le funzioni di avviso
          per immobili simili.
        </p>

        <div className="mt-10 space-y-10 text-white/72">
          <section>
            <h2 className="text-2xl font-semibold text-white">
              1. Titolare del trattamento
            </h2>

            <p className="mt-4 leading-8">
              Il titolare del trattamento è{' '}
              <strong>
                AREA IMMOBILIARE SAS di Belotti Gianfederico &amp; C.
              </strong>
              , con sede in Via Antonio Locatelli 62, 24121 Bergamo, C.F. e
              P.IVA 02610660165, PEC areaimmobiliaresas@legalmail.it, email di
              contatto info@areaimmobiliare.com.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Tipologie di dati trattati
            </h2>

            <p className="mt-4 leading-8">
              Il sito può trattare dati di navigazione, dati tecnici del dispositivo
              e del browser, log tecnici, dati conferiti volontariamente dall’utente
              tramite moduli di contatto o richieste relative agli immobili, oltre
              alle informazioni strettamente necessarie a memorizzare le preferenze
              sui cookie e sui contenuti esterni.
            </p>

            <p className="mt-4 leading-8">
              In caso di compilazione dei moduli presenti nelle schede immobile,
              possono essere trattati dati identificativi e di contatto come nome,
              cognome, email, numero di telefono, messaggio inserito dall’utente,
              immobile di interesse, data della richiesta e stato interno della
              gestione della richiesta.
            </p>

            <p className="mt-4 leading-8">
              In caso di utilizzo della funzione “Avvisami per immobili simili”,
              possono essere trattati nome, email, eventuale numero di telefono,
              immobile di partenza, zona, fascia di prezzo, caratteristiche principali
              dell’immobile e parametri tecnici necessari a individuare immobili
              simili.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Form richiesta immobile
            </h2>

            <p className="mt-4 leading-8">
              Quando l’utente invia una richiesta da una scheda immobile, i dati
              forniti vengono utilizzati per consentire all’agenzia di prendere in
              carico la richiesta, ricontattare l’utente, fornire informazioni
              sull’immobile e gestire eventuali appuntamenti o approfondimenti.
            </p>

            <p className="mt-4 leading-8">
              Prima dell’invio definitivo può essere richiesto l’inserimento di un
              codice di verifica ricevuto via email. Tale verifica serve a ridurre
              richieste errate, duplicate o non autorizzate e a confermare che
              l’indirizzo email indicato sia effettivamente raggiungibile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Funzione “Avvisami per immobili simili”
            </h2>

            <p className="mt-4 leading-8">
              L’utente può richiedere di essere avvisato quando saranno disponibili
              immobili simili a quello consultato, sulla base di zona, fascia di
              prezzo, superficie, numero di locali, tipologia e altre caratteristiche
              principali.
            </p>

            <p className="mt-4 leading-8">
              Anche questa funzione può richiedere una verifica tramite codice
              inviato via email. Una volta confermata la richiesta, il sistema può
              inviare comunicazioni automatiche solo quando vengono individuati
              immobili coerenti con i parametri salvati oppure, dopo un periodo senza
              risultati, un messaggio di suggerimento per rivedere i criteri di ricerca
              o contattare l’agenzia.
            </p>

            <p className="mt-4 leading-8">
              Per evitare duplicazioni, il sistema può impedire la presenza di più
              ricerche attive associate alla stessa email. Se l’utente ha già una
              ricerca attiva, può disattivarla prima di crearne una nuova.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Comunicazioni automatiche e disattivazione
            </h2>

            <p className="mt-4 leading-8">
              Le comunicazioni inviate in relazione alle richieste immobiliari e alle
              ricerche salvate hanno natura funzionale alla richiesta effettuata
              dall’utente. Possono includere codici di verifica, conferme di ricezione,
              aggiornamenti su immobili simili o avvisi relativi alla ricerca salvata.
            </p>

            <p className="mt-4 leading-8">
              Le email relative alle ricerche salvate includono, quando previsto,
              un collegamento per disattivare la ricerca. La disattivazione interrompe
              l’invio degli aggiornamenti automatici relativi a quella specifica
              ricerca.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Finalità del trattamento
            </h2>

            <p className="mt-4 leading-8">
              I dati possono essere trattati per consentire la navigazione del sito,
              garantire la sicurezza tecnica del servizio, rispondere alle richieste
              inviate dall’utente, gestire contatti commerciali, appuntamenti,
              richieste di informazioni, richieste relative a immobili in vendita o
              in affitto, ricerche salvate e comunicazioni funzionali collegate.
            </p>

            <p className="mt-4 leading-8">
              I dati possono inoltre essere utilizzati per finalità organizzative
              interne, come gestione delle richieste nel pannello amministrativo,
              classificazione dello stato della richiesta, note interne, statistiche
              operative e controllo delle attività svolte dagli utenti autorizzati
              del sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Base giuridica del trattamento
            </h2>

            <p className="mt-4 leading-8">
              Il trattamento si fonda, a seconda dei casi, sull’esecuzione di misure
              precontrattuali richieste dall’interessato, sull’adempimento di obblighi
              di legge, sul legittimo interesse del titolare alla sicurezza e corretta
              gestione tecnica del sito, nonché sul consenso dell’utente per cookie,
              contenuti facoltativi e specifiche funzionalità che richiedono una scelta
              esplicita.
            </p>

            <p className="mt-4 leading-8">
              Il consenso prestato tramite checkbox nei moduli serve a confermare la
              presa visione dell’informativa e l’autorizzazione al trattamento dei dati
              per la finalità indicata nel modulo stesso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              8. Modalità del trattamento e sicurezza
            </h2>

            <p className="mt-4 leading-8">
              I dati sono trattati con strumenti elettronici, telematici e organizzativi
              idonei a garantirne riservatezza, integrità, disponibilità e sicurezza,
              in misura adeguata alla natura dei dati trattati e alle finalità perseguite.
            </p>

            <p className="mt-4 leading-8">
              L’accesso all’area amministrativa è riservato a utenti autorizzati.
              Le funzionalità amministrative possono prevedere ruoli, permessi,
              autenticazione sicura, controlli interni, log attività e verifiche tramite
              codice email per operazioni considerate sensibili.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              9. Conservazione dei dati
            </h2>

            <p className="mt-4 leading-8">
              I dati sono conservati per il tempo necessario al raggiungimento delle
              finalità per cui sono stati raccolti e, ove richiesto, per i tempi ulteriori
              previsti dalla normativa applicabile o necessari alla tutela dei diritti
              del titolare.
            </p>

            <p className="mt-4 leading-8">
              Le richieste inviate tramite i moduli possono essere conservate nel
              pannello amministrativo per consentire la gestione commerciale e operativa
              della richiesta. Le ricerche salvate possono essere conservate finché
              restano attive, fino alla disattivazione da parte dell’utente o fino alla
              cancellazione/archiviazione automatica prevista dal sistema in caso di
              inattività o assenza prolungata di risultati.
            </p>

            <p className="mt-4 leading-8">
              I codici di verifica hanno durata limitata e vengono utilizzati solo per
              confermare l’operazione richiesta. Le preferenze relative ai cookie e ai
              contenuti facoltativi sono conservate per il periodo tecnico necessario
              a ricordare la scelta dell’utente, salvo successiva modifica o revoca.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              10. Comunicazione dei dati e soggetti coinvolti
            </h2>

            <p className="mt-4 leading-8">
              I dati possono essere trattati da fornitori di servizi tecnici, hosting,
              infrastruttura cloud, database, sistemi di posta elettronica, strumenti
              di gestione del sito, sistemi di autenticazione e servizi necessari alla
              corretta gestione delle richieste.
            </p>

            <p className="mt-4 leading-8">
              Tali soggetti trattano i dati nei limiti necessari al corretto funzionamento
              del servizio e, ove applicabile, in qualità di responsabili del trattamento
              o soggetti autorizzati. I dati non vengono diffusi indiscriminatamente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              11. Contenuti di terze parti e Google Maps
            </h2>

            <p className="mt-4 leading-8">
              La pagina contatti può mostrare una mappa incorporata di Google solo dopo
              una scelta positiva dell’utente sui cookie o contenuti facoltativi. In
              assenza di tale scelta, il contenuto esterno resta bloccato e l’utente può
              aprire la posizione direttamente sul sito di Google Maps tramite collegamento
              esterno.
            </p>

            <p className="mt-4 leading-8">
              L’utilizzo di servizi Google Maps comporta il coinvolgimento di Google come
              fornitore terzo. Per maggiori dettagli sul trattamento effettuato da Google,
              l’utente può consultare la relativa informativa privacy disponibile sui siti
              Google.
            </p>

            <p className="mt-4 leading-8">
              Per informazioni generali sul funzionamento dei cookie e dei contenuti esterni
              utilizzati dal sito, consulta anche la{' '}
              <Link href="/cookie" className="text-white underline underline-offset-4">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              12. Natura del conferimento
            </h2>

            <p className="mt-4 leading-8">
              Il conferimento dei dati richiesti nei moduli di contatto, richiesta immobile
              o avviso per immobili simili è facoltativo. Tuttavia, il mancato inserimento
              delle informazioni indicate come necessarie o la mancata accettazione
              dell’informativa privacy può impedire la gestione della richiesta, l’invio
              del codice di verifica o il successivo ricontatto da parte dell’agenzia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              13. Diritti dell’interessato
            </h2>

            <p className="mt-4 leading-8">
              L’interessato può esercitare, nei casi previsti dalla normativa, i diritti
              di accesso, rettifica, cancellazione, limitazione del trattamento, opposizione
              e portabilità dei dati, contattando il titolare all’indirizzo
              info@areaimmobiliare.com.
            </p>

            <p className="mt-4 leading-8">
              Resta salvo il diritto di proporre reclamo all’Autorità Garante per la
              protezione dei dati personali secondo le modalità previste dalla normativa
              vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              14. Cookie e preferenze
            </h2>

            <p className="mt-4 leading-8">
              Il sito utilizza cookie tecnici necessari al funzionamento del servizio.
              Eventuali cookie o strumenti facoltativi vengono attivati solo secondo la
              scelta dell’utente. Le preferenze possono essere aggiornate in qualsiasi
              momento dal banner richiamabile dal sito oppure dalla pagina{' '}
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
              15. Aggiornamenti dell’informativa
            </h2>

            <p className="mt-4 leading-8">
              La presente informativa può essere modificata o aggiornata nel tempo per
              esigenze normative, tecniche, organizzative o funzionali del sito. La versione
              pubblicata su questa pagina è quella attualmente in vigore.
            </p>

            <p className="mt-4 leading-8 text-white/56">
              Ultimo aggiornamento: aprile 2026.
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
