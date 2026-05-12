import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  jsonError,
  mapAIOSFileRecord,
  normalizeAIOSFolderType,
} from '@/lib/ai-os'

const SIGNED_URL_SECONDS = 60 * 60

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')?.trim()
    const folderType = normalizeAIOSFolderType(searchParams.get('folderType'))
    const customFolderId = searchParams.get('customFolderId')?.trim() || null

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    let query = supabase
      .from('ai_os_files')
      .select('*')
      .eq('property_id', propertyId)
      .eq('is_deleted', false)

    if (customFolderId) {
      query = query.eq('custom_folder_id', customFolderId)
    } else {
      query = query.eq('folder_type', folderType).is('custom_folder_id', null)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('AI-OS files error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const files = await Promise.all(
      (data ?? []).map(async (record) => {
        const storagePath = record.storage_path ? String(record.storage_path) : ''
        const storageBucket = record.storage_bucket ? String(record.storage_bucket) : 'ai-os'

        if (!storagePath) {
          return mapAIOSFileRecord(record as Record<string, unknown>)
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from(storageBucket)
          .createSignedUrl(storagePath, SIGNED_URL_SECONDS)

        if (signedError) {
          console.error('AI-OS signed url error:', signedError)
        }

        return mapAIOSFileRecord(
          record as Record<string, unknown>,
          signedData?.signedUrl ?? null,
        )
      }),
    )

    return NextResponse.json({ files, folderType })
  } catch (error) {
    console.error('AI-OS files exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento file AI-OS') },
      { status: 500 },
    )
  }
}
