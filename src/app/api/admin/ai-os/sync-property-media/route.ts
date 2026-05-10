import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  jsonError,
  mapAIOSFileRecord,
} from '@/lib/ai-os'

const SIGNED_URL_SECONDS = 60 * 60

function inferMimeType(fileName: string, mediaType: string) {
  const name = fileName.toLowerCase()

  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  if (name.endsWith('.webp')) return 'image/webp'
  if (name.endsWith('.gif')) return 'image/gif'
  if (name.endsWith('.mp4')) return 'video/mp4'
  if (name.endsWith('.mov')) return 'video/quicktime'
  if (name.endsWith('.pdf')) return 'application/pdf'

  if (mediaType === 'image') return 'image/jpeg'
  if (mediaType === 'video') return 'video/mp4'
  if (mediaType === 'plan') return 'application/pdf'

  return null
}

function inferFileKind(mediaType: string, fileName: string) {
  const name = fileName.toLowerCase()

  if (mediaType === 'image') return 'image'
  if (mediaType === 'video') return 'video'
  if (mediaType === 'plan') {
    if (name.endsWith('.pdf')) return 'pdf'
    if (name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png') || name.endsWith('.webp')) {
      return 'image'
    }

    return 'plan'
  }

  return 'generic'
}

function inferFolderType(mediaType: string) {
  if (mediaType === 'plan') return 'docs'
  return 'images'
}

function safeNameFromUrl(fileUrl: string, fallback: string) {
  try {
    const url = new URL(fileUrl)
    const rawName = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
    return rawName || fallback
  } catch {
    return fallback
  }
}

function parseSupabasePublicStorageUrl(fileUrl: string) {
  try {
    const url = new URL(fileUrl)
    const marker = '/storage/v1/object/public/'
    const markerIndex = url.pathname.indexOf(marker)

    if (markerIndex === -1) {
      return null
    }

    const rest = url.pathname.slice(markerIndex + marker.length)
    const [bucket, ...pathParts] = rest.split('/')

    if (!bucket || pathParts.length === 0) {
      return null
    }

    return {
      bucket: decodeURIComponent(bucket),
      storagePath: pathParts.map((part) => decodeURIComponent(part)).join('/'),
    }
  } catch {
    return null
  }
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

    const { data: mediaRows, error: mediaError } = await supabase
      .from('property_media')
      .select('*')
      .eq('property_id', propertyId)
      .order('sort_order', { ascending: true })

    if (mediaError) {
      console.error('AI-OS sync property_media read error:', mediaError)
      return NextResponse.json(
        { error: mediaError.message || 'Errore lettura media immobile' },
        { status: 500 },
      )
    }

    const media = Array.isArray(mediaRows) ? mediaRows : []

    if (media.length === 0) {
      return NextResponse.json({ ok: true, created: 0, files: [] })
    }

    const mediaIds = media.map((item) => String(item.id)).filter(Boolean)

    const { data: existingRows, error: existingError } = await supabase
      .from('ai_os_files')
      .select('id, property_media_id')
      .eq('property_id', propertyId)
      .eq('is_deleted', false)
      .in('property_media_id', mediaIds)

    if (existingError) {
      console.error('AI-OS sync ai_os_files read error:', existingError)
      return NextResponse.json(
        { error: existingError.message || 'Errore controllo file AI-OS esistenti' },
        { status: 500 },
      )
    }

    const existingMediaIds = new Set(
      (existingRows ?? [])
        .map((item) => (item.property_media_id ? String(item.property_media_id) : ''))
        .filter(Boolean),
    )

    const rowsToInsert = media
      .filter((item) => !existingMediaIds.has(String(item.id)))
      .map((item) => {
        const mediaType = String(item.media_type || 'image')
        const fileUrl = String(item.file_url || '')
        const fallbackName = `${mediaType}-${String(item.id).slice(0, 8)}`
        const fileName = String(item.label || '').trim() || safeNameFromUrl(fileUrl, fallbackName)
        const parsedStorage = parseSupabasePublicStorageUrl(fileUrl)
        const folderType = inferFolderType(mediaType)
        const fileKind = inferFileKind(mediaType, fileName)
        const mimeType = inferMimeType(fileName, mediaType)

        return {
          property_id: propertyId,
          file_name: fileName,
          file_kind: fileKind,
          folder_type: folderType,
          mime_type: mimeType,
          size_bytes: 0,
          storage_bucket:
            parsedStorage?.bucket ||
            (folderType === 'docs' ? 'property-plans' : 'property-media'),
          storage_path: parsedStorage?.storagePath ?? null,
          external_url: fileUrl || null,
          txt_content: null,
          property_media_id: item.id,
          is_gallery_visible: true,
          is_deleted: false,
        }
      })

    if (rowsToInsert.length === 0) {
      return NextResponse.json({ ok: true, created: 0, files: [] })
    }

    const { data: insertedRows, error: insertError } = await supabase
      .from('ai_os_files')
      .insert(rowsToInsert)
      .select('*')

    if (insertError) {
      console.error('AI-OS sync insert error:', insertError)
      return NextResponse.json(
        { error: insertError.message || 'Errore sincronizzazione media immobile' },
        { status: 500 },
      )
    }

    const files = await Promise.all(
      (insertedRows ?? []).map(async (record) => {
        const storagePath = record.storage_path ? String(record.storage_path) : ''
        const storageBucket = record.storage_bucket ? String(record.storage_bucket) : 'ai-os'

        if (!storagePath) {
          return mapAIOSFileRecord(record as Record<string, unknown>)
        }

        const { data: signedData } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

        return mapAIOSFileRecord(
          record as Record<string, unknown>,
          signedData?.signedUrl ?? null,
        )
      }),
    )

    return NextResponse.json({
      ok: true,
      created: files.length,
      files,
    })
  } catch (error) {
    console.error('AI-OS sync property media exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore sincronizzazione media immobile') },
      { status: 500 },
    )
  }
}
