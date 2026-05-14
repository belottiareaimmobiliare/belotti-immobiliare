import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

type DriveFolder = {
  id: string
  name: string
  url: string
}

type DriveFile = {
  id: string
  name: string
  url: string
  mimeType?: string
  size?: number
  updatedAt?: string
}

type SourceFolder = DriveFolder & {
  sourceType: 'image' | 'plan'
}

async function callDriveScript(input: {
  action: string
  folderId?: string
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
    folders: Array.isArray(payload.folders) ? payload.folders as DriveFolder[] : [],
    files: Array.isArray(payload.files) ? payload.files as DriveFile[] : [],
  }
}

function normalizeDriveName(value: unknown) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^\d+\s*[-_.]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isPhotoSourceFolderName(value: unknown) {
  const name = normalizeDriveName(value)

  if (!name) return false

  return (
    name === 'foto' ||
    name === 'immagini' ||
    name === 'images' ||
    name === 'foto e video' ||
    name === 'foto e video originali' ||
    name === 'foto video originali' ||
    name.includes('foto e video') ||
    name.includes('foto originali') ||
    name.includes('immagini')
  )
}

function isPlanSourceFolderName(value: unknown) {
  const name = normalizeDriveName(value)

  if (!name) return false

  return (
    name === 'planimetria' ||
    name === 'planimetrie' ||
    name.includes('planimetria') ||
    name.includes('planimetrie') ||
    name.includes('documenti e planimetrie')
  )
}

function isImageDriveFile(file: DriveFile) {
  const mimeType = String(file.mimeType || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()

  return (
    mimeType.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(name)
  )
}

function drivePublicImageUrl(fileId: string) {
  return `/api/public/drive-image?fileId=${encodeURIComponent(fileId)}`
}

async function collectImageFilesFromDriveFolder(folderId: string, depth = 2) {
  const content = await listDriveFolder(folderId)
  const files = content.files.filter(isImageDriveFile)

  if (depth <= 0) {
    return files
  }

  for (const childFolder of content.folders) {
    const childFiles = await collectImageFilesFromDriveFolder(childFolder.id, depth - 1)
    files.push(...childFiles)
  }

  const uniqueById = new Map<string, DriveFile>()

  for (const file of files) {
    if (file.id) {
      uniqueById.set(file.id, file)
    }
  }

  return Array.from(uniqueById.values())
}

function addUniqueSourceFolder(
  folders: SourceFolder[],
  folder: DriveFolder | null | undefined,
  sourceType: 'image' | 'plan',
) {
  if (!folder?.id) return

  const key = `${sourceType}:${folder.id}`

  if (folders.some((item) => `${item.sourceType}:${item.id}` === key)) {
    return
  }

  folders.push({
    ...folder,
    sourceType,
  })
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const propertyId = String(body?.propertyId ?? '').trim()
    const requestedSourceFolderId = String(body?.sourceFolderId ?? '').trim()
    const requestedSourceFolderName = String(body?.sourceFolderName ?? '').trim()

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: driveFolder, error: driveFolderError } = await supabase
      .from('property_drive_folders')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle()

    if (driveFolderError) {
      return NextResponse.json(
        { error: driveFolderError.message || 'Errore lettura cartella Drive immobile' },
        { status: 500 },
      )
    }

    const rootFolderId = String(driveFolder?.drive_folder_id || '').trim()

    if (!rootFolderId) {
      return NextResponse.json(
        { error: 'Cartella Drive immobile non collegata' },
        { status: 400 },
      )
    }

    const root = await listDriveFolder(rootFolderId)
    const sourceFolders: SourceFolder[] = []

    if (requestedSourceFolderId && requestedSourceFolderId !== rootFolderId) {
      if (isPhotoSourceFolderName(requestedSourceFolderName)) {
        addUniqueSourceFolder(
          sourceFolders,
          {
            id: requestedSourceFolderId,
            name: requestedSourceFolderName || 'Cartella immagini corrente',
            url: '',
          },
          'image',
        )
      }

      if (isPlanSourceFolderName(requestedSourceFolderName)) {
        addUniqueSourceFolder(
          sourceFolders,
          {
            id: requestedSourceFolderId,
            name: requestedSourceFolderName || 'Cartella planimetrie corrente',
            url: '',
          },
          'plan',
        )
      }
    }

    for (const folder of root.folders) {
      if (isPhotoSourceFolderName(folder.name)) {
        addUniqueSourceFolder(sourceFolders, folder, 'image')
      }

      if (isPlanSourceFolderName(folder.name)) {
        addUniqueSourceFolder(sourceFolders, folder, 'plan')
      }
    }

    if (sourceFolders.length === 0) {
      return NextResponse.json(
        {
          error:
            'Nessuna cartella media trovata. Crea o usa “01 Foto e video originali”, “immagini” o “documenti e planimetrie / Planimetria”.',
          availableFolders: root.folders.map((folder) => folder.name),
        },
        { status: 404 },
      )
    }

    const imageFilesById = new Map<string, DriveFile>()
    const planFilesById = new Map<string, DriveFile>()
    const usedSourceFolders: SourceFolder[] = []

    for (const sourceFolder of sourceFolders) {
      const files = await collectImageFilesFromDriveFolder(sourceFolder.id, 2)

      if (files.length > 0) {
        usedSourceFolders.push(sourceFolder)
      }

      for (const file of files) {
        if (!file.id) continue

        if (sourceFolder.sourceType === 'plan') {
          planFilesById.set(file.id, file)
        } else {
          imageFilesById.set(file.id, file)
        }
      }
    }

    const imageFiles = Array.from(imageFilesById.values())
    const planFiles = Array.from(planFilesById.values())

    const { data: existingMedia, error: existingMediaError } = await supabase
      .from('property_media')
      .select('id, file_url, sort_order, is_cover')
      .eq('property_id', propertyId)

    if (existingMediaError) {
      return NextResponse.json(
        { error: existingMediaError.message || 'Errore lettura galleria esistente' },
        { status: 500 },
      )
    }

    const existingUrls = new Set(
      (existingMedia ?? [])
        .map((media) => String(media.file_url || ''))
        .filter(Boolean),
    )

    const hasCover = (existingMedia ?? []).some((media) => media.is_cover === true)
    const maxSortOrder = (existingMedia ?? []).reduce((max, media) => {
      const sortOrder = Number(media.sort_order ?? 0)
      return Number.isFinite(sortOrder) && sortOrder > max ? sortOrder : max
    }, -1)

    let nextSortOrder = maxSortOrder + 1

    const imageRows = imageFiles
      .map((file) => ({
        file,
        fileUrl: drivePublicImageUrl(file.id),
      }))
      .filter((item) => !existingUrls.has(item.fileUrl))
      .map((item, index) => ({
        property_id: propertyId,
        media_type: 'image',
        file_url: item.fileUrl,
        label: item.file.name || null,
        sort_order: nextSortOrder + index,
        is_cover: !hasCover && index === 0,
      }))

    nextSortOrder += imageRows.length

    const planRows = planFiles
      .map((file) => ({
        file,
        fileUrl: drivePublicImageUrl(file.id),
      }))
      .filter((item) => !existingUrls.has(item.fileUrl))
      .map((item, index) => ({
        property_id: propertyId,
        media_type: 'plan',
        file_url: item.fileUrl,
        label: item.file.name || 'Planimetria',
        sort_order: nextSortOrder + index,
        is_cover: false,
      }))

    const rowsToInsert = [...imageRows, ...planRows]

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('property_media')
        .insert(rowsToInsert)

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message || 'Errore inserimento media in scheda immobile' },
          { status: 500 },
        )
      }

      await supabase
        .from('properties')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', propertyId)
    }

    const found = imageFiles.length + planFiles.length
    const imported = rowsToInsert.length

    return NextResponse.json({
      ok: true,
      propertyId,
      sourceFolders: usedSourceFolders,
      photoImagesFound: imageFiles.length,
      planImagesFound: planFiles.length,
      driveImagesFound: found,
      imported,
      importedImages: imageRows.length,
      importedPlans: planRows.length,
      skipped: found - imported,
      availableRootFolders: root.folders.map((folder) => folder.name),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore sincronizzazione media Drive verso scheda immobile') },
      { status: 500 },
    )
  }
}
