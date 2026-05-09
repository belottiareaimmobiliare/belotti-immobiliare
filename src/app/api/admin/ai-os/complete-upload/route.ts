import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  getAIOSFileKind,
  jsonError,
  mapAIOSFileRecord,
} from '@/lib/ai-os'

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

    if (!propertyId || !fileName || !storagePath || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json(
        { error: 'Dati completamento upload mancanti o non validi' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()
    const kind = getAIOSFileKind(fileName, mimeType)

    const { data: inserted, error: insertError } = await supabase
      .from('ai_os_files')
      .insert({
        property_id: propertyId,
        file_name: fileName,
        file_kind: kind,
        mime_type: mimeType || null,
        size_bytes: sizeBytes,
        storage_bucket: 'ai-os',
        storage_path: storagePath,
        txt_content: null,
        is_deleted: false,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('AI-OS complete insert error:', insertError)

      await supabase.storage.from('ai-os').remove([storagePath])

      return NextResponse.json(
        { error: insertError.message || 'Errore registrazione file AI-OS' },
        { status: 500 },
      )
    }

    const { data: signedData } = await supabase.storage
      .from('ai-os')
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
