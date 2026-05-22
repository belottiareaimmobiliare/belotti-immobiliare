import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp', 'area-portali-audit')
const PLAN_JSON = path.join(OUT_DIR, 'piano-import-immobili-portali.json')
const OUT_MD = path.join(OUT_DIR, 'descrizioni-portali-per-ref.md')
const OUT_JSON = path.join(OUT_DIR, 'descrizioni-portali-per-ref.json')

const APPLY = process.argv.includes('--apply')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function decodeBasic(value = '') {
  return String(value || '')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&eacute;/g, 'é')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&nbsp;/g, ' ')
}

function normalize(value = '') {
  return compact(decodeBasic(value))
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function safeCell(value = '') {
  return compact(value).replace(/\|/g, '/').slice(0, 260)
}

function stripHtml(html = '') {
  return decodeBasic(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cleanupDescription(text = '') {
  let t = compact(text)

  const badChunks = [
    'messaggio',
    'Visita',
    'Contatta',
    'Salva',
    'Espandi',
    'AREA IMMOBILIARE SAS DI BELOTTI G.',
    'AREA IMMOBILIARE SAS DI BELOTTI',
    'Immobiliare.it',
    'Casa.it',
    'Precedente',
    'Successiva',
    'Vai alla planimetria',
    'Vedi tutti i dettagli',
  ]

  for (const bad of badChunks) {
    t = t.replace(new RegExp(escapeRegex(bad), 'gi'), ' ')
  }

  t = t
    .replace(/\bpremium\b/gi, ' ')
    .replace(/\bnuovo premium\b/gi, ' ')
    .replace(/\b\d+\s*\/\s*\d+\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return t
}

function possibleTitleVariants(title = '') {
  const clean = compact(title)
  const variants = new Set([
    clean,
    clean.replace(/\bSan c\b/gi, ''),
    clean.replace(/\bs\.?n\.?c\.?\b/gi, ''),
    clean.replace(/\s*,\s*/g, ', '),
    clean.replace(/\s+/g, ' '),
  ])

  return [...variants].map(compact).filter(Boolean)
}

async function walk(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walk(full))
    else out.push(full)
  }

  return out
}

async function loadHtmlFiles() {
  const files = (await walk(OUT_DIR)).filter((file) => /\.html$/i.test(file))
  const loaded = []

  for (const file of files) {
    const html = decodeBasic(await fs.readFile(file, 'utf8'))
    loaded.push({
      file: path.relative(ROOT, file),
      html,
      norm: normalize(html),
    })
  }

  return loaded
}

function buildOccurrences(rows, htmlFile) {
  const occurrences = []

  for (const row of rows) {
    const variants = possibleTitleVariants(row.title)

    for (const variant of variants) {
      const re = new RegExp(escapeRegex(variant), 'gi')
      for (const match of htmlFile.html.matchAll(re)) {
        occurrences.push({
          reference_code: row.reference_code,
          row,
          index: match.index,
          variant,
        })
      }
    }
  }

  occurrences.sort((a, b) => a.index - b.index)

  const deduped = []
  for (const occ of occurrences) {
    const prev = deduped[deduped.length - 1]
    if (
      prev &&
      prev.reference_code === occ.reference_code &&
      Math.abs(prev.index - occ.index) < 300
    ) {
      continue
    }
    deduped.push(occ)
  }

  return deduped
}

function priceInSegment(segment = '', row) {
  const price = String(row.price_number || '').trim()
  if (!price) return false
  return normalize(segment).replace(/\s+/g, '').includes(price)
}

function extractCandidateDescription(row, htmlFiles, allRows) {
  let best = {
    score: -999,
    text: '',
    sourceFile: '',
    priceMatched: false,
  }

  for (const htmlFile of htmlFiles) {
    const occurrences = buildOccurrences(allRows, htmlFile)
    const rowOccurrences = occurrences.filter((occ) => occ.reference_code === row.reference_code)

    for (const occ of rowOccurrences) {
      const pos = occ.index
      const prev = [...occurrences].reverse().find((item) => item.index < pos - 20)
      const next = occurrences.find((item) => item.index > pos + 20)

      const start = prev ? Math.floor((prev.index + pos) / 2) : Math.max(0, pos - 4500)
      const end = next ? Math.floor((pos + next.index) / 2) : Math.min(htmlFile.html.length, pos + 5500)

      const segment = htmlFile.html.slice(start, end)
      const priceMatched = priceInSegment(segment, row)

      let text = cleanupDescription(stripHtml(segment))

      const titleNorm = normalize(row.title)
      const titleIndex = normalize(text).indexOf(titleNorm.split(' ').slice(0, 3).join(' '))

      if (titleIndex > 0 && titleIndex < 1200) {
        text = text.slice(Math.max(0, titleIndex - 80))
      }

      text = text
        .replace(/^.*?\b(?:€|Trattativa riservata|Prezzo su richiesta)\b/i, '')
        .trim()

      if (text.length > 1300) text = text.slice(0, 1300).replace(/\s+\S*$/, '') + '...'

      let score = 0
      if (priceMatched) score += 50
      if (text.length >= 160) score += 20
      if (text.length >= 400) score += 10
      if (text.length < 80) score -= 40
      if (/footer|cookie|privacy|pubblica annuncio/i.test(text)) score -= 60

      if (score > best.score) {
        best = {
          score,
          text,
          sourceFile: htmlFile.file,
          priceMatched,
        }
      }
    }
  }

  return best
}

function buildFinalDescription(row, candidate) {
  const parts = []

  if (candidate.text && candidate.text.length >= 80) {
    parts.push(candidate.text)
  }

  parts.push(`Bozza importata da audit portali Area Immobiliare.`)
  parts.push(`Fonte portali: ${row.portals}.`)
  parts.push(`REF import: ${row.reference_code}.`)

  return parts.join('\n\n')
}

function loadEnvText(text) {
  const out = {}

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const index = line.indexOf('=')
    if (index < 0) continue

    const key = line.slice(0, index).trim()
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')
    out[key] = value
  }

  return out
}

async function loadEnv() {
  const files = ['.env.local', '.env', '.env.development.local', '.env.production.local']
  const env = { ...process.env }

  for (const file of files) {
    try {
      const text = await fs.readFile(path.join(ROOT, file), 'utf8')
      Object.assign(env, loadEnvText(text))
    } catch {}
  }

  return env
}

async function supabaseConfig() {
  const env = await loadEnv()

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ||
    env.SUPABASE_SERVICE_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Variabili Supabase mancanti.')
  }

  return {
    baseUrl: supabaseUrl.replace(/\/$/, ''),
    key: supabaseKey,
  }
}

async function supabaseFetch(url, options = {}) {
  const cfg = await supabaseConfig()

  const response = await fetch(`${cfg.baseUrl}${url}`, {
    ...options,
    headers: {
      apikey: cfg.key,
      authorization: `Bearer ${cfg.key}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await response.text()

  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 900)}`)
  }

  return data
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const htmlFiles = await loadHtmlFiles()

  const importedRows = (plan.importRows || [])
    .filter((row) => row.action === 'CREARE DRAFT')
    .filter((row) => ['vendita', 'affitto'].includes(compact(row.contract_type).toLowerCase()))

  const rows = importedRows.map((row) => {
    const candidate = extractCandidateDescription(row, htmlFiles, importedRows)
    const finalDescription = buildFinalDescription(row, candidate)

    return {
      reference_code: row.reference_code,
      title: row.title,
      portals: row.portals,
      candidate_length: candidate.text.length,
      candidate_text: candidate.text,
      source_file: candidate.sourceFile,
      price_matched: candidate.priceMatched,
      score: candidate.score,
      final_description: finalDescription,
      status: candidate.text.length >= 80 && candidate.priceMatched ? 'OK' : 'REVIEW',
    }
  })

  const ok = rows.filter((row) => row.status === 'OK')
  const review = rows.filter((row) => row.status !== 'OK')

  const md = [
    '# Descrizioni portali per REF',
    '',
    `Generato: ${new Date().toLocaleString('it-IT')}`,
    '',
    '## Riepilogo',
    '',
    `- Immobili analizzati: **${rows.length}**`,
    `- Descrizioni candidate OK: **${ok.length}**`,
    `- Da verificare: **${review.length}**`,
    `- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`,
    '',
    '## Tabella compatta',
    '',
    '| REF | Stato | Lunghezza | Prezzo nel segmento | Immobile | Anteprima descrizione |',
    '|---|---|---:|---|---|---|',
    ...rows.map((row) => `| ${safeCell(row.reference_code)} | ${safeCell(row.status)} | ${row.candidate_length} | ${row.price_matched ? 'sì' : 'no'} | ${safeCell(row.title)} | ${safeCell(row.candidate_text)} |`),
    '',
    '## Descrizioni complete candidate',
    '',
    ...rows.map((row) => [
      `### ${row.reference_code} — ${row.title}`,
      '',
      `Stato: ${row.status}`,
      '',
      '```',
      row.final_description,
      '```',
      '',
    ].join('\n')),
  ].join('\n')

  await fs.writeFile(OUT_MD, md, 'utf8')
  await fs.writeFile(OUT_JSON, JSON.stringify({
    generatedAt: new Date().toISOString(),
    mode: APPLY ? 'apply' : 'dry-run',
    counts: {
      rows: rows.length,
      ok: ok.length,
      review: review.length,
    },
    rows,
  }, null, 2), 'utf8')

  console.log('=== REPORT DESCRIZIONI PORTALI CREATO ===')
  console.log('tmp/area-portali-audit/descrizioni-portali-per-ref.md')
  console.log('tmp/area-portali-audit/descrizioni-portali-per-ref.json')
  console.log('')
  console.log(md.split('\n').slice(0, 120).join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Nessuna descrizione aggiornata.')
    return
  }

  console.log('')
  console.log('=== UPDATE DESCRIZIONI IN SUPABASE ===')

  const refs = rows.map((row) => `"${row.reference_code}"`).join(',')
  const select = encodeURIComponent('id,title,reference_code,description')
  const properties = await supabaseFetch(`/rest/v1/properties?select=${select}&reference_code=in.(${refs})`)
  const byRef = new Map(properties.map((property) => [property.reference_code, property]))

  let updated = 0
  let skipped = 0

  for (const row of rows) {
    const property = byRef.get(row.reference_code)

    if (!property) {
      console.log(`SKIP ${row.reference_code} | proprietà non trovata`)
      skipped += 1
      continue
    }

    const current = compact(property.description || '')
    const canOverwrite =
      !current ||
      current.includes('Bozza importata da audit portali Area Immobiliare') ||
      current.includes('REF import:')

    if (!canOverwrite) {
      console.log(`SKIP ${row.reference_code} | descrizione già modificata a mano`)
      skipped += 1
      continue
    }

    await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
      method: 'PATCH',
      headers: {
        prefer: 'return=minimal',
      },
      body: JSON.stringify({
        description: row.final_description,
      }),
    })

    console.log(`OK ${row.reference_code} | ${row.status} | ${row.title}`)
    updated += 1
  }

  console.log('')
  console.log(`Aggiornate: ${updated}`)
  console.log(`Saltate: ${skipped}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
