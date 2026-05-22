import fs from 'node:fs/promises'
import path from 'node:path'

const AUDIT_DIR = 'tmp/area-portali-audit'
const CSV_FILE = path.join(AUDIT_DIR, 'descrizioni-manuali-portali.csv')
const IN_DIR = path.join(AUDIT_DIR, 'immobiliare-detail-pages')
const REPORT_MD = path.join(AUDIT_DIR, 'descrizioni-immobiliare-dettaglio-salvate.md')
const REPORT_JSON = path.join(AUDIT_DIR, 'descrizioni-immobiliare-dettaglio-salvate.json')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function htmlDecode(value) {
  return String(value ?? '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
}

function stripTags(value) {
  return compact(
    htmlDecode(value)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
  )
}

function parseCsv(text) {
  const rows = []
  let row = []
  let cell = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    const next = text[i + 1]

    if (quoted) {
      if (c === '"' && next === '"') {
        cell += '"'
        i++
      } else if (c === '"') {
        quoted = false
      } else {
        cell += c
      }
      continue
    }

    if (c === '"') quoted = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') {
      cell += c
    }
  }

  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }

  const headers = rows.shift() || []
  return rows
    .filter((r) => r.some((x) => compact(x)))
    .map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ''])))
}

function walk(value, cb) {
  if (!value) return
  if (Array.isArray(value)) {
    for (const item of value) walk(item, cb)
    return
  }
  if (typeof value === 'object') {
    cb(value)
    for (const item of Object.values(value)) walk(item, cb)
  }
}

function tryJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function unescapeJsonString(raw) {
  try {
    return JSON.parse(`"${raw.replace(/"/g, '\\"')}"`)
  } catch {
    return raw
  }
}

function titleTokens(title) {
  return compact(title)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((x) => x.length >= 4)
    .filter((x) => !['vendita', 'affitto', 'studio', 'locale', 'commerciale', 'appartamento', 'bilocale', 'trilocale', 'quadrilocale', 'ufficio'].includes(x))
}

function scoreCandidate(text, row) {
  const s = compact(text)
  const low = s.toLowerCase()

  let score = 0
  if (s.length >= 120) score += 20
  if (s.length >= 250) score += 20
  if (s.length >= 500) score += 10

  const tokens = titleTokens(row.title)
  const tokenHits = tokens.filter((t) => low.includes(t)).length
  score += Math.min(30, tokenHits * 10)

  if (/\b(vendesi|affittasi|richiesta|composto|composta|mq|m²|piano|bagno|bagni|camera|camere|soggiorno|cucina|box|cantina|terrazzo|giardino)\b/i.test(s)) score += 25

  if (/messaggio\s+visita/i.test(s)) score -= 80
  if (/immobiliare\.it\s+chi siamo/i.test(s)) score -= 80
  if (/agenzie e costruttori|pubblicazione annunci|lavora con noi|privacy|cookie/i.test(s)) score -= 40
  if (/22 annunci residenziali/i.test(s)) score -= 80
  if (/descrizione non trovata/i.test(s)) score -= 100
  if (/bozza importata da audit/i.test(s)) score -= 100

  return score
}

function addCandidate(candidates, source, text) {
  const clean = compact(htmlDecode(text))
  if (!clean) return
  if (clean.length < 80) return
  if (clean.length > 5000) return
  if (candidates.some((c) => c.text === clean)) return
  candidates.push({ source, text: clean })
}

function extractCandidates(html) {
  const candidates = []

  for (const m of html.matchAll(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["'][^>]*>/gi)) {
    addCandidate(candidates, 'meta-description', m[1])
  }

  for (const m of html.matchAll(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/gi)) {
    addCandidate(candidates, 'meta-description', m[1])
  }

  for (const m of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const json = tryJsonParse(htmlDecode(m[1]).trim())
    if (!json) continue

    walk(json, (obj) => {
      for (const key of ['description', 'articleBody', 'text']) {
        if (typeof obj[key] === 'string') addCandidate(candidates, `ld-json:${key}`, obj[key])
      }
    })
  }

  for (const m of html.matchAll(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    const json = tryJsonParse(htmlDecode(m[1]).trim())
    if (!json) continue

    walk(json, (obj) => {
      for (const key of ['description', 'descriptionText', 'seoDescription', 'text']) {
        if (typeof obj[key] === 'string') addCandidate(candidates, `next-data:${key}`, obj[key])
      }
    })
  }

  for (const m of html.matchAll(/"description"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/gi)) {
    addCandidate(candidates, 'json-regex:description', unescapeJsonString(m[1]))
  }

  for (const m of html.matchAll(/"seoDescription"\s*:\s*"((?:\\.|[^"\\]){80,5000})"/gi)) {
    addCandidate(candidates, 'json-regex:seoDescription', unescapeJsonString(m[1]))
  }

  const descriptionIndex = html.toLowerCase().indexOf('descrizione')
  if (descriptionIndex >= 0) {
    const chunk = html.slice(descriptionIndex, descriptionIndex + 9000)
    addCandidate(candidates, 'html-after-descrizione', stripTags(chunk))
  }

  return candidates
}

async function main() {
  const csv = await fs.readFile(CSV_FILE, 'utf8')
  const csvRows = parseCsv(csv)
    .map((row) => ({
      ref: compact(row.REF),
      title: compact(row.Titolo),
      url: compact(row['URL annuncio']),
    }))
    .filter((row) => /^IM\d{4}AA$/.test(row.ref))
    .filter((row) => /^https:\/\/www\.immobiliare\.it\/annunci\//i.test(row.url))

  const files = await fs.readdir(IN_DIR).catch(() => [])
  const fileByRef = new Map()

  for (const file of files) {
    const ref = file.match(/^(IM\d{4}AA)-/)?.[1]
    if (ref) fileByRef.set(ref, path.join(IN_DIR, file))
  }

  const rows = []

  for (const row of csvRows) {
    const file = fileByRef.get(row.ref)

    if (!file) {
      rows.push({
        ...row,
        status: 'MISSING_HTML',
        score: -100,
        source: '-',
        description: '',
        error: 'HTML dettaglio non salvato',
      })
      continue
    }

    const html = await fs.readFile(file, 'utf8')
    const candidates = extractCandidates(html)
      .map((candidate) => ({
        ...candidate,
        score: scoreCandidate(candidate.text, row),
      }))
      .sort((a, b) => b.score - a.score)

    const best = candidates[0]

    if (!best) {
      rows.push({
        ...row,
        status: 'MISSING',
        score: -100,
        source: '-',
        description: '',
        error: 'Nessuna descrizione candidata trovata',
      })
      continue
    }

    const status = best.score >= 60 ? 'OK' : 'REVIEW'

    rows.push({
      ...row,
      status,
      score: best.score,
      source: best.source,
      description: best.text,
      error: '',
      candidates: candidates.slice(0, 5),
    })
  }

  const counts = rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    counts,
    rows,
  }, null, 2), 'utf8')

  const md = []
  md.push('# Descrizioni Immobiliare.it da pagine dettaglio salvate')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Analizzati: **${rows.length}**`)
  md.push(`- OK: **${counts.OK || 0}**`)
  md.push(`- REVIEW: **${counts.REVIEW || 0}**`)
  md.push(`- MISSING: **${counts.MISSING || 0}**`)
  md.push(`- MISSING_HTML: **${counts.MISSING_HTML || 0}**`)
  md.push('')
  md.push('## Tabella compatta')
  md.push('')
  md.push('| REF | Stato | Score | Fonte | Immobile | Anteprima |')
  md.push('|---|---|---:|---|---|---|')

  for (const row of rows) {
    md.push(`| ${row.ref} | ${row.status} | ${row.score} | ${row.source} | ${row.title.replace(/\|/g, '\\|')} | ${(row.description || row.error || '-').slice(0, 260).replace(/\|/g, '\\|')} |`)
  }

  md.push('')
  md.push('## Descrizioni candidate')
  md.push('')

  for (const row of rows) {
    md.push(`### ${row.ref} — ${row.title}`)
    md.push('')
    md.push(`Stato: ${row.status}`)
    md.push('')
    md.push(`Score: ${row.score}`)
    md.push('')
    md.push(`URL: ${row.url}`)
    md.push('')
    md.push(`Fonte: ${row.source}`)
    md.push('')
    if (row.error) {
      md.push(`Errore: ${row.error}`)
      md.push('')
    }
    md.push('```')
    md.push(row.description || 'Descrizione non trovata.')
    md.push('```')
    md.push('')
  }

  await fs.writeFile(REPORT_MD, md.join('\n') + '\n', 'utf8')

  console.log('=== ESTRAZIONE DESCRIZIONI IMMOBILIARE.IT DA HTML SALVATI ===')
  console.log(`Analizzati: ${rows.length}`)
  console.log(`OK: ${counts.OK || 0}`)
  console.log(`REVIEW: ${counts.REVIEW || 0}`)
  console.log(`MISSING: ${counts.MISSING || 0}`)
  console.log(`MISSING_HTML: ${counts.MISSING_HTML || 0}`)
  console.log('')
  console.log('Report:')
  console.log(REPORT_MD)
  console.log(REPORT_JSON)
  console.log('')
  console.log('=== ANTEPRIMA ===')
  console.log(md.slice(0, 120).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
