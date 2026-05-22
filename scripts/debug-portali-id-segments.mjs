import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = 'tmp/area-portali-audit'
const INPUT_JSON = path.join(OUT_DIR, 'descrizioni-portali-dettaglio-per-ref.json')
const REPORT_MD = path.join(OUT_DIR, 'debug-segmenti-annunci-per-ref.md')
const REPORT_JSON = path.join(OUT_DIR, 'debug-segmenti-annunci-per-ref.json')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function stripHtml(value) {
  return compact(
    String(value ?? '')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#x27;/gi, "'")
      .replace(/&#39;/gi, "'")
      .replace(/&euro;/gi, '€')
  )
}

function walk(value, out = []) {
  if (!value) return out
  if (Array.isArray(value)) {
    value.forEach((item) => walk(item, out))
    return out
  }
  if (typeof value === 'object') {
    out.push(value)
    Object.values(value).forEach((item) => walk(item, out))
  }
  return out
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null) return obj[key]
  }
  return ''
}

function getAnnuncioId(url) {
  return String(url || '').match(/\/annunci\/(\d+)/i)?.[1] || ''
}

async function loadRows() {
  const json = JSON.parse(await fs.readFile(INPUT_JSON, 'utf8'))
  const objects = walk(json)
  const byRef = new Map()

  for (const obj of objects) {
    const ref = compact(pick(obj, ['reference_code', 'referenceCode', 'ref', 'REF']))
    const title = compact(pick(obj, ['title', 'immobile', 'property_title', 'propertyTitle']))
    const url = compact(pick(obj, ['url', 'source_url', 'sourceUrl', 'portal_url', 'portalUrl', 'annuncio_url', 'annuncioUrl']))

    if (!ref || !title || !/^https?:\/\//i.test(url)) continue

    const annuncioId = getAnnuncioId(url)
    if (!annuncioId) continue

    if (!byRef.has(ref)) {
      byRef.set(ref, {
        ref,
        title,
        url,
        annuncioId,
      })
    }
  }

  return [...byRef.values()].sort((a, b) => a.ref.localeCompare(b.ref))
}

async function loadHtmlFiles() {
  const files = await fs.readdir(OUT_DIR)
  const htmlFiles = []

  for (const file of files) {
    if (!file.endsWith('.html')) continue
    const full = path.join(OUT_DIR, file)
    const html = await fs.readFile(full, 'utf8')
    htmlFiles.push({ file, html })
  }

  return htmlFiles
}

function findBestSegment(html, annuncioId) {
  const markers = [
    `"id":${annuncioId}`,
    `"id":"${annuncioId}"`,
    `/annunci/${annuncioId}/`,
  ]

  let bestIndex = -1
  let bestMarker = ''

  for (const marker of markers) {
    const index = html.indexOf(marker)
    if (index >= 0 && (bestIndex < 0 || index < bestIndex)) {
      bestIndex = index
      bestMarker = marker
    }
  }

  if (bestIndex < 0) {
    return null
  }

  const start = Math.max(0, bestIndex - 3500)
  const end = Math.min(html.length, bestIndex + 8500)
  const raw = html.slice(start, end)
  const text = stripHtml(raw)

  const hasDescriptionKey = /description|descrizione|abstract|body|text/gi.test(raw)
  const hasLongHumanText = /[A-ZÀ-Ü][^.?!]{120,}[.?!]/.test(text)
  const hasJsonNoise = /realEstate|multimedia|featureList|formattedValue|compactLabel|idGeoHash|visibility|dataType/.test(raw)
  const hasOnlyCardNoise = /messaggio|Visita|Contatta|Salva|Immobiliare\.it|Area Immobiliare/i.test(text)

  return {
    marker: bestMarker,
    rawLength: raw.length,
    textLength: text.length,
    hasDescriptionKey,
    hasLongHumanText,
    hasJsonNoise,
    hasOnlyCardNoise,
    rawPreview: raw.slice(0, 1800),
    textPreview: text.slice(0, 1200),
  }
}

async function main() {
  console.log('=== DEBUG SEGMENTI ANNUNCI PER REF ===')

  const rows = await loadRows()
  const htmlFiles = await loadHtmlFiles()

  console.log(`REF analizzati: ${rows.length}`)
  console.log(`HTML disponibili: ${htmlFiles.length}`)
  console.log('Non scrive nulla in Supabase.')
  console.log('')

  const results = []

  for (const row of rows) {
    const matches = []

    for (const htmlFile of htmlFiles) {
      const segment = findBestSegment(htmlFile.html, row.annuncioId)
      if (!segment) continue

      matches.push({
        file: htmlFile.file,
        ...segment,
      })
    }

    const best = matches[0] || null

    const status = !best
      ? 'ID_NON_TROVATO'
      : best.hasDescriptionKey && best.hasLongHumanText && !best.hasOnlyCardNoise
        ? 'POSSIBILE_TESTO'
        : best.hasDescriptionKey
          ? 'SOLO_JSON_O_CARD'
          : 'NESSUNA_DESCRIZIONE'

    results.push({
      ...row,
      status,
      matches,
    })

    console.log(`${status} ${row.ref} | ${row.annuncioId} | match html: ${matches.length} | ${row.title}`)
  }

  const counts = results.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1
    return acc
  }, {})

  const lines = []

  lines.push('# Debug segmenti annuncio per REF')
  lines.push('')
  lines.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  lines.push('')
  lines.push('## Riepilogo')
  lines.push('')
  lines.push(`- REF analizzati: **${results.length}**`)
  lines.push(`- POSSIBILE_TESTO: **${counts.POSSIBILE_TESTO || 0}**`)
  lines.push(`- SOLO_JSON_O_CARD: **${counts.SOLO_JSON_O_CARD || 0}**`)
  lines.push(`- NESSUNA_DESCRIZIONE: **${counts.NESSUNA_DESCRIZIONE || 0}**`)
  lines.push(`- ID_NON_TROVATO: **${counts.ID_NON_TROVATO || 0}**`)
  lines.push('')
  lines.push('## Tabella compatta')
  lines.push('')
  lines.push('| REF | Stato | ID annuncio | Match HTML | Immobile | Preview testo segmento |')
  lines.push('|---|---|---:|---:|---|---|')

  for (const row of results) {
    const best = row.matches[0]
    const preview = best ? best.textPreview.replace(/\|/g, '\\|').slice(0, 260) : '-'
    lines.push(`| ${row.ref} | ${row.status} | ${row.annuncioId} | ${row.matches.length} | ${row.title.replace(/\|/g, '\\|')} | ${preview} |`)
  }

  lines.push('')
  lines.push('## Dettaglio segmenti')
  lines.push('')

  for (const row of results) {
    lines.push(`### ${row.ref} — ${row.title}`)
    lines.push('')
    lines.push(`Stato: ${row.status}`)
    lines.push('')
    lines.push(`URL: ${row.url}`)
    lines.push('')
    lines.push(`ID annuncio: ${row.annuncioId}`)
    lines.push('')

    if (!row.matches.length) {
      lines.push('ID non trovato negli HTML salvati.')
      lines.push('')
      continue
    }

    for (const match of row.matches.slice(0, 2)) {
      lines.push(`File: ${match.file}`)
      lines.push('')
      lines.push(`Marker: ${match.marker}`)
      lines.push('')
      lines.push(`Contiene chiavi descrizione: ${match.hasDescriptionKey ? 'sì' : 'no'}`)
      lines.push('')
      lines.push(`Contiene testo umano lungo: ${match.hasLongHumanText ? 'sì' : 'no'}`)
      lines.push('')
      lines.push('Preview testo:')
      lines.push('')
      lines.push('```')
      lines.push(match.textPreview || '-')
      lines.push('```')
      lines.push('')
      lines.push('Preview raw HTML/JSON:')
      lines.push('')
      lines.push('```')
      lines.push(match.rawPreview || '-')
      lines.push('```')
      lines.push('')
    }
  }

  await fs.writeFile(REPORT_MD, lines.join('\n'), 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    counts,
    results,
  }, null, 2), 'utf8')

  console.log('')
  console.log('=== REPORT CREATO ===')
  console.log(REPORT_MD)
  console.log(REPORT_JSON)
  console.log('')
  console.log('=== ANTEPRIMA ===')
  console.log(lines.slice(0, 90).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
