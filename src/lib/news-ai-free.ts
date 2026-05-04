export type GeneratedNews = {
  title: string
  brief: string
  content: string
  plainContent: string
  keyPoints: string[]
}

function normalizeText(input: string) {
  return input
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function stripNoise(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false
      if (line.length <= 2) return false
      if (/^pagina\s+\d+/i.test(line)) return false
      if (/^page\s+\d+/i.test(line)) return false
      if (/^\d+$/.test(line)) return false
      if (/^[\W_]+$/.test(line)) return false
      return true
    })
    .join('\n')
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function splitSentences(text: string) {
  return text
    .replace(/\n/g, ' ')
    .split(/(?<=[\.\!\?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 45)
}

function splitParagraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length >= 90)
}

function clampText(text: string, max: number) {
  const clean = text.trim()
  if (clean.length <= max) return clean

  return (
    clean
      .slice(0, max)
      .trim()
      .replace(/[\s,;:\-–—\.]+$/, '') + '…'
  )
}

function titleFromText(text: string) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const titleCandidate =
    lines.find((line) => {
      if (line.length < 22 || line.length > 95) return false
      if (line.split(' ').length < 4) return false
      if (/newsletter|pagina|copyright|www\./i.test(line)) return false
      return true
    }) ||
    splitSentences(text)[0] ||
    'Aggiornamento dal mercato immobiliare'

  return clampText(titleCandidate.replace(/[\.]+$/, ''), 82)
}

function scoreSentence(sentence: string) {
  const keywords = [
    'mercato',
    'immobiliare',
    'casa',
    'abitazione',
    'prezzi',
    'compravendite',
    'affitto',
    'vendita',
    'mutuo',
    'tassi',
    'domanda',
    'offerta',
    'investimento',
    'bergamo',
    'proprietari',
    'acquirenti',
    'locazione',
    'valore',
    'ristrutturazione',
    'energia',
    'classe energetica',
  ]

  const lower = sentence.toLowerCase()
  let score = 0

  for (const keyword of keywords) {
    if (lower.includes(keyword)) score += 2
  }

  if (sentence.length >= 80 && sentence.length <= 190) score += 2
  if (/\d/.test(sentence)) score += 1

  return score
}

function extractKeyPoints(text: string) {
  const sentences = splitSentences(text)

  const ranked = sentences
    .map((sentence, index) => ({
      sentence,
      index,
      score: scoreSentence(sentence),
    }))
    .filter((item) => item.sentence.length <= 230)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.index - b.index
    })

  const points: string[] = []

  for (const item of ranked) {
    const point = clampText(item.sentence, 185)

    if (!points.some((existing) => existing.toLowerCase() === point.toLowerCase())) {
      points.push(point)
    }

    if (points.length >= 3) break
  }

  return points
}

function briefFromText(text: string) {
  const sentences = splitSentences(text)
  const firstUseful = sentences.find((sentence) => sentence.length <= 220) || sentences[0]

  if (!firstUseful) {
    return 'Una sintesi editoriale dedicata al mercato immobiliare, con spunti utili per proprietari, acquirenti e persone interessate a vendere o acquistare casa.'
  }

  return clampText(firstUseful, 190)
}

function paragraphsFromText(text: string) {
  const paragraphs = splitParagraphs(text)

  if (paragraphs.length >= 2) {
    return paragraphs.slice(0, 4).map((paragraph) => clampText(paragraph, 720))
  }

  const sentences = splitSentences(text)
  const chunks: string[] = []

  for (let i = 0; i < sentences.length; i += 2) {
    const chunk = sentences.slice(i, i + 2).join(' ')
    if (chunk.length >= 80) chunks.push(clampText(chunk, 720))
  }

  return chunks.slice(0, 4)
}

export function generateNewsFromPdfText(rawText: string): GeneratedNews {
  const cleaned = stripNoise(normalizeText(rawText))
  const title = titleFromText(cleaned)
  const brief = briefFromText(cleaned)
  const keyPoints = extractKeyPoints(cleaned)
  const paragraphs = paragraphsFromText(cleaned)

  const intro =
    paragraphs[0] ||
    'Il tema affrontato nel documento offre spunti utili per leggere con maggiore attenzione il contesto immobiliare e orientare le scelte in modo più consapevole.'

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
      `<ul>${keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul>`
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
