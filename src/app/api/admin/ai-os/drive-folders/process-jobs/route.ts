import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

const BATCH_SIZE = 20

type DriveJob = {
  id: string
  property_id: string | null
  action: string | null
  status: string | null
  desired_folder_name: string | null
  drive_folder_id?: string | null
  last_error: string | null
}

type PropertyRow = {
  id: string
  title: string | null
  reference_code: string | null
  status: string | null
  source_tag: string | null
}

type PropertyDriveFolderRow = {
  id?: string
  property_id?: string | null
  folder_name?: string | null
  drive_folder_id?: string | null
  drive_folder_url?: string | null
  sync_status?: string | null
  last_error?: string | null
}

type DriveScriptInput = {
  action: string
  folderId: string
  folderName?: string
  fileName?: string
  mimeType?: string
  base64Data?: string
  sourceItemId?: string
  targetFolderId?: string
}

function cleanFolderName(value: string) {
  return value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140)
}

function buildFolderName(property: PropertyRow, desiredName?: string | null) {
  const desired = cleanFolderName(String(desiredName || ''))

  if (desired) return desired

  const code = cleanFolderName(String(property.reference_code || ''))
  const title = cleanFolderName(String(property.title || 'Immobile senza titolo'))

  return cleanFolderName(code ? `${code} - ${title}` : title)
}

function isVirtualDriveFolderId(value: unknown) {
  return String(value || '').trim().startsWith('aios-property-')
}

function isUsableDriveFolderId(value: unknown) {
  const folderId = String(value || '').trim()

  if (!folderId) return false
  if (isVirtualDriveFolderId(folderId)) return false

  return /^[a-zA-Z0-9_-]{12,}$/.test(folderId)
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Errore sconosciuto'
}

async function callDriveScript(input: DriveScriptInput) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('Connettore Drive non configurato')
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      action: input.action,
      folderId: input.folderId,
      folderName: input.folderName,
      fileName: input.fileName,
      mimeType: input.mimeType,
      base64Data: input.base64Data,
      sourceItemId: input.sourceItemId,
      targetFolderId: input.targetFolderId,
    }),
  })

  const text = await response.text()
  let payload: any = null

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`Risposta Drive non valida: ${text.slice(0, 180)}`)
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Errore Drive')
  }

  return payload
}

async function callDriveActionCandidates(
  actions: string[],
  input: Omit<DriveScriptInput, 'action'>,
) {
  const errors: string[] = []

  for (const action of actions) {
    try {
      return await callDriveScript({
        ...input,
        action,
      })
    } catch (error) {
      errors.push(`${action}: ${getErrorMessage(error)}`)
    }
  }

  throw new Error(errors.join(' | '))
}

function extractFolderId(payload: any) {
  return String(
    payload?.folder?.id ||
      payload?.item?.id ||
      payload?.file?.id ||
      payload?.id ||
      '',
  ).trim()
}

function extractFolderUrl(payload: any, folderId: string) {
  return String(
    payload?.folder?.url ||
      payload?.item?.url ||
      payload?.file?.url ||
      payload?.url ||
      `https://drive.google.com/drive/folders/${folderId}`,
  ).trim()
}

async function getPropertyRootFolderId(supabase: ReturnType<typeof createServiceClient>) {
  const envCandidates = [
    process.env.AIOS_DRIVE_IMMOBILI_FOLDER_ID,
    process.env.AIOS_DRIVE_PROPERTIES_FOLDER_ID,
    process.env.AIOS_DRIVE_PROPERTY_ROOT_FOLDER_ID,
    process.env.AIOS_DRIVE_ROOT_FOLDER_ID,
    process.env.GOOGLE_DRIVE_IMMOBILI_FOLDER_ID,
  ]

  for (const candidate of envCandidates) {
    if (isUsableDriveFolderId(candidate)) return String(candidate).trim()
  }

  const possibleTables = ['ai_os_drive_settings', 'ai_os_drive_config', 'drive_settings']
  const possibleColumns = [
    'immobili_folder_id',
    'properties_folder_id',
    'property_root_folder_id',
    'drive_folder_id',
    'root_folder_id',
    'folder_id',
  ]

  for (const tableName of possibleTables) {
    try {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .limit(1)
        .maybeSingle()

      if (error || !data) continue

      for (const column of possibleColumns) {
        const value = data[column]
        if (isUsableDriveFolderId(value)) return String(value).trim()
      }
    } catch {
      // tabella non presente o non usata in questa installazione
    }
  }

  throw new Error(
    'Cartella root Immobili Drive non configurata. Imposta AIOS_DRIVE_IMMOBILI_FOLDER_ID con l’ID reale della cartella Google Drive AI-OS/Immobili.',
  )
}

async function createDrivePropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  folderName: string,
) {
  const parentFolderId = await getPropertyRootFolderId(supabase)

  const payload = await callDriveActionCandidates(['createSubfolder'], {
    folderId: parentFolderId,
    folderName,
  })

  const folderId = extractFolderId(payload)

  if (!isUsableDriveFolderId(folderId)) {
    throw new Error('Apps Script ha creato la cartella ma non ha restituito un ID Drive valido')
  }

  return {
    folderId,
    folderUrl: extractFolderUrl(payload, folderId),
  }
}

async function renameDriveFolder(folderId: string, folderName: string) {
  await callDriveActionCandidates(['renameFolder', 'renameFile', 'updateFolderName'], {
    folderId,
    sourceItemId: folderId,
    folderName,
  })
}

async function trashDriveFolder(folderId: string) {
  await callDriveActionCandidates(['trashFolder', 'deleteFolder', 'trashFile', 'deleteFile'], {
    folderId,
    sourceItemId: folderId,
  })
}

async function markJob(
  supabase: ReturnType<typeof createServiceClient>,
  jobId: string,
  status: 'processing' | 'done' | 'failed',
  lastError: string | null = null,
) {
  const payload: Record<string, unknown> = {
    status,
    last_error: lastError,
    updated_at: new Date().toISOString(),
  }

  if (status === 'done' || status === 'failed') {
    payload.processed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('property_drive_folder_jobs')
    .update(payload)
    .eq('id', jobId)

  if (error) {
    console.error('Errore aggiornamento job Drive:', error)
  }
}

async function upsertPropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob,
) {
  if (!job.property_id) {
    throw new Error('Job senza property_id')
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id,title,reference_code,status,source_tag')
    .eq('id', job.property_id)
    .maybeSingle()

  if (propertyError) throw propertyError
  if (!property) throw new Error(`Immobile non trovato: ${job.property_id}`)

  const propertyRow = property as PropertyRow
  const folderName = buildFolderName(propertyRow, job.desired_folder_name)
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await supabase
    .from('property_drive_folders')
    .select('*')
    .eq('property_id', propertyRow.id)
    .maybeSingle()

  if (existingError) throw existingError

  const existingFolder = (existing || null) as PropertyDriveFolderRow | null
  const existingDriveFolderId = String(existingFolder?.drive_folder_id || '').trim()

  let driveFolderId = existingDriveFolderId
  let driveFolderUrl = String(existingFolder?.drive_folder_url || '').trim()
  let driveAction = 'kept'

  if (!isUsableDriveFolderId(existingDriveFolderId)) {
    const created = await createDrivePropertyFolder(supabase, folderName)

    driveFolderId = created.folderId
    driveFolderUrl = created.folderUrl
    driveAction = 'created'
  } else if (cleanFolderName(String(existingFolder?.folder_name || '')) !== folderName) {
    try {
      await renameDriveFolder(existingDriveFolderId, folderName)
      driveAction = 'renamed'
    } catch (error) {
      const message = getErrorMessage(error)

      await supabase
        .from('property_drive_folders')
        .update({
          sync_status: 'rename_failed',
          last_error: message,
          updated_at: now,
        })
        .eq('property_id', propertyRow.id)

      throw new Error(
        `Rinomina Drive fallita. Il connettore Apps Script deve supportare renameFolder/renameFile/updateFolderName. Dettaglio: ${message}`,
      )
    }
  }

  const payload = {
    property_id: propertyRow.id,
    folder_name: folderName,
    drive_folder_id: driveFolderId,
    drive_folder_url: driveFolderUrl || `https://drive.google.com/drive/folders/${driveFolderId}`,
    sync_status: 'synced',
    last_error: null,
    updated_at: now,
  }

  if (existingFolder?.id) {
    const { error } = await supabase
      .from('property_drive_folders')
      .update(payload)
      .eq('id', existingFolder.id)

    if (error) throw error
  } else {
    const { error } = await supabase
      .from('property_drive_folders')
      .insert([
        {
          ...payload,
          created_at: now,
        },
      ])

    if (error) throw error
  }

  return {
    action: driveAction,
    propertyId: propertyRow.id,
    folderName,
    driveFolderId,
  }
}

async function deletePropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob,
) {
  if (!job.property_id) {
    throw new Error('Job delete senza property_id')
  }

  const { data: existing } = await supabase
    .from('property_drive_folders')
    .select('*')
    .eq('property_id', job.property_id)
    .maybeSingle()

  const folderId =
    String(job.drive_folder_id || '').trim() ||
    String((existing as PropertyDriveFolderRow | null)?.drive_folder_id || '').trim()

  if (isUsableDriveFolderId(folderId)) {
    try {
      await trashDriveFolder(folderId)
    } catch (error) {
      const message = getErrorMessage(error)

      await supabase
        .from('property_drive_folders')
        .update({
          sync_status: 'delete_failed',
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('property_id', job.property_id)

      throw new Error(
        `Cancellazione Drive fallita. Il connettore Apps Script deve supportare trashFolder/deleteFolder/trashFile/deleteFile. Dettaglio: ${message}`,
      )
    }
  }

  await supabase
    .from('ai_os_files')
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq('property_id', job.property_id)

  const { error } = await supabase
    .from('property_drive_folders')
    .delete()
    .eq('property_id', job.property_id)

  if (error) throw error

  return {
    action: 'deleted',
    propertyId: job.property_id,
    driveFolderId: folderId || null,
  }
}

async function processJobs() {
  const supabase = createServiceClient()

  const { data: jobs, error } = await supabase
    .from('property_drive_folder_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE)

  if (error) throw error

  const results: unknown[] = []

  for (const job of (jobs || []) as DriveJob[]) {
    await markJob(supabase, job.id, 'processing', null)

    try {
      const action = String(job.action || '').trim()
      const result =
        action === 'delete'
          ? await deletePropertyFolder(supabase, job)
          : await upsertPropertyFolder(supabase, job)

      await markJob(supabase, job.id, 'done', null)

      results.push({
        jobId: job.id,
        status: 'done',
        result,
      })
    } catch (error) {
      const message = getErrorMessage(error)

      await markJob(supabase, job.id, 'failed', message)

      results.push({
        jobId: job.id,
        status: 'failed',
        error: message,
      })
    }
  }

  return {
    ok: true,
    processed: results.length,
    results,
  }
}

export async function GET() {
  try {
    await requireAdminProfile()

    const result = await processJobs()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore process jobs Drive folders:', error)

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : 'Errore interno process jobs Drive folders',
      },
      { status: 500 },
    )
  }
}

export async function POST() {
  return GET()
}
