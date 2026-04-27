export const HOME_CONTENT_KEY = 'home_page'
export const ABOUT_CONTENT_KEY = 'about_page'
export const CONTACTS_CONTENT_KEY = 'contacts'
export const GIANFEDERICO_BELOTTI_CONTENT_KEY = 'gianfederico_belotti_page'

export type HomeContent = {
  overline: string
  title: string
  subtitle: string
  stat1Enabled: boolean
  stat1: string
  stat2Enabled: boolean
  stat2: string
  stat3Enabled: boolean
  stat3: string
}

export type ContactsContent = {
  heroOverline: string
  heroTitle: string
  heroSubtitle: string
  phoneLabel: string
  phoneHref: string
  whatsappNumber: string
  ownerCtaOverline: string
  ownerCtaTitle: string
  ownerCtaText: string
  ownerCtaButtonLabel: string
  ownerCtaPhoneText: string
  directBoxTitle: string
  directBoxText: string
  mapBlockedOverline: string
  mapBlockedTitle: string
  mapBlockedText: string
  mapManageCookiesLabel: string
  mapOpenLabel: string
  whatsappDefaultMessage: string
  whatsappPropertyMessage: string
}

export type AboutQuadrant = {
  enabled: boolean
  title: string
  text: string
}

export type AboutContent = {
  heroTitle: string
  heroIntro: string
  box1Enabled: boolean
  box1Title: string
  box1Paragraph1: string
  box1Paragraph2: string
  box1Paragraph3: string
  box2Enabled: boolean
  box2Title: string
  quadrants: AboutQuadrant[]
  box3Enabled: boolean
  box3Title: string
  box3Paragraph1: string
  box3Paragraph2: string
  box4Enabled: boolean
  box4Title: string
  box4Text: string
}

export type GianfedericoHighlight = {
  enabled: boolean
  label: string
  text: string
}

export type GianfedericoMethodCard = {
  enabled: boolean
  title: string
  text: string
}

export type GianfedericoContentBox = {
  enabled: boolean
  title: string
  paragraph1: string
  paragraph2: string
}

export type GianfedericoBelottiContent = {
  heroOverline: string
  heroTitle: string
  heroIntro1: string
  heroIntro2: string
  primaryCtaLabel: string
  secondaryCtaLabel: string
  highlights: GianfedericoHighlight[]
  boxes: GianfedericoContentBox[]
  methodTitle: string
  methodCards: GianfedericoMethodCard[]
  sidebarOverline: string
  sidebarTitle: string
  sidebarText: string
  phoneLabel: string
  phoneHref: string
  consultationCtaLabel: string
}

export const defaultContactsContent: ContactsContent = {
  heroOverline: 'Contatti',
  heroTitle: 'Siamo a disposizione per informazioni e appuntamenti',
  heroSubtitle:
    'Per richieste su immobili, valutazioni o approfondimenti, puoi contattare Area Immobiliare direttamente ai recapiti qui sotto.',
  phoneLabel: '035 221206',
  phoneHref: '035221206',
  whatsappNumber: '393938149279',
  ownerCtaOverline: 'Proprietari',
  ownerCtaTitle: 'Hai un immobile da vendere o affittare?',
  ownerCtaText:
    'Raccontaci cosa vuoi fare: vendita, affitto o semplice valutazione. Area Immobiliare può aiutarti a capire il valore reale dell’immobile e il percorso più adatto.',
  ownerCtaButtonLabel: 'Parla con l’agenzia',
  ownerCtaPhoneText: 'Chiamaci al',
  directBoxTitle: 'Un contatto diretto e professionale',
  directBoxText:
    'Ogni richiesta viene valutata con attenzione, compatibilmente con le attività in corso e con le priorità operative dell’agenzia.',
  mapBlockedOverline: 'Contenuto esterno',
  mapBlockedTitle: 'La mappa è disattivata finché non scegli i cookie facoltativi',
  mapBlockedText:
    'Per visualizzare la mappa incorporata di Google è necessario abilitare i cookie facoltativi per questo contenuto. In alternativa puoi aprire direttamente la posizione su Google Maps con il pulsante dedicato.',
  mapManageCookiesLabel: 'Gestisci cookie per visualizzare la mappa',
  mapOpenLabel: 'Apri su Google Maps',
  whatsappDefaultMessage:
    'Ciao, sono proprietario di un immobile e vorrei ricevere informazioni per venderlo, affittarlo o farlo valutare. Grazie.',
  whatsappPropertyMessage:
    'Ciao, ho visto questo immobile sul vostro sito Area Immobiliare: {url}. Vorrei ricevere maggiori informazioni. Grazie.',
}

export const homeLimits = {
  overline: 50,
  title: 120,
  subtitle: 220,
  stat1: 40,
  stat2: 40,
  stat3: 40,
}

export const contactsLimits = {
  heroOverline: 40,
  heroTitle: 120,
  heroSubtitle: 260,
  phoneLabel: 30,
  phoneHref: 30,
  whatsappNumber: 30,
  ownerCtaOverline: 40,
  ownerCtaTitle: 90,
  ownerCtaText: 260,
  ownerCtaButtonLabel: 50,
  ownerCtaPhoneText: 50,
  directBoxTitle: 90,
  directBoxText: 260,
  mapBlockedOverline: 50,
  mapBlockedTitle: 120,
  mapBlockedText: 320,
  mapManageCookiesLabel: 70,
  mapOpenLabel: 50,
  whatsappDefaultMessage: 260,
  whatsappPropertyMessage: 300,
}

export const aboutLimits = {
  heroTitle: 140,
  heroIntro: 340,
  boxTitle: 90,
  paragraph: 500,
  quadrantTitle: 42,
  quadrantText: 140,
  box4Text: 500,
}

export const gianfedericoBelottiLimits = {
  heroOverline: 60,
  heroTitle: 130,
  heroIntro: 520,
  ctaLabel: 50,
  highlightLabel: 45,
  highlightText: 180,
  boxTitle: 120,
  boxParagraph: 760,
  methodTitle: 70,
  methodCardTitle: 70,
  methodCardText: 260,
  sidebarOverline: 50,
  sidebarTitle: 80,
  sidebarText: 260,
  phoneLabel: 30,
  phoneHref: 30,
}

export const defaultGianfedericoBelottiContent: GianfedericoBelottiContent = {
  heroOverline: 'Gianfederico Belotti',
  heroTitle: 'L’agente che ha creato la Borsa del mattone',
  heroIntro1:
    'Il mercato immobiliare è un terreno vastissimo, ricco di opportunità ma anche di insidie. Per questo acquistare casa non dovrebbe mai diventare un salto nel buio: dovrebbe restare uno dei momenti più importanti, emozionanti e consapevoli della vita.',
  heroIntro2:
    'Da questa convinzione nasce il percorso di Gianfederico Belotti: leggere il mercato, interpretarne i valori, proteggere chi compra e dare all’immobile una valutazione corretta, non soltanto conveniente.',
  primaryCtaLabel: 'Vedi immobili',
  secondaryCtaLabel: 'Contatta Area Immobiliare',
  highlights: [
    {
      enabled: true,
      label: 'Dal 1980',
      text: 'Area Immobiliare opera a Bergamo con sede in Via Locatelli 62.',
    },
    {
      enabled: true,
      label: 'Borsa del mattone',
      text: 'Un metodo nato per leggere il mercato con maggiore trasparenza.',
    },
    {
      enabled: true,
      label: 'Bergamo e provincia',
      text: 'Esperienza diretta su Città Alta, Città Bassa, Colli e hinterland.',
    },
  ],
  boxes: [
    {
      enabled: true,
      title: 'Acquistare casa è un sogno che non deve svanire',
      paragraph1:
        'Casa non è una parola qualunque. È il luogo in cui si progetta una vita, si custodiscono risparmi, si immagina il futuro. Proprio per questo l’acquisto di un immobile non può essere affrontato soltanto guardando una facciata, una metratura o una fotografia ben riuscita.',
      paragraph2:
        'Serve una guida capace di distinguere il valore reale dall’apparenza, l’occasione dalla trappola, il prezzo corretto da quello semplicemente desiderato. È questo il lavoro che Area Immobiliare svolge dal 1980: accompagnare chi compra e chi vende dentro una scelta importante, con metodo, prudenza e responsabilità.',
    },
    {
      enabled: true,
      title: 'La Borsa del mattone',
      paragraph1:
        'A Gianfederico Belotti si deve l’intuizione di portare anche nel mercato immobiliare bergamasco uno strumento di lettura più chiaro, più concreto e più utile: una vera Borsa del mattone, pensata per aiutare cittadini, proprietari e operatori a capire se il valore richiesto per una casa, un ufficio, un negozio o un terreno fosse davvero coerente con il mercato.',
      paragraph2:
        'Da quella impostazione sono nate pubblicazioni e strumenti di consultazione che negli anni hanno contribuito a rendere più trasparente il rapporto tra prezzo, zona, qualità dell’immobile e prospettive future. Perché il prezzo giusto non è soltanto quello che permette di comprare oggi: è anche quello che conserva equilibrio nel tempo, nel caso di una futura rivendita.',
    },
    {
      enabled: true,
      title: 'Dietro una buona compravendita ci sono controlli, non improvvisazione',
      paragraph1:
        'Ogni immobile racconta una storia. Ma prima di trasformare quella storia in un rogito, occorre leggerla con attenzione: provenienza, conformità allo stato di fatto, eventuali ipoteche, vincoli, documenti tecnici, situazione urbanistica e commerciale.',
      paragraph2:
        'Solo così l’acquisto torna a essere ciò che dovrebbe essere: non una corsa ansiosa verso una firma, ma un passaggio importante affrontato con le informazioni giuste. La consulenza immobiliare, quando è seria, non vende soltanto metri quadrati. Riduce i rischi, chiarisce i dubbi e protegge il valore dell’investimento.',
    },
    {
      enabled: true,
      title: 'Un metodo costruito sul territorio',
      paragraph1:
        'Bergamo non è un mercato uniforme. Città Alta, Città Bassa, i Colli, il centro, i quartieri residenziali e l’hinterland hanno dinamiche diverse, valori diversi, domande diverse. Conoscerli significa avere memoria delle compravendite, sensibilità sul territorio e capacità di interpretare ciò che i soli numeri non dicono.',
      paragraph2:
        'È in questa esperienza che si inserisce il lavoro di Area Immobiliare: selezionare immobili, valutarli con attenzione, presentarli con serietà e accompagnare il cliente fino alla scelta finale, senza perdere di vista ciò che conta davvero: acquistare bene, vendere correttamente, costruire fiducia.',
    },
    {
      enabled: true,
      title: 'Il meglio di consulenti, tecnici e professionisti',
      paragraph1:
        'Una compravendita immobiliare non si esaurisce nell’incontro tra chi vende e chi compra. Attorno a una casa si muovono banche, notai, tecnici, architetti, imprese, artigiani e professionisti chiamati a rendere sicuro e conveniente ogni passaggio.',
      paragraph2:
        'L’esperienza maturata nel tempo consente di orientare il cliente anche in queste scelte, indicando interlocutori affidabili e soluzioni adeguate. Perché quando si affronta uno degli investimenti più importanti della vita, la qualità delle persone coinvolte non è un dettaglio: è una garanzia.',
    },
  ],
  methodTitle: 'Metodo Belotti',
  methodCards: [
    {
      enabled: true,
      title: 'Valutare prima di proporre',
      text: 'Ogni immobile deve essere letto nel suo contesto: posizione, stato, commerciabilità, prospettive di rivendita e coerenza del prezzo richiesto.',
    },
    {
      enabled: true,
      title: 'Verificare prima di acquistare',
      text: 'La bellezza di una casa non basta. Provenienze, conformità, vincoli, ipoteche e documentazione devono essere controllati con attenzione.',
    },
    {
      enabled: true,
      title: 'Accompagnare fino alla firma',
      text: 'Comprare casa significa prendere una decisione importante. Il cliente deve essere guidato con chiarezza, senza pressioni e senza zone d’ombra.',
    },
  ],
  sidebarOverline: 'Area Immobiliare',
  sidebarTitle: 'Dal 1980 a Bergamo',
  sidebarText: 'Via A. Locatelli 62\n24121 Bergamo',
  phoneLabel: '035 221206',
  phoneHref: '+39035221206',
  consultationCtaLabel: 'Richiedi una consulenza',
}

export const defaultHomeContent: HomeContent = {
  overline: 'Area Immobiliare dal 1980',
  title:
    'Vendere, comprare o affittare casa e terreni a Bergamo con più chiarezza e meno stress.',
  subtitle:
    'Ogni scelta immobiliare merita tempo, competenza e informazioni corrette: per questo lavoriamo in modo chiaro, concreto e vicino alle persone.',
  stat1Enabled: true,
  stat1: 'Dal 1980',
  stat2Enabled: true,
  stat2: 'Bergamo e provincia',
  stat3Enabled: true,
  stat3: 'Analisi e verifica',
}

export const defaultAboutContent: AboutContent = {
  heroTitle:
    'Gianfederico Belotti, una storia immobiliare costruita su esperienza e trasparenza',
  heroIntro:
    'Area Immobiliare affianca da decenni chi desidera acquistare, vendere o locare un immobile con un metodo fondato su conoscenza del territorio, valutazione corretta e attenzione concreta alla qualità dell’operazione.',
  box1Enabled: true,
  box1Title: 'Una presenza storica a Bergamo',
  box1Paragraph1:
    'Il mercato immobiliare è un ambito complesso, fatto di opportunità ma anche di aspetti tecnici, economici e documentali che richiedono esperienza. Area Immobiliare nasce con l’idea di accompagnare il cliente con sobrietà, metodo e visione concreta.',
  box1Paragraph2:
    'Dal 1980, l’agenzia opera a Bergamo aiutando famiglie, privati e investitori nella scelta di abitazioni, uffici, negozi e altre soluzioni immobiliari, con attenzione alla reale commerciabilità dell’immobile e alla sostenibilità dell’operazione.',
  box1Paragraph3:
    'Gianfederico Belotti ha costruito negli anni una realtà riconosciuta per la conoscenza del territorio, per la sensibilità nel leggere il mercato e per l’attenzione al valore corretto degli immobili.',
  box2Enabled: true,
  box2Title: 'Un metodo fondato su valutazione, verifica e tutela',
  quadrants: [
    { enabled: true, title: 'Valutazione corretta', text: 'Ogni immobile viene letto con attenzione per comprenderne il valore reale e il suo posizionamento di mercato.' },
    { enabled: true, title: 'Controlli documentali', text: 'Provenienze, conformità, libertà da criticità e aspetti essenziali vengono verificati con metodo.' },
    { enabled: true, title: 'Conoscenza del territorio', text: 'Bergamo, Città Alta, Città Bassa, Colli e hinterland vengono interpretati con esperienza maturata sul campo.' },
    { enabled: true, title: 'Rete di professionisti', text: 'Quando serve, il cliente può contare anche su notai, tecnici, istituti di credito e partner selezionati.' },
  ],
  box3Enabled: true,
  box3Title: 'La cultura del prezzo giusto',
  box3Paragraph1:
    'Uno degli aspetti distintivi dell’approccio di Gianfederico Belotti è l’attenzione alla trasparenza del mercato. La valutazione dell’immobile non è solo una cifra: è un lavoro di equilibrio tra desiderio, realtà e prospettiva futura.',
  box3Paragraph2:
    'Questo approccio ha contribuito a costruire un profilo professionale autorevole, orientato a tutelare chi compra, chi vende e chi cerca una soluzione in affitto con maggiore consapevolezza.',
  box4Enabled: true,
  box4Title: 'Uno stile di lavoro sobrio e concreto',
  box4Text:
    'Area Immobiliare si rivolge a chi cerca non soltanto un immobile, ma un interlocutore affidabile. L’obiettivo è accompagnare il cliente in un percorso serio, ordinato e ben seguito, senza eccessi comunicativi ma con attenzione reale alla qualità della scelta.',
}
