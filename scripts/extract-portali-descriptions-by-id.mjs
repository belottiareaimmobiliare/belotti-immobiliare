import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = 'tmp/area-portali-audit'
const DETAIL_URLS_JSON = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.json')
const REPORT_MD = path.join(OUT_DIR, 'descrizioni-portali-by-id.md')
const REPORT_JSON = path.join(OUT_DIR, 'descrizioni-portali-by-id.json')

function compact(value) {
  return String(value ?? '')
    .replace(/\\u0026/g, '&')
    .replace(/\\u003c/g, '<')
    .replace(/\\u003e/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function decodeEntities(value) {
  return compact(value)
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#x27;/gi, "'")
    .replace(/&#39;/gi, "'")
    .replace(/&euro;/gi, '€')
}

function stripHtml(value) {
  return decodeEntities(String(value ?? ''))
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectObjects(value, out = []) {
  if (!value) return out

  if (Array.isArray(value)) {
    for (const item of value) collectObjects(item, out)
    return out
  }

  if (typeof value === 'object') {
    out.push(value)
    for (const child of Object.values(value)) collectObjects(child, out)
  }

  return out
}

function pick(obj, keys, fallback = '') {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] != null) {
      return obj[key]
    }
  }

  return fallback
}

function getAnnuncioId(url) {
  const match = String(url || '').match(/\/annunci\/(\d+)/i)
  return match?.[1] || ''
}

function words(value) {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length >= 4)
    .filter((word) => ![
      'euro',
      'mese',
      'prezzo',
      'richiesta',
      'immobile',
      'immobili',
      'bergamo',
      'centro',
      'piano',
      'studio',
      'locale',
      'locali',
      'villa',
      'trilocale',
      'bilocale',
      'quadrilocale',
      'ufficio',
      'commerciale',
      'vendita',
      'affitto',
    ].includes(word))
}

function scoreDescription(text, row, sourceKey = '') {
  const clean = stripHtml(text)

  if (clean.length < 80) return -100
  if (clean.length > 5000) return -20

  const badTokens = [
    'pwm.im-cdn.it',
    's1.immobiliare.it',
    'dataType',
    'realEstate',
    'visibility',
    'multimedia',
    'featureList',
    'uuid',
    'idGeoHash',
    'messaggio Visita',
    'Contatta Salva',
    'Pubblica Annuncio',
    'agenzie-immobiliari',
    'annunci residenziali',
    'AREA IMMOBILIARE SAS DI BELOTTI',
  ]

  let score = 0

  if (/description|descrizione|abstract|body|text/i.test(sourceKey)) score += 45
  if (clean.length >= 180) score += 20
  if (clean.length >= 350) score += 15

  const titleWords = words(row.title)
  const cleanLower = clean.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const hits = titleWords.filter((word) => cleanLower.includes(word)).length

  score += Math.min(hits * 12, 36)

  for (const bad of badTokens) {
    if (clean.includes(bad)) score -= 35
  }

  const jsonNoise = (clean.match(/[{}[\]"]|urls|caption|formattedValue|compactLabel/g) || []).length
  if (jsonNoise > 3) score -= 60

  if (/^\s*€\s?\d/.test(clean)) score -= 10
  if (clean.split(' ').length < 18) score -= 25

  return score
}

function collectDescriptionStrings(obj, row) {
  const candidates = []

  function walk(value, keyPath = '') {
    if (!value) return

    if (typeof value === 'string') {
      const key = keyPath.split('.').pop() || ''
      if (/description|descrizione|abstract|body|text/i.test(keyPath)) {
        const clean = stripHtml(value)
        const score = scoreDescription(clean, row, keyPath)
        candidates.push({
          key: keyPath,
          score,
          text: clean,
        })
      }

      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => walk(item, `${keyPath}[${index}]`))
      return
    }

    if (typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        walk(child, keyPath ? `${keyPath}.${key}` : key)
      }
    }
  }

  walk(obj)

  return candidates
    .filter((candidate) => candidate.text.length >= 80)
    .sort((a, b) => b.score - a.score)
}

function extractJsonScripts(html) {
  const scripts = []

  for (const match of html.matchAll(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    scripts.push(match[1])
  }

  for (const match of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    scripts.push(match[1])
  }

  return scripts
}

function findObjectForAnnuncioId(json, annuncioId) {
  const objects = collectObjects(json)

  const numericId = Number(annuncioId)

  const exact = objects.find((obj) => {
    const directId = Number(obj.id)
    const realEstateId = Number(obj.realEstate?.id)
    const propertyId = Number(obj.property?.id)
    const url = compact(obj.url || obj.seo?.url || obj.absoluteUrl || '')

    return (
      directId === numericId ||
      realEstateId === numericId ||
      propertyId === numericId ||
      url.includes(`/annunci/${annuncioId}`)
    )
  })

  return exact || null
}

function extractBalancedJsonAt(text, start) {
  let depth = 0
  let inString = false
  let escape = false

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i]

    if (inString) {
      if (escape) {
        escape = false
      } else if (ch === '\\') {
        escape = true
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
    if (ch === '}') depth -= 1

    if (depth === 0 && i > start) {
      return text.slice(start, i + 1)
    }
  }

  return ''
}

function findRawObjectsNearId(html, annuncioId) {
  const candidates = []
  const markers = [
    `"id":${annuncioId}`,
    `"id":"${annuncioId}"`,
    `/annunci/${annuncioId}/`,
  ]

  for (const marker of markers) {
    let index = html.indexOf(marker)

    while (index !== -1) {
      const starts = [
        html.lastIndexOf('{"realEstate"', index),
        html.lastIndexOf('{"id"', index),
        html.lastIndexOf('{"visibility"', index),
        html.lastIndexOf('{"dataType"', index),
      ].filter((value) => value >= 0)

      const start = starts.length ? Math.max(...starts) : -1

      if (start >= 0) {
        const raw = extractBalancedJsonAt(html, start)
        if (raw) {
          try {
            candidates.push(JSON.parse(raw))
          } catch {
            // JSON non valido nel frammento: ignoriamo.
          }
        }
      }

      index = html.indexOf(marker, index + marker.length)
    }
  }

  return candidates
}

async function loadRows() {
  const raw = await fs.readFile(DETAIL_URLS_JSON, 'utf8')
  const json = JSON.parse(raw)
  const objects = collectObjects(json)

  const byRef = new Map()

  for (const obj of objects) {
    const ref = compact(pick(obj, ['reference_code', 'referenceCode', 'ref', 'REF'], ''))
    const title = compact(pick(obj, ['title', 'immobile', 'property_title', 'propertyTitle'], ''))
    const url = compact(pick(obj, [
      'url',
      'source_url',
      'sourceUrl',
      'portal_url',
      'portalUrl',
      'annuncio_url',
      'annuncioUrl',
    ], ''))

    if (!ref || !title || !/^https?:\/\//i.test(url)) continue
    if (!byRef.has(ref)) {
      byRef.set(ref, {
        reference_code: ref,
        title,
        url,
        annuncio_id: getAnnuncioId(url),
      })
    }
  }

  return [...byRef.values()]
    .filter((row) => row.annuncio_id)
    .sort((a, b) => a.reference_code.localeCompare(b.reference_code))
}

async function loadHtmlFiles() {
  const files = await fs.readdir(OUT_DIR)
  const htmlFiles = files
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.join(OUT_DIR, file))

  const rows = []

  for (const file of htmlFiles) {
    const html = await fs.readFile(file, 'utf8')
    rows.push({
      file,
      html,
    })
  }

  return rows
}

async function analyzeRow(row, htmlFiles) {
  const matchedFiles = htmlFiles.filter(({ html }) => (
    html.includes(`"id":${row.annuncio_id}`) ||
    html.includes(`"id":"${row.annuncio_id}"`) ||
    html.includes(`/annunci/${row.annuncio_id}/`)
  ))

  if (!matchedFiles.length) {
    return {
      ...row,
      status: 'MISSING',
      score: -100,
      source: '-',
      description: '',
      error: 'ID annuncio non trovato negli HTML salvati',
    }
  }

  const candidates = []

  for (const { file, html } of matchedFiles) {
    for (const script of extractJsonScripts(html)) {
      try {
        const parsed = JSON.parse(decodeEntities(script))
        const obj = findObjectForAnnuncioId(parsed, row.annuncio_id)
        if (obj) {
          for (const candidate of collectDescriptionStrings(obj, row)) {
            candidates.push({
              ...candidate,
              source: `${path.basename(file)}:${candidate.key}`,
            })
          }
        }
      } catch {
        // Script non JSON puro: ignoriamo.
      }
    }

    for (const obj of findRawObjectsNearId(html, row.annuncio_id)) {
      for (const candidate of collectDescriptionStrings(obj, row)) {
        candidates.push({
          ...candidate,
          source: `${path.basename(file)}:${candidate.key}`,
        })
      }
    }
  }

  const best = candidates
    .filter((candidate) => candidate.score >= 40)
    .sort((a, b) => b.score - a.score)[0]

  if (!best) {
    return {
      ...row,
      status: 'REVIEW',
      score: candidates[0]?.score ?? -50,
      source: candidates[0]?.source ?? path.basename(matchedFiles[0].file),
      description: candidates[0]?.text ?? '',
      error: 'Nessuna descrizione affidabile trovata per ID',
    }
  }

  return {
    ...row,
    status: best.score >= 70 ? 'OK' : 'REVIEW',
    score: best.score,
    source: best.source,
    description: best.text,
    error: '',
  }
}

function buildMarkdown(results) {
  const counts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  const lines = []

  lines.push('# Descrizioni portali estratte per ID annuncio')
  lines.push('')
  lines.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  lines.push('')
  lines.push('## Riepilogo')
  lines.push('')
  lines.push(`- Immobili analizzati: **${results.length}**`)
  lines.push(`- OK: **${counts.OK || 0}**`)
  lines.push(`- REVIEW: **${counts.REVIEW || 0}**`)
  lines.push(`- MISSING: **${counts.MISSING || 0}**`)
  lines.push('')
  lines.push('## Tabella compatta')
  lines.push('')
  lines.push('| REF | Stato | Score | ID annuncio | Immobile | Anteprima descrizione / errore |')
  lines.push('|---|---|---:|---:|---|---|')

  for (const row of results) {
    const preview = row.description
      ? row.description.slice(0, 240).replace(/\|/g, '\\|')
      : row.error.replace(/\|/g, '\\|')

    lines.push(`| ${row.reference_code} | ${row.status} | ${row.score} | ${row.annuncio_id} | ${row.title.replace(/\|/g, '\\|')} | ${preview} |`)
  }

  lines.push('')
  lines.push('## Descrizioni trovate')
  lines.push('')

  for (const row of results) {
    lines.push(`### ${row.reference_code} — ${row.title}`)
    lines.push('')
    lines.push(`Stato: ${row.status}`)
    lines.push('')
    lines.push(`Score: ${row.score}`)
    lines.push('')
    lines.push(`URL: ${row.url}`)
    lines.push('')
    lines.push(`Fonte: ${row.source}`)
    lines.push('')
    if (row.error) {
      lines.push(`Errore: ${row.error}`)
      lines.push('')
    }
    lines.push('```')
    lines.push(row.description || 'Descrizione non trovata.')
    lines.push('```')
    lines.push('')
  }

  lines.push('## Nota')
  lines.push('')
  lines.push('Questo report non scrive nulla in Supabase. Usa l’ID numerico dell’annuncio per evitare descrizioni agganciate all’immobile sbagliato.')
  lines.push('')

  return lines.join('\n')
}

async function main() {
  console.log('=== ESTRAZIONE DESCRIZIONI DA HTML SALVATI PER ID ANNUNCIO ===')

  const rows = await loadRows()
  const htmlFiles = await loadHtmlFiles()

  console.log(`Immobili da analizzare: ${rows.length}`)
  console.log(`File HTML disponibili: ${htmlFiles.length}`)
  console.log('Non scrive nulla in Supabase.')
  console.log('')

  const results = []

  for (const row of rows) {
    const result = await analyzeRow(row, htmlFiles)
    results.push(result)
    console.log(`${result.status} ${result.reference_code} | score ${result.score} | ${result.title}`)
  }

  const md = buildMarkdown(results)

  await fs.writeFile(REPORT_MD, md, 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    results,
  }, null, 2), 'utf8')

  const counts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  console.log('')
  console.log('=== REPORT CREATO ===')
  console.log(REPORT_MD)
  console.log(REPORT_JSON)
  console.log('')
  console.log(`OK: ${counts.OK || 0}`)
  console.log(`REVIEW: ${counts.REVIEW || 0}`)
  console.log(`MISSING: ${counts.MISSING || 0}`)
  console.log('')
  console.log('=== ANTEPRIMA ===')
  console.log(md.split('\n').slice(0, 180).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
