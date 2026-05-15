import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

type DriveItem = {
  id?: string
  folderId?: string
  name?: string
  mimeType?: string
  type?: string
  webViewLink?: string
  url?: string
  folderUrl?: string
}

type DriveActionResult = {
  ok?: boolean
  error?: string
  id?: string
  folderId?: string
  url?: string
  folderUrl?: string
  webViewLink?: string
  files?: DriveItem[]
  items?: DriveItem[]
  data?: {
    id?: string
    folderId?: string
    url?: string
    folderUrl?: string
    webViewLink?: string
    files?: DriveItem[]
    items?: DriveItem[]
  }
}

function cleanName(value: string | null | undefined) {
  return String(value || '')
    .replace(/[\\/:*?"<>|#{}%~&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

function buildFolderName(property: {
  id: string
  title: string | null
  reference_code: string | null
}) {
  const reference = cleanName(property.reference_code).toUpperCase()
  const prefix = reference || property.id.replaceAll('-', '').slice(0, 6).toUpperCase()
  const title = cleanName(property.title) || 'Immobile'

  return `${prefix} - ${title}`
}

function getResultFolderId(result: DriveActionResult) {
  return (
    result.folderId ||
    result.id ||
    result.data?.folderId ||
    result.data?.id ||
    ''
  )
}

function getResultFolderUrl(result: DriveActionResult, folderId: string) {
  return (
    result.folderUrl ||
    result.url ||
    result.webViewLink ||
    result.data?.folderUrl ||
    result.data?.url ||
    result.data?.webViewLink ||
    (folderId ? `https://drive.google.com/drive/folders/${folderId}` : '')
  )
}

function getItems(result: DriveActionResult): DriveItem[] {
  if (Array.isArray(result.files)) return result.files
  if (Array.isArray(result.items)) return result.items
  if (Array.isArray(result.data?.files)) return result.data.files
  if (Array.isArray(result.data?.items)) return result.data.items
  return []
}

async function callDriveConnector(action: string, payload: Record<string, unknown>) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('AIOS_DRIVE_APP_SCRIPT_URL o AIOS_DRIVE_APP_SCRIPT_TOKEN mancanti')
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      action,
      ...payload,
    }),
    cache: 'no-store',
  })

  const text = await response.text()
  let json: DriveActionResult = {}

  try {
    json = text ? JSON.parse(text) : {}
  } catch {
    json = { error: text }
  }

  if (!response.ok || json.ok === false) {
    throw new Error(json.error || `Errore Drive action ${action}: HTTP ${response.status}`)
  }

  return json
}

async function tryDriveActions(
  actions: string[],
  payloads: Record<string, unknown>[],
) {
  const errors: string[] = []

  for (const action of actions) {
    for (const payload of payloads) {
      try {
        return await callDriveConnector(action, payload)
      } catch (error) {
        errors.push(
          `${action}: ${error instanceof Error ? error.message : String(error)}`
        )
      }
    }
  }

  throw new Error(errors.slice(0, 5).join(' | '))
}

async function listDriveFolder(folderId: string) {
  const result = await tryDriveActions(
    ['listFolder'],
    [
      { folderId },
      { driveFolderId: folderId },
      { parentFolderId: folderId },
    ],
  )

  return getItems(result)
}

function isFolder(item: DriveItem) {
  const mime = String(item.mimeType || item.type || '').toLowerCase()
  return mime.includes('folder') || mime.includes('directory') || Boolean(item.folderId)
}

async function resolvePropertiesFolderId(rootFolderId: string) {
  try {
    const items = await listDriveFolder(rootFolderId)
    const immobiliFolder = items.find((item) => {
      const name = cleanName(item.name)
      return name.toLowerCase() === 'immobili' && isFolder(item)
    })

    const folderId = immobiliFolder?.id || immobiliFolder?.folderId

    if (folderId) return folderId
  } catch {
    // Se il connector non supporta bene listFolder sul root, uso direttamente il root configurato.
  }

  return rootFolderId
}

async function findExistingFolder(parentFolderId: string, folderName: string) {
  const items = await listDriveFolder(parentFolderId)
  const found = items.find((item) => {
    const itemName = cleanName(item.name)
    return itemName === folderName && isFolder(item)
  })

  if (!found) return null

  const folderId = found.id || found.folderId || ''
  const folderUrl =
    found.webViewLink ||
    found.url ||
    found.folderUrl ||
    (folderId ? `https://drive.google.com/drive/folders/${folderId}` : '')

  if (!folderId) return null

  return { folderId, folderUrl }
}

async function createDriveFolder(parentFolderId: string, folderName: string) {
  try {
    const existing = await findExistingFolder(parentFolderId, folderName)
    if (existing) return existing
  } catch {
    // Proseguo con la creazione.
  }

  const result = await tryDriveActions(
    ['createFolder', 'createFolderIfMissing', 'ensureFolder'],
    [
      { parentFolderId, name: folderName },
      { folderId: parentFolderId, name: folderName },
      { parentId: parentFolderId, folderName },
      { parentFolderId, folderName },
    ],
  )

  const folderId = getResultFolderId(result)
  const folderUrl = getResultFolderUrl(result, folderId)

  if (!folderId) {
    try {
      const existing = await findExistingFolder(parentFolderId, folderName)
      if (existing) return existing
    } catch {
      // Ignoro, sotto lancio errore pulito.
    }

    throw new Error(`Cartella Drive creata ma ID non ricevuto: ${folderName}`)
  }

  return { folderId, folderUrl }
}

async function renameDriveFolder(folderId: string, folderName: string) {
  await tryDriveActions(
    ['renameFolder', 'renameFile', 'updateFolderName'],
    [
      { folderId, name: folderName },
      { fileId: folderId, name: folderName },
      { id: folderId, name: folderName },
      { folderId, folderName },
    ],
  )
}

async function trashDriveFolder(folderId: string) {
  await tryDriveActions(
    ['trashFolder', 'deleteFolder', 'trashFile', 'deleteFile'],
    [
      { folderId },
      { fileId: folderId },
      { id: folderId },
    ],
  )
}

async function getRootFolderId(supabase: ReturnType<typeof createServiceClient>) {
  const { data } = await supabase
    .from('ai_os_drive_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  const rootFolderId =
    data?.drive_root_folder_id ||
    process.env.AIOS_DRIVE_ROOT_FOLDER_ID ||
    process.env.AIOS_GOOGLE_DRIVE_ROOT_FOLDER_ID

  if (!rootFolderId) {
    throw new Error('Root folder Drive non configurata')
  }

  return String(rootFolderId)
}

async function enqueueMissingOrRenamedProperties(
  supabase: ReturnType<typeof createServiceClient>
) {
  const [{ data: properties, error: propertiesError }, { data: folders, error: foldersError }] =
    await Promise.all([
      supabase
        .from('properties')
        .select('id,title,reference_code,status')
        .neq('status', 'archived')
        .order('created_at', { ascending: false }),
      supabase
        .from('property_drive_folders')
        .select('property_id,drive_folder_name,drive_folder_id'),
    ])

  if (propertiesError) throw propertiesError
  if (foldersError) throw foldersError

  const folderByPropertyId = new Map(
    (folders || []).map((folder: any) => [String(folder.property_id), folder])
  )

  let queued = 0

  for (const property of properties || []) {
    const desiredName = buildFolderName(property)
    const existing = folderByPropertyId.get(String(property.id))
    const existingName = cleanName(existing?.drive_folder_name)

    if (existing?.drive_folder_id && existingName === desiredName) {
      continue
    }

    const { error: updateError } = await supabase
      .from('property_drive_folder_jobs')
      .update({
        desired_folder_name: desiredName,
        status: 'pending',
        attempts: 0,
        last_error: null,
        updated_at: new Date().toISOString(),
        processed_at: null,
      })
      .eq('property_id', property.id)
      .eq('action', 'upsert')
      .in('status', ['pending', 'failed'])

    if (updateError) throw updateError

    const { data: existingJob, error: jobCheckError } = await supabase
      .from('property_drive_folder_jobs')
      .select('id')
      .eq('property_id', property.id)
      .eq('action', 'upsert')
      .in('status', ['pending', 'failed'])
      .limit(1)

    if (jobCheckError) throw jobCheckError

    if (!existingJob || existingJob.length === 0) {
      const { error: insertError } = await supabase
        .from('property_drive_folder_jobs')
        .insert({
          property_id: property.id,
          action: 'upsert',
          desired_folder_name: desiredName,
          status: 'pending',
        })

      if (insertError) throw insertError
    }

    queued += 1
  }

  return queued
}

async function processJobs() {
  const profile = await requireAdminProfile()

  if (
    profile.role !== 'owner' &&
    profile.role !== 'administrator' &&
    !profile.can_manage_properties
  ) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
  }

  const supabase = createServiceClient()

  const queuedNow = await enqueueMissingOrRenamedProperties(supabase)
  const rootFolderId = await getRootFolderId(supabase)
  const propertiesFolderId = await resolvePropertiesFolderId(rootFolderId)

  const { data: jobs, error: jobsError } = await supabase
    .from('property_drive_folder_jobs')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(30)

  if (jobsError) throw jobsError

  let created = 0
  let renamed = 0
  let deleted = 0
  let failed = 0

  for (const job of jobs || []) {
    const now = new Date().toISOString()

    await supabase
      .from('property_drive_folder_jobs')
      .update({
        status: 'processing',
        attempts: Number(job.attempts || 0) + 1,
        updated_at: now,
      })
      .eq('id', job.id)

    try {
      if (job.action === 'delete') {
        const folderId = String(job.drive_folder_id || '').trim()

        if (folderId) {
          await trashDriveFolder(folderId)
        }

        if (job.property_id) {
          await supabase
            .from('property_drive_folders')
            .delete()
            .eq('property_id', job.property_id)
        }

        await supabase
          .from('property_drive_folder_jobs')
          .update({
            status: 'done',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', job.id)

        deleted += 1
        continue
      }

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .select('id,title,reference_code,status')
        .eq('id', job.property_id)
        .maybeSingle()

      if (propertyError) throw propertyError

      if (!property) {
        await supabase
          .from('property_drive_folder_jobs')
          .update({
            status: 'done',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_error: null,
          })
          .eq('id', job.id)

        continue
      }

      const desiredName = cleanName(job.desired_folder_name) || buildFolderName(property)

      const { data: existingFolder } = await supabase
        .from('property_drive_folders')
        .select('*')
        .eq('property_id', property.id)
        .maybeSingle()

      let folderId = String(existingFolder?.drive_folder_id || '').trim()
      let folderUrl = String(existingFolder?.drive_folder_url || '').trim()

      if (!folderId) {
        const createdFolder = await createDriveFolder(propertiesFolderId, desiredName)
        folderId = createdFolder.folderId
        folderUrl = createdFolder.folderUrl
        created += 1
      } else if (cleanName(existingFolder?.drive_folder_name) !== desiredName) {
        await renameDriveFolder(folderId, desiredName)
        renamed += 1
      }

      await supabase
        .from('property_drive_folders')
        .upsert(
          {
            property_id: property.id,
            drive_folder_id: folderId,
            drive_folder_url: folderUrl || `https://drive.google.com/drive/folders/${folderId}`,
            drive_folder_name: desiredName,
            sync_status: 'synced',
            last_synced_at: new Date().toISOString(),
            last_error: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'property_id' }
        )

      await supabase
        .from('property_drive_folder_jobs')
        .update({
          status: 'done',
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', job.id)
    } catch (error) {
      failed += 1

      const message = error instanceof Error ? error.message : String(error)

      await supabase
        .from('property_drive_folder_jobs')
        .update({
          status: 'failed',
          last_error: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.id)

      if (job.property_id) {
        await supabase
          .from('property_drive_folders')
          .update({
            sync_status: 'failed',
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('property_id', job.property_id)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    queuedNow,
    processed: jobs?.length || 0,
    created,
    renamed,
    deleted,
    failed,
  })
}

export async function POST() {
  try {
    return await processJobs()
  } catch (error) {
    console.error('AI-OS Drive folder jobs error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Errore sincronizzazione cartelle Drive',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
