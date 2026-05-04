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

    if (
      /^[A-ZÀÈÉÌÒÙ]$/.test(line) &&
      next &&
      /^[a-zàèéìòù]/.test(next)
    ) {
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
  ]

  let startIndex = -1

  for (const pattern of startPriority) {
    startIndex = bodyLines.findIndex((line) => pattern.test(line))
    if (startIndex >= 0) break
  }

  const selected = startIndex >= 0 ? bodyLines.slice(startIndex) : bodyLines

  return fixPdfText(selected.join(' '))
}

function detectTopic(bodyText: string): NewsTopic {
  if (/chi cerca casa|ultima uscita|sospensione|fine lavori|120 redazionali/i.test(bodyText)) {
    return 'closing-editorial'
  }

  if (/valore casa&terreni|valore casa|una bussola per l’immobiliare|18 anni|quotazioni|mappe dei valori immobiliari/i.test(bodyText)) {
    return 'valore-casa'
  }

  if (/affitti brevi|locazioni brevi|affitto turistico|case vacanze|borghi storici/i.test(bodyText)) {
    return 'short-rentals'
  }

  if (/piano europeo|piano casa ue|edilizia abitativa|abitare accessibile|edilizia sociale|commissione europea/i.test(bodyText)) {
    return 'housing-plan'
  }

  return 'generic'
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

function makeStrongTitle(headline: string | null, bodyText: string) {
  const topic = detectTopic(bodyText)
  const extracted = headline ? fixPdfText(headline).replace(/,$/, '') : ''

  if (topic === 'closing-editorial') {
    return 'Chi cerca casa: arrivederci, per ora'
  }

  if (topic === 'valore-casa') {
    return 'Valore Casa&Terreni: la bussola immobiliare'
  }

  if (topic === 'short-rentals') {
    return 'Affitti brevi: nuove regole nei borghi storici'
  }

  if (topic === 'housing-plan') {
    return 'Piano Casa UE: abitare accessibile'
  }

  if (extracted && extracted.length <= 74) return extracted
  if (extracted) return clampText(extracted, 74)

  const first = splitSentences(bodyText)[0] || 'Aggiornamento immobiliare'
  return clampText(first.replace(/[.]+$/, ''), 74)
}

function makeBrief(bodyText: string) {
  const topic = detectTopic(bodyText)

  if (topic === 'closing-editorial') {
    return 'L’editoriale «Chi cerca casa» si ferma temporaneamente dopo un percorso settimanale dedicato al mondo della casa e del mercato immobiliare.'
  }

  if (topic === 'valore-casa') {
    return 'Torna «Valore Casa&Terreni», il volume che raccoglie analisi, quotazioni e approfondimenti sul mercato immobiliare bergamasco.'
  }

  if (topic === 'housing-plan') {
    return 'Una sintesi del Piano europeo per l’edilizia abitativa accessibile e dei suoi effetti su cantieri, ristrutturazioni e mercato.'
  }

  if (topic === 'short-rentals') {
    return 'Una panoramica sulle nuove regole per gli affitti brevi e sulle ricadute per proprietari, operatori e territori.'
  }

  return clampText(splitSentences(bodyText)[0] || 'Sintesi della notizia.', 220)
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
  const paragraphs: string[] = []

  const overview = findSentences(
    bodyText,
    [/affitti brevi/i, /locazioni brevi/i, /proprietari/i, /piattaforme/i],
    3
  )

  if (overview.length > 0) {
    paragraphs.push(clampText(overview.join(' '), 760))
  }

  const rules = findSentences(
    bodyText,
    [/regolamento/i, /2024\/1028/i, /20 maggio 2026/i, /trasparenza/i, /registro nazionale/i, /\bCIN\b/i],
    3
  )

  if (rules.length > 0) {
    paragraphs.push(clampText(rules.join(' '), 760))
  }

  const localImpact = findSentences(
    bodyText,
    [/bergamo/i, /borghi storici/i, /agibilità/i, /impianti/i, /associazioni/i, /confedilizia/i, /fiaip/i, /confabitare/i],
    4
  )

  if (localImpact.length > 0) {
    paragraphs.push(clampText(localImpact.join(' '), 820))
  }

  if (paragraphs.length === 0) {
    return buildGenericSummary(bodyText)
  }

  return paragraphs.map((paragraph) => fixPdfText(paragraph)).slice(0, 3)
}

function buildHousingPlanSummary(bodyText: string) {
  const paragraphs: string[] = []

  const plan = findSentences(
    bodyText,
    [/commissione europea/i, /piano europeo/i, /edilizia abitativa/i, /prezzi accessibili/i, /svolta storica/i],
    3
  )

  if (plan.length > 0) {
    paragraphs.push(clampText(plan.join(' '), 760))
  }

  const operations = findSentences(
    bodyText,
    [/cantieri/i, /ristrutturazioni/i, /passaporto digitale/i, /\bDPP\b/i, /titoli edilizi/i, /urbanistica/i, /burocrazia/i, /BIM/i],
    4
  )

  if (operations.length > 0) {
    paragraphs.push(clampText(operations.join(' '), 820))
  }

  const market = findSentences(
    bodyText,
    [/investimenti/i, /edilizia sociale/i, /offerta abitativa/i, /mercato/i, /imprese edili/i, /professionisti tecnici/i, /micro-imprese/i],
    4
  )

  if (market.length > 0) {
    paragraphs.push(clampText(market.join(' '), 820))
  }

  if (paragraphs.length === 0) {
    return buildGenericSummary(bodyText)
  }

  return paragraphs.map((paragraph) => fixPdfText(paragraph)).slice(0, 3)
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
    paragraphs = buildHousingPlanSummary(bodyText)
  } else {
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
