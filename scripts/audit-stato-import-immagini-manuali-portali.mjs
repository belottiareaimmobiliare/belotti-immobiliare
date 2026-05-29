import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('tmp/area-portali-audit/immagini-manuali-da-importare')
const DELETE_FLAGS_FILE = path.resolve('tmp/area-portali-audit/immobili-da-eliminare.json')
const OUT_MD = path.resolve('tmp/area-portali-audit/audit-stato-import-immagini-manuali-portali.md')
const OUT_JSON = path.resolve('tmp/area-portali-audit/audit-stato-import-immagini-manuali-portali.json')

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

function isImage(file) {
  return ['.jpg', '.jpeg', '.png', '.webp'].includes(path.extname(file).toLowerCase())
}

function readDeleteFlags() {
  if (!fs.existsSync(DELETE_FLAGS_FILE)) return {}
  try {
    const parsed = JSON.parse(fs.readFileSync(DELETE_FLAGS_FILE, 'utf8'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function localFilesFor(ref) {
  const importate = path.join(ROOT, ref, 'importate')
  const direct = path.join(ROOT, ref)

  const fromImportate = fs.existsSync(importate)
    ? fs.readdirSync(importate).filter(isImage).sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
    : []

  const fromDirect = fs.existsSync(direct)
    ? fs.readdirSync(direct).filter(isImage).sort((a, b) => a.localeCompare(b, 'it', { numeric: true }))
    : []

  return {
    importate_dir: importate,
    importate_files: fromImportate,
    direct_files: fromDirect,
  }
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 600)}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  console.log('=== AUDIT STATO IMPORT IMMAGINI MANUALI PORTALI ===')
  console.log('Modalità: sola lettura, non modifica nulla.')
  console.log('')

  const flags = readDeleteFlags()

  const properties = await supabaseFetch(
    '/rest/v1/properties?select=id,reference_code,title,status,main_image,gallery&reference_code=like.IM%25AA&order=reference_code.asc'
  )

  const ids = properties.map((p) => p.id)
  let media = []

  if (ids.length) {
    const idList = ids.map((id) => `"${id}"`).join(',')
    media = await supabaseFetch(
      `/rest/v1/property_media?select=id,property_id,media_type,file_url,label,is_cover,sort_order&property_id=in.(${encodeURIComponent(idList)})`
    )
  }

  const mediaByProperty = new Map()
  for (const item of media) {
    if (!mediaByProperty.has(item.property_id)) mediaByProperty.set(item.property_id, [])
    mediaByProperty.get(item.property_id).push(item)
  }

  const rows = properties.map((p) => {
    const local = localFilesFor(p.reference_code)
    const propertyMedia = mediaByProperty.get(p.id) || []
    const gallery = Array.isArray(p.gallery) ? p.gallery : []
    const deleteFlag = flags[p.reference_code]

    return {
      ref: p.reference_code,
      title: p.title,
      status: p.status,
      delete_marked: Boolean(deleteFlag?.delete_marked),
      delete_reason: compact(deleteFlag?.reason),
      local_importate_count: local.importate_files.length,
      local_direct_count: local.direct_files.length,
      local_importate_files: local.importate_files,
      importate_dir: local.importate_dir,
      media_count: propertyMedia.length,
      gallery_count: gallery.length,
      has_main_image: Boolean(p.main_image),
      site_has_images: propertyMedia.length > 0 || gallery.length > 0 || Boolean(p.main_image),
    }
  })

  const markedDelete = rows.filter((r) => r.delete_marked)
  const withLocal = rows.filter((r) => r.local_importate_count > 0 || r.local_direct_count > 0)
  const localNotImported = rows.filter((r) => !r.delete_marked && r.local_importate_count > 0 && !r.site_has_images)
  const noLocalNoSite = rows.filter((r) => !r.delete_marked && r.local_importate_count === 0 && !r.site_has_images)

  const md = []
  md.push('# Audit stato import immagini manuali portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push('## Riepilogo')
  md.push('')
  md.push(`- Immobili importati IMxxxxAA: **${rows.length}**`)
  md.push(`- REF con foto locali in cartella importate: **${withLocal.length}**`)
  md.push(`- REF segnati da eliminare: **${markedDelete.length}**`)
  md.push(`- REF con foto locali ma non ancora importate su Supabase: **${localNotImported.length}**`)
  md.push(`- REF senza foto locali e senza foto sito, esclusi eliminati: **${noLocalNoSite.length}**`)
  md.push('')
  md.push('## Da eliminare')
  md.push('')
  if (!markedDelete.length) {
    md.push('Nessun REF segnato da eliminare.')
  } else {
    md.push('| REF | Stato | Foto locali | Media sito | Gallery | Motivo | Titolo |')
    md.push('|---|---|---:|---:|---:|---|---|')
    for (const row of markedDelete) {
      md.push(`| ${row.ref} | ${row.status} | ${row.local_importate_count} | ${row.media_count} | ${row.gallery_count} | ${row.delete_reason || '-'} | ${row.title} |`)
    }
  }
  md.push('')
  md.push('## Foto locali non ancora importate su Supabase')
  md.push('')
  if (!localNotImported.length) {
    md.push('Nessun REF con foto locali ancora da importare.')
  } else {
    md.push('| REF | Foto locali | Media sito | Gallery | Titolo |')
    md.push('|---|---:|---:|---:|---|')
    for (const row of localNotImported) {
      md.push(`| ${row.ref} | ${row.local_importate_count} | ${row.media_count} | ${row.gallery_count} | ${row.title} |`)
    }
  }
  md.push('')
  md.push('## Tutti i REF')
  md.push('')
  md.push('| REF | Elimina | Locali importate | Locali dirette | Media sito | Gallery | Main | Titolo |')
  md.push('|---|---|---:|---:|---:|---:|---|---|')
  for (const row of rows) {
    md.push(`| ${row.ref} | ${row.delete_marked ? 'sì' : 'no'} | ${row.local_importate_count} | ${row.local_direct_count} | ${row.media_count} | ${row.gallery_count} | ${row.has_main_image ? 'sì' : 'no'} | ${row.title} |`)
  }

  fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(OUT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    summary: {
      total: rows.length,
      with_local: withLocal.length,
      marked_delete: markedDelete.length,
      local_not_imported: localNotImported.length,
      no_local_no_site: noLocalNoSite.length,
    },
    rows,
    marked_delete: markedDelete,
    local_not_imported: localNotImported,
    no_local_no_site: noLocalNoSite,
  }, null, 2), 'utf8')

  console.log('Report creati:')
  console.log(OUT_MD)
  console.log(OUT_JSON)
  console.log('')
  console.log(md.slice(0, 180).join('\n'))
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
