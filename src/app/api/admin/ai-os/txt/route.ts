import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  jsonError,
  mapAIOSFileRecord,
  normalizeAIOSFolderType,
  safeFileName,
  textSizeBytes,
} from '@/lib/ai-os'

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const propertyId = String(body?.propertyId ?? '').trim()
    const fileId = String(body?.fileId ?? '').trim()
    const fileNameRaw = String(body?.fileName ?? '').trim()
    const content = String(body?.content ?? '')
    const folderType = normalizeAIOSFolderType(body?.folderType)
    const customFolderId = String(body?.customFolderId ?? '').trim() || null

    if (folderType === 'images') {
      return NextResponse.json(
        { error: 'Nella cartella Immagini non puoi creare file TXT' },
        { status: 400 },
      )
    }

    if (!propertyId && !fileId) {
      return NextResponse.json(
        { error: 'propertyId o fileId mancanti' },
        { status: 400 },
      )
    }

    const sizeBytes = textSizeBytes(content)
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
        console.error('AI-OS TXT custom folder error:', customFolderError)
        return NextResponse.json(
          { error: customFolderError.message || 'Errore lettura sottocartella AI-OS' },
          { status: 500 },
        )
      }

      if (!customFolder) {
        return NextResponse.json(
          { error: 'Sottocartella AI-OS non trovata' },
          { status: 404 },
        )
      }

      if (normalizeAIOSFolderType(customFolder.parent_folder_type) !== folderType) {
        return NextResponse.json(
          { error: 'La sottocartella non appartiene alla sezione AI-OS corrente' },
          { status: 400 },
        )
      }
    }

    if (fileId) {
      const { data: existing, error: existingError } = await supabase
        .from('ai_os_files')
        .select('*')
        .eq('id', fileId)
        .eq('is_deleted', false)
        .maybeSingle()

      if (existingError) {
        console.error('AI-OS TXT fetch error:', existingError)
        return NextResponse.json({ error: existingError.message }, { status: 500 })
      }

      if (!existing) {
        return NextResponse.json({ error: 'File TXT non trovato' }, { status: 404 })
      }

      const { data: updated, error: updateError } = await supabase
        .from('ai_os_files')
        .update({
          file_name: fileNameRaw ? safeFileName(fileNameRaw) : existing.file_name,
          file_kind: 'txt',
          folder_type: folderType,
          custom_folder_id: customFolderId,
          mime_type: 'text/plain',
          size_bytes: sizeBytes,
          txt_content: content,
          storage_bucket: 'ai-os',
          storage_path: null,
          is_deleted: false,
        })
        .eq('id', fileId)
        .select('*')
        .single()

      if (updateError) {
        console.error('AI-OS TXT update error:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        ok: true,
        file: mapAIOSFileRecord(updated as Record<string, unknown>),
      })
    }

    const finalName = safeFileName(fileNameRaw || `nuova-nota-${new Date().toISOString().slice(0, 10)}.txt`)

    const { data: inserted, error: insertError } = await supabase
      .from('ai_os_files')
      .insert({
        property_id: propertyId,
        file_name: finalName.endsWith('.txt') ? finalName : `${finalName}.txt`,
        file_kind: 'txt',
        folder_type: folderType,
        custom_folder_id: customFolderId,
        mime_type: 'text/plain',
        size_bytes: sizeBytes,
        storage_bucket: 'ai-os',
        storage_path: null,
        txt_content: content,
        is_deleted: false,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('AI-OS TXT insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      file: mapAIOSFileRecord(inserted as Record<string, unknown>),
    })
  } catch (error) {
    console.error('AI-OS TXT exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio TXT AI-OS') },
      { status: 500 },
    )
  }
}
