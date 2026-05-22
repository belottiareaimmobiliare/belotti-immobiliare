import fs from 'fs'
import path from 'path'

function loadLocalEnv() {
  const files = [
    '.env.local',
    '.env',
    '.env.development.local',
    '.env.production.local',
  ]

  for (const file of files) {
    if (!fs.existsSync(file)) continue

    const text = fs.readFileSync(file, 'utf8')
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) continue

      const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
      if (!match) continue

      const key = match[1]
      let value = match[2].trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  }
}

loadLocalEnv()

const APPLY = process.argv.includes('--apply')
const JSON_FILE = 'tmp/area-portali-audit/descrizioni-finali-portali-manuali.json'
const BACKUP_DIR = 'tmp/area-portali-audit/backups'
const EXPECTED = 32

function env(name) {
  return process.env[name] || ''
}

const SUPABASE_URL =
  env('NEXT_PUBLIC_SUPABASE_URL') ||
  env('SUPABASE_URL') ||
  env('PUBLIC_SUPABASE_URL')

const SUPABASE_KEY =
  env('SUPABASE_SERVICE_ROLE_KEY') ||
  env('SUPABASE_SERVICE_ROLE') ||
  env('SUPABASE_SERVICE_KEY') ||
  env('NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY') ||
  env('SUPABASE_ANON_KEY') ||
  env('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  console.error('Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY oppure equivalenti già presenti nel progetto.')
  process.exit(1)
}

function compact(value) {
  return String(value || '').trim()
}

function nowStamp() {
  const d = new Date()
  return d.toISOString().replace(/[:.]/g, '-')
}

async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${typeof data === 'string' ? data : JSON.stringify(data)}`)
  }

  return data
}

function loadRows() {
  if (!fs.existsSync(JSON_FILE)) {
    throw new Error(`File non trovato: ${JSON_FILE}`)
  }

  const rows = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'))
    .map((row) => ({
      reference_code: compact(row.reference_code),
      title: compact(row.title),
      source_url: compact(row.source_url),
      description: compact(row.description),
    }))
    .filter((row) => row.reference_code && row.description)

  const uniqueRefs = new Set(rows.map((row) => row.reference_code))

  if (rows.length !== EXPECTED || uniqueRefs.size !== EXPECTED) {
    throw new Error(`Descrizioni non complete: righe=${rows.length}, REF unici=${uniqueRefs.size}, attesi=${EXPECTED}`)
  }

  const short = rows.filter((row) => row.description.length < 250)
  if (short.length) {
    throw new Error(`Descrizioni troppo corte: ${short.map((r) => r.reference_code).join(', ')}`)
  }

  return rows
}

async function main() {
  const rows = loadRows()
  const refs = rows.map((row) => row.reference_code)

  console.log('=== APPLY DESCRIZIONI FINALI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log(`Descrizioni nel JSON: ${rows.length}`)
  console.log('')

  const refFilter = refs.map((ref) => `"${ref}"`).join(',')

  const existing = await supabaseFetch(
    `/rest/v1/properties?select=id,reference_code,title,status,description&reference_code=in.(${refFilter})`
  )

  const byRef = new Map(existing.map((p) => [p.reference_code, p]))
  const missing = refs.filter((ref) => !byRef.has(ref))

  if (missing.length) {
    throw new Error(`REF non trovati in Supabase: ${missing.join(', ')}`)
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })
  const backupFile = path.join(BACKUP_DIR, `backup-descrizioni-prima-apply-${nowStamp()}.json`)
  fs.writeFileSync(backupFile, JSON.stringify(existing, null, 2) + '\n', 'utf8')

  console.log(`Backup creato: ${backupFile}`)
  console.log('')

  let updated = 0

  for (const row of rows) {
    const property = byRef.get(row.reference_code)
    const oldDescription = compact(property.description)

    const isPlaceholder =
      oldDescription.includes('Bozza importata da audit portali') ||
      oldDescription.includes('La scheda è stata creata partendo dai dati pubblici') ||
      oldDescription.length < 250

    console.log(`${APPLY ? 'UPDATE' : 'DRY'} ${row.reference_code} | ${row.description.length} caratteri | ${property.title}`)

    if (APPLY) {
      await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
        method: 'PATCH',
        headers: {
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          description: row.description,
        }),
      })
    }

    updated += 1
  }

  console.log('')
  console.log(`${APPLY ? 'Aggiornate' : 'Aggiornabili'}: ${updated}/${rows.length}`)

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Ora puoi applicare con:')
    console.log('npm run audit:portali:apply-final-descriptions -- --apply')
    return
  }

  const after = await supabaseFetch(
    `/rest/v1/properties?select=reference_code,title,description&reference_code=in.(${refFilter})`
  )

  const bad = after.filter((p) => {
    const d = compact(p.description)
    return (
      d.length < 250 ||
      d.includes('Bozza importata da audit portali') ||
      d.includes('La scheda è stata creata partendo dai dati pubblici')
    )
  })

  console.log('')
  console.log('=== VERIFICA POST APPLY ===')
  console.log(`Immobili verificati: ${after.length}`)
  console.log(`Descrizioni sospette/placeholder residue: ${bad.length}`)

  if (bad.length) {
    for (const p of bad) {
      console.log(`ATTENZIONE ${p.reference_code} | ${p.title}`)
    }
    process.exit(1)
  }

  console.log('OK: tutte le 32 descrizioni finali risultano applicate.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
