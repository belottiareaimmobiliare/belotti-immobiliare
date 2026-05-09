import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, getAIOSFileKind, jsonError, safeFileName } from '@/lib/ai-os'

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

    if (!propertyId || !fileName || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
      return NextResponse.json(
        { error: 'Dati upload mancanti o non validi' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { error: quotaError } = await supabase.rpc('assert_ai_os_quota', {
      p_property_id: propertyId,
      p_incoming_size_bytes: sizeBytes,
      p_incoming_file_count: 1,
      p_exclude_file_id: null,
    })

    if (quotaError) {
      console.error('AI-OS quota prepare blocked:', quotaError)

      return NextResponse.json(
        { error: quotaError.message || 'Quota AI-OS superata' },
        { status: 413 },
      )
    }

    const cleanName = safeFileName(fileName)
    const kind = getAIOSFileKind(fileName, mimeType)
    const storagePath = `properties/${propertyId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${cleanName}`

    const { data, error } = await supabase.storage
      .from('ai-os')
      .createSignedUploadUrl(storagePath)

    if (error || !data) {
      console.error('AI-OS signed upload url error:', error)

      return NextResponse.json(
        { error: error?.message || 'Errore creazione signed upload URL' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      upload: {
        bucket: 'ai-os',
        path: storagePath,
        token: data.token,
        signedUrl: data.signedUrl,
        kind,
      },
    })
  } catch (error) {
    console.error('AI-OS prepare upload exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore preparazione upload AI-OS') },
      { status: 500 },
    )
  }
}
