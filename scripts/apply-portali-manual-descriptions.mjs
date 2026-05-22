import fs from 'node:fs/promises'
import path from 'node:path'

const OUT_DIR = 'tmp/area-portali-audit'
const CSV_FILE = path.join(OUT_DIR, 'descrizioni-manuali-portali.csv')
const REPORT_MD = path.join(OUT_DIR, 'apply-descrizioni-manuali-portali.md')
const APPLY = process.argv.includes('--apply')

function compact(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
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

    if (c === '"') {
      quoted = true
    } else if (c === ',') {
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

function getEnv(name) {
  const value = process.env[name]
  if (!value) throw new Error(`Manca variabile ambiente: ${name}`)
  return value
}

async function supabaseFetch(endpoint, options = {}) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY

  if (!key) {
    throw new Error('Manca SUPABASE_SERVICE_ROLE_KEY oppure SUPABASE_SERVICE_KEY oppure SUPABASE_SECRET_KEY')
  }

  const res = await fetch(`${url}${endpoint}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }

  if (res.status === 204) return null
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

function isBadDescription(text) {
  const s = compact(text)
  if (s.length < 80) return true
  if (/bozza importata da audit portali/i.test(s)) return true
  if (/scheda è stata creata partendo dai dati pubblici/i.test(s)) return true
  if (/descrizione non trovata/i.test(s)) return true
  if (/messaggio visita/i.test(s)) return true
  if (/chi siamo i numeri 1 in italia/i.test(s)) return true
  return false
}

async function main() {
  console.log('=== APPLY DESCRIZIONI MANUALI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log('')

  const csv = await fs.readFile(CSV_FILE, 'utf8')
  const rows = parseCsv(csv)

  const candidates = rows
    .map((row) => ({
      ref: compact(row.REF),
      title: compact(row.Titolo),
      description: compact(row['Descrizione da incollare qui']),
    }))
    .filter((row) => row.ref)

  const toApply = []
  const skipped = []

  for (const row of candidates) {
    if (!row.description) {
      skipped.push({ ...row, reason: 'descrizione vuota' })
      continue
    }

    if (isBadDescription(row.description)) {
      skipped.push({ ...row, reason: 'descrizione troppo corta o non affidabile' })
      continue
    }

    toApply.push(row)
  }

  console.log(`Righe CSV: ${candidates.length}`)
  console.log(`Aggiornabili: ${toApply.length}`)
  console.log(`Saltate: ${skipped.length}`)
  console.log('')

  for (const row of skipped) {
    console.log(`SKIP ${row.ref} | ${row.reason} | ${row.title}`)
  }

  for (const row of toApply) {
    console.log(`UPDATE ${row.ref} | ${row.description.length} caratteri | ${row.title}`)
  }

  if (APPLY) {
    console.log('')
    console.log('=== SCRITTURA IN SUPABASE ===')

    for (const row of toApply) {
      const found = await supabaseFetch(`/rest/v1/properties?reference_code=eq.${encodeURIComponent(row.ref)}&select=id,reference_code,title`)

      if (!found?.length) {
        console.log(`MISS ${row.ref} | immobile non trovato`)
        continue
      }

      const property = found[0]

      await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
        method: 'PATCH',
        headers: { prefer: 'return=minimal' },
        body: JSON.stringify({
          description: row.description,
        }),
      })

      console.log(`OK ${row.ref} | ${property.title}`)
    }
  }

  const md = []
  md.push('# Apply descrizioni manuali portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push('')
  md.push(`- Righe CSV: **${candidates.length}**`)
  md.push(`- Aggiornabili: **${toApply.length}**`)
  md.push(`- Saltate: **${skipped.length}**`)
  md.push('')
  md.push('## Aggiornabili')
  md.push('')
  md.push('| REF | Titolo | Caratteri |')
  md.push('|---|---|---:|')
  for (const row of toApply) {
    md.push(`| ${row.ref} | ${row.title.replace(/\|/g, '\\|')} | ${row.description.length} |`)
  }
  md.push('')
  md.push('## Saltate')
  md.push('')
  md.push('| REF | Titolo | Motivo |')
  md.push('|---|---|---|')
  for (const row of skipped) {
    md.push(`| ${row.ref} | ${row.title.replace(/\|/g, '\\|')} | ${row.reason} |`)
  }

  await fs.writeFile(REPORT_MD, md.join('\n') + '\n', 'utf8')

  console.log('')
  console.log('Report:')
  console.log(REPORT_MD)

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Quando il CSV è compilato bene, esegui:')
    console.log('npm run audit:portali:apply-manual-descriptions -- --apply')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
