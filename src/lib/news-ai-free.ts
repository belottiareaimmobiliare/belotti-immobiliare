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

const NOISE_PATTERNS = [
  /^pagina:/i,
  /^orario bozza:/i,
  /^autore:/i,
  /^l’eco di bergamo$/i,
  /^l'eco di bergamo$/i,
  /^sabato\s+\d+/i,
  /^venerdì\s+\d+/i,
  /^giovedì\s+\d+/i,
  /^mercoledì\s+\d+/i,
  /^martedì\s+\d+/i,
  /^lunedì\s+\d+/i,
  /^domenica\s+\d+/i,
  /^a cura di/i,
  /^www\./i,
  /^di gianfederico belotti/i,
  /^\*direttore/i,
  /^claudia lenzini$/i,
  /^lorella ghilardi$/i,
  /^giuliano olivati$/i,
  /^marco tacchini$/i,
  /^chicercacasa$/i,
  /^spm pubblicità$/i,
  /^il contesto$/i,
  /^punti principali$/i,
  /^\d+$/,
]

function fixPdfText(value: string) {
  return value
    .replace(/[\u00ad\uFFFE\uFFFD￾]/g, '')
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s+([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s*\n\s*([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/\b([dDlLsScC])\s+[’']\s*/g, '$1’')
    .replace(/\b([dDlLsScC])-\s+[’']\s*/g, '$1’')
    // rimuove date editoriali/testata tipo: Venerdì 1 Maggio 2026
    .replace(
      /\b(lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica)\s+\d{1,2}\s+[a-zàèéìòù]+\s+\d{4}\s+/gi,
      ''
    )
    // correzione frequente quando la C iniziale viene persa dal parser PDF
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

function cleanLines(rawText: string) {
  return normalizeText(rawText)
    .split('\n')
    .map((line) => fixPdfText(line.trim()))
    .filter((line) => {
      if (!line) return false
      if (line.length <= 2) return false
      if (/^[\W_]+$/.test(line)) return false
      return !NOISE_PATTERNS.some((pattern) => pattern.test(line))
    })
}

function uppercaseRatio(line: string) {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return 0

  const uppercase = letters.replace(/[^A-ZÀÈÉÌÒÙ]/g, '')
  return uppercase.length / letters.length
}

function isHeadlineLine(line: string) {
  const clean = fixPdfText(line)

  if (clean.length < 12 || clean.length > 150) return false
  if (/[a-zàèéìòù]{3,}/.test(clean)) return false

  return uppercaseRatio(clean) >= 0.66 && /[A-ZÀÈÉÌÒÙ]{4,}/.test(clean)
}

function titleCase(value: string) {
  const acronyms = new Map([
    ['ue', 'UE'],
    ['dpp', 'DPP'],
    ['cin', 'CIN'],
    ['sca', 'SCA'],
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
  const headlineLines = lines.filter((line) => isHeadlineLine(line))

  if (headlineLines.length === 0) return null

  const joined = headlineLines.slice(-4).join(' ')
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
    /il\s+\d{1,2}\s+\w+\s+\d{4}/i,
    /negli ultimi anni/i,
    /a livello europeo/i,
    /la commissione europea/i,
    /per la prima volta/i,
  ]

  let startIndex = -1

  for (const pattern of startPriority) {
    startIndex = bodyLines.findIndex((line) => pattern.test(line))
    if (startIndex >= 0) break
  }

  const selected = startIndex >= 0 ? bodyLines.slice(startIndex) : bodyLines

  return fixPdfText(selected.join(' '))
}

function detectTopic(bodyText: string) {
  if (/chi cerca casa|ultima uscita|sospensione|fine lavori|redazionali/i.test(bodyText)) {
    return 'closing-editorial'
  }

  if (/affitti brevi|locazioni brevi|affitto turistico|case vacanze/i.test(bodyText)) {
    return 'short-rentals'
  }

  if (/piano europeo|piano casa ue|edilizia abitativa|abitare accessibile|edilizia sociale|commissione europea/i.test(bodyText)) {
    return 'housing-plan'
  }

  return 'generic'
}

function findSentence(bodyText: string, patterns: RegExp[]) {
  const sentences = splitSentences(bodyText)

  return sentences.find((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  )
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

function makeStrongTitle(rawTitle: string | null, bodyText: string) {
  const body = bodyText.toLowerCase()
  const title = rawTitle ? fixPdfText(rawTitle).replace(/,$/, '') : ''

  if (/chi cerca casa|ultima uscita|sospensione|fine lavori/.test(body)) {
    return 'Chi cerca casa: fine lavori, per ora'
  }

  if (/piano europeo|piano casa ue|edilizia abitativa|abitare accessibile/.test(body)) {
    return 'Piano Casa UE: abitare accessibile'
  }

  if (/affitti brevi|locazioni brevi/.test(body)) {
    return 'Affitti brevi: nuove regole'
  }

  if (title && title.length <= 70) return title

  if (title) return clampText(title, 70)

  const first = splitSentences(bodyText)[0] || 'Aggiornamento immobiliare'
  return clampText(first.replace(/[.]+$/, ''), 70)
}

function makeBrief(bodyText: string) {
  const topic = detectTopic(bodyText)

  if (topic === 'closing-editorial') {
    return 'L’editoriale «Chi cerca casa» si ferma per ragioni tecniche, dopo un percorso settimanale dedicato al tema della casa.'
  }

  if (topic === 'housing-plan') {
    return 'Una sintesi del Piano europeo per l’edilizia abitativa accessibile e dei suoi effetti su cantieri, ristrutturazioni e mercato.'
  }

  if (topic === 'short-rentals') {
    return 'Una panoramica sulle nuove regole per gli affitti brevi e sulle ricadute per proprietari, operatori e territori.'
  }

  return clampText(splitSentences(bodyText)[0] || 'Sintesi della notizia.', 220)
}

function buildClosingEditorialSummary(bodyText: string) {
  const paragraphs: string[] = []

  const opening = findSentences(bodyText, [
    /ultima uscita/i,
    /sospensione/i,
    /gennaio 2024/i,
    /120 redazionali/i,
  ], 3)

  if (opening.length > 0) {
    paragraphs.push(
      clampText(opening.join(' '), 720)
    )
  }

  const meaning = findSentences(bodyText, [
    /luogo perfetto/i,
    /emozioni/i,
    /ricordi/i,
    /battere il cuore/i,
    /anima unica/i,
  ], 3)

  if (meaning.length > 0) {
    paragraphs.push(
      clampText(meaning.join(' '), 720)
    )
  }

  const thanks = findSentences(bodyText, [
    /ringraziare/i,
    /collaborazione/i,
    /ordini professionali/i,
    /associazioni di settore/i,
    /costruttori/i,
  ], 2)

  if (thanks.length > 0) {
    paragraphs.push(
      clampText(thanks.join(' '), 620)
    )
  }

  return paragraphs
}

function buildHousingPlanSummary(bodyText: string) {
  const paragraphs: string[] = []

  const plan = findSentences(bodyText, [
    /commissione europea/i,
    /piano europeo/i,
    /edilizia abitativa/i,
    /prezzi accessibili/i,
    /svolta storica/i,
  ], 3)

  if (plan.length > 0) {
    paragraphs.push(clampText(plan.join(' '), 760))
  }

  const operations = findSentences(bodyText, [
    /cantieri/i,
    /ristrutturazioni/i,
    /passaporto digitale/i,
    /\bDPP\b/i,
    /titoli edilizi/i,
    /urbanistica/i,
    /burocrazia/i,
  ], 3)

  if (operations.length > 0) {
    paragraphs.push(clampText(operations.join(' '), 760))
  }

  const market = findSentences(bodyText, [
    /investimenti/i,
    /edilizia sociale/i,
    /offerta abitativa/i,
    /mercato/i,
    /imprese edili/i,
    /professionisti tecnici/i,
  ], 3)

  if (market.length > 0) {
    paragraphs.push(clampText(market.join(' '), 760))
  }

  return paragraphs
}

function buildShortRentalsSummary(bodyText: string) {
  const paragraphs: string[] = []

  const overview = findSentences(bodyText, [
    /affitti brevi/i,
    /locazioni brevi/i,
    /proprietari/i,
    /piattaforme/i,
  ], 3)

  if (overview.length > 0) {
    paragraphs.push(clampText(overview.join(' '), 760))
  }

  const rules = findSentences(bodyText, [
    /regolamento/i,
    /2024\/1028/i,
    /20 maggio 2026/i,
    /trasparenza/i,
    /registro nazionale/i,
    /\bCIN\b/i,
  ], 3)

  if (rules.length > 0) {
    paragraphs.push(clampText(rules.join(' '), 760))
  }

  const impact = findSentences(bodyText, [
    /centri storici/i,
    /borghi storici/i,
    /stress abitativo/i,
    /bergamo/i,
    /operatori/i,
    /associazioni/i,
  ], 3)

  if (impact.length > 0) {
    paragraphs.push(clampText(impact.join(' '), 760))
  }

  return paragraphs
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

  return paragraphs
}

function buildSummary(bodyText: string) {
  const topic = detectTopic(bodyText)

  let paragraphs: string[] = []

  if (topic === 'closing-editorial') {
    paragraphs = buildClosingEditorialSummary(bodyText)
  } else if (topic === 'housing-plan') {
    paragraphs = buildHousingPlanSummary(bodyText)
  } else if (topic === 'short-rentals') {
    paragraphs = buildShortRentalsSummary(bodyText)
  } else {
    paragraphs = buildGenericSummary(bodyText)
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
          item.toLowerCase().includes(clean.toLowerCase().slice(0, 80))
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
