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

const FIXES = {
  IM0028AA: {
    province: 'Bergamo',
    comune: 'Bergamo',
    city: 'Bergamo',
    area: 'Redona',
  },
  IM0029AA: {
    province: 'Bergamo',
    comune: 'Gorle',
    city: 'Gorle',
    area: null,
  },
  IM0030AA: {
    province: 'Bergamo',
    comune: 'Gorle',
    city: 'Gorle',
    area: null,
  },
  IM0031AA: {
    province: 'Bergamo',
    comune: 'Gorle',
    city: 'Gorle',
    area: null,
  },
  IM0032AA: {
    province: 'Bergamo',
    comune: 'Bergamo',
    city: 'Bergamo',
    area: 'Borgo Santa Caterina',
    address: 'Viale Giulio Cesare 29',
  },
  IM0033AA: {
    province: 'Bergamo',
    comune: 'Bergamo',
    city: 'Bergamo',
    area: 'Borgo Santa Caterina',
    address: 'Viale Giulio Cesare 29',
  },
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
  console.log('=== FIX GEO POST IMPORT PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log('')

  const refs = Object.keys(FIXES)
  const query = refs.map((ref) => `reference_code.eq.${ref}`).join(',')
  const properties = await supabaseFetch(
    `/rest/v1/properties?select=*&or=(${query})&order=reference_code.asc`
  )

  fs.mkdirSync('tmp/area-portali-audit/backups', { recursive: true })
  const backup = path.resolve(
    `tmp/area-portali-audit/backups/backup-fix-geo-post-import-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )
  fs.writeFileSync(backup, JSON.stringify(properties, null, 2), 'utf8')

  console.log(`Backup creato: ${backup}`)
  console.log(`Immobili trovati: ${properties.length}/${refs.length}`)
  console.log('')

  let changed = 0

  for (const property of properties) {
    const fix = FIXES[property.reference_code]
    if (!fix) continue

    const changes = []

    for (const [key, value] of Object.entries(fix)) {
      const oldValue = property[key] ?? null
      const newValue = value ?? null
      if (oldValue !== newValue) {
        changes.push(`${key}: "${oldValue ?? '-'}" -> "${newValue ?? '-'}"`)
      }
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
        body: JSON.stringify({
          ...fix,
          updated_at: new Date().toISOString(),
        }),
      })
    }

    console.log('')
  }

  console.log(`Immobili con correzioni: ${changed}`)

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Per applicare:')
    console.log('npm run audit:portali:fix-geo-post-import -- --apply')
    return
  }

  console.log('')
  console.log('OK: geografie corrette.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
