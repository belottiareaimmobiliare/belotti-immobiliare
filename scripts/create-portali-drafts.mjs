import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const PLAN_JSON = path.join(ROOT, 'tmp', 'area-portali-audit', 'piano-import-immobili-portali.json')

const APPLY = process.argv.includes('--apply')

function compact(value = '') {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalize(value = '') {
  return compact(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugify(value = '') {
  return normalize(value)
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 95)
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
    throw new Error('Variabili Supabase mancanti. Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY oppure NEXT_PUBLIC_SUPABASE_ANON_KEY.')
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
    throw new Error(`Supabase ${response.status}: ${typeof data === 'string' ? data : JSON.stringify(data).slice(0, 700)}`)
  }

  return data
}

async function fetchExistingProperties() {
  const select = encodeURIComponent('id,title,slug,reference_code,status,price,contract_type')
  return await supabaseFetch(`/rest/v1/properties?select=${select}`)
}

function featureLabelsFor(row) {
  const high = Array.isArray(row.features_high) ? row.features_high : []
  return high
    .map((item) => compact(item))
    .filter(Boolean)
}

function toDbPayload(row) {
  const title = compact(row.title)
  const referenceCode = compact(row.reference_code)
  const slug = slugify(`${referenceCode} ${title}`)

  const features = featureLabelsFor(row)

  const descriptionParts = [
    'Bozza importata da audit portali Area Immobiliare.',
    '',
    `Fonte portali: ${compact(row.portals) || 'n/d'}.`,
    `REF import: ${referenceCode}.`,
  ]

  if (row.features_review?.length) {
    descriptionParts.push('')
    descriptionParts.push(`Caratteristiche da verificare in admin: ${row.features_review.join(', ')}.`)
  }

  return {
    title,
    slug,
    reference_code: referenceCode,
    status: 'draft',
    price: row.price_number ?? null,
    contract_type: compact(row.contract_type) || null,
    property_type: compact(row.property_type) || null,
    city: compact(row.city) || null,
    comune: compact(row.city) || null,
    description: descriptionParts.join('\n'),
    features,
  }
}

function isCreateCandidate(row) {
  const action = compact(row.action)
  const contract = compact(row.contract_type).toLowerCase()

  // Primo import sicuro: creiamo solo vendita/affitto.
  // I casi "non chiaro" restano fuori e vanno verificati a mano.
  return action === 'CREARE DRAFT' && ['vendita', 'affitto'].includes(contract)
}

function shouldSkipBecauseExisting(row, existing) {
  const ref = normalize(row.reference_code)
  const slug = normalize(row.slug)
  const title = normalize(row.title)
  const contract = normalize(row.contract_type)
  const price = Number(row.price_number || 0)

  // 1) Priorità assoluta: stesso reference_code.
  const byRef = existing.find((item) => {
    const existingRef = normalize(item.reference_code)
    return ref && existingRef && ref === existingRef
  })

  if (byRef) return byRef

  // 2) Poi stesso slug.
  const bySlug = existing.find((item) => {
    const existingSlug = normalize(item.slug)
    return slug && existingSlug && slug === existingSlug
  })

  if (bySlug) return bySlug

  // 3) Solo come ultima rete: stesso titolo + stesso contratto + stesso prezzo.
  return existing.find((item) => {
    const existingTitle = normalize(item.title)
    const existingContract = normalize(item.contract_type)
    const existingPrice = Number(item.price || 0)

    if (!title || !existingTitle || title !== existingTitle) return false
    if (contract && existingContract && contract !== existingContract) return false
    if (price && existingPrice && price !== existingPrice) return false

    return true
  })
}

async function createProperty(payload) {
  return await supabaseFetch('/rest/v1/properties', {
    method: 'POST',
    headers: {
      prefer: 'return=representation',
    },
    body: JSON.stringify(payload),
  })
}

async function main() {
  const plan = JSON.parse(await fs.readFile(PLAN_JSON, 'utf8'))
  const existing = await fetchExistingProperties()

  const candidates = (plan.importRows || []).filter(isCreateCandidate)

  const toCreate = []
  const skipped = []

  for (const row of candidates) {
    const existingMatch = shouldSkipBecauseExisting(row, existing)

    if (existingMatch) {
      skipped.push({
        reference_code: row.reference_code,
        title: row.title,
        reason: `già presente: ${existingMatch.reference_code || existingMatch.slug || existingMatch.title}`,
      })
      continue
    }

    toCreate.push(row)
  }

  console.log('')
  console.log('=== CREATE DRAFT IMMOBILI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log(`Candidati CREARE DRAFT dal piano: ${candidates.length}`)
  console.log(`Da creare: ${toCreate.length}`)
  console.log(`Saltati perché già presenti: ${skipped.length}`)
  console.log('')

  if (skipped.length) {
    console.log('=== SALTATI ===')
    for (const row of skipped) {
      console.log(`- ${row.reference_code} ${row.title} -> ${row.reason}`)
    }
    console.log('')
  }

  console.log('=== BOZZE DA CREARE ===')
  for (const row of toCreate) {
    console.log(`- ${row.reference_code} | ${row.contract_type} | ${row.price_label} | ${row.title}`)
  }

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Per creare davvero i draft esegui:')
    console.log('npm run audit:portali:create-drafts -- --apply')
    return
  }

  console.log('')
  console.log('=== CREAZIONE DRAFT IN SUPABASE ===')

  let created = 0

  for (const row of toCreate) {
    const payload = toDbPayload(row)

    try {
      const result = await createProperty(payload)
      const createdItem = Array.isArray(result) ? result[0] : result
      created += 1
      console.log(`OK ${row.reference_code} -> ${createdItem?.id || 'creato'}`)
    } catch (error) {
      console.error(`ERRORE ${row.reference_code} ${row.title}`)
      console.error(error.message)
      process.exitCode = 1
      break
    }
  }

  console.log('')
  console.log(`Creati: ${created}/${toCreate.length}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
