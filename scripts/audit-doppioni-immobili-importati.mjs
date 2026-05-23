import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'tmp/area-portali-audit')
const OUT_MD = path.join(OUT_DIR, 'audit-doppioni-immobili-importati.md')
const OUT_JSON = path.join(OUT_DIR, 'audit-doppioni-immobili-importati.json')

fs.mkdirSync(OUT_DIR, { recursive: true })

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const clean = line.trim()
    if (!clean || clean.startsWith('#') || !clean.includes('=')) continue
    const idx = clean.indexOf('=')
    const key = clean.slice(0, idx).trim()
    let value = clean.slice(idx + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(path.join(ROOT, file))
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.PUBLIC_SUPABASE_URL

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function norm(value) {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(san c|s c|via|viale|piazza|largo|centro|bergamo|bg)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function euro(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return '-'
  return new Intl.NumberFormat('it-IT').format(n) + ' €'
}

function groupBy(rows, keyFn) {
  const map = new Map()
  for (const row of rows) {
    const key = keyFn(row)
    if (!key) continue
    if (!map.has(key)) map.set(key, [])
    map.get(key).push(row)
  }
  return [...map.entries()]
    .filter(([, rows]) => rows.length > 1)
    .map(([key, rows]) => ({ key, rows }))
}

async function supabaseFetch(pathname) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      accept: 'application/json',
    },
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`Supabase HTTP ${res.status}: ${text.slice(0, 500)}`)
  }

  return text ? JSON.parse(text) : []
}

async function main() {
  const select = [
    'id',
    'reference_code',
    'title',
    'slug',
    'status',
    'contract_type',
    'property_type',
    'city',
    'comune',
    'area',
    'address',
    'price',
    'created_at',
    'updated_at',
  ].join(',')

  const rows = await supabaseFetch(`/rest/v1/properties?select=${encodeURIComponent(select)}&order=created_at.desc&limit=1000`)

  const normalized = rows.map((p) => ({
    ...p,
    ref: compact(p.reference_code),
    title_clean: compact(p.title),
    title_key: norm(p.title),
    title_no_price_key: norm(p.title).replace(/\b\d+\b/g, '').trim(),
    contract_key: norm(p.contract_type),
    type_key: norm(p.property_type),
    city_key: norm(p.city || p.comune),
    address_key: norm(p.address),
    price_num: Number(p.price || 0),
    imported: /^IM\d{4}AA$/i.test(compact(p.reference_code)),
  }))

  const imported = normalized.filter((p) => p.imported)

  const exactRef = groupBy(normalized.filter((p) => p.ref), (p) => p.ref)
  const exactSlug = groupBy(normalized.filter((p) => p.slug), (p) => norm(p.slug))
  const exactImportedTitle = groupBy(imported, (p) => p.title_key)
  const exactTitleContract = groupBy(normalized, (p) => `${p.title_key}|${p.contract_key}`)
  const exactTitleContractPrice = groupBy(normalized, (p) => `${p.title_key}|${p.contract_key}|${p.price_num}`)
  const addressContract = groupBy(
    normalized.filter((p) => p.address_key && p.city_key),
    (p) => `${p.address_key}|${p.city_key}|${p.contract_key}`
  )

  function renderGroup(group) {
    return group.rows
      .map((p) => `- ${p.ref || '-'} | ${p.status || '-'} | ${p.contract_type || '-'} | ${euro(p.price)} | ${p.title_clean} | ${p.slug || '-'}`)
      .join('\n')
  }

  const realProblems = []
  const review = []

  for (const g of exactRef) {
    realProblems.push({ type: 'REF DUPLICATO', ...g })
  }

  for (const g of exactSlug) {
    realProblems.push({ type: 'SLUG DUPLICATO', ...g })
  }

  for (const g of exactTitleContractPrice) {
    realProblems.push({ type: 'STESSO TITOLO + CONTRATTO + PREZZO', ...g })
  }

  for (const g of exactTitleContract) {
    const prices = new Set(g.rows.map((p) => p.price_num))
    if (prices.size > 1) {
      review.push({ type: 'STESSO TITOLO + CONTRATTO, PREZZO DIVERSO', ...g })
    }
  }

  for (const g of exactImportedTitle) {
    const contracts = new Set(g.rows.map((p) => p.contract_key))
    const prices = new Set(g.rows.map((p) => p.price_num))
    if (contracts.size > 1) {
      review.push({ type: 'IMPORTATI CON STESSO TITOLO MA CONTRATTO DIVERSO', ...g })
    } else if (prices.size > 1) {
      review.push({ type: 'IMPORTATI CON STESSO TITOLO MA PREZZO DIVERSO', ...g })
    }
  }

  for (const g of addressContract) {
    review.push({ type: 'STESSO INDIRIZZO + CITTÀ + CONTRATTO', ...g })
  }

  const md = []
  md.push('# Audit doppioni immobili importati')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Immobili totali letti dal sito: **${normalized.length}**`)
  md.push(`- Immobili importati REF IMxxxxAA: **${imported.length}**`)
  md.push(`- Problemi forti trovati: **${realProblems.length}**`)
  md.push(`- Gruppi da verificare: **${review.length}**`)
  md.push('')
  md.push('## Problemi forti')
  md.push('')
  if (!realProblems.length) {
    md.push('Nessun problema forte trovato su REF, slug o titolo/contratto/prezzo identici.')
  } else {
    for (const g of realProblems) {
      md.push(`### ${g.type}`)
      md.push('')
      md.push(renderGroup(g))
      md.push('')
    }
  }
  md.push('')
  md.push('## Da verificare a mano')
  md.push('')
  if (!review.length) {
    md.push('Nessun gruppo sospetto da verificare.')
  } else {
    for (const g of review) {
      md.push(`### ${g.type}`)
      md.push('')
      md.push(renderGroup(g))
      md.push('')
    }
  }
  md.push('')
  md.push('## Nota')
  md.push('')
  md.push('Uno stesso indirizzo con prezzi diversi non è per forza un doppione: può essere un complesso, più uffici, box diversi o vendita/affitto separati. Questo report serve per decidere cosa cancellare o unire, senza toccare il database.')

  fs.writeFileSync(OUT_MD, md.join('\n'), 'utf8')
  fs.writeFileSync(OUT_JSON, JSON.stringify({ summary: {
    total: normalized.length,
    imported: imported.length,
    realProblems: realProblems.length,
    review: review.length,
  }, realProblems, review }, null, 2), 'utf8')

  console.log('=== AUDIT DOPPIONI CREATO ===')
  console.log(OUT_MD)
  console.log(OUT_JSON)
  console.log('')
  console.log(md.slice(0, 220).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
