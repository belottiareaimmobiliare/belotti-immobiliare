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

type PropertyMediaRow = {
  id: string
  property_id: string
  media_type: string
  file_url: string
  label?: string | null
  sort_order?: number | null
}

const MAX_DRIVE_IMPORT_BYTES = 18 * 1024 * 1024

async function callDriveScript(input: {
  action: string
  folderId?: string
  folderName?: string
  fileName?: string
  mimeType?: string
  base64Data?: string
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
      fileName: input.fileName,
      mimeType: input.mimeType,
      base64Data: input.base64Data,
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

function isImagesFolderName(value: unknown) {
  const name = normalizeDriveName(value)

  return (
    name === 'immagini' ||
    name === 'foto' ||
    name === 'images' ||
    name === 'foto e video originali' ||
    name.includes('immagini') ||
    name.includes('foto')
  )
}

function safeFileName(value: unknown) {
  const cleaned = String(value || 'immagine')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)

  return cleaned || 'immagine'
}

function inferExtensionFromMime(mimeType: string) {
  const mime = mimeType.toLowerCase()

  if (mime.includes('png')) return '.png'
  if (mime.includes('webp')) return '.webp'
  if (mime.includes('gif')) return '.gif'
  if (mime.includes('bmp')) return '.bmp'
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg'

  return '.jpg'
}

function fileNameFromMedia(media: PropertyMediaRow, mimeType?: string) {
  const label = safeFileName(media.label || '')
  const urlName = safeFileName(
    String(media.file_url || '')
      .split('?')[0]
      .split('/')
      .filter(Boolean)
      .pop() || '',
  )

  let baseName = label || urlName || `immagine-${media.id.slice(0, 8)}`
  baseName = baseName.replace(/\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i, '')

  const extension =
    /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.exec(urlName)?.[0] ||
    inferExtensionFromMime(mimeType || '')

  return safeFileName(`property-media-${media.id.slice(0, 8)}-${baseName}${extension}`)
}

function isDriveProxyUrl(value: unknown) {
  const url = String(value || '')
  return url.includes('/api/public/drive-image?fileId=')
}

function buildAbsoluteUrl(value: string) {
  if (value.startsWith('http://') || value.startsWith('https://')) return value

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    ''

  if (!siteUrl) return value

  const normalizedSiteUrl = siteUrl.startsWith('http')
    ? siteUrl
    : `https://${siteUrl}`

  return `${normalizedSiteUrl.replace(/\/+$/, '')}/${value.replace(/^\/+/, '')}`
}

async function fetchMediaAsBase64(media: PropertyMediaRow) {
  const url = buildAbsoluteUrl(String(media.file_url || '').trim())

  if (!url) {
    throw new Error('URL media vuoto')
  }

  const response = await fetch(url, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`Impossibile leggere media ${media.id}: HTTP ${response.status}`)
  }

  const mimeType = response.headers.get('content-type')?.split(';')[0] || 'image/jpeg'
  const arrayBuffer = await response.arrayBuffer()
  const bytes = Buffer.from(arrayBuffer)

  if (bytes.length <= 0) {
    throw new Error(`Media vuoto: ${media.id}`)
  }

  if (bytes.length > MAX_DRIVE_IMPORT_BYTES) {
    throw new Error(`Media troppo grande per import Drive automatico: ${media.id}`)
  }

  return {
    mimeType,
    sizeBytes: bytes.length,
    base64Data: bytes.toString('base64'),
  }
}

async function ensureImagesDriveFolder(rootFolderId: string) {
  const root = await listDriveFolder(rootFolderId)
  const existing = root.folders.find((folder) => isImagesFolderName(folder.name))

  if (existing) {
    return existing
  }

  const payload = await callDriveScript({
    action: 'createSubfolder',
    folderId: rootFolderId,
    folderName: 'immagini',
  })

  const folder = payload.folder as DriveFolder | null

  if (!folder?.id) {
    throw new Error('Creazione cartella immagini non confermata da Drive')
  }

  return folder
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

    const imagesFolder = await ensureImagesDriveFolder(rootFolderId)
    const imagesContent = await listDriveFolder(imagesFolder.id)
    const existingDriveNames = new Set(
      imagesContent.files.map((file) => String(file.name || '').trim()).filter(Boolean),
    )

    const { data: mediaRows, error: mediaError } = await supabase
      .from('property_media')
      .select('id, property_id, media_type, file_url, label, sort_order')
      .eq('property_id', propertyId)
      .eq('media_type', 'image')
      .order('sort_order', { ascending: true })

    if (mediaError) {
      return NextResponse.json(
        { error: mediaError.message || 'Errore lettura foto pubblicate immobile' },
        { status: 500 },
      )
    }

    const mediaToImport = ((mediaRows ?? []) as PropertyMediaRow[])
      .filter((media) => media.file_url)
      .filter((media) => !isDriveProxyUrl(media.file_url))

    let imported = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const media of mediaToImport) {
      try {
        const fileData = await fetchMediaAsBase64(media)
        const fileName = fileNameFromMedia(media, fileData.mimeType)

        if (existingDriveNames.has(fileName)) {
          skipped += 1
          continue
        }

        const payload = await callDriveScript({
          action: 'uploadFile',
          folderId: imagesFolder.id,
          fileName,
          mimeType: fileData.mimeType,
          base64Data: fileData.base64Data,
        })

        if (!payload?.file?.id) {
          throw new Error('Upload Drive non confermato')
        }

        existingDriveNames.add(fileName)
        imported += 1
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'Errore import media'
        errors.push(`${media.id}: ${message}`)
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      propertyId,
      imagesFolder,
      publishedImagesFound: mediaToImport.length,
      imported,
      skipped,
      failed,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore sincronizzazione foto pubblicate verso Drive') },
      { status: 500 },
    )
  }
}
