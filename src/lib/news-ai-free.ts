export type GeneratedNews = {
  title: string
  brief: string
  content: string
  plainContent: string
  keyPoints: string[]
}

const NOISE_PATTERNS = [
  /^pagina:/i,
  /^orario bozza:/i,
  /^autore:/i,
  /^l’eco di bergamo$/i,
  /^l'eco di bergamo$/i,
  /^sabato\s+\d+/i,
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
  /^\d+$/,
]

function normalizeText(input: string) {
  return input
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[\u00ad\uFFFD\uFFFE]/g, '')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeBrokenWords(text: string) {
  return text
    // parole spezzate con trattino e spazio/newline: "du- rata" -> "durata"
    .replace(/([a-zàèéìòù])-\s+([a-zàèéìòù])/gi, '$1$2')
    // spezzature strane frequenti nei PDF giornale: "piat- taforme"
    .replace(/([a-zàèéìòù])\s+-\s+([a-zàèéìòù])/gi, '$1$2')
    // apostrofi separati male
    .replace(/\s+’\s+/g, '’')
    .replace(/\s+'\s+/g, "'")
}

function compactLines(rawText: string) {
  const sourceLines = normalizeBrokenWords(normalizeText(rawText))
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const lines: string[] = []

  for (let i = 0; i < sourceLines.length; i += 1) {
    const line = sourceLines[i]

    // Caso tipico OCR/PDF: "N" su una riga e "egli ultimi anni" sulla successiva.
    if (
      /^[A-ZÀÈÉÌÒÙ]$/.test(line) &&
      sourceLines[i + 1] &&
      /^[a-zàèéìòù]/.test(sourceLines[i + 1])
    ) {
      lines.push(line + sourceLines[i + 1])
      i += 1
      continue
    }

    lines.push(line)
  }

  return lines
}

function isNoiseLine(line: string) {
  const clean = line.trim()
  if (!clean) return true
  if (clean.length <= 2) return true
  if (/^[\W_]+$/.test(clean)) return true

  return NOISE_PATTERNS.some((pattern) => pattern.test(clean))
}

function cleanLines(rawText: string) {
  return compactLines(rawText)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => !isNoiseLine(line))
}

function uppercaseRatio(line: string) {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return 0

  const uppercase = letters.replace(/[^A-ZÀÈÉÌÒÙ]/g, '')
  return uppercase.length / letters.length
}

function isHeadlineLine(line: string) {
  const clean = line.trim()

  if (clean.length < 12 || clean.length > 130) return false
  if (/[a-zàèéìòù]{3,}/.test(clean)) return false

  const ratio = uppercaseRatio(clean)

  return ratio >= 0.72 && /[A-ZÀÈÉÌÒÙ]{4,}/.test(clean)
}

function titleCaseFromHeadline(value: string) {
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
  ])

  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      const clean = word.replace(/[^\p{L}]/gu, '').toLowerCase()

      if (index > 0 && lowerWords.has(clean)) return word

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
    .replace(/\s+([,.;:!?])/g, '$1')
}

function extractHeadline(lines: string[]) {
  const headlineIndexes = lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => isHeadlineLine(line))

  if (headlineIndexes.length === 0) return null

  // Cerco blocchi consecutivi in maiuscolo. Nei PDF giornale spesso il titolo è verso fine estrazione.
  const blocks: { start: number; lines: string[] }[] = []

  let current: { start: number; lines: string[] } | null = null

  for (const item of headlineIndexes) {
    if (!current) {
      current = { start: item.index, lines: [item.line] }
      continue
    }

    const previousIndex = current.start + current.lines.length - 1

    if (item.index <= previousIndex + 2) {
      current.lines.push(item.line)
    } else {
      blocks.push(current)
      current = { start: item.index, lines: [item.line] }
    }
  }

  if (current) blocks.push(current)

  const bestBlock =
    blocks
      .filter((block) => block.lines.length >= 2)
      .sort((a, b) => b.start - a.start)[0] ||
    blocks.sort((a, b) => b.start - a.start)[0]

  if (!bestBlock) return null

  const titleLines = bestBlock.lines.slice(0, 2)
  const subtitleLines = bestBlock.lines.slice(2, 6)

  return {
    rawTitle: titleLines.join(' '),
    title: titleCaseFromHeadline(titleLines.join(' ')),
    subtitle: subtitleLines.length
      ? titleCaseFromHeadline(subtitleLines.join(' '))
      : '',
    blockStart: bestBlock.start,
  }
}

function removeHeadlineBlockFromBody(lines: string[]) {
  return lines.filter((line) => !isHeadlineLine(line))
}

function splitSentences(text: string) {
  return text
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 55)
}

function clampText(text: string, max: number) {
  const clean = text.trim()
  if (clean.length <= max) return clean

  return (
    clean
      .slice(0, max)
      .trim()
      .replace(/[\s,;:\-–—.]+$/, '') + '…'
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function fallbackTitle(bodyText: string) {
  const sentence = splitSentences(bodyText)[0]

  if (!sentence) return 'Aggiornamento dal mercato immobiliare'

  return clampText(sentence.replace(/[.]+$/, ''), 82)
}

function buildBrief(headlineSubtitle: string, bodyText: string) {
  if (headlineSubtitle && headlineSubtitle.length >= 80) {
    return clampText(headlineSubtitle, 230)
  }

  const sentences = splitSentences(bodyText)
  const useful =
    sentences.find((sentence) => {
      if (/^il modello/i.test(sentence)) return false
      if (/^pagina:/i.test(sentence)) return false
      return sentence.length <= 260
    }) || sentences[0]

  return clampText(
    useful ||
      'Una sintesi editoriale dedicata al mercato immobiliare, con spunti utili per proprietari, acquirenti e persone interessate a vendere o acquistare casa.',
    230
  )
}

function scoreSentence(sentence: string) {
  const keywords = [
    'mercato',
    'immobiliare',
    'casa',
    'affitti brevi',
    'locazioni brevi',
    'proprietari',
    'bergamo',
    'regolamento',
    'comune',
    'normativa',
    'cin',
    'registro nazionale',
    'agibilità',
    'impianti',
    'requisiti',
    'borghi storici',
    'centri storici',
    'tassazione',
    'turistico',
    'turistica',
  ]

  const lower = sentence.toLowerCase()
  let score = 0

  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 2
  }

  if (sentence.length >= 85 && sentence.length <= 240) score += 2
  if (/\d/.test(sentence)) score += 1

  return score
}

function extractKeyPoints(bodyText: string) {
  const sentences = splitSentences(bodyText)

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence),
    }))
    .filter((item) => item.sentence.length <= 280)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.index - b.index
    })

  const points: string[] = []

  for (const item of ranked) {
    const point = clampText(item.sentence, 210)

    if (
      !points.some(
        (existing) => existing.toLowerCase() === point.toLowerCase()
      )
    ) {
      points.push(point)
    }

    if (points.length >= 3) break
  }

  return points
}

function paragraphize(bodyText: string) {
  const paragraphs = bodyText
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length >= 140)

  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 4).map((paragraph) => clampText(paragraph, 820))
  }

  const sentences = splitSentences(bodyText)
  const chunks: string[] = []

  for (let i = 0; i < sentences.length; i += 3) {
    const chunk = sentences.slice(i, i + 3).join(' ')
    if (chunk.length >= 120) chunks.push(clampText(chunk, 820))
  }

  return chunks.slice(0, 4)
}

function makeBodyText(lines: string[]) {
  const bodyLines = removeHeadlineBlockFromBody(lines)

  const cutStartIndex = bodyLines.findIndex((line) =>
    /negli ultimi anni|a livello europeo|il modello|le associazioni/i.test(line)
  )

  const selectedLines =
    cutStartIndex >= 0 ? bodyLines.slice(cutStartIndex) : bodyLines

  return selectedLines
    .join('\n')
    .replace(/\n(?=[a-zàèéìòù])/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .trim()
}

export function generateNewsFromPdfText(rawText: string): GeneratedNews {
  const lines = cleanLines(rawText)
  const headline = extractHeadline(lines)
  const bodyText = makeBodyText(lines)

  const title = headline?.title || fallbackTitle(bodyText)
  const brief = buildBrief(headline?.subtitle || '', bodyText)
  const keyPoints = extractKeyPoints(bodyText)
  const paragraphs = paragraphize(bodyText)

  const intro =
    paragraphs[0] ||
    'Il documento offre spunti utili per leggere con maggiore attenzione il contesto immobiliare e orientare le scelte in modo più consapevole.'

  const plainParts: string[] = []

  plainParts.push(intro)

  if (keyPoints.length > 0) {
    plainParts.push('Punti chiave:')
    keyPoints.forEach((point) => {
      plainParts.push(`- ${point}`)
    })
  }

  paragraphs.slice(1, 4).forEach((paragraph) => {
    plainParts.push(paragraph)
  })

  plainParts.push(
    'Per valutare correttamente un immobile o approfondire il tema, Area Immobiliare può offrire un confronto diretto e mirato.'
  )

  const plainContent = plainParts.join('\n\n')

  const htmlParts: string[] = []

  htmlParts.push(`<p>${escapeHtml(intro)}</p>`)

  if (keyPoints.length > 0) {
    htmlParts.push('<h3>Punti chiave</h3>')
    htmlParts.push(
      `<ul>${keyPoints
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join('')}</ul>`
    )
  }

  paragraphs.slice(1, 4).forEach((paragraph) => {
    htmlParts.push(`<p>${escapeHtml(paragraph)}</p>`)
  })

  htmlParts.push(
    '<p>Per valutare correttamente un immobile o approfondire il tema, Area Immobiliare può offrire un confronto diretto e mirato.</p>'
  )

  return {
    title,
    brief,
    content: htmlParts.join('\n'),
    plainContent,
    keyPoints,
  }
}
