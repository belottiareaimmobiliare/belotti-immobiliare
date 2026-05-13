import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  getAIOSFileKind,
  jsonError,
  mapAIOSFileRecord,
  normalizeAIOSFolderType,
  shouldCreatePropertyMedia,
} from '@/lib/ai-os'


const AI_OS_MAX_SUPABASE_FILE_BYTES = 45 * 1024 * 1024

const SIGNED_URL_SECONDS = 60 * 60

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId ?? '').trim()
    const fileName = String(body?.fileName ?? '').trim()
    const mimeType = String(body?.mimeType ?? '').trim()
    const sizeBytes = Number(body?.sizeBytes ?? 0)
    const storagePath = String(body?.storagePath ?? '').trim()
    const storageBucket = String(body?.storageBucket ?? 'ai-os').trim() || 'ai-os'
    let folderType = normalizeAIOSFolderType(body?.folderType)
    const customFolderId = String(body?.customFolderId ?? '').trim() || null

    if (!propertyId || !fileName || !storagePath || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json(
        { error: 'Dati completamento upload mancanti o non validi' },
        { status: 400 },
      )
    }

    if (sizeBytes > AI_OS_MAX_SUPABASE_FILE_BYTES) {
      return NextResponse.json(
        {
          error:
            'File sopra 45 MB: non caricarlo su Supabase. Usa la cartella Drive dell’immobile oppure riduci il video.',
        },
        { status: 413 },
      )
    }

    const supabase = createServiceClient()

    if (customFolderId) {
      const { data: customFolder, error: customFolderError } = await supabase
        .from('ai_os_custom_folders')
        .select('id, property_id, parent_folder_type')
        .eq('id', customFolderId)
        .eq('property_id', propertyId)
        .eq('is_deleted', false)
        .maybeSingle()

      if (customFolderError) {
        console.error('AI-OS complete custom folder error:', customFolderError)
        await supabase.storage.from(storageBucket).remove([storagePath])

        return NextResponse.json(
          { error: customFolderError.message || 'Errore lettura sottocartella AI-OS' },
          { status: 500 },
        )
      }

      if (!customFolder) {
        await supabase.storage.from(storageBucket).remove([storagePath])

        return NextResponse.json(
          { error: 'Sottocartella AI-OS non trovata' },
          { status: 404 },
        )
      }

      folderType = normalizeAIOSFolderType(customFolder.parent_folder_type)
    }

    const kind = getAIOSFileKind(fileName, mimeType)

    if (folderType === 'images' && kind !== 'image' && kind !== 'video') {
      await supabase.storage.from(storageBucket).remove([storagePath])

      return NextResponse.json(
        { error: 'Nella cartella Immagini puoi caricare solo immagini o video' },
        { status: 400 },
      )
    }

    const propertyMediaType = shouldCreatePropertyMedia({
      folderType,
      fileKind: kind,
      storageBucket,
    })

    let propertyMediaId: string | null = null
    let isGalleryVisible = false

    if (propertyMediaType) {
      const { data: publicUrlData } = supabase.storage
        .from(storageBucket)
        .getPublicUrl(storagePath)

      const { data: sortRows } = await supabase
        .from('property_media')
        .select('sort_order')
        .eq('property_id', propertyId)
        .eq('media_type', propertyMediaType)
        .order('sort_order', { ascending: false })
        .limit(1)

      const nextSortOrder =
        typeof sortRows?.[0]?.sort_order === 'number'
          ? sortRows[0].sort_order + 1
          : 0

      const { data: propertyMedia, error: propertyMediaError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          media_type: propertyMediaType,
          file_url: publicUrlData.publicUrl,
          label: null,
          sort_order: nextSortOrder,
          is_cover: false,
        })
        .select('id')
        .single()

      if (propertyMediaError) {
        console.error('AI-OS property_media insert error:', propertyMediaError)

        await supabase.storage.from(storageBucket).remove([storagePath])

        return NextResponse.json(
          { error: propertyMediaError.message || 'Errore collegamento galleria immobile' },
          { status: 500 },
        )
      }

      propertyMediaId = propertyMedia?.id ?? null
      isGalleryVisible = true

      await supabase
        .from('properties')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', propertyId)
    }

    const { data: inserted, error: insertError } = await supabase
      .from('ai_os_files')
      .upsert({
        property_id: propertyId,
        file_name: fileName,
        file_kind: kind,
        folder_type: folderType,
        custom_folder_id: customFolderId,
        mime_type: mimeType || null,
        size_bytes: sizeBytes,
        storage_bucket: storageBucket,
        storage_path: storagePath,
        txt_content: null,
        property_media_id: propertyMediaId,
        is_gallery_visible: isGalleryVisible,
        is_deleted: false,
      }, {
        onConflict: 'property_media_id',
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('AI-OS complete insert error:', insertError)

      if (propertyMediaId) {
        await supabase.from('property_media').delete().eq('id', propertyMediaId)
      }

      await supabase.storage.from(storageBucket).remove([storagePath])

      return NextResponse.json(
        { error: insertError.message || 'Errore registrazione file AI-OS' },
        { status: 500 },
      )
    }

    const { data: signedData } = await supabase.storage
      .from(storageBucket)
      .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

    return NextResponse.json({
      ok: true,
      file: mapAIOSFileRecord(
        inserted as Record<string, unknown>,
        signedData?.signedUrl ?? null,
      ),
    })
  } catch (error) {
    console.error('AI-OS complete upload exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore completamento upload AI-OS') },
      { status: 500 },
    )
  }
}
