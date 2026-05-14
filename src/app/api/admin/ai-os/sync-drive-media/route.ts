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

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const propertyId = String(body?.propertyId ?? '').trim()

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
    const fotoFolder = root.folders.find(
      (folder) => String(folder.name || '').trim().toLowerCase() === 'foto',
    )

    if (!fotoFolder?.id) {
      return NextResponse.json(
        { error: 'Cartella "Foto" non trovata nel Drive immobile' },
        { status: 404 },
      )
    }

    const fotoContent = await listDriveFolder(fotoFolder.id)
    const imageFiles = fotoContent.files.filter(isImageDriveFile)

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

    const rowsToInsert = imageFiles
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
        sort_order: maxSortOrder + 1 + index,
        is_cover: !hasCover && index === 0,
      }))

    if (rowsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('property_media')
        .insert(rowsToInsert)

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message || 'Errore inserimento immagini in galleria' },
          { status: 500 },
        )
      }

      await supabase
        .from('properties')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', propertyId)
    }

    return NextResponse.json({
      ok: true,
      propertyId,
      sourceFolder: fotoFolder,
      driveImagesFound: imageFiles.length,
      imported: rowsToInsert.length,
      skipped: imageFiles.length - rowsToInsert.length,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore sincronizzazione foto Drive verso galleria') },
      { status: 500 },
    )
  }
}
