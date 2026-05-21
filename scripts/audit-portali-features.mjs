import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const AUDIT_JSON = path.join(OUT_DIR, 'area-portali-audit.json')
const OUT_MD = path.join(OUT_DIR, 'caratteristiche-portali.md')
const OUT_JSON = path.join(OUT_DIR, 'caratteristiche-portali.json')
const OUT_CSV = path.join(OUT_DIR, 'caratteristiche-portali.csv')

const FEATURES = [
  {
    key: 'giardino',
    label: 'Giardino',
    regex: /\bgiardino\b|\bgiardinetto\b|\bverde privato\b/i,
  },
  {
    key: 'ascensore',
    label: 'Ascensore',
    regex: /\bascensore\b|\bservito da ascensore\b/i,
  },
  {
    key: 'box_garage',
    label: 'Box/Garage',
    regex: /\bbox\b|\bgarage\b|\bautorimessa\b|\bbox doppio\b|\bbox singolo\b|\bbox auto\b/i,
  },
  {
    key: 'posto_auto',
    label: 'Posto auto',
    regex: /\bposto auto\b|\bposti auto\b|\bposti macchina\b|\bparcheggio privato\b/i,
  },
  {
    key: 'cantina',
    label: 'Cantina',
    regex: /\bcantina\b|\bcantine\b/i,
  },
  {
    key: 'terrazzo',
    label: 'Terrazzo',
    regex: /\bterrazzo\b|\bterrazza\b|\bterrazzi\b|\bterrazze\b/i,
  },
  {
    key: 'balcone',
    label: 'Balcone',
    regex: /\bbalcone\b|\bbalconi\b|\bbalconcino\b/i,
  },
  {
    key: 'piscina',
    label: 'Piscina',
    regex: /\bpiscina\b|\bpiscine\b/i,
  },
  {
    key: 'arredato',
    label: 'Arredato',
    regex: /\barredato\b|\barredata\b|\barredati\b|\barredamento\b/i,
  },
  {
    key: 'nuova_costruzione',
    label: 'Nuova costruzione',
    regex: /\bnuova costruzione\b|\bnuova realizzazione\b|\bmai abitato\b|\bnuovi esclusivi\b|\bappartamento nuovo\b|\btrilocale nuovo\b|\bquadrilocale nuovo\b|\blocale nuovo\b|\bufficio nuovo\b|\brimesso interamente a nuovo\b|\ba nuovo\b/i,
  },
  {
    key: 'classe_a',
    label: 'Classe A',
    regex: /\bclasse energetica a\b|\bclasse a\b|\bclasse a\+\b|\ba4\b|\ba\+4\b/i,
  },
  {
    key: 'piano_terra',
    label: 'Piano terra',
    regex: /\bpiano terra\b|\bp\.?\s*terra\b/i,
  },
  {
    key: 'ultimo_piano',
    label: 'Ultimo piano',
    regex: /\bultimo piano\b|\bquarto ed ultimo\b/i,
  },
  {
    key: 'doppi_servizi',
    label: 'Doppi servizi',
    regex: /\bdue bagni\b|\b2 bagni\b|\bdoppi servizi\b/i,
  },
  {
    key: 'riscaldamento_autonomo',
    label: 'Riscaldamento autonomo',
    regex: /\briscaldamento autonomo\b|\btermoautonomo\b|\btermo autonomo\b/i,
  },
  {
    key: 'aria_condizionata',
    label: 'Aria condizionata',
    regex: /\baria condizionata\b|\bclimatizzazione\b|\bclimatizzato\b|\bclimatizzata\b/i,
  },
]

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeHtml(value = '') {
  return String(value || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&euro;/g, '€')
    .replace(/&#8364;/g, '€')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
}

function stripTags(value = '') {
  return compact(
    decodeHtml(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function stripAccents(value = '') {
  return compact(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function normalize(value = '') {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/')
}

function parsePrice(value) {
  const text = compact(value)
  if (!text || /richiesta|riservata/i.test(text)) return text || ''
  const match = text.match(/(€\s*\d{1,3}(?:\.\d{3})*(?:,\d+)?(?:\s*\/\s*mese)?|\d{1,3}(?:\.\d{3})*(?:,\d+)?\s*€(?:\s*\/\s*mese)?)/i)
  return match ? compact(match[1]).replace(/\s*\/\s*/g, '/') : text
}

function groupKey(entry) {
  return [
    normalize(entry.title || ''),
    normalize(entry.location || ''),
    normalize(parsePrice(entry.price || '')),
  ].join('|')
}

function detectFeaturesFromText(text) {
  const found = []
  const evidence = []

  const clean = compact(text)

  if (!clean) return { found, evidence }

  for (const feature of FEATURES) {
    const match = clean.match(feature.regex)
    if (match) {
      found.push(feature.label)

      const index = match.index ?? clean.toLowerCase().indexOf(match[0].toLowerCase())
      const start = Math.max(0, index - 90)
      const end = Math.min(clean.length, index + 170)
      evidence.push(compact(clean.slice(start, end)))
    }
  }

  return {
    found: [...new Set(found)],
    evidence: [...new Set(evidence)].slice(0, 3),
  }
}

async function loadHtmlFiles() {
  const files = await fs.readdir(OUT_DIR)
  const htmlFiles = files.filter((file) => file.endsWith('.html'))

  const loaded = []

  for (const file of htmlFiles) {
    const html = await fs.readFile(path.join(OUT_DIR, file), 'utf8')
    loaded.push({ file, html })
  }

  return loaded
}

function casaArticlesFromHtml(htmlFile) {
  const articles = []
  const re = /<div\b[^>]*role=(["'])article\1[\s\S]*?(?=<div\b[^>]*role=(["'])article\2|<\/body>|$)/gi

  for (const match of htmlFile.html.matchAll(re)) {
    const html = match[0]
    const aria = html.match(/\baria-label=(["'])(.*?)\1/i)
    const title = compact(decodeHtml(aria?.[2] || ''))
    const text = stripTags(html)

    if (!title || text.length < 20) continue

    articles.push({
      file: htmlFile.file,
      title,
      text,
    })
  }

  return articles
}

function bestCasaCardFor(entry, casaArticles) {
  const titleNorm = normalize(entry.title || '')
  const priceNorm = normalize(parsePrice(entry.price || ''))

  let best = null

  for (const article of casaArticles) {
    const articleTitleNorm = normalize(article.title)
    const articleTextNorm = normalize(article.text)

    let score = 0

    if (titleNorm && articleTitleNorm === titleNorm) score += 10
    if (titleNorm && articleTextNorm.includes(titleNorm)) score += 6
    if (priceNorm && articleTextNorm.includes(priceNorm)) score += 3

    const titleTokens = titleNorm.split(' ').filter((token) => token.length >= 4)
    for (const token of titleTokens) {
      if (articleTextNorm.includes(token)) score += 0.5
    }

    if (!best || score > best.score) {
      best = {
        ...article,
        score,
      }
    }
  }

  if (!best || best.score < 6) return null
  return best
}

function mergeEntries(entries, casaArticles) {
  const map = new Map()

  for (const entry of entries) {
    const key = groupKey(entry)

    if (!map.has(key)) {
      map.set(key, {
        title: entry.title || '',
        location: entry.location || '',
        portals: new Set(),
        prices: new Set(),
        details: new Set(),
        strictTexts: [],
        casaCards: [],
      })
    }

    const current = map.get(key)

    if (entry.portal) current.portals.add(entry.portal)
    if (entry.price) current.prices.add(entry.price)
    if (entry.details) current.details.add(entry.details)

    const strictText = compact([
      entry.title || '',
      entry.location || '',
      entry.details || '',
    ].join(' '))

    if (strictText) current.strictTexts.push({
      source: `${entry.portal || 'portale'}:${entry.source || 'entry'}`,
      text: strictText,
    })

    if (entry.portal === 'casa.it') {
      const card = bestCasaCardFor(entry, casaArticles)
      if (card) {
        current.casaCards.push({
          source: `casa.it:${card.file}`,
          text: card.text,
        })
      }
    }
  }

  return [...map.values()]
}

function analyzeItem(item) {
  const detections = []

  for (const strict of item.strictTexts) {
    const result = detectFeaturesFromText(strict.text)
    if (result.found.length) {
      detections.push({
        confidence: 'alta',
        source: strict.source,
        features: result.found,
        evidence: result.evidence,
      })
    }
  }

  for (const card of item.casaCards) {
    const result = detectFeaturesFromText(card.text)
    if (result.found.length) {
      detections.push({
        confidence: 'media',
        source: card.source,
        features: result.found,
        evidence: result.evidence,
      })
    }
  }

  const high = new Set()
  const medium = new Set()
  const evidence = []

  for (const detection of detections) {
    for (const feature of detection.features) {
      if (detection.confidence === 'alta') high.add(feature)
      if (detection.confidence === 'media' && !high.has(feature)) medium.add(feature)
    }

    for (const ev of detection.evidence) {
      evidence.push(`${detection.confidence}: ${ev}`)
    }
  }

  return {
    title: item.title,
    location: item.location,
    portals: [...item.portals].sort().join(', '),
    prices: [...item.prices].sort().join(' / '),
    high: [...high].sort(),
    medium: [...medium].sort(),
    evidence: [...new Set(evidence)].slice(0, 4),
  }
}


function cleanupRows(rows) {
  const genericTitles = new Set([
    'villa',
    'trilocale',
    'bilocale',
    'quadrilocale',
    'appartamento',
    'ufficio',
    'locale commerciale',
  ])

  function norm(value = '') {
    return String(value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function priceKey(row) {
    return norm(row.prices || '')
  }

  return rows.filter((row) => {
    const title = norm(row.title)
    if (!genericTitles.has(title)) return true

    const samePriceMoreSpecific = rows.some((other) => {
      if (other === row) return false
      if (priceKey(other) !== priceKey(row)) return false
      if (norm(other.title) === title) return false
      return norm(other.title).includes(title) || norm(other.title).length > title.length + 8
    })

    return !samePriceMoreSpecific
  })
}

function toCsv(rows) {
  const header = [
    'immobile',
    'portali',
    'prezzo',
    'caratteristiche_alta_confidenza',
    'caratteristiche_da_verificare',
    'evidenza',
  ]

  const escape = (value) => `"${String(value || '').replace(/"/g, '""')}"`

  return [
    header.join(';'),
    ...rows.map((row) => [
      row.title,
      row.portals,
      row.prices,
      row.high.join(', '),
      row.medium.join(', '),
      row.evidence.join(' | '),
    ].map(escape).join(';')),
  ].join('\n')
}

async function main() {
  const audit = JSON.parse(await fs.readFile(AUDIT_JSON, 'utf8'))
  const htmlFiles = await loadHtmlFiles()
  const casaArticles = htmlFiles.flatMap(casaArticlesFromHtml)

  const entries = Array.isArray(audit.entries) ? audit.entries : []
  const items = mergeEntries(entries, casaArticles)
  const rows = cleanupRows(items.map(analyzeItem))

  const withHigh = rows.filter((row) => row.high.length > 0)
  const withMediumOnly = rows.filter((row) => row.high.length === 0 && row.medium.length > 0)
  const withoutFeatures = rows.filter((row) => row.high.length === 0 && row.medium.length === 0)

  const statsHigh = new Map()
  const statsMedium = new Map()

  for (const row of rows) {
    for (const feature of row.high) statsHigh.set(feature, (statsHigh.get(feature) || 0) + 1)
    for (const feature of row.medium) statsMedium.set(feature, (statsMedium.get(feature) || 0) + 1)
  }

  const md = [
    '# Caratteristiche rilevate dai portali',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo conservativo',
    '',
    `- Immobili/righe analizzate: **${rows.length}**`,
    `- Immobili con caratteristiche ad alta confidenza: **${withHigh.length}**`,
    `- Immobili con sole caratteristiche da verificare: **${withMediumOnly.length}**`,
    `- Immobili senza caratteristiche rilevate: **${withoutFeatures.length}**`,
    '',
    '## Conteggio caratteristiche ad alta confidenza',
    '',
    '| Caratteristica | Immobili |',
    '|---|---:|',
    ...[...statsHigh.entries()].sort((a, b) => b[1] - a[1]).map(([feature, count]) => `| ${safeCell(feature)} | ${count} |`),
    '',
    '## Conteggio caratteristiche da verificare',
    '',
    '| Caratteristica | Immobili |',
    '|---|---:|',
    ...[...statsMedium.entries()].sort((a, b) => b[1] - a[1]).map(([feature, count]) => `| ${safeCell(feature)} | ${count} |`),
    '',
    '## Alta confidenza',
    '',
    '| Immobile | Portali | Prezzo | Caratteristiche | Evidenza |',
    '|---|---|---:|---|---|',
    ...withHigh.map((row) => `| ${safeCell(row.title)} | ${safeCell(row.portals)} | ${safeCell(row.prices)} | ${safeCell(row.high.join(', '))} | ${safeCell(row.evidence.join(' / '))} |`),
    '',
    '## Da verificare in admin',
    '',
    '| Immobile | Portali | Prezzo | Caratteristiche da verificare | Evidenza |',
    '|---|---|---:|---|---|',
    ...withMediumOnly.map((row) => `| ${safeCell(row.title)} | ${safeCell(row.portals)} | ${safeCell(row.prices)} | ${safeCell(row.medium.join(', '))} | ${safeCell(row.evidence.join(' / '))} |`),
    '',
    '## Nessuna caratteristica rilevata',
    '',
    '| Immobile | Portali | Prezzo |',
    '|---|---|---:|',
    ...withoutFeatures.map((row) => `| ${safeCell(row.title)} | ${safeCell(row.portals)} | ${safeCell(row.prices)} |`),
    '',
    '## Nota importante',
    '',
    'Questo report è volutamente conservativo. Le caratteristiche ad alta confidenza arrivano da titolo/dettagli già agganciati all’immobile. Le caratteristiche da verificare arrivano da card Casa.it riconosciute come probabili. Se una caratteristica non compare, non significa che l’immobile non ce l’abbia.',
    '',
  ].join('\n')

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2), 'utf8')
  await fs.writeFile(OUT_CSV, toCsv(rows), 'utf8')

  console.log('=== REPORT CARATTERISTICHE CONSERVATIVO CREATO ===')
  console.log('tmp/area-portali-audit/caratteristiche-portali.md')
  console.log('tmp/area-portali-audit/caratteristiche-portali.json')
  console.log('tmp/area-portali-audit/caratteristiche-portali.csv')
  console.log('')
  console.log(md.split('\n').slice(0, 220).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
