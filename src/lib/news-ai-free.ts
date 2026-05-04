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
    .replace(/([a-zàèéìòù])-\s+([a-zàèéìòù])/gi, '$1$2')
    .replace(/([a-zàèéìòù])\s+-\s+([a-zàèéìòù])/gi, '$1$2')
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

  if (clean.length < 12 || clean.length > 135) return false
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
    title: titleCaseFromHeadline(titleLines.join(' ')),
    subtitle: subtitleLines.length
      ? titleCaseFromHeadline(subtitleLines.join(' '))
      : '',
  }
}

function splitSentences(text: string) {
  return text
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 50)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function clampText(text: string, max: number) {
  const clean = text.trim()
  if (clean.length <= max) return clean

  const cut = clean.slice(0, max)
  const lastStop = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf(';'),
    cut.lastIndexOf(':')
  )

  if (lastStop > max * 0.55) {
    return cut.slice(0, lastStop + 1).trim()
  }

  return cut.trim().replace(/[\s,;:\-–—.]+$/, '') + '…'
}

function removeHeadlineLines(lines: string[]) {
  return lines.filter((line) => !isHeadlineLine(line))
}

function makeBodyText(lines: string[]) {
  const bodyLines = removeHeadlineLines(lines)

  const startPriority = [
    /negli ultimi anni/i,
    /a livello europeo/i,
    /il modello/i,
    /le associazioni/i,
  ]

  let cutStartIndex = -1

  for (const pattern of startPriority) {
    cutStartIndex = bodyLines.findIndex((line) => pattern.test(line))
    if (cutStartIndex >= 0) break
  }

  const selectedLines =
    cutStartIndex >= 0 ? bodyLines.slice(cutStartIndex) : bodyLines

  return selectedLines
    .join('\n')
    .replace(/\n(?=[a-zàèéìòù])/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(
      /Per valutare correttamente un immobile o approfondire il tema, Area Immobiliare può offrire un confronto diretto e mirato\./gi,
      ''
    )
    .trim()
}

function fallbackTitle(bodyText: string) {
  const sentence = splitSentences(bodyText)[0]
  if (!sentence) return 'Aggiornamento dal mercato immobiliare'

  return clampText(sentence.replace(/[.]+$/, ''), 82)
}

function buildBrief(headlineSubtitle: string, bodyText: string) {
  if (headlineSubtitle && headlineSubtitle.length >= 80) {
    return clampText(headlineSubtitle, 260)
  }

  const sentences = splitSentences(bodyText)
  const useful =
    sentences.find((sentence) => {
      if (/^il modello/i.test(sentence)) return false
      if (/^pagina:/i.test(sentence)) return false
      return sentence.length <= 280
    }) || sentences[0]

  return clampText(
    useful ||
      'Sintesi editoriale dedicata al mercato immobiliare, con spunti utili per proprietari, acquirenti e persone interessate al tema casa.',
    260
  )
}

function findSentence(bodyText: string, patterns: RegExp[]) {
  const sentences = splitSentences(bodyText)

  return sentences.find((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  )
}

function buildKeyPoints(bodyText: string) {
  const points: string[] = []

  const euPoint = findSentence(bodyText, [
    /regolamento.*2024\/1028/i,
    /20 maggio 2026/i,
    /trasparenza.*dati/i,
  ])

  if (euPoint) {
    points.push(clampText(euPoint, 260))
  }

  const bergamoPoint = findSentence(bodyText, [
    /comune di bergamo/i,
    /borghi storici/i,
    /requisiti qualitativi/i,
    /agibilità/i,
  ])

  if (bergamoPoint) {
    points.push(clampText(bergamoPoint, 260))
  }

  const associazioniPoint = findSentence(bodyText, [
    /confedilizia/i,
    /fiaip/i,
    /confabitare/i,
    /associazioni/i,
    /operatori del settore/i,
  ])

  if (associazioniPoint) {
    points.push(clampText(associazioniPoint, 260))
  }

  const fallback = splitSentences(bodyText)
    .filter((sentence) => sentence.length <= 260)
    .slice(0, 3)

  for (const sentence of fallback) {
    if (points.length >= 3) break

    const clean = clampText(sentence, 260)
    if (!points.some((point) => point.toLowerCase() === clean.toLowerCase())) {
      points.push(clean)
    }
  }

  return points.slice(0, 3)
}

function buildSection(bodyText: string, title: string, patterns: RegExp[]) {
  const sentences = splitSentences(bodyText)
  const startIndex = sentences.findIndex((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  )

  if (startIndex < 0) return null

  const sectionSentences = sentences.slice(startIndex, startIndex + 3)
  const paragraph = sectionSentences.join(' ').trim()

  if (!paragraph) return null

  return {
    title,
    paragraph: clampText(paragraph, 920),
  }
}

function buildSections(bodyText: string) {
  const sections: { title: string; paragraph: string }[] = []

  const introSentences = splitSentences(bodyText).slice(0, 3)
  if (introSentences.length > 0) {
    sections.push({
      title: 'Il contesto',
      paragraph: clampText(introSentences.join(' '), 920),
    })
  }

  const european = buildSection(bodyText, 'Il quadro europeo', [
    /a livello europeo/i,
    /regolamento.*2024\/1028/i,
    /20 maggio 2026/i,
  ])

  if (european) sections.push(european)

  const bergamo = buildSection(bodyText, 'Il caso Bergamo', [
    /bergamo/i,
    /orio/i,
    /borghi storici/i,
    /comune di bergamo/i,
  ])

  if (bergamo) sections.push(bergamo)

  const operators = buildSection(bodyText, 'Le posizioni degli operatori', [
    /confedilizia/i,
    /fiaip/i,
    /confabitare/i,
    /associazioni/i,
    /operatori del settore/i,
  ])

  if (operators) sections.push(operators)

  const uniqueSections: { title: string; paragraph: string }[] = []

  for (const section of sections) {
    if (
      !uniqueSections.some(
        (existing) =>
          existing.title === section.title ||
          existing.paragraph.toLowerCase() === section.paragraph.toLowerCase()
      )
    ) {
      uniqueSections.push(section)
    }
  }

  return uniqueSections.slice(0, 4)
}

function normalizePdfUrl(value?: string) {
  const clean = value?.trim()
  if (!clean) return ''

  return clean
}

export function generateNewsFromPdfText(
  rawText: string,
  options: GenerateNewsOptions = {}
): GeneratedNews {
  const lines = cleanLines(rawText)
  const headline = extractHeadline(lines)
  const bodyText = makeBodyText(lines)

  const title = headline?.title || fallbackTitle(bodyText)
  const brief = buildBrief(headline?.subtitle || '', bodyText)
  const keyPoints = buildKeyPoints(bodyText)
  const sections = buildSections(bodyText)
  const sourcePdfUrl = normalizePdfUrl(options.sourcePdfUrl)

  const plainParts: string[] = []

  sections.forEach((section, index) => {
    if (index === 0) {
      plainParts.push(section.paragraph)
    } else {
      plainParts.push(`${section.title}\n${section.paragraph}`)
    }
  })

  if (keyPoints.length > 0) {
    plainParts.push(
      `Punti principali\n${keyPoints.map((point) => `- ${point}`).join('\n')}`
    )
  }

  if (sourcePdfUrl) {
    plainParts.push(`Fonte PDF completa\n${sourcePdfUrl}`)
  }

  const plainContent = plainParts.join('\n\n')

  const htmlParts: string[] = []

  sections.forEach((section, index) => {
    if (index > 0) {
      htmlParts.push(`<h3>${escapeHtml(section.title)}</h3>`)
    }

    htmlParts.push(`<p>${escapeHtml(section.paragraph)}</p>`)
  })

  if (keyPoints.length > 0) {
    htmlParts.push('<h3>Punti principali</h3>')
    htmlParts.push(
      `<ul>${keyPoints
        .map((point) => `<li>${escapeHtml(point)}</li>`)
        .join('')}</ul>`
    )
  }

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
    plainContent,
    keyPoints,
    sourcePdfUrl: sourcePdfUrl || undefined,
  }
}
