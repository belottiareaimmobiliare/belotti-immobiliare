import { loadEnvFile } from 'node:process'
import { createClient } from '@supabase/supabase-js'

loadEnvFile('.env.local')

const APPLY = process.argv.includes('--confirm=MOVE_DUPLICATE_DRIVE_FOLDERS')
const SCRIPT_URL = process.env.AIOS_DRIVE_APP_SCRIPT_URL
const TOKEN = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN
const ROOT_FOLDER_ID =
  process.env.AIOS_DRIVE_IMMOBILI_FOLDER_ID ||
  process.env.AIOS_DRIVE_ROOT_FOLDER_ID

const QUARANTINE_NAME = `_AI-OS_DUPLICATI_DA_VERIFICARE_${new Date()
  .toISOString()
  .slice(0, 10)}`

if (!SCRIPT_URL || !TOKEN) {
  throw new Error('AIOS_DRIVE_APP_SCRIPT_URL o AIOS_DRIVE_APP_SCRIPT_TOKEN mancanti in .env.local')
}

if (!ROOT_FOLDER_ID) {
  throw new Error('AIOS_DRIVE_IMMOBILI_FOLDER_ID mancante in .env.local')
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

function cleanName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function norm(value) {
  return cleanName(value).toLowerCase()
}

function itemId(item) {
  return String(item?.id || item?.folderId || '').trim()
}

function itemName(item) {
  return cleanName(item?.name || item?.title || item?.folderName || '')
}

function isManagedPropertyFolderName(name) {
  const cleaned = cleanName(name)

  return (
    /^OLD-\d{4}\s+-\s+/i.test(cleaned) ||
    /^[A-Z0-9]{6}\s+-\s+/.test(cleaned)
  )
}

async function callDrive(action, payload = {}) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token: TOKEN,
      action,
      ...payload,
    }),
  })

  const text = await response.text()
  let json = null

  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Risposta Drive non JSON per ${action}: ${text.slice(0, 250)}`)
  }

  if (!response.ok || !json?.ok) {
    throw new Error(json?.error || `Errore Drive action ${action}`)
  }

  return json
}

async function getRootFolders() {
  const payload = await callDrive('listFolder', {
    folderId: ROOT_FOLDER_ID,
  })

  return Array.isArray(payload.folders) ? payload.folders : []
}

async function ensureQuarantineFolder(rootFolders) {
  const existing = rootFolders.find((folder) => norm(itemName(folder)) === norm(QUARANTINE_NAME))

  if (existing && itemId(existing)) {
    return {
      id: itemId(existing),
      name: itemName(existing),
      created: false,
    }
  }

  const payload = await callDrive('createSubfolder', {
    folderId: ROOT_FOLDER_ID,
    folderName: QUARANTINE_NAME,
  })

  const folder = payload.folder || payload.item || payload

  if (!itemId(folder)) {
    throw new Error('Cartella quarantena creata ma ID non ricevuto da Drive')
  }

  return {
    id: itemId(folder),
    name: itemName(folder) || QUARANTINE_NAME,
    created: true,
  }
}

async function main() {
  const { data: expectedRows, error } = await supabase
    .from('property_drive_folders')
    .select(`
      property_id,
      folder_name,
      drive_folder_id,
      sync_status,
      properties (
        title,
        reference_code,
        source_tag,
        status
      )
    `)
    .not('drive_folder_id', 'is', null)

  if (error) throw error

  const expected = (expectedRows || []).filter((row) => {
    const id = String(row.drive_folder_id || '').trim()
    return id && !id.startsWith('aios-property-')
  })

  const expectedIds = new Set(expected.map((row) => String(row.drive_folder_id).trim()))
  const expectedNames = new Set(expected.map((row) => norm(row.folder_name)).filter(Boolean))

  const rootFolders = await getRootFolders()

  const candidates = []

  for (const folder of rootFolders) {
    const id = itemId(folder)
    const name = itemName(folder)

    if (!id || !name) continue
    if (id === ROOT_FOLDER_ID) continue
    if (norm(name) === norm(QUARANTINE_NAME)) continue
    if (expectedIds.has(id)) continue

    const sameNameAsExpected = expectedNames.has(norm(name))
    const looksManaged = isManagedPropertyFolderName(name)

    if (sameNameAsExpected || looksManaged) {
      candidates.push({
        id,
        name,
        reason: sameNameAsExpected
          ? 'stesso nome di una cartella gestita, ma ID diverso'
          : 'cartella in formato AI-OS non collegata al DB',
      })
    }
  }

  console.log('')
  console.log('=== AUDIT DUPLICATI DRIVE IMMOBILI ===')
  console.log({
    apply: APPLY,
    rootFolderId: ROOT_FOLDER_ID,
    driveFoldersInRoot: rootFolders.length,
    expectedDbFolders: expected.length,
    duplicateCandidates: candidates.length,
    quarantineName: QUARANTINE_NAME,
  })

  console.log('')
  console.log('=== CARTELLE DA SPOSTARE IN QUARANTENA ===')

  if (!candidates.length) {
    console.log('Nessun doppione rilevato.')
    return
  }

  for (const item of candidates) {
    console.log(`- ${item.name}`)
    console.log(`  id: ${item.id}`)
    console.log(`  motivo: ${item.reason}`)
  }

  if (!APPLY) {
    console.log('')
    console.log('DRY RUN: nessuna cartella spostata.')
    console.log('Per spostare davvero i doppioni:')
    console.log('npm run drive:immobili:duplicates:quarantine')
    return
  }

  const quarantine = await ensureQuarantineFolder(rootFolders)

  console.log('')
  console.log('=== QUARANTENA ===')
  console.log(quarantine)

  let moved = 0
  const errors = []

  for (const item of candidates) {
    try {
      await callDrive('moveItem', {
        folderId: ROOT_FOLDER_ID,
        sourceItemId: item.id,
        targetFolderId: quarantine.id,
      })

      moved += 1
      console.log(`SPOSTATA: ${item.name}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({
        name: item.name,
        id: item.id,
        error: message,
      })
      console.log(`ERRORE: ${item.name} -> ${message}`)
    }
  }

  console.log('')
  console.log('=== RISULTATO ===')
  console.log({
    moved,
    errors: errors.length,
    quarantineFolderId: quarantine.id,
  })

  if (errors.length) {
    console.log('')
    console.log('=== ERRORI ===')
    console.log(JSON.stringify(errors, null, 2))
  }
}

main().catch((error) => {
  console.error('')
  console.error('CLEANUP DUPLICATI DRIVE FALLITO:')
  console.error(error)
  process.exit(1)
})
