import fs from 'fs'
import path from 'path'

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  const text = fs.readFileSync(file, 'utf8')
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    let value = trimmed.slice(i + 1).trim()
    value = value.replace(/^['"]|['"]$/g, '')
    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(file)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')

const TITLE_PATCHES = {
  IM0012AA: {
    title: 'Locale commerciale in vendita, 250 mq, Via Torquato Tasso, Bergamo',
    slug: 'im0012aa-locale-commerciale-vendita-250-mq-via-torquato-tasso-bergamo',
    surface: 250,
    bathrooms: 4,
    address: 'Via Torquato Tasso',
  },
  IM0013AA: {
    title: 'Negozio in affitto, 200 mq, Via Torquato Tasso, Bergamo',
    slug: 'im0013aa-negozio-affitto-200-mq-via-torquato-tasso-bergamo',
    surface: 200,
    bathrooms: 1,
    address: 'Via Torquato Tasso',
  },
  IM0029AA: {
    title: 'Ufficio centro medico, 250 mq, Via Roma 85, Gorle',
    slug: 'im0029aa-ufficio-centro-medico-250-mq-via-roma-85-gorle',
    surface: 250,
    rooms: 8,
    bathrooms: 3,
    address: 'Via Roma 85',
  },
  IM0030AA: {
    title: 'Ufficio direzionale, 400 mq, Via Roma 85, Gorle',
    slug: 'im0030aa-ufficio-direzionale-400-mq-via-roma-85-gorle',
    surface: 400,
    rooms: 13,
    bathrooms: 5,
    address: 'Via Roma 85',
  },
  IM0031AA: {
    title: 'Ufficio 120 mq convertibile in attico, Via Roma 85, Gorle',
    slug: 'im0031aa-ufficio-120-mq-convertibile-attico-via-roma-85-gorle',
    surface: 120,
    rooms: 4,
    bathrooms: 2,
    address: 'Via Roma 85',
  },
}

const BG_MUNICIPALITIES = [
  'Bergamo',
  'Gorle',
  'Brembate di Sopra',
  'Bianzano',
  'Bedulita',
  'Treviolo',
  'Strozza',
  'Sotto il Monte Giovanni XXIII',
  'Bottanuco',
]

const BERGAMO_AREAS = [
  'Centro Sant’Alessandro',
  "Centro Sant'Alessandro",
  'Centro Papa Giovanni XXIII',
  'Borgo Santa Caterina',
  'Conca Fiorita',
  'Città Alta',
  'Citta Alta',
  'Grumellina',
  'Colognola',
  'Canovine',
  'Corridoni',
  'Stazione',
  'Pignolo',
  'Redona',
  'Valtesse',
  'Celadina',
  'Boccaleone',
  'Santa Lucia',
  'Loreto',
  'Colli',
  'Stadio',
  'Malpensata',
  'Longuelo',
  'Monterosso',
  'Campagnola',
  'Villaggio degli Sposi',
  'San Bernardino',
  'Centro',
]

function norm(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[’']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

function containsText(haystack, needle) {
  return norm(haystack).includes(norm(needle))
}

function findFirstByText(text, values) {
  return values.find((value) => containsText(text, value)) || ''
}

function inferGeo(property) {
  const text = [
    property.title,
    property.description,
    property.address,
    property.city,
    property.comune,
    property.area,
  ].filter(Boolean).join(' | ')

  let province = property.province || ''
  let comune = property.comune || property.city || ''
  let city = property.city || property.comune || ''
  let area = property.area || ''

  if (containsText(text, 'Chiusi')) {
    return {
      province: 'Siena',
      comune: 'Chiusi',
      city: 'Chiusi',
      area: area || '',
    }
  }

  const municipality = findFirstByText(text, BG_MUNICIPALITIES)
  const bergamoArea = findFirstByText(text, BERGAMO_AREAS)

  if (municipality) {
    province = 'Bergamo'
    comune = municipality
    city = municipality
  }

  if (!municipality && bergamoArea) {
    province = 'Bergamo'
    comune = 'Bergamo'
    city = 'Bergamo'
  }

  if (comune === 'Bergamo' && bergamoArea) {
    area = bergamoArea.replace('Citta Alta', 'Città Alta').replace("Centro Sant'Alessandro", 'Centro Sant’Alessandro')
  }

  if (comune && comune !== 'Bergamo' && containsText(text, 'Centro')) {
    area = area || 'Centro'
  }

  return {
    province: province || null,
    comune: comune || null,
    city: city || null,
    area: area || null,
  }
}

async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  console.log('=== FIX TITOLI + GEO IMMOBILI IMPORTATI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log('')

  const properties = await supabaseFetch(
    '/rest/v1/properties?select=*&reference_code=like.IM%25AA&order=reference_code.asc'
  )

  fs.mkdirSync('tmp/area-portali-audit/backups', { recursive: true })
  const backup = path.resolve(
    `tmp/area-portali-audit/backups/backup-fix-titoli-geo-portali-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
  fs.writeFileSync(backup, JSON.stringify(properties, null, 2), 'utf8')
  console.log(`Backup creato: ${backup}`)
  console.log(`Immobili importati trovati: ${properties.length}`)
  console.log('')

  let changed = 0

  for (const property of properties) {
    const titlePatch = TITLE_PATCHES[property.reference_code] || {}
    const geo = inferGeo({
      ...property,
      ...titlePatch,
    })

    const body = {
      ...titlePatch,
      ...geo,
      updated_at: new Date().toISOString(),
    }

    Object.keys(body).forEach((key) => {
      if (body[key] === undefined) delete body[key]
    })

    const changes = []
    for (const [key, value] of Object.entries(body)) {
      if (key === 'updated_at') continue
      const oldValue = property[key] ?? null
      const newValue = value ?? null
      if (oldValue !== newValue) changes.push(`${key}: "${oldValue ?? '-'}" -> "${newValue ?? '-'}"`)
    }

    if (!changes.length) {
      console.log(`OK ${property.reference_code} | nessuna modifica | ${property.title}`)
      continue
    }

    changed += 1
    console.log(`${APPLY ? 'UPDATE' : 'DRY'} ${property.reference_code} | ${property.title}`)
    for (const change of changes) console.log(`  - ${change}`)

    if (APPLY) {
      await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify(body),
      })
    }

    console.log('')
  }

  console.log(`Immobili con modifiche: ${changed}`)

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Per applicare:')
    console.log('npm run audit:portali:fix-titles-geo -- --apply')
    return
  }

  console.log('')
  console.log('OK: fix titoli/geografia applicato.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
