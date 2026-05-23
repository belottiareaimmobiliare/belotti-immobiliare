import fs from 'fs'
import path from 'path'

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
  loadEnvFile(file)
}

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  console.error('Servono NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY in .env.local/.env.')
  process.exit(1)
}

async function supabaseFetch(endpoint) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      accept: 'application/json',
    },
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }

  return text ? JSON.parse(text) : null
}

function euro(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function lineProperty(p) {
  return [
    `REF: ${p.reference_code || '-'}`,
    `ID: ${p.id}`,
    `Titolo: ${p.title || '-'}`,
    `Slug: ${p.slug || '-'}`,
    `Stato: ${p.status || '-'}`,
    `Contratto: ${p.contract_type || '-'}`,
    `Prezzo: ${euro(p.price)}`,
    `Città: ${p.city || p.comune || '-'}`,
    `Creato: ${p.created_at || '-'}`,
    `Aggiornato: ${p.updated_at || '-'}`,
  ].join('\n')
}

async function getPropertyByRef(ref) {
  const rows = await supabaseFetch(
    `/rest/v1/properties?reference_code=eq.${encodeURIComponent(ref)}&select=*`
  )
  return rows?.[0] || null
}

async function countRows(table, query) {
  const rows = await supabaseFetch(`/rest/v1/${table}?${query}&select=id`)
  return Array.isArray(rows) ? rows.length : 0
}

async function main() {
  console.log('=== AUDIT DOPPIONE OLD-0001 / AED4MH ===')
  console.log('Modalità: solo verifica, non modifica nulla.')
  console.log('')

  const oldRef = 'OLD-0001'
  const keepRef = 'AED4MH'

  const oldProperty = await getPropertyByRef(oldRef)
  const keepProperty = await getPropertyByRef(keepRef)

  const lines = []
  lines.push('# Audit doppione AFFITTASI BILOCALE PIAZZA ANGELINI')
  lines.push('')
  lines.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  lines.push('')
  lines.push('## Obiettivo')
  lines.push('')
  lines.push('Verificare se il draft `OLD-0001` può essere eliminato/archiviato senza perdere media o lead, mantenendo la scheda pubblicata `AED4MH`.')
  lines.push('')

  if (!oldProperty) {
    console.log('OLD-0001 non trovato.')
    lines.push('## Esito')
    lines.push('')
    lines.push('`OLD-0001` non trovato nel database.')
  } else {
    console.log('--- IMMOBILE DA VERIFICARE ---')
    console.log(lineProperty(oldProperty))
    console.log('')

    lines.push('## Immobile da verificare')
    lines.push('')
    lines.push('```')
    lines.push(lineProperty(oldProperty))
    lines.push('```')
    lines.push('')

    const mediaCount = await countRows('property_media', `property_id=eq.${oldProperty.id}`)
    const leadsById = await countRows('leads', `property_id=eq.${oldProperty.id}`)
    const leadsBySlug = oldProperty.slug
      ? await countRows('leads', `property_slug=eq.${encodeURIComponent(oldProperty.slug)}`)
      : 0

    console.log('--- COLLEGAMENTI OLD-0001 ---')
    console.log(`Media collegati: ${mediaCount}`)
    console.log(`Lead collegati per property_id: ${leadsById}`)
    console.log(`Lead collegati per property_slug: ${leadsBySlug}`)
    console.log('')

    lines.push('## Collegamenti OLD-0001')
    lines.push('')
    lines.push(`- Media collegati: **${mediaCount}**`)
    lines.push(`- Lead collegati per property_id: **${leadsById}**`)
    lines.push(`- Lead collegati per property_slug: **${leadsBySlug}**`)
    lines.push('')

    if (mediaCount === 0 && leadsById === 0 && leadsBySlug === 0) {
      lines.push('## Valutazione')
      lines.push('')
      lines.push('`OLD-0001` non risulta avere media o lead collegati. È un buon candidato per eliminazione o archiviazione manuale.')
      console.log('VALUTAZIONE: OLD-0001 sembra eliminabile/archiviabile: nessun media o lead collegato.')
    } else {
      lines.push('## Valutazione')
      lines.push('')
      lines.push('`OLD-0001` ha collegamenti. Prima di eliminarlo bisogna decidere se migrare media/lead sulla scheda pubblicata.')
      console.log('VALUTAZIONE: OLD-0001 ha collegamenti. Non eliminare finché non si decide cosa migrare.')
    }
  }

  if (!keepProperty) {
    console.log('')
    console.log('AED4MH non trovato.')
    lines.push('')
    lines.push('## Immobile da tenere')
    lines.push('')
    lines.push('`AED4MH` non trovato nel database.')
  } else {
    console.log('')
    console.log('--- IMMOBILE DA TENERE ---')
    console.log(lineProperty(keepProperty))

    lines.push('')
    lines.push('## Immobile da tenere')
    lines.push('')
    lines.push('```')
    lines.push(lineProperty(keepProperty))
    lines.push('```')
  }

  const outMd = path.resolve('tmp/area-portali-audit/audit-old-0001-duplicate.md')
  fs.writeFileSync(outMd, lines.join('\n') + '\n', 'utf8')

  console.log('')
  console.log('Report creato:')
  console.log(outMd)
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
