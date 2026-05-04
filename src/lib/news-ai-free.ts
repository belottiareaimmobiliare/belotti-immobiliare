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
  /^il caso bergamo$/i,
  /^punti principali$/i,
  /^\d+$/,
]

function fixPdfHyphenation(value: string) {
  return value
    .replace(/[\u2010-\u2015\u2212]/g, '-')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s+([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/([A-Za-zÀ-ÖØ-öø-ÿ])-\s*\n\s*([A-Za-zÀ-ÖØ-öø-ÿ])/g, '$1$2')
    .replace(/\b([dDlLsScC])\s+[’']\s*/g, '$1’')
    .replace(/\s+([,.;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function normalizeText(input: string) {
  return fixPdfHyphenation(
    input
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[\u00ad\uFFFD\uFFFE]/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

function compactLines(rawText: string) {
  const sourceLines = normalizeText(rawText)
    .split('\n')
    .map((line) => fixPdfHyphenation(line.trim()))
    .filter(Boolean)

  const lines: string[] = []

  for (let i = 0; i < sourceLines.length; i += 1) {
    const line = sourceLines[i]

    if (
      /^[A-ZÀÈÉÌÒÙ]$/.test(line) &&
      sourceLines[i + 1] &&
      /^[a-zàèéìòù]/.test(sourceLines[i + 1])
    ) {
      lines.push(fixPdfHyphenation(line + sourceLines[i + 1]))
      i += 1
      continue
    }

    lines.push(line)
  }

  return lines
}

function isNoiseLine(line: string) {
  const clean = fixPdfHyphenation(line.trim())
  if (!clean) return true
  if (clean.length <= 2) return true
  if (/^[\W_]+$/.test(clean)) return true

  return NOISE_PATTERNS.some((pattern) => pattern.test(clean))
}

function cleanLines(rawText: string) {
  return compactLines(rawText)
    .map((line) => fixPdfHyphenation(line.replace(/\s+/g, ' ').trim()))
    .filter((line) => !isNoiseLine(line))
}

function uppercaseRatio(line: string) {
  const letters = line.replace(/[^a-zA-ZÀ-ÿ]/g, '')
  if (!letters) return 0

  const uppercase = letters.replace(/[^A-ZÀÈÉÌÒÙ]/g, '')
  return uppercase.length / letters.length
}

function isHeadlineLine(line: string) {
  const clean = fixPdfHyphenation(line.trim())

  if (clean.length < 12 || clean.length > 145) return false
  if (/[a-zàèéìòù]{3,}/.test(clean)) return false

  const ratio = uppercaseRatio(clean)

  return ratio >= 0.68 && /[A-ZÀÈÉÌÒÙ]{4,}/.test(clean)
}

function smartTitleCase(value: string) {
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

  return fixPdfHyphenation(value)
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
    .replace(/\s+’/g, '’')
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

  const linesForTitle = bestBlock.lines.slice(0, 2)
  const linesForSubtitle = bestBlock.lines.slice(2, 6)

  return {
    rawTitle: linesForTitle.join(' '),
    title: smartTitleCase(linesForTitle.join(' ')),
    subtitle: linesForSubtitle.length
      ? smartTitleCase(linesForSubtitle.join(' '))
      : '',
    allLines: bestBlock.lines,
  }
}

function removeHeadlineLines(lines: string[]) {
  return lines.filter((line) => !isHeadlineLine(line))
}

function splitSentences(text: string) {
  return fixPdfHyphenation(text)
    .replace(/\n/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => fixPdfHyphenation(sentence.trim()))
    .filter((sentence) => sentence.length >= 50)
}

function escapeHtml(value: string) {
  return fixPdfHyphenation(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function clampText(text: string, max: number) {
  const clean = fixPdfHyphenation(text)
  if (clean.length <= max) return clean

  const cut = clean.slice(0, max)
  const lastStop = Math.max(
    cut.lastIndexOf('.'),
    cut.lastIndexOf(';'),
    cut.lastIndexOf(':')
  )

  if (lastStop > max * 0.55) {
    return fixPdfHyphenation(cut.slice(0, lastStop + 1).trim())
  }

  return fixPdfHyphenation(cut.trim().replace(/[\s,;:\-–—.]+$/, '') + '…')
}

function makeBodyText(lines: string[]) {
  const bodyLines = removeHeadlineLines(lines)

  const startPriority = [
    /il\s+\d{1,2}\s+\w+\s+\d{4}/i,
    /negli ultimi anni/i,
    /a livello europeo/i,
    /il modello/i,
    /le associazioni/i,
    /la commissione europea/i,
    /la commissione ue/i,
    /per la prima volta/i,
  ]

  let cutStartIndex = -1

  for (const pattern of startPriority) {
    cutStartIndex = bodyLines.findIndex((line) => pattern.test(line))
    if (cutStartIndex >= 0) break
  }

  const selectedLines =
    cutStartIndex >= 0 ? bodyLines.slice(cutStartIndex) : bodyLines

  return fixPdfHyphenation(
    selectedLines
      .join(' ')
      .replace(/\s+/g, ' ')
      .replace(
        /Per valutare correttamente un immobile o approfondire il tema, Area Immobiliare può offrire un confronto diretto e mirato\./gi,
        ''
      )
      .trim()
  )
}

function fallbackTitle(bodyText: string) {
  const sentence = splitSentences(bodyText)[0]
  if (!sentence) return 'Aggiornamento dal mercato immobiliare'

  return clampText(sentence.replace(/[.]+$/, ''), 82)
}

function refineTitle(title: string, bodyText: string) {
  const clean = fixPdfHyphenation(title.trim())

  if (
    /^per l[’']abitare accessibile/i.test(clean) &&
    /commissione europea|piano europeo|edilizia abitativa|prezzi accessibili/i.test(
      bodyText
    )
  ) {
    return 'Piano UE per l’abitare accessibile'
  }

  if (
    /abitare accessibile/i.test(clean) &&
    /cantieri|ristrutturazioni|edilizia sociale/i.test(clean)
  ) {
    return 'Piano UE per l’abitare accessibile'
  }

  return clean.replace(/,$/, '')
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

function uniquePush(list: string[], value: string) {
  const clean = clampText(value, 270)

  if (!clean) return

  if (
    !list.some(
      (item) =>
        item.toLowerCase() === clean.toLowerCase() ||
        item.toLowerCase().includes(clean.toLowerCase().slice(0, 80)) ||
        clean.toLowerCase().includes(item.toLowerCase().slice(0, 80))
    )
  ) {
    list.push(clean)
  }
}

function buildKeyPoints(bodyText: string) {
  const points: string[] = []

  const policyPoint = findSentence(bodyText, [
    /piano europeo/i,
    /commissione europea/i,
    /regolamento/i,
    /normativa/i,
    /20 maggio 2026/i,
    /2024\/1028/i,
  ])

  if (policyPoint) uniquePush(points, policyPoint)

  const operationalPoint = findSentence(bodyText, [
    /cantieri/i,
    /ristrutturazioni/i,
    /titoli edilizi/i,
    /urbanistica/i,
    /passaporto digitale/i,
    /\bDPP\b/i,
    /agibilità/i,
    /impianti/i,
  ])

  if (operationalPoint) uniquePush(points, operationalPoint)

  const marketPoint = findSentence(bodyText, [
    /mercato/i,
    /investimenti/i,
    /edilizia sociale/i,
    /offerta abitativa/i,
    /abitazioni/i,
    /proprietari/i,
    /operatori/i,
    /imprese edili/i,
    /professionisti tecnici/i,
  ])

  if (marketPoint) uniquePush(points, marketPoint)

  const fallback = splitSentences(bodyText)
    .filter((sentence) => sentence.length <= 270)
    .slice(0, 4)

  for (const sentence of fallback) {
    if (points.length >= 3) break
    uniquePush(points, sentence)
  }

  return points.slice(0, 3)
}

function takeSentencesAround(bodyText: string, patterns: RegExp[], maxSentences = 3) {
  const sentences = splitSentences(bodyText)
  const startIndex = sentences.findIndex((sentence) =>
    patterns.some((pattern) => pattern.test(sentence))
  )

  if (startIndex < 0) return ''

  return fixPdfHyphenation(sentences.slice(startIndex, startIndex + maxSentences).join(' '))
}

function isStrongBergamo(bodyText: string) {
  return /comune di bergamo|borghi storici|città alta|orio|palafrizzoni/i.test(
    bodyText
  )
}

function detectTopic(bodyText: string) {
  if (/affitti brevi|locazioni brevi|affitto turistico|case vacanze/i.test(bodyText)) {
    return 'short-rentals'
  }

  if (
    /edilizia abitativa|abitare accessibile|prezzi accessibili|piano europeo|commissione europea|edilizia sociale/i.test(
      bodyText
    )
  ) {
    return 'housing-plan'
  }

  return 'generic'
}

function buildSections(bodyText: string) {
  const topic = detectTopic(bodyText)
  const sections: { title: string; paragraph: string }[] = []
  const sentences = splitSentences(bodyText)

  const intro = sentences.slice(0, 3).join(' ')
  if (intro) {
    sections.push({
      title: 'Sintesi',
      paragraph: clampText(intro, 920),
    })
  }

  if (topic === 'short-rentals') {
    const europe = takeSentencesAround(bodyText, [
      /a livello europeo/i,
      /regolamento.*2024\/1028/i,
      /20 maggio 2026/i,
      /trasparenza/i,
    ])

    if (europe) {
      sections.push({
        title: 'Il quadro europeo',
        paragraph: clampText(europe, 920),
      })
    }

    if (isStrongBergamo(bodyText)) {
      const bergamo = takeSentencesAround(bodyText, [
        /comune di bergamo/i,
        /borghi storici/i,
        /orio/i,
        /palafrizzoni/i,
      ])

      if (bergamo) {
        sections.push({
          title: 'Il caso Bergamo',
          paragraph: clampText(bergamo, 920),
        })
      }
    }

    const operators = takeSentencesAround(bodyText, [
      /confedilizia/i,
      /fiaip/i,
      /confabitare/i,
      /operatori del settore/i,
      /associazioni/i,
    ])

    if (operators) {
      sections.push({
        title: 'Le posizioni degli operatori',
        paragraph: clampText(operators, 920),
      })
    }
  } else if (topic === 'housing-plan') {
    const plan = takeSentencesAround(bodyText, [
      /commissione europea/i,
      /piano europeo/i,
      /edilizia abitativa/i,
      /prezzi accessibili/i,
      /svolta storica/i,
    ])

    if (plan) {
      sections.push({
        title: 'Il piano europeo',
        paragraph: clampText(plan, 920),
      })
    }

    const innovation = takeSentencesAround(bodyText, [
      /cantieri/i,
      /ristrutturazioni/i,
      /passaporto digitale/i,
      /\bDPP\b/i,
      /titoli edilizi/i,
      /urbanistica/i,
      /burocrazia/i,
    ])

    if (innovation) {
      sections.push({
        title: 'Cantieri, ristrutturazioni e innovazione',
        paragraph: clampText(innovation, 920),
      })
    }

    const market = takeSentencesAround(bodyText, [
      /mercato/i,
      /investimenti/i,
      /edilizia sociale/i,
      /offerta abitativa/i,
      /abitazioni/i,
      /imprese edili/i,
      /professionisti tecnici/i,
    ])

    if (market) {
      sections.push({
        title: 'Effetti sul mercato',
        paragraph: clampText(market, 920),
      })
    }
  } else {
    const context = takeSentencesAround(bodyText, [
      /normativa/i,
      /mercato/i,
      /proprietari/i,
      /abitazioni/i,
      /immobiliare/i,
    ])

    if (context) {
      sections.push({
        title: 'Il contesto',
        paragraph: clampText(context, 920),
      })
    }
  }

  const uniqueSections: { title: string; paragraph: string }[] = []

  for (const section of sections) {
    if (
      section.paragraph &&
      !uniqueSections.some(
        (existing) =>
          existing.title === section.title ||
          existing.paragraph.toLowerCase() === section.paragraph.toLowerCase()
      )
    ) {
      uniqueSections.push({
        title: section.title,
        paragraph: fixPdfHyphenation(section.paragraph),
      })
    }
  }

  return uniqueSections.slice(0, 4)
}


function makeStrongShortTitle(title: string) {
  const clean = fixPdfHyphenation(title)
    .replace(/\s+/g, ' ')
    .replace(/,$/, '')
    .trim()

  if (clean.length <= 64) return clean

  const separators = ['. ', ': ', ' - ', ' – ', ', ']

  for (const separator of separators) {
    const index = clean.indexOf(separator)
    if (index > 28 && index <= 64) {
      return clean.slice(0, index).trim()
    }
  }

  return clampText(clean, 64)
}

function makeLightBrief(brief: string, bodyText: string) {
  const clean = fixPdfHyphenation(brief)
    .replace(/\s+/g, ' ')
    .trim()

  if (clean && clean.length <= 210) return clean

  const firstSentence = splitSentences(bodyText)[0]

  if (firstSentence) {
    return clampText(firstSentence, 210)
  }

  return clampText(clean || 'Sintesi della notizia con i principali elementi utili per comprendere il tema trattato.', 210)
}


function normalizePdfUrl(value?: string) {
  return value?.trim() || ''
}

export function generateNewsFromPdfText(
  rawText: string,
  options: GenerateNewsOptions = {}
): GeneratedNews {
  const lines = cleanLines(rawText)
  const headline = extractHeadline(lines)
  const bodyText = makeBodyText(lines)

  const title = refineTitle(headline?.title || fallbackTitle(bodyText), bodyText)
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
      `Punti principali\n${keyPoints.map((point) => `• ${point}`).join('\n')}`
    )
  }

  if (sourcePdfUrl) {
    plainParts.push(`Fonte PDF completa\n${sourcePdfUrl}`)
  }

  const plainContent = fixPdfHyphenation(plainParts.join('\n\n'))

  const htmlParts: string[] = []

  sections.forEach((section, index) => {
    if (index > 0) {
      htmlParts.push(`<h3>${escapeHtml(section.title)}</h3>`)
    }

    htmlParts.push(`<p>${escapeHtml(section.paragraph)}</p>`)
  })

  if (keyPoints.length > 0) {
    htmlParts.push('<h3>Punti principali</h3>')
    keyPoints.forEach((point) => {
      htmlParts.push(`<p>• ${escapeHtml(point)}</p>`)
    })
  }

  if (sourcePdfUrl) {
    htmlParts.push(
      `<p><strong>Fonte PDF completa:</strong><br><a href="${escapeHtml(
        sourcePdfUrl
      )}">${escapeHtml(sourcePdfUrl)}</a></p>`
    )
  }

  return {
    title: makeStrongShortTitle(title),
    brief: makeLightBrief(brief, bodyText),
    content: htmlParts.join('\n'),
    plainContent,
    keyPoints: [],
    sourcePdfUrl: sourcePdfUrl || undefined,
  }
}
