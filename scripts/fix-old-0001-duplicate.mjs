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
  process.exit(1)
}

const APPLY = process.argv.includes('--apply')

const OLD_REF = 'OLD-0001'
const KEEP_REF = 'AED4MH'

async function supabaseFetch(endpoint, options = {}) {
  const res = await fetch(`${SUPABASE_URL}${endpoint}`, {
    ...options,
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
      accept: 'application/json',
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}: ${text}`)
  }

  return text ? JSON.parse(text) : null
}

async function getProperty(ref) {
  const rows = await supabaseFetch(
    `/rest/v1/properties?reference_code=eq.${encodeURIComponent(ref)}&select=*`
  )
  return rows?.[0] || null
}

async function getMedia(propertyId) {
  return await supabaseFetch(
    `/rest/v1/property_media?property_id=eq.${propertyId}&select=*&order=sort_order.asc,created_at.asc`
  )
}

async function getLeads(property) {
  const byId = await supabaseFetch(
    `/rest/v1/leads?property_id=eq.${property.id}&select=id,property_id,property_slug,full_name,email,created_at`
  )

  const bySlug = property.slug
    ? await supabaseFetch(
        `/rest/v1/leads?property_slug=eq.${encodeURIComponent(property.slug)}&select=id,property_id,property_slug,full_name,email,created_at`
      )
    : []

  const map = new Map()
  for (const lead of [...byId, ...bySlug]) map.set(lead.id, lead)
  return [...map.values()]
}

async function patchProperty(id, body) {
  await supabaseFetch(`/rest/v1/properties?id=eq.${id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
}

async function patchMedia(id, body) {
  await supabaseFetch(`/rest/v1/property_media?id=eq.${id}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify(body),
  })
}

async function deleteMedia(id) {
  await supabaseFetch(`/rest/v1/property_media?id=eq.${id}`, {
    method: 'DELETE',
    headers: { prefer: 'return=minimal' },
  })
}

async function deleteProperty(id) {
  await supabaseFetch(`/rest/v1/properties?id=eq.${id}`, {
    method: 'DELETE',
    headers: { prefer: 'return=minimal' },
  })
}

function normUrl(url) {
  return String(url || '').trim()
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

async function syncGallery(propertyId) {
  const media = await getMedia(propertyId)
  const urls = media
    .map((m) => normUrl(m.file_url))
    .filter(Boolean)

  const cover =
    media.find((m) => m.is_cover && normUrl(m.file_url))?.file_url ||
    urls[0] ||
    null

  await patchProperty(propertyId, {
    main_image: cover,
    gallery: urls,
    photo_coming_soon: false,
    no_photo_available: false,
  })

  return { count: media.length, cover, urls }
}

async function main() {
  console.log('=== FIX DOPPIONE OLD-0001 -> AED4MH ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - scrive in Supabase' : 'DRY RUN - non scrive nulla'}`)
  console.log('')

  const oldProperty = await getProperty(OLD_REF)
  const keepProperty = await getProperty(KEEP_REF)

  if (!oldProperty) throw new Error(`${OLD_REF} non trovato`)
  if (!keepProperty) throw new Error(`${KEEP_REF} non trovato`)

  const oldMedia = await getMedia(oldProperty.id)
  const keepMedia = await getMedia(keepProperty.id)
  const oldLeads = await getLeads(oldProperty)

  const keepUrls = new Set(keepMedia.map((m) => normUrl(m.file_url)).filter(Boolean))

  const mediaToMove = []
  const duplicateOldMedia = []

  for (const media of oldMedia) {
    const url = normUrl(media.file_url)
    if (url && keepUrls.has(url)) {
      duplicateOldMedia.push(media)
    } else {
      mediaToMove.push(media)
    }
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupPath = path.resolve(`tmp/area-portali-audit/backups/backup-fix-old-0001-${stamp}.json`)

  fs.writeFileSync(backupPath, JSON.stringify({
    generated_at: new Date().toISOString(),
    old_ref: OLD_REF,
    keep_ref: KEEP_REF,
    old_property: oldProperty,
    keep_property: keepProperty,
    old_media: oldMedia,
    keep_media: keepMedia,
    old_leads: oldLeads,
    media_to_move: mediaToMove,
    duplicate_old_media: duplicateOldMedia,
  }, null, 2), 'utf8')

  console.log('--- DA TENERE ---')
  console.log(`${KEEP_REF} | ${keepProperty.status} | ${keepProperty.title} | ${euro(keepProperty.price)} | media attuali: ${keepMedia.length}`)
  console.log('')
  console.log('--- DA RIMUOVERE ---')
  console.log(`${OLD_REF} | ${oldProperty.status} | ${oldProperty.title} | ${euro(oldProperty.price)} | media attuali: ${oldMedia.length}`)
  console.log('')
  console.log('--- AZIONI PREVISTE ---')
  console.log(`Media da spostare da ${OLD_REF} a ${KEEP_REF}: ${mediaToMove.length}`)
  console.log(`Media duplicati da eliminare solo come righe vecchie: ${duplicateOldMedia.length}`)
  console.log(`Lead collegati a ${OLD_REF}: ${oldLeads.length}`)
  console.log(`Backup: ${backupPath}`)
  console.log('')

  if (oldLeads.length > 0) {
    console.log('STOP: OLD-0001 ha lead collegati. Non procedo con eliminazione automatica.')
    process.exit(1)
  }

  if (!APPLY) {
    console.log('Dry-run completato. Per applicare davvero:')
    console.log('npm run audit:fix-old-0001-duplicate -- --apply')
    return
  }

  console.log('=== APPLICO ===')

  let nextSort = keepMedia.length
  for (const media of mediaToMove) {
    nextSort += 1
    await patchMedia(media.id, {
      property_id: keepProperty.id,
      sort_order: nextSort,
      is_cover: false,
    })
    console.log(`MOVE media ${media.id}`)
  }

  for (const media of duplicateOldMedia) {
    await deleteMedia(media.id)
    console.log(`DELETE duplicate old media row ${media.id}`)
  }

  const oldMediaAfter = await getMedia(oldProperty.id)
  const oldLeadsAfter = await getLeads(oldProperty)

  if (oldMediaAfter.length > 0 || oldLeadsAfter.length > 0) {
    console.log('')
    console.log(`STOP: non elimino ${OLD_REF}, restano media=${oldMediaAfter.length}, lead=${oldLeadsAfter.length}`)
    process.exit(1)
  }

  const sync = await syncGallery(keepProperty.id)
  console.log(`SYNC ${KEEP_REF} main_image/gallery | media finali: ${sync.count}`)

  await deleteProperty(oldProperty.id)
  console.log(`DELETE property ${OLD_REF}`)

  const oldCheck = await getProperty(OLD_REF)
  const keepCheck = await getProperty(KEEP_REF)
  const keepMediaAfter = await getMedia(keepProperty.id)

  console.log('')
  console.log('=== VERIFICA FINALE ===')
  console.log(`${OLD_REF}: ${oldCheck ? 'ANCORA PRESENTE' : 'eliminato correttamente'}`)
  console.log(`${KEEP_REF}: ${keepCheck ? 'presente' : 'ERRORE: non trovato'}`)
  console.log(`${KEEP_REF} media finali: ${keepMediaAfter.length}`)

  if (oldCheck) process.exit(1)
  console.log('')
  console.log('OK: doppione OLD-0001 risolto.')
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
