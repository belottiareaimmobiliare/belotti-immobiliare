export const HOME_CONTENT_KEY = 'home_page'
export const ABOUT_CONTENT_KEY = 'about_page'

export type HomeContent = {
  overline: string
  title: string
  subtitle: string
  stat1: string
  stat2: string
  stat3: string
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

export const homeLimits = {
  overline: 50,
  title: 120,
  subtitle: 220,
  stat1: 40,
  stat2: 40,
  stat3: 40,
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

export const defaultHomeContent: HomeContent = {
  overline: 'Area Immobiliare dal 1980',
  title:
    'Vendere, comprare o affittare casa e terreni a Bergamo con più chiarezza e meno stress.',
  subtitle:
    'Ogni scelta immobiliare merita tempo, competenza e informazioni corrette: per questo lavoriamo in modo chiaro, concreto e vicino alle persone.',
  stat1: 'Dal 1980',
  stat2: 'Bergamo e provincia',
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
    {
      enabled: true,
      title: 'Valutazione corretta',
      text: 'Ogni immobile viene letto con attenzione per comprenderne il valore reale e il suo posizionamento di mercato.',
    },
    {
      enabled: true,
      title: 'Controlli documentali',
      text: 'Provenienze, conformità, libertà da criticità e aspetti essenziali vengono verificati con metodo.',
    },
    {
      enabled: true,
      title: 'Conoscenza del territorio',
      text: 'Bergamo, Città Alta, Città Bassa, Colli e hinterland vengono interpretati con esperienza maturata sul campo.',
    },
    {
      enabled: true,
      title: 'Rete di professionisti',
      text: 'Quando serve, il cliente può contare anche su notai, tecnici, istituti di credito e partner selezionati.',
    },
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