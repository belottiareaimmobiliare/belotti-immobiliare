import { NextResponse } from 'next/server'
import { getCurrentAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

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

function isRealDriveId(value: unknown) {
  const id = String(value || '').trim()

  return Boolean(id && !id.startsWith('aios-property-') && /^[a-zA-Z0-9_-]{12,}$/.test(id))
}

function driveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

async function callDriveScript(input: {
  action: string
  folderId?: string
  folderName?: string
  fileName?: string
  mimeType?: string
  base64Data?: string
  sourceItemId?: string
  targetFolderId?: string
}) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('Connettore Drive non configurato: mancano AIOS_DRIVE_APP_SCRIPT_URL o AIOS_DRIVE_APP_SCRIPT_TOKEN.')
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
    throw new Error(`Risposta Drive non valida: ${text.slice(0, 220)}`)
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || `Errore Drive action ${input.action}`)
  }

  return payload
}

async function tryDriveActions(
  actions: string[],
  input: Omit<Parameters<typeof callDriveScript>[0], 'action'>,
) {
  const errors: string[] = []

  for (const action of actions) {
    try {
      return await callDriveScript({
        ...input,
        action,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${action}: ${message}`)
    }
  }

  throw new Error(errors.join(' | '))
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

  const rootFolderId = String(
    process.env.AIOS_DRIVE_IMMOBILI_FOLDER_ID ||
      process.env.AIOS_DRIVE_ROOT_FOLDER_ID ||
      '',
  ).trim()

  if (!isRealDriveId(rootFolderId)) {
    throw new Error(
      'Cartella root Immobili Drive non configurata. Imposta AIOS_DRIVE_IMMOBILI_FOLDER_ID con l’ID reale della cartella Google Drive AI-OS/Immobili.',
    )
  }

  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('id,title,reference_code,status,source_tag')
    .eq('id', job.property_id)
    .maybeSingle()

  if (propertyError) throw propertyError
  if (!property) throw new Error(`Immobile non trovato: ${job.property_id}`)

  const propertyRow = property as PropertyRow
  const folderName = buildFolderName(propertyRow, null)
  const now = new Date().toISOString()

  const { data: existing, error: existingError } = await supabase
    .from('property_drive_folders')
    .select('*')
    .eq('property_id', propertyRow.id)
    .maybeSingle()

  if (existingError) throw existingError

  let folderId = String(existing?.drive_folder_id || '').trim()

  if (!isRealDriveId(folderId)) {
    const payload = await tryDriveActions(['createSubfolder', 'createFolderIfMissing', 'ensureFolder'], {
      folderId: rootFolderId,
      folderName,
    })

    folderId = String(payload?.folder?.id || payload?.id || payload?.folderId || '').trim()

    if (!isRealDriveId(folderId)) {
      throw new Error('Apps Script ha creato/risposto senza restituire un ID cartella Drive reale.')
    }
  } else {
    const oldName = cleanFolderName(String(existing?.folder_name || ''))

    if (oldName && oldName !== folderName) {
      await tryDriveActions(['renameFolder', 'renameFile', 'updateFolderName'], {
        folderId,
        folderName,
      })
    }
  }

  const payload = {
    property_id: propertyRow.id,
    folder_name: folderName,
    drive_folder_id: folderId,
    drive_folder_url: driveFolderUrl(folderId),
    sync_status: 'synced',
    last_error: null,
    updated_at: now,
  }

  if (existing?.id) {
    const { error } = await supabase
      .from('property_drive_folders')
      .update(payload)
      .eq('id', existing.id)

    if (error) throw error

    return {
      action: 'updated',
      propertyId: propertyRow.id,
      folderName,
      folderId,
    }
  }

  const { error } = await supabase
    .from('property_drive_folders')
    .insert([
      {
        ...payload,
        created_at: now,
      },
    ])

  if (error) throw error

  return {
    action: 'created',
    propertyId: propertyRow.id,
    folderName,
    folderId,
  }
}

async function deletePropertyFolder(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob,
) {
  if (!job.property_id) {
    throw new Error('Job delete senza property_id')
  }

  const { data: existing, error: existingError } = await supabase
    .from('property_drive_folders')
    .select('*')
    .eq('property_id', job.property_id)
    .maybeSingle()

  if (existingError) throw existingError

  const folderId = String(existing?.drive_folder_id || job.drive_folder_id || '').trim()

  if (isRealDriveId(folderId)) {
    await tryDriveActions(['trashFolder', 'deleteFolder', 'trashFile', 'deleteFile'], {
      folderId,
    })
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
    folderId: isRealDriveId(folderId) ? folderId : null,
  }
}

async function markFolderFailed(
  supabase: ReturnType<typeof createServiceClient>,
  job: DriveJob,
  message: string,
) {
  if (!job.property_id) return

  await supabase
    .from('property_drive_folders')
    .update({
      sync_status: 'failed',
      last_error: message,
      updated_at: new Date().toISOString(),
    })
    .eq('property_id', job.property_id)
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
      const message = error instanceof Error ? error.message : 'Errore sconosciuto'

      await markJob(supabase, job.id, 'failed', message)
      await markFolderFailed(supabase, job, message)

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
    const profile = await getCurrentAdminProfile()

    if (!profile || !profile.is_active) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Sessione admin non valida. Accedi da /admin/login e riprova.',
        },
        { status: 401 },
      )
    }

    if (!canUseAIOS(profile)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Non autorizzato a usare AI-OS.',
        },
        { status: 403 },
      )
    }

    const result = await processJobs()

    return NextResponse.json(result)
  } catch (error) {
    console.error('Errore process jobs Drive folders:', error)

    return NextResponse.json(
      {
        ok: false,
        error: jsonError(error, 'Errore interno process jobs Drive folders'),
      },
      { status: 500 },
    )
  }
}


export async function POST() {
  return GET()
}
