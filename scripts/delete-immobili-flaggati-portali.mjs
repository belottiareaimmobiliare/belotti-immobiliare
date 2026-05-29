import fs from 'fs'
import path from 'path'

const FLAGS_FILE = path.resolve('tmp/area-portali-audit/immobili-da-eliminare.json')
const LOCAL_ROOT = path.resolve('tmp/area-portali-audit/immagini-manuali-da-importare')
const DELETED_LOCAL_ROOT = path.resolve('tmp/area-portali-audit/cartelle-immobili-eliminati')
const BACKUP_DIR = path.resolve('tmp/area-portali-audit/backups')
const REPORT_MD = path.resolve('tmp/area-portali-audit/delete-immobili-flaggati-portali.md')
const REPORT_JSON = path.resolve('tmp/area-portali-audit/delete-immobili-flaggati-portali.json')
const BUCKET = 'property-media'

const APPLY = process.argv.includes('--apply')
const FORCE = process.argv.includes('--force')

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

function readFlags() {
  if (!fs.existsSync(FLAGS_FILE)) return {}
  return JSON.parse(fs.readFileSync(FLAGS_FILE, 'utf8'))
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
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text.slice(0, 800)}`)
  return text ? JSON.parse(text) : null
}

function storagePathFromUrl(fileUrl) {
  const s = compact(fileUrl)
  if (!s) return ''

  const markers = [
    `/storage/v1/object/public/${BUCKET}/`,
    `/storage/v1/object/sign/${BUCKET}/`,
  ]

  for (const marker of markers) {
    const i = s.indexOf(marker)
    if (i >= 0) return decodeURIComponent(s.slice(i + marker.length).split('?')[0])
  }

  return ''
}

async function deleteStorageObject(objectPath) {
  if (!objectPath) return

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: 'DELETE',
    headers: {
      apikey: SERVICE_KEY,
      authorization: `Bearer ${SERVICE_KEY}`,
    },
  })

  const text = await res.text()
  if (!res.ok && res.status !== 404) {
    throw new Error(`Storage delete fallito ${objectPath}: ${res.status} ${text.slice(0, 500)}`)
  }
}

function moveLocalFolder(ref) {
  const src = path.join(LOCAL_ROOT, ref)
  if (!fs.existsSync(src)) return null

  fs.mkdirSync(DELETED_LOCAL_ROOT, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dst = path.join(DELETED_LOCAL_ROOT, `${ref}-${stamp}`)

  fs.renameSync(src, dst)
  return dst
}

async function main() {
  console.log('=== DELETE IMMOBILI FLAGGATI PORTALI ===')
  console.log(`Modalità: ${APPLY ? 'APPLY - cancella davvero' : 'DRY RUN - non cancella nulla'}`)
  console.log(`Force: ${FORCE ? 'sì' : 'no'}`)
  console.log('')

  const flags = readFlags()
  const refs = Object.values(flags)
    .filter((item) => item?.delete_marked)
    .map((item) => compact(item.ref))
    .filter((ref) => /^IM\d{4}AA$/.test(ref))
    .sort()

  if (!refs.length) {
    console.log('Nessun REF flaggato da eliminare.')
    return
  }

  fs.mkdirSync(BACKUP_DIR, { recursive: true })

  const report = []

  for (const ref of refs) {
    const properties = await supabaseFetch(
      `/rest/v1/properties?select=*&reference_code=eq.${encodeURIComponent(ref)}&limit=1`
    )
    const property = Array.isArray(properties) ? properties[0] : null

    if (!property) {
      report.push({
        ref,
        action: 'SKIP_NOT_FOUND',
        reason: 'Immobile non trovato in Supabase',
      })
      continue
    }

    const media = await supabaseFetch(
      `/rest/v1/property_media?select=*&property_id=eq.${property.id}&order=sort_order.asc,created_at.asc`
    )

    const leads = await supabaseFetch(
      `/rest/v1/leads?select=id,full_name,email,phone,created_at&property_id=eq.${property.id}`
    )

    const blockers = []

    if (property.status !== 'draft') blockers.push(`status non draft: ${property.status}`)
    if (Array.isArray(leads) && leads.length > 0) blockers.push(`ha lead collegati: ${leads.length}`)

    if (blockers.length && !FORCE) {
      report.push({
        ref,
        action: 'BLOCKED',
        title: property.title,
        status: property.status,
        blockers,
        media_count: media.length,
        leads_count: leads.length,
      })
      continue
    }

    const backup = {
      ref,
      flag: flags[ref],
      property,
      media,
      leads,
      backup_at: new Date().toISOString(),
    }

    const backupPath = path.join(
      BACKUP_DIR,
      `backup-delete-${ref}-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    )

    const storageObjects = media.map((item) => storagePathFromUrl(item.file_url)).filter(Boolean)

    let movedLocalFolder = null

    if (APPLY) {
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8')

      for (const objectPath of storageObjects) {
        await deleteStorageObject(objectPath)
      }

      await supabaseFetch(`/rest/v1/property_media?property_id=eq.${property.id}`, {
        method: 'DELETE',
        headers: { prefer: 'return=minimal' },
      })

      await supabaseFetch(`/rest/v1/properties?id=eq.${property.id}`, {
        method: 'DELETE',
        headers: { prefer: 'return=minimal' },
      })

      movedLocalFolder = moveLocalFolder(ref)

      delete flags[ref]
      fs.writeFileSync(FLAGS_FILE, JSON.stringify(flags, null, 2) + '\n', 'utf8')
    }

    report.push({
      ref,
      action: APPLY ? 'DELETED' : 'DRY_DELETE',
      title: property.title,
      status: property.status,
      media_count: media.length,
      leads_count: leads.length,
      storage_objects: storageObjects,
      backup_path: APPLY ? backupPath : null,
      local_folder_moved_to: movedLocalFolder,
    })
  }

  const md = []
  md.push('# Delete immobili flaggati portali')
  md.push('')
  md.push(`Generato: ${new Date().toLocaleString('it-IT')}`)
  md.push('')
  md.push(`- Modalità: **${APPLY ? 'APPLY' : 'DRY RUN'}**`)
  md.push(`- Force: **${FORCE ? 'sì' : 'no'}**`)
  md.push(`- REF flaggati: **${refs.length}**`)
  md.push('')
  md.push('| REF | Azione | Stato | Media | Lead | Titolo |')
  md.push('|---|---|---|---:|---:|---|')

  for (const row of report) {
    md.push(`| ${row.ref} | ${row.action} | ${row.status || '-'} | ${row.media_count ?? '-'} | ${row.leads_count ?? '-'} | ${row.title || row.reason || '-'} |`)
  }

  md.push('')
  md.push('## Dettaglio JSON')
  md.push('')
  md.push('```json')
  md.push(JSON.stringify(report, null, 2))
  md.push('```')

  fs.writeFileSync(REPORT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(REPORT_JSON, JSON.stringify({
    generated_at: new Date().toISOString(),
    apply: APPLY,
    force: FORCE,
    refs,
    report,
  }, null, 2), 'utf8')

  console.log(md.join('\n'))

  if (!APPLY) {
    console.log('')
    console.log('Dry-run completato. Se vedi SOLO IM0014AA e azione DRY_DELETE, puoi applicare con:')
    console.log('npm run audit:portali:delete-flagged -- --apply')
  } else {
    console.log('')
    console.log('OK: cancellazione completata.')
  }
}

main().catch((error) => {
  console.error(error.message)
  process.exit(1)
})
