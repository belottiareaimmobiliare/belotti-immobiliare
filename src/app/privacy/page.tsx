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
          Informativa sul trattamento dei dati personali ai sensi degli articoli 13 e 14
          del Regolamento UE 2016/679, relativo alla protezione delle persone fisiche
          con riguardo al trattamento dei dati personali.
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

            <p className="mt-4 leading-8">
              Per qualsiasi richiesta relativa al trattamento dei dati personali,
              l’interessato può contattare il titolare all’indirizzo email
              info@areaimmobiliare.com oppure tramite i recapiti indicati nella
              pagina contatti del sito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              2. Ambito di applicazione
            </h2>

            <p className="mt-4 leading-8">
              La presente informativa riguarda i dati personali trattati tramite il sito
              web, l’area pubblica, le schede immobiliari, i moduli di richiesta informazioni,
              la funzione di avviso per immobili simili, l’area amministrativa, le comunicazioni
              email automatiche e le attività connesse alla gestione degli immobili, dei clienti,
              delle richieste commerciali, degli incarichi e delle operazioni immobiliari.
            </p>

            <p className="mt-4 leading-8">
              L’informativa riguarda anche i trattamenti effettuati quando i dati vengono
              comunicati, sincronizzati, esportati, pubblicati o messi a disposizione di
              fornitori tecnici, piattaforme cloud, portali immobiliari, professionisti,
              collaboratori, partner commerciali o soggetti terzi necessari alla gestione
              dell’incarico, della richiesta o dell’operazione immobiliare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              3. Tipologie di dati trattati
            </h2>

            <p className="mt-4 leading-8">
              Il sito può trattare dati di navigazione, dati tecnici del dispositivo e del
              browser, log tecnici, indirizzi IP, identificativi di sessione, user agent,
              preferenze cookie, consensi prestati, dati di errore, dati di sicurezza e
              informazioni necessarie al funzionamento del servizio.
            </p>

            <p className="mt-4 leading-8">
              In caso di compilazione dei moduli presenti nelle schede immobile, possono
              essere trattati dati identificativi e di contatto come nome, cognome, email,
              numero di telefono, messaggio inserito dall’utente, immobile di interesse,
              data della richiesta, stato interno della richiesta, note operative e storico
              delle attività collegate.
            </p>

            <p className="mt-4 leading-8">
              In caso di utilizzo della funzione “Avvisami per immobili simili”, possono
              essere trattati nome, email, eventuale numero di telefono, immobile di partenza,
              zona, comune, provincia, fascia di prezzo, superficie, numero di locali, bagni,
              caratteristiche principali dell’immobile, coordinate approssimative o tecniche
              dell’immobile di partenza, raggio di ricerca e parametri necessari a individuare
              immobili simili.
            </p>

            <p className="mt-4 leading-8">
              Nell’ambito di incarichi, valutazioni, trattative o operazioni immobiliari,
              il titolare può trattare ulteriori dati forniti direttamente dall’interessato
              o necessari alla gestione della pratica, quali dati anagrafici, recapiti,
              informazioni sull’immobile, documentazione tecnica, catastale, urbanistica,
              amministrativa, condominiale, contrattuale, fiscale, creditizia, notarile,
              fotografica o planimetrica, nei limiti strettamente necessari alla finalità
              perseguita.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              4. Dati relativi agli immobili pubblicati
            </h2>

            <p className="mt-4 leading-8">
              Per la pubblicazione, promozione e gestione degli annunci immobiliari possono
              essere trattati dati relativi all’immobile, immagini, planimetrie, descrizioni,
              indirizzo o zona, coordinate, prezzo, tipologia, contratto, superficie,
              caratteristiche tecniche, stato dell’immobile, informazioni energetiche, dati
              catastali o ulteriori elementi necessari alla corretta presentazione dell’annuncio.
            </p>

            <p className="mt-4 leading-8">
              Ove tali informazioni siano riconducibili direttamente o indirettamente a una
              persona fisica, esse vengono trattate nel rispetto della normativa privacy e
              limitatamente alle finalità di gestione dell’incarico, promozione dell’immobile,
              ricerca di potenziali interessati e conclusione dell’operazione immobiliare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              5. Finalità del trattamento
            </h2>

            <p className="mt-4 leading-8">
              I dati possono essere trattati per consentire la navigazione del sito, garantire
              sicurezza, stabilità e corretto funzionamento del servizio, rispondere alle richieste
              inviate dall’utente, gestire contatti commerciali, appuntamenti, richieste di
              informazioni, richieste relative a immobili in vendita o in affitto, valutazioni,
              trattative e comunicazioni funzionali.
            </p>

            <p className="mt-4 leading-8">
              I dati possono inoltre essere trattati per salvare e gestire ricerche immobiliari,
              inviare codici di verifica, confermare la ricezione delle richieste, inviare avvisi
              relativi a immobili simili, suggerire la revisione dei parametri di ricerca, disattivare
              ricerche salvate, prevenire richieste duplicate, errate o non autorizzate, gestire
              lead, appuntamenti e ricontatti.
            </p>

            <p className="mt-4 leading-8">
              I dati possono essere trattati per finalità organizzative interne, quali gestione
              delle richieste nel pannello amministrativo, classificazione dello stato della richiesta,
              note interne, statistiche operative, controllo delle attività degli utenti autorizzati,
              gestione degli immobili, esportazione verso portali immobiliari, produzione di
              documentazione tecnica o commerciale e manutenzione del gestionale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              6. Pubblicazione e trasmissione dati a portali immobiliari
            </h2>

            <p className="mt-4 leading-8">
              Per promuovere gli immobili affidati all’agenzia, i dati relativi agli annunci
              possono essere pubblicati sul sito e trasmessi a portali immobiliari o piattaforme
              commerciali di settore, quali, a titolo esemplificativo, Immobiliare.it, Idealista,
              Casa.it, BergamoNews o altri canali analoghi utilizzati dall’agenzia.
            </p>

            <p className="mt-4 leading-8">
              La trasmissione ai portali può avvenire tramite caricamento manuale, file XML,
              feed automatizzati, esportazioni tecniche, API, pannelli gestionali o altri strumenti
              di sincronizzazione. Può includere titolo dell’annuncio, descrizione, prezzo, tipologia,
              contratto, superficie, località, immagini, planimetrie, classe energetica, caratteristiche
              dell’immobile, riferimenti dell’agenzia e altri dati necessari alla pubblicazione e gestione
              dell’annuncio.
            </p>

            <p className="mt-4 leading-8">
              Quando la pubblicazione o trasmissione riguarda dati personali del proprietario,
              dell’incaricante o di altri soggetti interessati, il trattamento avviene nei limiti
              necessari all’esecuzione dell’incarico, delle misure precontrattuali o contrattuali
              richieste, nonché per il legittimo interesse alla promozione dell’immobile affidato,
              salvo diverse disposizioni o specifiche opposizioni applicabili.
            </p>

            <p className="mt-4 leading-8">
              I portali e le piattaforme terze possono trattare i dati secondo le proprie condizioni
              contrattuali e informative privacy. Area Immobiliare invita gli interessati a consultare
              anche le informative privacy dei singoli portali utilizzati per la pubblicazione degli
              annunci.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              7. Fornitori tecnici, infrastruttura e piattaforme utilizzate
            </h2>

            <p className="mt-4 leading-8">
              Per realizzare, pubblicare, proteggere, mantenere e gestire il sito e il relativo
              gestionale, il titolare può avvalersi di fornitori tecnici e piattaforme cloud, anche
              esterne alla propria organizzazione.
            </p>

            <p className="mt-4 leading-8">
              Tra i fornitori e strumenti tecnici utilizzati o utilizzabili rientrano, a titolo
              esemplificativo e non esaustivo: Vercel per hosting, deploy, funzioni serverless,
              log tecnici e cron job; Supabase per database, autenticazione, storage e servizi
              collegati; GitHub per repository, versionamento del codice, tracciamento tecnico
              e collaborazione sullo sviluppo; Google, Google Cloud Platform, Google Workspace,
              Gmail/SMTP, Google Maps e servizi collegati per autenticazione, posta elettronica,
              mappe, recapiti, sicurezza, integrazioni o funzionalità tecniche.
            </p>

            <p className="mt-4 leading-8">
              Possono inoltre essere utilizzati servizi di posta elettronica, provider DNS, sistemi
              di backup, strumenti di monitoraggio, strumenti di sicurezza, sistemi di logging,
              strumenti di analisi tecnica, piattaforme di deploy, servizi di geocodifica, sistemi
              di gestione immagini, sistemi per generazione o gestione di export, API di terze parti
              e servizi equivalenti necessari all’evoluzione tecnica del sito.
            </p>

            <p className="mt-4 leading-8">
              Tali fornitori possono trattare dati personali, dati tecnici, dati di accesso, log,
              metadati, contenuti caricati, email, allegati, immagini, file, identificativi, token
              tecnici o altre informazioni necessarie all’erogazione del servizio. Il trattamento
              avviene nei limiti delle rispettive funzioni tecniche, delle impostazioni configurate,
              degli accordi applicabili e delle policy privacy dei fornitori.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              8. Repository codice, sviluppo e manutenzione
            </h2>

            <p className="mt-4 leading-8">
              Il codice sorgente del sito e del gestionale può essere gestito tramite piattaforme
              di versionamento come GitHub o strumenti equivalenti. Tali piattaforme possono
              trattare dati tecnici, log, cronologia delle modifiche, riferimenti a funzionalità,
              issue, commit, configurazioni, variabili non segrete, identificativi tecnici e dati
              necessari allo sviluppo e manutenzione del progetto.
            </p>

            <p className="mt-4 leading-8">
              Il titolare, i propri incaricati, collaboratori, sviluppatori, manutentori o fornitori
              tecnici possono accedere ai sistemi, ai dati e agli ambienti tecnici esclusivamente
              per finalità di sviluppo, manutenzione, sicurezza, correzione errori, aggiornamento,
              migrazione, backup, recupero dati, assistenza, verifica funzionale o miglioramento
              del servizio.
            </p>

            <p className="mt-4 leading-8">
              Le credenziali, i token, le password e le variabili segrete devono essere gestite
              con modalità riservate e non devono essere pubblicate intenzionalmente in repository
              o aree accessibili a soggetti non autorizzati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              9. Mappe, geocodifica e dati di localizzazione
            </h2>

            <p className="mt-4 leading-8">
              Il sito può utilizzare mappe, strumenti di geocodifica, coordinate, localizzazioni
              approssimative, dati del comune, provincia, zona o indirizzo dell’immobile per mostrare
              la posizione degli immobili, consentire ricerche geografiche, disegnare aree su mappa,
              individuare immobili simili entro un raggio prestabilito o migliorare la qualità della
              navigazione.
            </p>

            <p className="mt-4 leading-8">
              Tali funzionalità possono coinvolgere fornitori esterni come Google Maps, OpenStreetMap,
              servizi di geocodifica, librerie cartografiche o piattaforme equivalenti. Le mappe
              incorporate di terze parti possono essere caricate solo in base alle scelte cookie e
              preferenze dell’utente, quando previsto.
            </p>

            <p className="mt-4 leading-8">
              La posizione degli immobili può essere mostrata in modo puntuale o approssimativo
              in base alle impostazioni dell’annuncio e alle esigenze di riservatezza del proprietario,
              dell’incaricante o dell’agenzia.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              10. Comunicazione a professionisti, partner e soggetti terzi
            </h2>

            <p className="mt-4 leading-8">
              Quando necessario per gestire una richiesta, una trattativa, una valutazione o
              un’operazione immobiliare, i dati possono essere comunicati a soggetti terzi
              coinvolti nella pratica, quali notai, tecnici, geometri, architetti, amministratori
              condominiali, consulenti, istituti bancari, società finanziarie, imprese, artigiani,
              fornitori di servizi, portali immobiliari, consulenti informatici, sviluppatori,
              manutentori, hosting provider, cloud provider e fornitori software.
            </p>

            <p className="mt-4 leading-8">
              La comunicazione avviene solo quando necessaria, pertinente e proporzionata
              rispetto alla finalità perseguita, oppure quando richiesta da obblighi di legge,
              da autorità competenti o per la tutela dei diritti del titolare o dell’interessato.
            </p>

            <p className="mt-4 leading-8">
              I soggetti terzi possono operare, a seconda dei casi, come autonomi titolari del
              trattamento, responsabili del trattamento o soggetti autorizzati, in base al ruolo
              concretamente assunto nel servizio o nella pratica immobiliare.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              11. Form richiesta immobile
            </h2>

            <p className="mt-4 leading-8">
              Quando l’utente invia una richiesta da una scheda immobile, i dati forniti vengono
              utilizzati per consentire all’agenzia di prendere in carico la richiesta, ricontattare
              l’utente, fornire informazioni sull’immobile e gestire eventuali appuntamenti o
              approfondimenti.
            </p>

            <p className="mt-4 leading-8">
              Prima dell’invio definitivo può essere richiesto l’inserimento di un codice di verifica
              ricevuto via email. Tale verifica serve a ridurre richieste errate, duplicate o non
              autorizzate e a confermare che l’indirizzo email indicato sia effettivamente
              raggiungibile.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              12. Funzione “Avvisami per immobili simili”
            </h2>

            <p className="mt-4 leading-8">
              L’utente può richiedere di essere avvisato quando saranno disponibili immobili
              simili a quello consultato, sulla base di zona, fascia di prezzo, superficie,
              numero di locali, tipologia e altre caratteristiche principali.
            </p>

            <p className="mt-4 leading-8">
              La funzione può utilizzare i dati dell’immobile consultato come modello di partenza
              e confrontarli con gli immobili presenti sul sito o pubblicati successivamente.
              Se disponibili, possono essere utilizzate coordinate o localizzazioni tecniche per
              individuare immobili in una zona coerente o in un raggio di ricerca prestabilito.
            </p>

            <p className="mt-4 leading-8">
              Anche questa funzione può richiedere una verifica tramite codice inviato via email.
              Una volta confermata la richiesta, il sistema può inviare comunicazioni automatiche
              solo quando vengono individuati immobili coerenti con i parametri salvati oppure,
              dopo un periodo senza risultati, un messaggio di suggerimento per rivedere i criteri
              di ricerca o contattare l’agenzia.
            </p>

            <p className="mt-4 leading-8">
              Per evitare duplicazioni, il sistema può impedire la presenza di più ricerche attive
              associate alla stessa email. Se l’utente ha già una ricerca attiva, può disattivarla
              prima di crearne una nuova.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              13. Comunicazioni automatiche e disattivazione
            </h2>

            <p className="mt-4 leading-8">
              Le comunicazioni inviate in relazione alle richieste immobiliari e alle ricerche
              salvate hanno natura funzionale alla richiesta effettuata dall’utente. Possono
              includere codici di verifica, conferme di ricezione, aggiornamenti su immobili
              simili, avvisi relativi alla ricerca salvata e comunicazioni necessarie alla gestione
              della richiesta.
            </p>

            <p className="mt-4 leading-8">
              Le email relative alle ricerche salvate includono, quando previsto, un collegamento
              per disattivare la ricerca. La disattivazione interrompe l’invio degli aggiornamenti
              automatici relativi a quella specifica ricerca.
            </p>

            <p className="mt-4 leading-8">
              Tali comunicazioni non sono inviate come newsletter promozionale generalizzata,
              ma come servizio funzionale alla richiesta specifica dell’utente. Eventuali comunicazioni
              promozionali ulteriori saranno inviate solo in presenza di una base giuridica idonea.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              14. Area amministrativa, utenti interni, KPI e log
            </h2>

            <p className="mt-4 leading-8">
              L’area amministrativa del sito può consentire la gestione di immobili, immagini,
              planimetrie, news, contenuti del sito, lead, ricerche salvate, utenti interni, ruoli,
              permessi, esportazioni e log attività.
            </p>

            <p className="mt-4 leading-8">
              I dati degli utenti autorizzati al gestionale, inclusi nome, username, email,
              ruolo, permessi, attività effettuate, accessi, azioni amministrative, operazioni su
              immobili, KPI e log, possono essere trattati per finalità di sicurezza, organizzazione,
              tracciabilità, controllo operativo e corretta gestione del sito.
            </p>

            <p className="mt-4 leading-8">
              Alcune operazioni sensibili, come la pulizia dei KPI o altre azioni amministrative,
              possono richiedere una conferma tramite codice email o altra verifica, al fine di
              ridurre il rischio di cancellazioni o modifiche accidentali.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              15. Backup, sicurezza, log tecnici e conservazione tecnica
            </h2>

            <p className="mt-4 leading-8">
              Per esigenze di sicurezza, continuità operativa, manutenzione, troubleshooting,
              audit tecnico, prevenzione abusi e ripristino del servizio, dati personali e tecnici
              possono essere temporaneamente presenti in backup, log server, log applicativi,
              sistemi di monitoraggio, ambienti di deploy, strumenti di diagnostica, database,
              storage, repository o sistemi di posta.
            </p>

            <p className="mt-4 leading-8">
              La cancellazione o modifica di dati presenti nei sistemi principali può non comportare
              la cancellazione immediata da tutti i backup tecnici, ove questi siano conservati per
              finalità di sicurezza, continuità o obblighi tecnici. In tali casi, i dati verranno mantenuti
              protetti e rimossi o sovrascritti secondo i cicli tecnici applicabili.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              16. Base giuridica del trattamento
            </h2>

            <p className="mt-4 leading-8">
              Il trattamento può fondarsi, a seconda dei casi, sull’esecuzione di misure
              precontrattuali richieste dall’interessato, sull’esecuzione di un contratto o incarico,
              sull’adempimento di obblighi di legge, sul legittimo interesse del titolare alla
              sicurezza, alla gestione tecnica del sito, alla prevenzione di abusi, alla tutela dei
              propri diritti, alla gestione amministrativa e commerciale delle richieste, alla
              manutenzione del sito e alla promozione degli immobili affidati.
            </p>

            <p className="mt-4 leading-8">
              Per cookie, contenuti facoltativi, comunicazioni non strettamente funzionali o
              ulteriori trattamenti che lo richiedano, la base giuridica è il consenso dell’utente.
              Il consenso prestato tramite checkbox nei moduli serve a confermare la presa visione
              dell’informativa e l’autorizzazione al trattamento dei dati per la finalità indicata
              nel modulo stesso.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              17. Modalità del trattamento e sicurezza
            </h2>

            <p className="mt-4 leading-8">
              I dati sono trattati con strumenti elettronici, telematici e organizzativi idonei
              a garantirne riservatezza, integrità, disponibilità e sicurezza, in misura adeguata
              alla natura dei dati trattati e alle finalità perseguite.
            </p>

            <p className="mt-4 leading-8">
              L’accesso all’area amministrativa è riservato a utenti autorizzati. Le funzionalità
              amministrative possono prevedere ruoli, permessi, autenticazione sicura, controlli
              interni, log attività e verifiche tramite codice email per operazioni considerate
              sensibili.
            </p>

            <p className="mt-4 leading-8">
              Il titolare adotta misure ragionevoli per ridurre il rischio di accessi non autorizzati,
              perdita, modifica, divulgazione impropria o trattamento non conforme dei dati. Resta
              inteso che nessun sistema informatico può garantire sicurezza assoluta.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              18. Conservazione dei dati
            </h2>

            <p className="mt-4 leading-8">
              I dati sono conservati per il tempo necessario al raggiungimento delle finalità per cui
              sono stati raccolti e, ove richiesto, per i tempi ulteriori previsti dalla normativa
              applicabile o necessari alla tutela dei diritti del titolare.
            </p>

            <p className="mt-4 leading-8">
              Le richieste inviate tramite i moduli possono essere conservate nel pannello
              amministrativo per consentire la gestione commerciale e operativa della richiesta.
              Le ricerche salvate possono essere conservate finché restano attive, fino alla
              disattivazione da parte dell’utente o fino alla cancellazione/archiviazione automatica
              prevista dal sistema in caso di inattività o assenza prolungata di risultati.
            </p>

            <p className="mt-4 leading-8">
              I dati connessi a incarichi, trattative, contratti, adempimenti fiscali, contabili,
              antiriciclaggio, amministrativi o legali possono essere conservati per i termini previsti
              dalla normativa applicabile e per il tempo necessario alla tutela dei diritti del titolare
              o dell’interessato.
            </p>

            <p className="mt-4 leading-8">
              I codici di verifica hanno durata limitata e vengono utilizzati solo per confermare
              l’operazione richiesta. Le preferenze relative ai cookie e ai contenuti facoltativi sono
              conservate per il periodo tecnico necessario a ricordare la scelta dell’utente, salvo
              successiva modifica o revoca.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              19. Destinatari dei dati
            </h2>

            <p className="mt-4 leading-8">
              I dati possono essere trattati da personale autorizzato del titolare e da soggetti esterni
              che forniscono servizi necessari alla gestione del sito, dell’agenzia e delle operazioni
              immobiliari.
            </p>

            <p className="mt-4 leading-8">
              Tra i possibili destinatari rientrano fornitori di hosting e infrastruttura cloud, Vercel,
              Supabase, GitHub, Google, Google Cloud Platform, Google Workspace, Gmail/SMTP,
              Google Maps, provider DNS, servizi email, servizi di autenticazione, manutentori
              informatici, sviluppatori, gestori di piattaforme web, portali immobiliari, sistemi di
              esportazione annunci, consulenti, tecnici, notai, istituti bancari, amministratori
              condominiali, professionisti, autorità competenti e fornitori equivalenti.
            </p>

            <p className="mt-4 leading-8">
              I dati non vengono venduti a terzi. La comunicazione a soggetti esterni avviene solo
              nei limiti della finalità perseguita, degli obblighi contrattuali o normativi e delle necessità
              operative della pratica immobiliare, del sito o del gestionale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              20. Trasferimento di dati fuori dallo Spazio Economico Europeo
            </h2>

            <p className="mt-4 leading-8">
              Alcuni fornitori tecnici, piattaforme cloud, servizi email, strumenti di autenticazione,
              mappe, repository codice, sistemi di log, piattaforme di deploy o portali terzi potrebbero
              trattare dati anche al di fuori dello Spazio Economico Europeo.
            </p>

            <p className="mt-4 leading-8">
              In tali casi, ove applicabile, il trasferimento avviene nel rispetto delle garanzie previste
              dal GDPR, quali decisioni di adeguatezza, clausole contrattuali standard, misure
              supplementari o altri strumenti riconosciuti dalla normativa. L’utilizzo di servizi esterni
              può inoltre essere regolato dalle rispettive condizioni contrattuali, informative privacy
              e documentazione sul trattamento dei dati.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              21. Contenuti di terze parti e Google Maps
            </h2>

            <p className="mt-4 leading-8">
              La pagina contatti può mostrare una mappa incorporata di Google solo dopo una scelta
              positiva dell’utente sui cookie o contenuti facoltativi. In assenza di tale scelta, il
              contenuto esterno resta bloccato e l’utente può aprire la posizione direttamente sul sito
              di Google Maps tramite collegamento esterno.
            </p>

            <p className="mt-4 leading-8">
              L’utilizzo di servizi Google Maps comporta il coinvolgimento di Google come fornitore
              terzo. Per maggiori dettagli sul trattamento effettuato da Google, l’utente può consultare
              la relativa informativa privacy disponibile sui siti Google.
            </p>

            <p className="mt-4 leading-8">
              Per informazioni generali sul funzionamento dei cookie e dei contenuti esterni utilizzati
              dal sito, consulta anche la{' '}
              <Link href="/cookie" className="text-white underline underline-offset-4">
                Cookie Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              22. Natura del conferimento
            </h2>

            <p className="mt-4 leading-8">
              Il conferimento dei dati richiesti nei moduli di contatto, richiesta immobile o avviso
              per immobili simili è facoltativo. Tuttavia, il mancato inserimento delle informazioni
              indicate come necessarie o la mancata accettazione dell’informativa privacy può impedire
              la gestione della richiesta, l’invio del codice di verifica o il successivo ricontatto da parte
              dell’agenzia.
            </p>

            <p className="mt-4 leading-8">
              Nell’ambito di incarichi immobiliari, trattative o adempimenti connessi, il conferimento
              di alcuni dati può essere necessario per adempiere a obblighi contrattuali, normativi,
              fiscali, amministrativi o professionali. Il mancato conferimento può impedire o limitare
              la gestione dell’incarico o dell’operazione.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              23. Diritti dell’interessato
            </h2>

            <p className="mt-4 leading-8">
              L’interessato può esercitare, nei casi previsti dalla normativa, i diritti di accesso,
              rettifica, cancellazione, limitazione del trattamento, opposizione, portabilità dei dati
              e revoca del consenso, quando il trattamento è basato sul consenso, contattando il
              titolare all’indirizzo info@areaimmobiliare.com.
            </p>

            <p className="mt-4 leading-8">
              L’esercizio dei diritti può essere soggetto ai limiti previsti dalla normativa applicabile,
              ad esempio quando la conservazione dei dati sia necessaria per obblighi di legge, per
              l’accertamento, l’esercizio o la difesa di un diritto, o per esigenze contrattuali ancora
              in corso.
            </p>

            <p className="mt-4 leading-8">
              Resta salvo il diritto di proporre reclamo all’Autorità Garante per la protezione dei dati
              personali secondo le modalità previste dalla normativa vigente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white">
              24. Cookie e preferenze
            </h2>

            <p className="mt-4 leading-8">
              Il sito utilizza cookie tecnici necessari al funzionamento del servizio. Eventuali cookie
              o strumenti facoltativi vengono attivati solo secondo la scelta dell’utente. Le preferenze
              possono essere aggiornate in qualsiasi momento dal banner richiamabile dal sito oppure
              dalla pagina{' '}
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
              25. Aggiornamenti dell’informativa
            </h2>

            <p className="mt-4 leading-8">
              La presente informativa può essere modificata o aggiornata nel tempo per esigenze
              normative, tecniche, organizzative, contrattuali o funzionali del sito. La versione
              pubblicata su questa pagina è quella attualmente in vigore.
            </p>

            <p className="mt-4 leading-8">
              Eventuali nuove funzionalità, nuovi fornitori, nuovi portali, nuove piattaforme tecniche
              o nuove modalità operative potranno comportare l’aggiornamento della presente
              informativa.
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
