import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const REPORT_MD = path.join(OUT_DIR, 'descrizioni-reali-portali-per-ref.md')
const REPORT_JSON = path.join(OUT_DIR, 'descrizioni-reali-portali-per-ref.json')

function compact(value = '') {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pick(row, keys, fallback = '') {
  for (const key of keys) {
    if (row && row[key] !== undefined && row[key] !== null && compact(row[key]) !== '') {
      return row[key]
    }
  }
  return fallback
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/').slice(0, 260)
}

function stripTags(html = '') {
  return compact(
    String(html || '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function decodeEntities(value = '') {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\\u0026/g, '&')
}

function decodeJsonString(value = '') {
  const raw = String(value || '')
  try {
    return JSON.parse(`"${raw.replace(/"/g, '\\"')}"`)
  } catch {
    return raw
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '\\')
  }
}

function normalize(value = '') {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(value = '') {
  const stop = new Set([
    'in', 'via', 'viale', 'piazza', 'largo', 'san', 'santa', 'santo',
    'centro', 'bergamo', 'citta', 'alta', 'stazione', 'studio',
    'ufficio', 'locale', 'commerciale', 'trilocale', 'bilocale',
    'quadrilocale', 'appartamento', 'villa', 'garage', 'box',
    'vendita', 'affitto', 'nuovo', 'ottimo', 'buono', 'stato',
  ])

  return normalize(value)
    .split(' ')
    .filter((token) => token.length >= 4 && !stop.has(token))
}

function titleScore(a = '', b = '') {
  const ta = new Set(tokens(a))
  const tb = new Set(tokens(b))

  if (!ta.size || !tb.size) return 0

  let hit = 0
  for (const token of ta) {
    if (tb.has(token)) hit += 1
  }

  return hit / Math.max(ta.size, 1)
}

function priceKey(value = '') {
  const raw = compact(value)
  if (!raw) return ''
  const nums = raw.match(/\d[\d.\s]*/g)
  if (!nums) return ''
  return nums.join('').replace(/\D/g, '')
}

function extractIdFromUrl(value = '') {
  const match = String(value || '').match(/\/annunci\/(\d+)/)
  return match ? match[1] : ''
}

function getRowUrl(row) {
  return compact(pick(row, [
    'url',
    'source_url',
    'sourceUrl',
    'portal_url',
    'portalUrl',
    'annuncio_url',
    'annuncioUrl',
  ], ''))
}

function normalizeContract(contract = '') {
  const c = compact(contract).toLowerCase()
  if (c.includes('affitto') || c.includes('locazione') || c.includes('rent')) return 'affitto'
  if (c.includes('vendita') || c.includes('sale')) return 'vendita'
  return c || 'non chiaro'
}

function shouldAnalyze(row) {
  const action = compact(pick(row, ['action', 'azione'], ''))
  const contract = normalizeContract(pick(row, ['contract_type', 'contractType', 'contract', 'contratto'], ''))
  return action === 'CREARE DRAFT' && ['vendita', 'affitto'].includes(contract)
}

function cleanDescription(value = '') {
  let text = decodeEntities(decodeJsonString(value))

  text = text
    .replace(/<[^>]+>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\bAREA IMMOBILIARE SAS DI BELOTTI G\.?/gi, ' ')
    .replace(/\bArea Immobiliare S\.a\.s\b/gi, ' ')
    .replace(/\bContatta\b/gi, ' ')
    .replace(/\bSalva\b/gi, ' ')
    .replace(/\bEspandi\b/gi, ' ')
    .replace(/\bTi interessa\?\b/gi, ' ')
    .replace(/\bChiama\b/gi, ' ')
    .replace(/\bInvia\b/gi, ' ')
    .replace(/\bGold\b|\bPlatinum\b|\bpremium\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text
}

function looksDirty(text = '') {
  const value = compact(text)
  if (!value) return true

  const badPatterns = [
    /"urls"\s*:/i,
    /"caption"\s*:/i,
    /"uuid"\s*:/i,
    /"realEstate"\s*:/i,
    /"featureList"\s*:/i,
    /pwm\.im-cdn\.it/i,
    /pic\.im-cdn\.it/i,
    /__NEXT_DATA__/i,
    /<\/?[a-z][\s\S]*>/i,
    /\{.*\}/,
    /\[".*"\]/,
  ]

  if (badPatterns.some((regex) => regex.test(value))) return true

  const quoteCount = (value.match(/"/g) || []).length
  const braceCount = (value.match(/[{}[\]]/g) || []).length

  if (quoteCount > 4) return true
  if (braceCount > 2) return true

  return false
}

function qualityScore({ description, title, price, sourceTitle }) {
  const text = compact(description)

  if (!text) return -100
  if (looksDirty(text)) return -90
  if (text.length < 80) return -30

  let score = 0

  if (text.length >= 160) score += 30
  if (text.length >= 300) score += 20
  if (text.length >= 600) score += 10

  const strongTitleScore = Math.max(titleScore(title, sourceTitle || ''), titleScore(title, text))
  score += Math.round(strongTitleScore * 35)

  const p = priceKey(price)
  if (p && text.replace(/\D/g, '').includes(p)) score += 10

  if (/[.?!]/.test(text)) score += 5

  return score
}

function findBalancedObject(text, objectStart) {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = objectStart; i < text.length; i++) {
    const ch = text[i]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === '"') {
        inString = false
      }
      continue
    }

    if (ch === '"') {
      inString = true
      continue
    }

    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) {
        return text.slice(objectStart, i + 1)
      }
    }
  }

  return ''
}

function collectStringsByKey(obj, keys = ['description']) {
  const out = []

  function walk(value, keyName = '') {
    if (value === null || value === undefined) return

    if (typeof value === 'string') {
      if (keys.some((key) => keyName.toLowerCase().includes(key.toLowerCase()))) {
        out.push(value)
      }
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, keyName)
      return
    }

    if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, key)
      }
    }
  }

  walk(obj)
  return out
}

function objectTitle(obj) {
  const candidates = []

  function walk(value, keyName = '') {
    if (value === null || value === undefined) return

    if (typeof value === 'string') {
      if (['title', 'anchor'].includes(keyName)) candidates.push(value)
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, keyName)
      return
    }

    if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, key)
      }
    }
  }

  walk(obj)
  return candidates.sort((a, b) => compact(b).length - compact(a).length)[0] || ''
}

function objectIds(obj) {
  const ids = new Set()

  function walk(value, keyName = '') {
    if (value === null || value === undefined) return

    if ((keyName === 'id' || keyName === 'advertId') && (typeof value === 'number' || typeof value === 'string')) {
      ids.add(String(value))
    }

    if (typeof value === 'string') {
      const id = extractIdFromUrl(value)
      if (id) ids.add(id)
      return
    }

    if (Array.isArray(value)) {
      for (const item of value) walk(item, keyName)
      return
    }

    if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, key)
      }
    }
  }

  walk(obj)
  return [...ids]
}

function extractFromImmobiliareStructured({ html, row, file }) {
  const title = compact(pick(row, ['title', 'immobile'], ''))
  const price = compact(pick(row, ['price', 'prezzo', 'price_label', 'priceLabel'], ''))
  const rowUrl = getRowUrl(row)
  const rowId = extractIdFromUrl(rowUrl)
  const candidates = []

  const decoded = decodeEntities(html)
  const markers = []

  if (rowId) markers.push(rowId)
  if (rowUrl) markers.push(rowUrl)
  if (title) markers.push(title)

  const starts = new Set()

  for (const marker of markers) {
    let index = decoded.indexOf(marker)
    while (index >= 0) {
      const start = decoded.lastIndexOf('{"realEstate"', index)
      if (start >= 0) starts.add(start)
      index = decoded.indexOf(marker, index + marker.length)
    }
  }

  for (const start of starts) {
    const objectText = findBalancedObject(decoded, start)
    if (!objectText) continue

    try {
      const obj = JSON.parse(objectText)
      const foundTitle = objectTitle(obj)
      const foundIds = objectIds(obj)

      const idMatches = rowId && foundIds.includes(rowId)
      const titleMatches = titleScore(title, foundTitle) >= 0.45

      if (!idMatches && !titleMatches) continue

      const descriptions = collectStringsByKey(obj, ['description'])

      for (const raw of descriptions) {
        const description = cleanDescription(raw)
        const score = qualityScore({
          description,
          title,
          price,
          sourceTitle: foundTitle,
        })

        candidates.push({
          source: `immobiliare-json:${path.basename(file)}`,
          sourceTitle: foundTitle,
          score,
          description,
        })
      }
    } catch {}
  }

  return candidates
}

function extractFromGenericDescriptionFields({ html, row, file }) {
  const title = compact(pick(row, ['title', 'immobile'], ''))
  const price = compact(pick(row, ['price', 'prezzo', 'price_label', 'priceLabel'], ''))
  const rowUrl = getRowUrl(row)
  const rowId = extractIdFromUrl(rowUrl)
  const decoded = decodeEntities(html)
  const candidates = []

  const markers = [rowId, rowUrl, title].filter(Boolean)

  for (const marker of markers) {
    let pos = decoded.indexOf(marker)
    while (pos >= 0) {
      const segment = decoded.slice(Math.max(0, pos - 6000), Math.min(decoded.length, pos + 12000))

      const regexes = [
        /"description"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/gi,
        /"shortDescription"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/gi,
        /"descriptionText"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/gi,
      ]

      for (const regex of regexes) {
        let match
        while ((match = regex.exec(segment))) {
          const description = cleanDescription(match[1])
          const score = qualityScore({
            description,
            title,
            price,
            sourceTitle: title,
          })

          candidates.push({
            source: `generic-json:${path.basename(file)}`,
            sourceTitle: title,
            score,
            description,
          })
        }
      }

      pos = decoded.indexOf(marker, pos + marker.length)
    }
  }

  return candidates
}

function extractFromCasaCards({ html, row, file }) {
  const title = compact(pick(row, ['title', 'immobile'], ''))
  const price = compact(pick(row, ['price', 'prezzo', 'price_label', 'priceLabel'], ''))
  const decoded = decodeEntities(html)
  const plain = stripTags(decoded)
  const candidates = []

  const titleNorm = normalize(title)
  const words = tokens(title)

  if (!titleNorm && !words.length) return candidates

  const splitMarkers = [
    '<div role="article"',
    'class="csaSrpcard__cnt-card',
  ]

  let chunks = [decoded]

  for (const marker of splitMarkers) {
    if (decoded.includes(marker)) {
      chunks = decoded.split(marker).map((chunk, index) => index === 0 ? chunk : marker + chunk)
      break
    }
  }

  for (const chunk of chunks) {
    const chunkPlain = stripTags(chunk)
    const scoreTitle = titleScore(title, chunkPlain)

    if (scoreTitle < 0.35) continue

    let cleaned = chunkPlain

    const startCandidates = [
      cleaned.indexOf(title),
      ...words.map((word) => normalize(cleaned).indexOf(word)).filter((x) => x >= 0),
    ].filter((x) => x >= 0)

    if (startCandidates.length) {
      const start = Math.min(...startCandidates)
      cleaned = cleaned.slice(Math.max(0, start - 80))
    }

    cleaned = cleaned
      .replace(/^.*?(€\s?[\d.]+|Trattativa riservata)/i, '$1')
      .replace(/\bAREA IMMOBILIARE[\s\S]*$/i, '')
      .replace(/\bContatta[\s\S]*$/i, '')
      .replace(/\bSalva[\s\S]*$/i, '')
      .trim()

    const description = cleanDescription(cleaned)
    const score = qualityScore({
      description,
      title,
      price,
      sourceTitle: title,
    })

    candidates.push({
      source: `casa-card:${path.basename(file)}`,
      sourceTitle: title,
      score,
      description,
    })
  }

  if (!candidates.length && plain.includes(title)) {
    const index = plain.indexOf(title)
    const segment = plain.slice(index, index + 1500)
    const description = cleanDescription(segment)
    const score = qualityScore({
      description,
      title,
      price,
      sourceTitle: title,
    })

    candidates.push({
      source: `plain-near-title:${path.basename(file)}`,
      sourceTitle: title,
      score,
      description,
    })
  }

  return candidates
}

async function loadHtmlFiles() {
  const names = await fs.readdir(OUT_DIR)
  const htmlNames = names.filter((name) => name.endsWith('.html'))

  const files = []

  for (const name of htmlNames) {
    const file = path.join(OUT_DIR, name)
    const html = await fs.readFile(file, 'utf8')
    files.push({ file, html })
  }

  return files
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const planRows = Array.isArray(plan.importRows) ? plan.importRows : []

  const rows = planRows
    .filter(shouldAnalyze)
    .map((row) => ({
      original: row,
      reference_code: compact(pick(row, ['reference_code', 'referenceCode', 'ref'], '')),
      title: compact(pick(row, ['title', 'immobile'], '')),
      price: compact(pick(row, ['price', 'prezzo', 'price_label', 'priceLabel'], '')),
      portals: compact(pick(row, ['portals', 'portali'], '')),
      url: getRowUrl(row),
    }))
    .filter((row) => row.reference_code && row.title)

  const htmlFiles = await loadHtmlFiles()

  const outputRows = []

  for (const row of rows) {
    const candidates = []

    for (const { file, html } of htmlFiles) {
      candidates.push(...extractFromImmobiliareStructured({ html, row: row.original, file }))
      candidates.push(...extractFromGenericDescriptionFields({ html, row: row.original, file }))

      if (row.portals.toLowerCase().includes('casa') || file.includes('casa.it')) {
        candidates.push(...extractFromCasaCards({ html, row: row.original, file }))
      }
    }

    const cleanedCandidates = candidates
      .map((candidate) => ({
        ...candidate,
        description: cleanDescription(candidate.description),
      }))
      .filter((candidate) => candidate.description && !looksDirty(candidate.description))
      .sort((a, b) => b.score - a.score || b.description.length - a.description.length)

    const best = cleanedCandidates[0] || null

    let status = 'MISSING'
    if (best && best.score >= 70) status = 'OK'
    else if (best && best.score >= 35) status = 'REVIEW'

    outputRows.push({
      reference_code: row.reference_code,
      title: row.title,
      price: row.price,
      portals: row.portals,
      url: row.url,
      status,
      score: best?.score ?? -100,
      source: best?.source || '',
      sourceTitle: best?.sourceTitle || '',
      description: best?.description || '',
      candidates: cleanedCandidates.slice(0, 5),
    })
  }

  const counts = {
    analyzed: outputRows.length,
    ok: outputRows.filter((row) => row.status === 'OK').length,
    review: outputRows.filter((row) => row.status === 'REVIEW').length,
    missing: outputRows.filter((row) => row.status === 'MISSING').length,
  }

  const md = [
    '# Descrizioni reali portali per REF',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Immobili analizzati: **${counts.analyzed}**`,
    `- Descrizioni reali OK: **${counts.ok}**`,
    `- Da verificare: **${counts.review}**`,
    `- Non trovate: **${counts.missing}**`,
    '',
    '## Tabella compatta',
    '',
    '| REF | Stato | Score | Fonte | Immobile | Anteprima descrizione |',
    '|---|---|---:|---|---|---|',
    ...outputRows.map((row) => `| ${safeCell(row.reference_code)} | ${row.status} | ${row.score} | ${safeCell(row.source || '-')} | ${safeCell(row.title)} | ${safeCell(row.description || '-')} |`),
    '',
    '## Descrizioni trovate',
    '',
    ...outputRows.map((row) => [
      `### ${row.reference_code} — ${row.title}`,
      '',
      `Stato: ${row.status}`,
      '',
      `Score: ${row.score}`,
      '',
      `Fonte: ${row.source || '-'}`,
      '',
      '```',
      row.description || 'Descrizione non trovata.',
      '```',
      '',
    ].join('\n')),
    '',
    '## Nota',
    '',
    'Questo report non scrive nulla in Supabase. Le descrizioni OK sono candidate reali estratte dagli HTML/cache dei portali. Le REVIEW vanno controllate prima di aggiornare il database.',
    '',
  ].join('\n')

  await fs.writeFile(REPORT_MD, md, 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    counts,
    rows: outputRows,
  }, null, 2), 'utf8')

  console.log('=== ESTRAZIONE DESCRIZIONI REALI PORTALI ===')
  console.log(`Immobili analizzati: ${counts.analyzed}`)
  console.log(`OK: ${counts.ok}`)
  console.log(`REVIEW: ${counts.review}`)
  console.log(`MISSING: ${counts.missing}`)
  console.log('')
  console.log('Report creato:')
  console.log('tmp/area-portali-audit/descrizioni-reali-portali-per-ref.md')
  console.log('tmp/area-portali-audit/descrizioni-reali-portali-per-ref.json')
  console.log('')
  console.log('=== ANTEPRIMA ===')
  console.log(md.split('\n').slice(0, 180).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
