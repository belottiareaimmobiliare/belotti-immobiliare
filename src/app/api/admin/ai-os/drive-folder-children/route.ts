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

function canManageDriveSharing(role: string) {
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

  return {
    folder: payload.folder ?? null,
    folders: Array.isArray(payload.folders) ? (payload.folders as DriveFolder[]) : [],
  }
}

async function ensureSubfolder(parentFolderId: string, folderName: string) {
  const listed = await listDriveFolder(parentFolderId)
  const normalizedTarget = normalizeDriveFolderName(folderName)

  const existing = listed.folders.find(
    (folder) => normalizeDriveFolderName(folder.name) === normalizedTarget,
  )

  if (existing?.id) {
    return {
      id: existing.id,
      name: existing.name || folderName,
      url: existing.url || buildDriveFolderUrl(existing.id),
    }
  }

  const created = await callDriveScript({
    action: 'createSubfolder',
    folderId: parentFolderId,
    folderName,
  })

  if (!created?.folder?.id) {
    throw new Error(`Sottocartella non creata: ${folderName}`)
  }

  return {
    id: created.folder.id,
    name: created.folder.name || folderName,
    url: created.folder.url || buildDriveFolderUrl(created.folder.id),
  }
}

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canManageDriveSharing(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = cleanString(searchParams.get('propertyId'))

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: driveFolder, error: driveFolderError } = await supabase
      .from('property_drive_folders')
      .select('property_id, folder_name, drive_folder_id, drive_folder_url, sync_status')
      .eq('property_id', propertyId)
      .maybeSingle()

    if (driveFolderError) {
      return NextResponse.json(
        { error: driveFolderError.message || 'Errore lettura cartella Drive immobile' },
        { status: 500 },
      )
    }

    const parentFolderId = cleanString(driveFolder?.drive_folder_id)

    if (!parentFolderId || parentFolderId.startsWith('aios-property-')) {
      return NextResponse.json(
        { error: 'Cartella Drive reale immobile non ancora pronta.' },
        { status: 409 },
      )
    }

    const ensuredFolders = []

    for (const standardFolder of AI_OS_DRIVE_STANDARD_FOLDERS) {
      const ensured = await ensureSubfolder(parentFolderId, standardFolder.name)

      const row = {
        property_id: propertyId,
        folder_key: standardFolder.key,
        folder_name: standardFolder.name,
        drive_folder_id: ensured.id,
        drive_folder_url: ensured.url,
        updated_at: new Date().toISOString(),
      }

      const { error: upsertError } = await supabase
        .from('property_drive_subfolders')
        .upsert(row, { onConflict: 'property_id,folder_key' })

      if (upsertError) {
        throw new Error(upsertError.message || 'Errore salvataggio sottocartelle Drive')
      }

      ensuredFolders.push({
        ...standardFolder,
        driveFolderId: ensured.id,
        driveFolderUrl: ensured.url,
      })
    }

    return NextResponse.json({
      ok: true,
      propertyId,
      parentFolder: {
        id: parentFolderId,
        name: driveFolder?.folder_name || 'Cartella immobile',
        url: driveFolder?.drive_folder_url || buildDriveFolderUrl(parentFolderId),
      },
      folders: ensuredFolders,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore preparazione sottocartelle Drive') },
      { status: 500 },
    )
  }
}
