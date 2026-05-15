import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

function loadEnv(file) {
  const envPath = path.join(process.cwd(), file)
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue

    let value = match[2].trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    process.env[match[1]] = value
  }
}

function cleanFolderName(value) {
  return String(value || '')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

function expectedFolderName(property) {
  const ref = cleanFolderName(property?.reference_code || '')
  const title = cleanFolderName(property?.title || 'Immobile senza titolo')

  return cleanFolderName(ref ? `${ref} - ${title}` : title)
}

async function callDriveScript(payload) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl) throw new Error('AIOS_DRIVE_APP_SCRIPT_URL mancante in .env.local')
  if (!token) throw new Error('AIOS_DRIVE_APP_SCRIPT_TOKEN mancante in .env.local')

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      ...payload,
    }),
  })

  const text = await response.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Risposta Apps Script non JSON: ${text.slice(0, 300)}`)
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.error || `Errore Apps Script HTTP ${response.status}`)
  }

  return data
}

loadEnv('.env.local')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

async function main() {
  const onlyRef = process.argv.find((arg) => arg.startsWith('--ref='))?.split('=')[1]?.trim() || ''

  const { data, error } = await supabase
    .from('property_drive_folders')
    .select(`
      id,
      property_id,
      folder_name,
      drive_folder_id,
      sync_status,
      last_error,
      properties (
        id,
        title,
        reference_code,
        source_tag,
        status
      )
    `)
    .not('drive_folder_id', 'is', null)
    .order('updated_at', { ascending: false })

  if (error) throw error

  const rows = (data || []).filter((row) => {
    const folderId = String(row.drive_folder_id || '').trim()
    const ref = String(row.properties?.reference_code || '').trim()

    if (!folderId) return false
    if (folderId.startsWith('aios-property-')) return false
    if (onlyRef && ref !== onlyRef) return false

    return true
  })

  console.log('')
  console.log('=== FORCE DRIVE FOLDER NAMES FROM PROPERTIES ===')
  console.log({
    selectedFolders: rows.length,
    onlyRef: onlyRef || null,
  })

  let dbUpdated = 0
  let driveRenamed = 0
  let alreadyOk = 0
  let errors = 0

  for (const row of rows) {
    const expected = expectedFolderName(row.properties)
    const currentDbName = String(row.folder_name || '').trim()
    const folderId = String(row.drive_folder_id || '').trim()
    const ref = String(row.properties?.reference_code || '').trim()
    const title = String(row.properties?.title || '').trim()

    try {
      if (currentDbName !== expected) {
        const { error: updateError } = await supabase
          .from('property_drive_folders')
          .update({
            folder_name: expected,
            sync_status: 'pending',
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (updateError) throw updateError

        dbUpdated++
        console.log('')
        console.log(`DB aggiornato: ${ref} | ${title}`)
        console.log(`  da: ${currentDbName}`)
        console.log(`  a : ${expected}`)
      }

      const before = await callDriveScript({
        action: 'listFolder',
        folderId,
      })

      const currentDriveName = String(before?.folder?.name || '').trim()

      if (currentDriveName === expected) {
        alreadyOk++

        const { error: okError } = await supabase
          .from('property_drive_folders')
          .update({
            folder_name: expected,
            sync_status: 'synced',
            last_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', row.id)

        if (okError) throw okError

        console.log(`OK già allineata: ${expected}`)
        continue
      }

      console.log('')
      console.log(`RINOMINO DRIVE: ${ref} | ${title}`)
      console.log(`  da: ${currentDriveName}`)
      console.log(`  a : ${expected}`)

      await callDriveScript({
        action: 'renameFolder',
        folderId,
        folderName: expected,
      })

      const after = await callDriveScript({
        action: 'listFolder',
        folderId,
      })

      const finalName = String(after?.folder?.name || '').trim()

      if (finalName !== expected) {
        throw new Error(`Rename non verificato. Nome attuale Drive: ${finalName}`)
      }

      const { error: finalUpdateError } = await supabase
        .from('property_drive_folders')
        .update({
          folder_name: expected,
          sync_status: 'synced',
          last_error: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      if (finalUpdateError) throw finalUpdateError

      driveRenamed++
      console.log(`  OK: ${finalName}`)
    } catch (error) {
      errors++
      const message = error instanceof Error ? error.message : String(error)

      await supabase
        .from('property_drive_folders')
        .update({
          sync_status: 'error',
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', row.id)

      console.log('')
      console.log(`ERRORE: ${expected}`)
      console.log(message)
    }
  }

  console.log('')
  console.log('=== RISULTATO ===')
  console.log({
    alreadyOk,
    dbUpdated,
    driveRenamed,
    errors,
  })
}

main().catch((error) => {
  console.error('')
  console.error('FORCE SYNC DRIVE DA PROPERTIES FALLITO:')
  console.error(error)
  process.exit(1)
})
