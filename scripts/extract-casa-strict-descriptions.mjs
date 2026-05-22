import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = 'tmp/area-portali-audit'
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const REPORT_MD = path.join(OUT_DIR, 'descrizioni-casa-strict-per-ref.md')
const REPORT_JSON = path.join(OUT_DIR, 'descrizioni-casa-strict-per-ref.json')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function norm(value) {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' e ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(in|di|del|della|delle|dell|via|viale|piazza|centro|bergamo|bg)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
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
      .replace(/\\u0026euro;/gi, '€')
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

function parseRows(json) {
  const rows = []
  const seen = new Set()

  for (const obj of walk(json)) {
    const ref = compact(pick(obj, ['reference_code', 'referenceCode', 'ref', 'REF']))
    const title = compact(pick(obj, ['title', 'immobile', 'property_title', 'propertyTitle']))
    const action = compact(pick(obj, ['action', 'azione']))
    const portals = compact(pick(obj, ['portals', 'portal', 'portali', 'source_portals', 'sourcePortals']))
    const price = compact(pick(obj, ['price', 'prezzo', 'formatted_price', 'formattedPrice']))

    if (!/^IM\d{4}AA$/.test(ref)) continue
    if (!title) continue
    if (seen.has(ref)) continue

    seen.add(ref)
    rows.push({
      ref,
      title,
      action,
      portals,
      price,
      titleNorm: norm(title),
    })
  }

  return rows
    .filter((row) => row.action === 'CREARE DRAFT' || !row.action)
    .sort((a, b) => a.ref.localeCompare(b.ref))
}

async function loadCasaText() {
  const files = await fs.readdir(OUT_DIR)
  const casaFiles = files.filter((file) => file.includes('casa.it') && file.endsWith('.html'))

  const chunks = []

  for (const file of casaFiles) {
    const html = await fs.readFile(path.join(OUT_DIR, file), 'utf8')
    const text = stripHtml(html)
    chunks.push({ file, html, text })
  }

  return chunks
}

function similarity(a, b) {
  const aa = new Set(norm(a).split(' ').filter(Boolean))
  const bb = new Set(norm(b).split(' ').filter(Boolean))
  if (!aa.size || !bb.size) return 0

  let common = 0
  for (const token of aa) {
    if (bb.has(token)) common += 1
  }

  return common / Math.max(aa.size, bb.size)
}

function cleanSnippet(text, title) {
  let s = compact(text)

  const titleIndex = norm(s).indexOf(norm(title))
  if (titleIndex >= 0) {
    // Non possiamo usare direttamente l'indice normalizzato sul testo originale.
    // Quindi lasciamo il testo com'è e facciamo pulizia conservativa.
  }

  s = s
    .replace(/\bTi interessa\?\s*Chiama\s*Invia\b/gi, ' ')
    .replace(/\bChiama\s*Invia\b/gi, ' ')
    .replace(/\bContatta\s*Salva\b/gi, ' ')
    .replace(/\bGold\b/gi, ' ')
    .replace(/\bPlatinum\b/gi, ' ')
    .replace(/\bEspandi\b/gi, ' ')
    .replace(/\bAREA IMMOBILIARE SAS DI BELOTTI G\.\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Taglia prima di blocchi successivi molto probabili.
  const cutMarkers = [
    'Ti interessa?',
    'AREA IMMOBILIARE',
    'Contatta',
    'Salva',
  ]

  for (const marker of cutMarkers) {
    const idx = s.toLowerCase().indexOf(marker.toLowerCase())
    if (idx > 160) {
      s = s.slice(0, idx).trim()
    }
  }

  return s
}

function extractAroundTitle(fileText, row) {
  const text = fileText.text
  const normalizedText = norm(text)
  const target = row.titleNorm

  if (!target) return null

  const tokens = target.split(' ').filter((token) => token.length >= 3)
  if (!tokens.length) return null

  // Cerca finestre intorno ai token più specifici del titolo.
  const rareTokens = [...tokens].sort((a, b) => b.length - a.length).slice(0, 4)

  const candidates = []

  for (const token of rareTokens) {
    let searchFrom = 0

    while (true) {
      const idx = normalizedText.indexOf(token, searchFrom)
      if (idx < 0) break

      // Indice normalizzato non perfetto, ma abbastanza per prendere finestra dal testo originale.
      const rawStart = Math.max(0, Math.floor(idx * text.length / normalizedText.length) - 260)
      const rawEnd = Math.min(text.length, rawStart + 1400)
      const window = text.slice(rawStart, rawEnd)
      const score = similarity(row.title, window)

      if (score >= 0.42) {
        candidates.push({
          score,
          raw: window,
          clean: cleanSnippet(window, row.title),
        })
      }

      searchFrom = idx + token.length
    }
  }

  candidates.sort((a, b) => b.score - a.score)

  const best = candidates[0]
  if (!best) return null

  const clean = best.clean

  const looksUseful =
    clean.length >= 120 &&
    !/messaggio visita precedente successiva/i.test(clean) &&
    !/chi siamo i numeri 1 in italia/i.test(clean)

  return {
    score: best.score,
    clean,
    looksUseful,
  }
}

async function main() {
  console.log('=== ESTRAZIONE DESCRIZIONI CASA.IT STRETTA ===')
  console.log('Non scrive nulla in Supabase.')
  console.log('')

  const planRaw = await fs.readFile(PLAN_JSON, 'utf8')
  const planJson = JSON.parse(planRaw)
  const rows = parseRows(planJson)
  const casaTexts = await loadCasaText()

  console.log(`REF dal piano: ${rows.length}`)
  console.log(`File Casa.it disponibili: ${casaTexts.length}`)
  console.log('')

  const results = []

  for (const row of rows) {
    let best = null

    for (const casaText of casaTexts) {
      const found = extractAroundTitle(casaText, row)
      if (!found) continue

      const candidate = {
        file: casaText.file,
        ...found,
      }

      if (!best || candidate.score > best.score) {
        best = candidate
      }
    }

    const status = best?.looksUseful ? 'OK_DA_REVIEW' : 'MISSING'

    results.push({
      ref: row.ref,
      title: row.title,
      price: row.price,
      portals: row.portals,
      status,
      score: best?.score ?? 0,
      file: best?.file ?? '',
      description: best?.looksUseful ? best.clean : '',
      preview: best?.clean?.slice(0, 320) ?? '',
    })

    console.log(`${status} ${row.ref} | score ${best?.score?.toFixed(2) ?? '0.00'} | ${row.title}`)
  }

  const ok = results.filter((row) => row.status === 'OK_DA_REVIEW')
  const missing = results.filter((row) => row.status === 'MISSING')

  const lines = []

  lines.push('# Descrizioni Casa.it estratte in modo stretto')
  lines.push('')
  lines.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  lines.push('')
  lines.push('## Riepilogo')
  lines.push('')
  lines.push(`- REF analizzati: **${results.length}**`)
  lines.push(`- Descrizioni/snippet Casa.it candidate: **${ok.length}**`)
  lines.push(`- Non trovate: **${missing.length}**`)
  lines.push('')
  lines.push('## Candidate da verificare')
  lines.push('')
  lines.push('| REF | Score | Immobile | Anteprima |')
  lines.push('|---|---:|---|---|')

  for (const row of ok) {
    lines.push(`| ${row.ref} | ${row.score.toFixed(2)} | ${row.title.replace(/\|/g, '\\|')} | ${row.preview.replace(/\|/g, '\\|')} |`)
  }

  lines.push('')
  lines.push('## Non trovate')
  lines.push('')
  lines.push('| REF | Immobile |')
  lines.push('|---|---|')

  for (const row of missing) {
    lines.push(`| ${row.ref} | ${row.title.replace(/\|/g, '\\|')} |`)
  }

  lines.push('')
  lines.push('## Testi completi candidati')
  lines.push('')

  for (const row of ok) {
    lines.push(`### ${row.ref} — ${row.title}`)
    lines.push('')
    lines.push(`Score: ${row.score.toFixed(2)}`)
    lines.push('')
    lines.push(`File: ${row.file}`)
    lines.push('')
    lines.push('```')
    lines.push(row.description)
    lines.push('```')
    lines.push('')
  }

  await fs.writeFile(REPORT_MD, lines.join('\n'), 'utf8')
  await fs.writeFile(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      total: results.length,
      ok_review: ok.length,
      missing: missing.length,
    },
    rows: results,
  }, null, 2), 'utf8')

  console.log('')
  console.log('Report creato:')
  console.log(REPORT_MD)
  console.log(REPORT_JSON)
  console.log('')
  console.log('=== ANTEPRIMA ===')
  console.log(lines.slice(0, 160).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
