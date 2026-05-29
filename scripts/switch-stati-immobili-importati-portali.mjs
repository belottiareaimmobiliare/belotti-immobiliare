import fs from 'fs'
import path from 'path'

const APPLY = process.argv.includes('--apply')
const REPORT_MD = path.resolve('tmp/area-portali-audit/switch-stati-immobili-importati-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/switch-stati-immobili-importati-portali.json')

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const i = trimmed.indexOf('=')
    const key = trimmed.slice(0, i).trim()
    let value = trimmed.slice(i + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

for (const file of ['.env.local', '.env', '.env.development.local', '.env.production.local']) {
  loadEnvFile(file)
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

function compact(v) {
  return String(v ?? '').trim()
}

function isImportedRef(ref) {
  return /^IM\d{4}AA$/.test(compact(ref))
}

async function supabaseFetch(restPath, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${restPath}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 1000)}`)
  return text ? JSON.parse(text) : null
}

async function patchProperty(id, body) {
  return supabaseFetch(`/rest/v1/properties?id=eq.${id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=representation' },
    body: JSON.stringify(body),
  })
}

async function main() {
  console.log('=== SWITCH STATI IMMOBILI IMPORTATI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - modifica davvero Supabase' : 'DRY RUN - non modifica nulla'}`)
  console.log('')

  const properties = await supabaseFetch(
    '/rest/v1/properties?select=id,reference_code,title,status,published_at,main_image,gallery&order=reference_code.asc'
  )

  const now = new Date().toISOString()

  const rows = properties.map((p) => {
    const imported = isImportedRef(p.reference_code)
    const targetStatus = imported ? 'published' : 'draft'
    const currentStatus = compact(p.status) || '(vuoto)'
    const hasMain = Boolean(p.main_image)
    const galleryCount = Array.isArray(p.gallery) ? p.gallery.length : 0

    return {
      id: p.id,
      ref: compact(p.reference_code) || '-',
      title: p.title,
      imported,
      current_status: currentStatus,
      target_status: targetStatus,
      will_change: currentStatus !== targetStatus,
      published_at: p.published_at,
      has_main_image: hasMain,
      gallery_count: galleryCount,
    }
  })

  const toPublish = rows.filter((r) => r.imported)
  const toDraft = rows.filter((r) => !r.imported)
  const changes = rows.filter((r) => r.will_change)

  if (APPLY) {
    for (const row of changes) {
      const body = {
        status: row.target_status,
        updated_at: now,
      }

      if (row.target_status === 'published') {
        body.published_at = row.published_at || now
        body.photo_coming_soon = false
        body.no_photo_available = false
      }

      if (row.target_status === 'draft') {
        body.published_at = null
      }

      await patchProperty(row.id, body)
      console.log(`OK ${row.ref}: ${row.current_status} -> ${row.target_status}`)
    }
  }

  const md = []
  md.push('# Switch stati immobili importati portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push(`- Immobili totali: **${rows.length}**`)
  md.push(`- Importati IMxxxxAA da pubblicare: **${toPublish.length}**`)
  md.push(`- Preesistenti/non importati da mettere in bozza: **${toDraft.length}**`)
  md.push(`- Cambi stato necessari: **${changes.length}**`)
  md.push('')
  md.push('## Da pubblicare')
  md.push('')
  md.push('| REF | Stato attuale | Stato finale | Main | Gallery | Titolo |')
  md.push('|---|---|---|---|---:|---|')
  for (const row of toPublish) {
    md.push(`| ${row.ref} | ${row.current_status} | ${row.target_status} | ${row.has_main_image ? 'sì' : 'no'} | ${row.gallery_count} | ${row.title} |`)
  }
  md.push('')
  md.push('## Da mettere in bozza')
  md.push('')
  md.push('| REF | Stato attuale | Stato finale | Main | Gallery | Titolo |')
  md.push('|---|---|---|---|---:|---|')
  for (const row of toDraft) {
    md.push(`| ${row.ref} | ${row.current_status} | ${row.target_status} | ${row.has_main_image ? 'sì' : 'no'} | ${row.gallery_count} | ${row.title} |`)
  }

  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true })
  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    apply: APPLY,
    summary: {
      total: rows.length,
      imported_to_publish: toPublish.length,
      existing_to_draft: toDraft.length,
      changes: changes.length,
    },
    to_publish: toPublish,
    to_draft: toDraft,
    changes,
  }, null, 2), 'utf8')

  console.log(md.join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Se i numeri sono corretti, applica con:')
    console.log('npm run audit:portali:switch-status -- --apply')
  } else {
    console.log('')
    console.log('OK: stati aggiornati.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
