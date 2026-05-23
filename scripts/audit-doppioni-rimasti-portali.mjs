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

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('ERRORE: variabili Supabase mancanti.')
  process.exit(1)
}

const TARGET_REFS = ['IM0029AA', 'IM0030AA', 'IM0031AA', 'IM0012AA', 'IM0013AA']

async function supabaseFetch(endpoint) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
    },
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }

  return text ? JSON.parse(text) : null
}

function money(value) {
  if (value === null || value === undefined || value === '') return '-'
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function clean(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function preview(text, len = 260) {
  const t = clean(text)
  if (!t) return '-'
  return t.length > len ? t.slice(0, len) + '…' : t
}

function galleryCount(gallery) {
  if (Array.isArray(gallery)) return gallery.length
  if (!gallery) return 0
  return 1
}

async function main() {
  fs.mkdirSync('tmp/area-portali-audit', { recursive: true })

  const refFilter = TARGET_REFS.join(',')
  const select = [
    'id',
    'reference_code',
    'title',
    'slug',
    'status',
    'contract_type',
    'property_type',
    'price',
    'city',
    'address',
    'surface',
    'rooms',
    'bathrooms',
    'description',
    'main_image',
    'gallery',
    'created_at',
    'updated_at',
  ].join(',')

  const properties = await supabaseFetch(
    `/rest/v1/properties?select=${encodeURIComponent(select)}&reference_code=in.(${refFilter})&order=reference_code.asc`
  )

  const ids = properties.map((p) => p.id)
  const slugs = properties.map((p) => p.slug).filter(Boolean)

  const media = ids.length
    ? await supabaseFetch(
        `/rest/v1/property_media?select=id,property_id,media_type,file_url,label,sort_order,is_cover&property_id=in.(${ids.join(',')})&order=property_id.asc,sort_order.asc`
      )
    : []

  const leadsById = ids.length
    ? await supabaseFetch(
        `/rest/v1/leads?select=id,property_id,property_slug,created_at,email,full_name&property_id=in.(${ids.join(',')})`
      )
    : []

  const leadsBySlug = slugs.length
    ? await supabaseFetch(
        `/rest/v1/leads?select=id,property_id,property_slug,created_at,email,full_name&property_slug=in.(${slugs.join(',')})`
      )
    : []

  const mediaByProperty = new Map()
  for (const m of media) {
    if (!mediaByProperty.has(m.property_id)) mediaByProperty.set(m.property_id, [])
    mediaByProperty.get(m.property_id).push(m)
  }

  const leadsByProperty = new Map()
  for (const l of [...leadsById, ...leadsBySlug]) {
    const key = l.property_id || l.property_slug || 'unknown'
    if (!leadsByProperty.has(key)) leadsByProperty.set(key, [])
    leadsByProperty.get(key).push(l)
  }

  const lines = []
  lines.push('# Audit mirato doppioni rimasti portali')
  lines.push('')
  lines.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  lines.push('')
  lines.push('## Valutazione rapida')
  lines.push('')
  lines.push('- `IM0029AA`, `IM0030AA`, `IM0031AA`: stesso complesso/indirizzo Via Roma 85, prezzi diversi. Da verificare come unità separate prima di eliminare.')
  lines.push('- `IM0012AA`, `IM0013AA`: stesso indirizzo Torquato Tasso ma contratto diverso vendita/affitto. Normalmente può restare così.')
  lines.push('- Questo audit non modifica nulla.')
  lines.push('')
  lines.push('## Tabella')
  lines.push('')
  lines.push('| REF | Stato | Contratto | Prezzo | Tipo | Mq | Media | Gallery | Lead | Slug | Titolo |')
  lines.push('|---|---|---|---:|---|---:|---:|---:|---:|---|---|')

  for (const p of properties) {
    const pm = mediaByProperty.get(p.id) || []
    const leadCount =
      (leadsByProperty.get(p.id) || []).length +
      (leadsByProperty.get(p.slug) || []).length

    lines.push(
      `| ${p.reference_code} | ${p.status || '-'} | ${p.contract_type || '-'} | ${money(p.price)} | ${p.property_type || '-'} | ${p.surface || '-'} | ${pm.length} | ${galleryCount(p.gallery)} | ${leadCount} | ${p.slug || '-'} | ${p.title || '-'} |`
    )
  }

  lines.push('')
  lines.push('## Dettaglio descrizioni')
  lines.push('')

  for (const p of properties) {
    const pm = mediaByProperty.get(p.id) || []
    const leadCount =
      (leadsByProperty.get(p.id) || []).length +
      (leadsByProperty.get(p.slug) || []).length

    lines.push(`### ${p.reference_code} — ${p.title}`)
    lines.push('')
    lines.push(`- ID: \`${p.id}\``)
    lines.push(`- Stato: **${p.status || '-'}**`)
    lines.push(`- Contratto: **${p.contract_type || '-'}**`)
    lines.push(`- Prezzo: **${money(p.price)}**`)
    lines.push(`- Tipo: **${p.property_type || '-'}**`)
    lines.push(`- Superficie: **${p.surface || '-'}**`)
    lines.push(`- Locali: **${p.rooms || '-'}**`)
    lines.push(`- Bagni: **${p.bathrooms || '-'}**`)
    lines.push(`- Media collegati: **${pm.length}**`)
    lines.push(`- Gallery legacy: **${galleryCount(p.gallery)}**`)
    lines.push(`- Lead collegati: **${leadCount}**`)
    lines.push(`- Slug: \`${p.slug || '-'}\``)
    lines.push('')
    lines.push('Descrizione:')
    lines.push('')
    lines.push('```')
    lines.push(preview(p.description, 1200))
    lines.push('```')
    lines.push('')
    lines.push('Prime immagini:')
    lines.push('')
    for (const m of pm.slice(0, 5)) {
      lines.push(`- ${m.is_cover ? 'cover ' : ''}${m.media_type || '-'} | ${m.label || '-'} | ${m.file_url}`)
    }
    if (!pm.length) lines.push('- Nessuna immagine collegata')
    lines.push('')
  }

  lines.push('## Decisione consigliata')
  lines.push('')
  lines.push('- Non eliminare automaticamente `IM0012AA` / `IM0013AA`: vendita e affitto sono contratti diversi.')
  lines.push('- Per `IM0029AA` / `IM0030AA` / `IM0031AA`: eliminare solo se descrizione, immagini e metrature confermano che sono lo stesso identico ufficio. Se sono tagli/prezzi diversi nello stesso complesso, vanno tenuti separati ma con titoli più distinti.')
  lines.push('')

  const outMd = path.resolve('tmp/area-portali-audit/audit-doppioni-rimasti-portali.md')
  fs.writeFileSync(outMd, lines.join('\n') + '\n', 'utf8')

  console.log('=== AUDIT MIRATO DOPPIONI RIMASTI CREATO ===')
  console.log(outMd)
  console.log('')
  console.log(lines.slice(0, 220).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
