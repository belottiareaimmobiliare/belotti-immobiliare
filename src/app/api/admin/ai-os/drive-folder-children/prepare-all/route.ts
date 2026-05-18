import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'
import {
  AI_OS_DRIVE_STANDARD_FOLDERS,
  normalizeDriveFolderName,
} from '@/lib/ai-os/drive-standard-folders'

export const dynamic = 'force-dynamic'

type DriveFolder = {
  id: string
  name: string
  url?: string
}

function canPrepareDriveFolders(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function buildDriveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

async function callDriveScript(input: {
  action: string
  folderId: string
  folderName?: string
}) {
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

async function listDriveFolder(folderId: string) {
  const payload = await callDriveScript({
    action: 'listFolder',
    folderId,
  })

  return Array.isArray(payload.folders) ? (payload.folders as DriveFolder[]) : []
}

async function createSubfolder(parentFolderId: string, folderName: string) {
  const payload = await callDriveScript({
    action: 'createSubfolder',
    folderId: parentFolderId,
    folderName,
  })

  if (!payload?.folder?.id) {
    throw new Error(`Sottocartella non creata: ${folderName}`)
  }

  return {
    id: payload.folder.id,
    name: payload.folder.name || folderName,
    url: payload.folder.url || buildDriveFolderUrl(payload.folder.id),
    created: payload.created !== false,
  }
}

export async function POST() {
  try {
    const profile = await requireAdminProfile()

    if (!canPrepareDriveFolders(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data: driveFolders, error: driveFoldersError } = await supabase
      .from('property_drive_folders')
      .select('property_id, folder_name, drive_folder_id, drive_folder_url, sync_status')
      .not('drive_folder_id', 'is', null)
      .limit(1000)

    if (driveFoldersError) {
      return NextResponse.json(
        { error: driveFoldersError.message || 'Errore lettura cartelle Drive immobili' },
        { status: 500 },
      )
    }

    let processedProperties = 0
    let skippedProperties = 0
    let createdFolders = 0
    let existingFolders = 0
    let savedRows = 0
    const errors: string[] = []

    for (const driveFolder of driveFolders ?? []) {
      const propertyId = cleanString(driveFolder.property_id)
      const parentFolderId = cleanString(driveFolder.drive_folder_id)

      if (!propertyId || !parentFolderId || parentFolderId.startsWith('aios-property-')) {
        skippedProperties += 1
        continue
      }

      try {
        processedProperties += 1

        const existingChildFolders = await listDriveFolder(parentFolderId)
        const rows = []

        for (const standardFolder of AI_OS_DRIVE_STANDARD_FOLDERS) {
          const normalizedTarget = normalizeDriveFolderName(standardFolder.name)

          const existing = existingChildFolders.find(
            (folder) => normalizeDriveFolderName(folder.name) === normalizedTarget,
          )

          const ensured = existing?.id
            ? {
                id: existing.id,
                name: existing.name || standardFolder.name,
                url: existing.url || buildDriveFolderUrl(existing.id),
                created: false,
              }
            : await createSubfolder(parentFolderId, standardFolder.name)

          if (ensured.created) {
            createdFolders += 1
          } else {
            existingFolders += 1
          }

          rows.push({
            property_id: propertyId,
            folder_key: standardFolder.key,
            folder_name: standardFolder.name,
            drive_folder_id: ensured.id,
            drive_folder_url: ensured.url,
            updated_at: new Date().toISOString(),
          })
        }

        const { error: upsertError } = await supabase
          .from('property_drive_subfolders')
          .upsert(rows, { onConflict: 'property_id,folder_key' })

        if (upsertError) {
          throw new Error(upsertError.message || 'Errore salvataggio sottocartelle Drive')
        }

        savedRows += rows.length
      } catch (error) {
        errors.push(
          `${driveFolder.folder_name || propertyId}: ${
            error instanceof Error ? error.message : 'Errore preparazione cartelle'
          }`,
        )
      }
    }

    return NextResponse.json({
      ok: true,
      processedProperties,
      skippedProperties,
      createdFolders,
      existingFolders,
      savedRows,
      errors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore preparazione massiva sottocartelle Drive') },
      { status: 500 },
    )
  }
}
