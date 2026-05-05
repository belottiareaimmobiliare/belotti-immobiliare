export type GeneratedNews = {
  title: string
  brief: string
  content: string
  plainContent: string
  keyPoints: string[]
  sourcePdfUrl?: string
}

type GenerateNewsOptions = {
  sourcePdfUrl?: string
}

type NewsTopic =
  | 'closing-editorial'
  | 'short-rentals'
  | 'housing-plan'
  | 'valore-casa'
  | 'buying-selling'
  | 'valuation'
  | 'mortgages'
  | 'renovation-energy'
  | 'urban-planning'
  | 'traditional-rentals'
  | 'market-analysis'
  | 'generic'

const NOISE_PATTERNS = [
  /^pagina:/i,
  /^orario bozza:/i,
  /^autore:/i,
  /^l’eco di bergamo$/i,
  /^l'eco di bergamo$/i,
  /^a cura di/i,
  /^www\./i,
  /^di gianfederico belotti/i,
  /^di marco offredi/i,
  /^\*direttore/i,
  /^direttore valore casa/i,
  /^gianfederico belotti$/i,
  /^claudia lenzini$/i,
  /^lorella ghilardi$/i,
  /^giuliano olivati$/i,
  /^marco tacchini$/i,
  /^antonello pezzini$/i,
  /^alessio agliardi$/i,
  /^carlos de carvalho$/i,
  /^emilio gramano$/i,
  /^chicercacasa$/i,
  /^spm pubblicità$/i,
  /^il contesto$/i,
  /^punti principali$/i,
  /^fonte pdf completa$/i,
  /^\d+$/,
  /^(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)\s+\d+/i,
]

function fixPdfText(value: string) {
  return value
    .replace(/[\u00ad\uFFFE\uFFFD￾]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s+([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s*\n\s*([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/\b([dDlLsScC])\s+[’']\s*/g, '$1’')
    .replace(/\b([dDlLsScC])-\s+[’']\s*/g, '$1’')
    .replace(
      /\b(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)\s+\d{1,2}\s+[a-zàèéìòù]+\s+\d{4}\s+/gi,
      ''
    )
    .replace(/^ari lettori/i, 'Cari lettori')
    .replace(/\bari lettori\b/gi, 'Cari lettori')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function normalizeText(input: string) {
  return input
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function compactLines(rawText: string) {
  const sourceLines = normalizeText(rawText)
    .split('\n')
    .map((line) => fixPdfText(line.trim()))
    .filter(Boolean)

  const lines: string[] = []

  for (let i = 0; i < sourceLines.length; i += 1) {
    const line = sourceLines[i]
    const next = sourceLines[i + 1]

    if (/^[A-ZÀÈÉÌÒÙ]$/.test(line) && next && /^[a-zàèéìòù]/.test(next)) {
      lines.push(fixPdfText(line + next))
      i += 1
      continue
    }

    lines.push(line)
  }

  return lines
}

function isNoiseLine(line: string) {
  const clean = fixPdfText(line)

  if (!clean) return true
  if (clean.length <= 2) return true
  if (/^[\W_]+$/.test(clean)) return true

  return NOISE_PATTERNS.some((pattern) => pattern.test(clean))
}

function cleanLines(rawText: string) {
  return compactLines(rawText).filter((line) => !isNoiseLine(line))
}

function uppercaseRatio(line: string) {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return 0

  const uppercase = letters.replace(/[^A-ZÀÈÉÌÒÙ]/g, '')
  return uppercase.length / letters.length
}

function isHeadlineLine(line: string) {
  const clean = fixPdfText(line)

  if (clean.length < 12 || clean.length > 170) return false
  if (/[a-zàèéìòù]{3,}/.test(clean)) return false

  return uppercaseRatio(clean) >= 0.64 && /[A-ZÀÈÉÌÒÙ]{4,}/.test(clean)
}

function titleCase(value: string) {
  const acronyms = new Map([
    ['ue', 'UE'],
    ['dpp', 'DPP'],
    ['cin', 'CIN'],
    ['sca', 'SCA'],
    ['bim', 'BIM'],
    ['imu', 'IMU'],
    ['tari', 'TARI'],
    ['iva', 'IVA'],
    ['ape', 'APE'],
    ['spm', 'SPM'],
  ])

  const lowerWords = new Set([
    'di',
    'a',
    'da',
    'in',
    'con',
    'su',
    'per',
    'tra',
    'fra',
    'e',
    'o',
    'il',
    'lo',
    'la',
    'i',
    'gli',
    'le',
    'un',
    'uno',
    'una',
    'nei',
    'nel',
    'nella',
    'nelle',
    'degli',
    'delle',
    'del',
    'della',
    'all',
    'alla',
    'alle',
    'dall',
    'dalla',
    'dalle',
  ])

  return fixPdfText(value)
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const clean = word.replace(/[^\p{L}0-9]/gu, '').toLowerCase()

      if (acronyms.has(clean)) {
        return word.replace(new RegExp(clean, 'i'), acronyms.get(clean) || clean)
      }

      if (index > 0 && lowerWords.has(clean)) return word

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/\s+([,.;:!?])/g, '$1')
}

function extractHeadline(lines: string[]) {
  const candidates = lines.filter((line) => isHeadlineLine(line))

  if (candidates.length === 0) return null

  const joined = candidates.slice(-5).join(' ')
  return titleCase(joined)
}

function splitSentences(text: string) {
  return fixPdfText(text)
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => fixPdfText(sentence.trim()))
    .filter((sentence) => sentence.length >= 45)
}

function clampText(text: string, max: number) {
  const clean = fixPdfText(text)

  if (clean.length <= max) return clean

  const cut = clean.slice(0, max)
  const lastStop = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf(';'),
    cut.lastIndexOf(':')
  )

  if (lastStop > max * 0.55) {
    return fixPdfText(cut.slice(0, lastStop + 1))
  }

  return fixPdfText(cut.replace(/[\s,;:\-–—.]+$/, '') + '…')
}

function escapeHtml(value: string) {
  return fixPdfText(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function makeBodyText(lines: string[]) {
  const bodyLines = lines.filter((line) => !isHeadlineLine(line))

  const startPriority = [
    /cari lettori/i,
    /sta per tornare in edicola/i,
    /negli ultimi anni/i,
    /il\s+\d{1,2}\s+\w+\s+\d{4}/i,
    /la commissione europea/i,
    /per la prima volta/i,
    /a livello europeo/i,
    /comprare casa/i,
    /vendere casa/i,
    /valutare un immobile/i,
    /il mercato immobiliare/i,
  ]

  let startIndex = -1

  for (const pattern of startPriority) {
    startIndex = bodyLines.findIndex((line) => pattern.test(line))
    if (startIndex >= 0) break
  }

  const selected = startIndex >= 0 ? bodyLines.slice(startIndex) : bodyLines

  return fixPdfText(selected.join(' '))
}

function score(body: string, patterns: Array<[RegExp, number]>) {
  return patterns.reduce((total, [pattern, points]) => {
    return total + (pattern.test(body) ? points : 0)
  }, 0)
}

function detectTopic(bodyText: string): NewsTopic {
  const body = fixPdfText(bodyText).toLowerCase()

  if (/chi cerca casa|ultima uscita|sospensione|fine lavori|120 redazionali/i.test(bodyText)) {
    return 'closing-editorial'
  }

  if (/valore casa&terreni|valore casa|una bussola per l’immobiliare|18 anni|quotazioni|mappe dei valori immobiliari/i.test(bodyText)) {
    return 'valore-casa'
  }

  const scores: Record<NewsTopic, number> = {
    'closing-editorial': 0,
    'short-rentals': score(body, [
      [/affitti brevi|locazioni brevi|affitto turistico|case vacanze/i, 4],
      [/borghi storici|città alta|orio|bergamo/i, 3],
      [/regolamento comunale|comune di bergamo|palafrizzoni/i, 3],
      [/agibilità|s\.c\.a|impianti|visitabilità|parcheggi/i, 3],
      [/confedilizia|fiaip|confabitare|lorella ghilardi|giuliano olivati|marco tacchini/i, 3],
      [/airbnb|booking|vrbo|registro nazionale degli affitti brevi|cin|2024\/1028/i, 2],
    ]),
    'housing-plan': score(body, [
      [/piano casa ue|piano europeo|piano europeo per l’edilizia abitativa/i, 5],
      [/edilizia abitativa|abitare accessibile|prezzi accessibili/i, 4],
      [/4 pilastri|quattro pilastri|10 azioni|dieci azioni/i, 3],
      [/cantieri|ristrutturazioni|passaporto digitale|dpp|bim/i, 3],
      [/investimenti|edilizia sociale|housing accessibile|micro-imprese/i, 3],
      [/commissione europea|dan jorgensen|antonello pezzini/i, 2],
    ]),
    'valore-casa': 0,
    'buying-selling': score(body, [
      [/comprare casa|acquistare casa|vendere casa|compravendita/i, 4],
      [/rogito|proposta d’acquisto|preliminare|caparra|notaio/i, 4],
      [/trattativa|documenti|conformità|visura|catasto/i, 3],
      [/acquirente|venditore|agenzia immobiliare/i, 2],
    ]),
    valuation: score(body, [
      [/valutazione|valutare un immobile|stimare il valore|prezzo corretto/i, 5],
      [/quotazione|prezzo di mercato|comparabili|zona|posizione/i, 3],
      [/superficie|stato manutentivo|classe energetica|contesto/i, 3],
      [/sovrastimare|sottostimare|margine di trattativa/i, 2],
    ]),
    mortgages: score(body, [
      [/mutuo|mutui|tasso fisso|tasso variabile|spread/i, 5],
      [/bce|euribor|surroga|rata|finanziamento/i, 4],
      [/credito|banca|istruttoria|loan to value|ltv/i, 3],
      [/prima casa|agevolazioni prima casa/i, 2],
    ]),
    'renovation-energy': score(body, [
      [/ristrutturazione|riqualificazione|efficientamento|efficienza energetica/i, 5],
      [/classe energetica|ape|cappotto|impianto|pompa di calore/i, 4],
      [/bonus|superbonus|ecobonus|detrazione/i, 3],
      [/sostenibilità|emissioni|energia/i, 2],
    ]),
    'urban-planning': score(body, [
      [/urbanistica|titoli edilizi|permesso di costruire|scia|cila/i, 5],
      [/agibilità|conformità urbanistica|catastale|sanatoria/i, 4],
      [/rigenerazione urbana|consumo di suolo|pgt|piano di governo del territorio/i, 3],
      [/vincoli|destinazione d’uso|cambio d’uso/i, 3],
    ]),
    'traditional-rentals': score(body, [
      [/locazione|affitto|canone|inquilino|proprietario/i, 3],
      [/canone concordato|contratto 4\+4|contratto 3\+2|cedolare secca/i, 5],
      [/morosità|sfratto|deposito cauzionale|garanzie/i, 4],
      [/studenti|lavoratori|famiglie/i, 2],
    ]),
    'market-analysis': score(body, [
      [/mercato immobiliare|prezzi delle case|compravendite|domanda|offerta/i, 4],
      [/bergamo|provincia|quotazioni|valori immobiliari/i, 3],
      [/trend|andamento|crescita|calo|stabilità/i, 3],
      [/residenziale|uffici|negozi|logistica/i, 2],
    ]),
    generic: 0,
  }

  // I PDF Piano Casa citano anche gli affitti brevi: vince solo se è tema dominante.
  if (scores['housing-plan'] >= scores['short-rentals'] + 3) return 'housing-plan'
  if (scores['short-rentals'] >= scores['housing-plan'] + 2) return 'short-rentals'

  const ordered = Object.entries(scores)
    .filter(([topic]) => topic !== 'generic')
    .sort((a, b) => b[1] - a[1]) as Array<[NewsTopic, number]>

  const [bestTopic, bestScore] = ordered[0] || ['generic', 0]

  if (bestScore >= 5) return bestTopic

  return 'generic'
}

function makeStrongTitle(headline: string | null, bodyText: string) {
  const topic = detectTopic(bodyText)
  const extracted = headline ? fixPdfText(headline).replace(/,$/, '') : ''

  const titles: Record<NewsTopic, string | null> = {
    'closing-editorial': 'Chi cerca casa: arrivederci, per ora',
    'valore-casa': 'Valore Casa&Terreni: la bussola immobiliare',
    'short-rentals': 'Affitti brevi: nuove regole nei borghi storici',
    'housing-plan': 'Piano Casa UE: abitare accessibile',
    'buying-selling': 'Comprare o vendere casa: cosa sapere',
    valuation: 'Valutare casa: il prezzo giusto conta',
    mortgages: 'Mutui casa: cosa cambia per chi compra',
    'renovation-energy': 'Casa ed energia: ristrutturare meglio',
    'urban-planning': 'Urbanistica e casa: regole da conoscere',
    'traditional-rentals': 'Affitti casa: regole e tutele',
    'market-analysis': 'Mercato immobiliare: segnali da leggere',
    generic: null,
  }

  const fixedTitle = titles[topic]
  if (fixedTitle) return fixedTitle

  if (extracted && extracted.length <= 74) return extracted
  if (extracted) return clampText(extracted, 74)

  const first = splitSentences(bodyText)[0] || 'Aggiornamento immobiliare'
  return clampText(first.replace(/[.]+$/, ''), 74)
}

function makeBrief(bodyText: string) {
  const topic = detectTopic(bodyText)

  const briefs: Record<NewsTopic, string | null> = {
    'closing-editorial':
      'L’editoriale «Chi cerca casa» si ferma temporaneamente dopo un percorso settimanale dedicato al mondo della casa e del mercato immobiliare.',
    'valore-casa':
      'Torna «Valore Casa&Terreni», il volume che raccoglie analisi, quotazioni e approfondimenti sul mercato immobiliare bergamasco.',
    'short-rentals':
      'Una sintesi sulle nuove regole per gli affitti brevi, tra trasparenza europea, requisiti locali e ricadute per proprietari e operatori.',
    'housing-plan':
      'Una sintesi del Piano europeo per l’edilizia abitativa accessibile e dei suoi effetti su cantieri, ristrutturazioni e mercato.',
    'buying-selling':
      'Una guida sintetica per capire meglio passaggi, controlli e attenzioni nella compravendita immobiliare.',
    valuation:
      'Un approfondimento sul valore corretto dell’immobile e sugli elementi che incidono davvero sul prezzo.',
    mortgages:
      'Un quadro sintetico su mutui, tassi e accesso al credito per chi sta valutando l’acquisto di una casa.',
    'renovation-energy':
      'Una panoramica su ristrutturazioni, efficienza energetica e interventi che possono migliorare valore e qualità dell’immobile.',
    'urban-planning':
      'Una sintesi su titoli edilizi, conformità e aspetti urbanistici da considerare quando si parla di casa.',
    'traditional-rentals':
      'Un riepilogo sulle locazioni abitative, tra canoni, contratti, garanzie e tutele per proprietari e inquilini.',
    'market-analysis':
      'Una lettura sintetica dell’andamento immobiliare, con attenzione a prezzi, domanda, offerta e territorio.',
    generic: null,
  }

  const fixedBrief = briefs[topic]
  if (fixedBrief) return fixedBrief

  return clampText(splitSentences(bodyText)[0] || 'Sintesi della notizia.', 220)
}

function findSentences(bodyText: string, patterns: RegExp[], max = 3) {
  const sentences = splitSentences(bodyText)
  const found: string[] = []

  for (const sentence of sentences) {
    if (patterns.some((pattern) => pattern.test(sentence))) {
      if (!found.some((item) => item.toLowerCase() === sentence.toLowerCase())) {
        found.push(sentence)
      }
    }

    if (found.length >= max) break
  }

  return found
}

function buildClosingEditorialSummary() {
  return [
    'L’appuntamento editoriale «Chi cerca casa» si sospende per ragioni tecniche, dopo un percorso iniziato a gennaio 2024 e sviluppato attraverso circa 120 redazionali. Settimana dopo settimana, la rubrica ha raccontato il tema della casa nelle sue molte sfaccettature, unendo aspetti pratici, emotivi, tecnici e culturali.',
    'Il filo conduttore del progetto è stato il valore della casa come luogo di vita, memoria e progettualità. Non solo un immobile, quindi, ma uno spazio capace di accogliere storie, relazioni, sogni e scelte importanti.',
    'Nel corso dei mesi, l’editoriale ha coinvolto professionisti, agenti immobiliari, tecnici, associazioni di settore e istituzioni, offrendo ai lettori strumenti utili per orientarsi tra compravendita, locazione, aspetti legali, fiscali e urbanistici. La sospensione viene presentata come un arrivederci, con l’obiettivo di tornare in una veste rinnovata.',
  ].map((paragraph) => fixPdfText(paragraph))
}

function buildValoreCasaSummary(bodyText: string) {
  const paragraphs = [
    '«Valore Casa&Terreni» torna come appuntamento editoriale dedicato al mercato immobiliare di Bergamo e provincia. Il volume raccoglie dati, mappe, analisi e racconti sul modo di abitare, mettendo insieme il punto di vista degli operatori e quello di chi vive quotidianamente la casa.',
    'Il progetto, nato nel 2006 e giunto a un percorso ormai consolidato, si conferma come una bussola per leggere quotazioni, compravendite, locazioni, trasformazioni urbane e nuove esigenze abitative. Al centro resta il valore della casa come bene concreto, investimento e riferimento di sicurezza.',
    'Accanto ai valori immobiliari aggiornati, il volume affronta temi come rigenerazione urbana, consumo di suolo, qualità dell’abitare, spazi flessibili, contratti di locazione e casi architettonici. Il risultato è una lettura ampia del territorio, utile sia agli addetti ai lavori sia a chi vuole orientarsi nel mercato.',
  ]

  const release = findSentences(bodyText, [/24 dicembre/i, /esce con/i], 1)[0]
  if (release) {
    paragraphs[0] = clampText(
      `Torna in edicola «Valore Casa&Terreni», il volume dedicato al mercato immobiliare di Bergamo e provincia. ${release}`,
      760
    )
  }

  return paragraphs.map((paragraph) => fixPdfText(paragraph))
}

function buildShortRentalsSummary(bodyText: string) {
  const hasBergamo = /bergamo|borghi storici|palafrizzoni|orio/i.test(bodyText)
  const hasAssociations = /confedilizia|fiaip|confabitare|associazioni|operatori/i.test(bodyText)

  const paragraphs = [
    'Gli affitti brevi entrano in una fase di maggiore regolamentazione, tra nuove norme europee, obblighi di trasparenza e requisiti locali più stringenti. Il tema riguarda da vicino proprietari, operatori immobiliari e territori ad alta domanda turistica, dove il fenomeno ha inciso in modo crescente sull’offerta abitativa.',
    'Dal 20 maggio 2026 entrerà pienamente in vigore il Regolamento UE 2024/1028, pensato per rendere più trasparenti i dati delle locazioni brevi e facilitare i controlli da parte delle autorità. A questo quadro si affiancano le regole italiane già attive, come il CIN e il Registro Nazionale degli Affitti Brevi.',
    hasBergamo
      ? 'A Bergamo il tema riguarda soprattutto i borghi storici, dove il Comune ha introdotto requisiti qualitativi per alcune strutture destinate all’affitto turistico. Tra gli elementi richiamati ci sono agibilità, impianti, visitabilità e dotazione di parcheggi.'
      : 'Sul territorio, le nuove regole puntano ad aumentare qualità e trasparenza, ma introducono anche adempimenti che possono incidere sull’operatività dei proprietari e degli operatori.',
  ]

  if (hasAssociations) {
    paragraphs[2] =
      'A Bergamo il tema riguarda soprattutto i borghi storici, dove il Comune ha introdotto requisiti qualitativi per alcune strutture destinate all’affitto turistico. Le associazioni dei proprietari e diversi operatori contestano però nuovi vincoli, costi aggiuntivi e possibili difficoltà applicative, soprattutto negli edifici storici.'
  }

  return paragraphs.map((paragraph) => fixPdfText(paragraph))
}

function buildHousingPlanSummary() {
  return [
    'Il Piano Casa UE segna un cambio di passo sul tema dell’abitare accessibile, portando la crisi abitativa al centro dell’agenda europea. L’obiettivo è aumentare l’offerta di alloggi, sostenere nuove costruzioni e ristrutturazioni e ridurre gli ostacoli che frenano il mercato.',
    'Il piano si muove su più fronti: semplificazione dei titoli edilizi, digitalizzazione dei processi, passaporto digitale dei prodotti da costruzione, uso di strumenti come BIM e intelligenza artificiale, oltre a nuove modalità di coordinamento tra Unione Europea, Stati, Regioni e città.',
    'Per imprese edili, progettisti e operatori immobiliari si apre una fase di trasformazione concreta. Gli investimenti pubblici e privati, l’edilizia sociale, la riqualificazione dell’esistente e l’innovazione dei cantieri diventeranno elementi centrali per restare competitivi nei prossimi anni.',
  ].map((paragraph) => fixPdfText(paragraph))
}

function buildTemplateSummary(topic: NewsTopic) {
  const templates: Record<NewsTopic, string[] | null> = {
    'closing-editorial': null,
    'valore-casa': null,
    'short-rentals': null,
    'housing-plan': null,
    'buying-selling': [
      'La compravendita immobiliare richiede attenzione fin dalle prime fasi, perché prezzo, documenti, condizioni dell’immobile e tempi dell’operazione incidono sulla qualità della scelta. Una lettura corretta evita decisioni affrettate e riduce il rischio di imprevisti.',
      'Per chi compra, è importante verificare non solo le caratteristiche apparenti della casa, ma anche conformità, situazione catastale, spese, stato manutentivo e contesto. Per chi vende, una presentazione corretta e una valutazione realistica aiutano a intercettare interlocutori realmente interessati.',
      'Il ruolo dell’agenzia diventa centrale nel coordinare informazioni, trattativa e passaggi operativi, accompagnando le parti verso una decisione più consapevole e sostenibile.',
    ],
    valuation: [
      'La valutazione di un immobile non dipende da un solo elemento, ma dall’equilibrio tra posizione, stato dell’abitazione, superficie, caratteristiche interne, contesto e andamento reale della domanda. Un prezzo corretto nasce da una lettura concreta del mercato.',
      'Sovrastimare un immobile può allungare i tempi di vendita e ridurre l’interesse dei potenziali acquirenti, mentre sottostimarlo rischia di penalizzare il proprietario. Per questo è importante distinguere tra valore percepito e valore effettivamente sostenibile dal mercato.',
      'Una valutazione ben costruita permette di impostare una strategia più credibile, migliorare la qualità delle visite e affrontare la trattativa con maggiore consapevolezza.',
    ],
    mortgages: [
      'Mutui, tassi e accesso al credito restano elementi decisivi per chi vuole acquistare casa. Le condizioni proposte dagli istituti bancari incidono direttamente sulla capacità di spesa delle famiglie e sulla scelta dell’immobile.',
      'La valutazione della rata, della durata, del tipo di tasso e delle garanzie richieste deve essere affrontata prima di avviare una trattativa, così da evitare squilibri tra desiderio di acquisto e sostenibilità economica.',
      'Un corretto inquadramento finanziario aiuta a cercare immobili coerenti con il proprio profilo, rendendo il percorso di acquisto più ordinato e realistico.',
    ],
    'renovation-energy': [
      'Ristrutturazione ed efficienza energetica sono sempre più centrali nel valore di un immobile. Interventi ben progettati possono migliorare comfort, consumi, qualità abitativa e attrattività sul mercato.',
      'La scelta delle opere deve tenere insieme aspetti tecnici, costi, tempi, normative e benefici reali. Classe energetica, impianti, isolamento e materiali incidono sia sull’uso quotidiano della casa sia sulla sua futura rivendibilità.',
      'Per proprietari e acquirenti diventa quindi importante valutare gli interventi non come semplici lavori, ma come parte di una strategia complessiva sul valore dell’immobile.',
    ],
    'urban-planning': [
      'Gli aspetti urbanistici e documentali sono una parte essenziale di ogni operazione immobiliare. Titoli edilizi, conformità, agibilità e destinazione d’uso possono incidere in modo decisivo sulla sicurezza della compravendita.',
      'Una verifica preventiva consente di individuare eventuali criticità prima che diventino ostacoli nella trattativa o nel percorso verso il rogito. Questo vale soprattutto per immobili datati, ristrutturati nel tempo o inseriti in contesti complessi.',
      'Affrontare questi controlli con metodo permette di tutelare venditore e acquirente, rendendo l’operazione più trasparente e gestibile.',
    ],
    'traditional-rentals': [
      'Il mercato delle locazioni richiede un equilibrio tra esigenze dei proprietari e bisogni degli inquilini. Canoni, durata del contratto, garanzie e sostenibilità economica sono elementi che incidono sulla stabilità del rapporto.',
      'Contratti corretti e condizioni chiare aiutano a ridurre incomprensioni e rischi, soprattutto in una fase in cui la domanda abitativa resta forte e l’offerta disponibile non sempre risponde alle necessità delle famiglie e dei lavoratori.',
      'Una gestione attenta della locazione permette di valorizzare l’immobile e, allo stesso tempo, costruire rapporti più solidi e trasparenti tra le parti.',
    ],
    'market-analysis': [
      'Il mercato immobiliare va letto attraverso più segnali: andamento dei prezzi, domanda, offerta, tempi di vendita, tipologia degli immobili richiesti e caratteristiche del territorio. Solo una visione complessiva consente di interpretare correttamente le tendenze.',
      'Bergamo e la provincia presentano dinamiche differenziate, con zone più richieste, aree in trasformazione e segmenti che rispondono in modo diverso alle esigenze di famiglie, investitori e operatori.',
      'Per chi compra, vende o investe, una lettura aggiornata del mercato aiuta a prendere decisioni più consapevoli e a impostare strategie coerenti con il contesto reale.',
    ],
    generic: null,
  }

  return templates[topic]?.map((paragraph) => fixPdfText(paragraph)) || []
}

function buildGenericSummary(bodyText: string) {
  const sentences = splitSentences(bodyText)
  const paragraphs: string[] = []

  for (let i = 0; i < sentences.length && paragraphs.length < 3; i += 3) {
    const paragraph = sentences.slice(i, i + 3).join(' ')
    if (paragraph.length >= 80) {
      paragraphs.push(clampText(paragraph, 760))
    }
  }

  return paragraphs.map((paragraph) => fixPdfText(paragraph))
}

function buildSummary(bodyText: string) {
  const topic = detectTopic(bodyText)

  let paragraphs: string[] = []

  if (topic === 'closing-editorial') {
    paragraphs = buildClosingEditorialSummary()
  } else if (topic === 'valore-casa') {
    paragraphs = buildValoreCasaSummary(bodyText)
  } else if (topic === 'short-rentals') {
    paragraphs = buildShortRentalsSummary(bodyText)
  } else if (topic === 'housing-plan') {
    paragraphs = buildHousingPlanSummary()
  } else {
    paragraphs = buildTemplateSummary(topic)
  }

  if (paragraphs.length === 0) {
    paragraphs = buildGenericSummary(bodyText)
  }

  const unique: string[] = []

  for (const paragraph of paragraphs) {
    const clean = fixPdfText(paragraph)

    if (
      clean &&
      !unique.some(
        (item) =>
          item.toLowerCase() === clean.toLowerCase() ||
          item.toLowerCase().includes(clean.toLowerCase().slice(0, 100))
      )
    ) {
      unique.push(clean)
    }
  }

  return unique.slice(0, 4)
}

function normalizePdfUrl(value?: string) {
  return value?.trim() || ''
}

export function generateNewsFromPdfText(
  rawText: string,
  options: GenerateNewsOptions = {}
): GeneratedNews {
  const lines = cleanLines(rawText)
  const bodyText = makeBodyText(lines)
  const headline = extractHeadline(lines)

  const title = makeStrongTitle(headline, bodyText)
  const brief = makeBrief(bodyText)
  const summaryParagraphs = buildSummary(bodyText)
  const sourcePdfUrl = normalizePdfUrl(options.sourcePdfUrl)

  const plainParts = [...summaryParagraphs]

  if (sourcePdfUrl) {
    plainParts.push(`Fonte PDF completa\n${sourcePdfUrl}`)
  }

  const htmlParts = summaryParagraphs.map(
    (paragraph) => `<p>${escapeHtml(paragraph)}</p>`
  )

  if (sourcePdfUrl) {
    htmlParts.push(
      `<p><strong>Fonte PDF completa:</strong><br><a href="${escapeHtml(
        sourcePdfUrl
      )}">${escapeHtml(sourcePdfUrl)}</a></p>`
    )
  }

  return {
    title,
    brief,
    content: htmlParts.join('\n'),
    plainContent: plainParts.join('\n\n'),
    keyPoints: [],
    sourcePdfUrl: sourcePdfUrl || undefined,
  }
}
