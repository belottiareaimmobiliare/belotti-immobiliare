import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import {
  canUseAIOS,
  getAIOSFileKind,
  jsonError,
  mapAIOSFileRecord,
  safeFileName,
} from '@/lib/ai-os'

const SIGNED_URL_SECONDS = 60 * 60

export async function POST(request: Request) {
  let uploadedPath: string | null = null

  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const formData = await request.formData()
    const propertyId = String(formData.get('property_id') ?? '').trim()
    const file = formData.get('file')

    if (!propertyId || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'property_id o file mancanti' },
        { status: 400 },
      )
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: 'File vuoto non valido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error: quotaError } = await supabase.rpc('assert_ai_os_quota', {
      p_property_id: propertyId,
      p_incoming_size_bytes: file.size,
      p_incoming_file_count: 1,
      p_exclude_file_id: null,
    })

    if (quotaError) {
      console.error('AI-OS quota upload blocked:', quotaError)

      return NextResponse.json(
        { error: quotaError.message || 'Quota AI-OS superata' },
        { status: 413 },
      )
    }

    const kind = getAIOSFileKind(file.name, file.type)
    const cleanName = safeFileName(file.name)
    const filePath = `properties/${propertyId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${cleanName}`

    uploadedPath = filePath

    const { error: uploadError } = await supabase.storage
      .from('ai-os')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || undefined,
      })

    if (uploadError) {
      console.error('AI-OS storage upload error:', uploadError)

      return NextResponse.json(
        { error: uploadError.message || 'Errore upload file AI-OS' },
        { status: 500 },
      )
    }

    const { data: inserted, error: insertError } = await supabase
      .from('ai_os_files')
      .insert({
        property_id: propertyId,
        file_name: file.name,
        file_kind: kind,
        mime_type: file.type || null,
        size_bytes: file.size,
        storage_bucket: 'ai-os',
        storage_path: filePath,
        txt_content: null,
      })
      .select('*')
      .single()

    if (insertError) {
      console.error('AI-OS db insert error:', insertError)

      await supabase.storage.from('ai-os').remove([filePath])

      return NextResponse.json(
        { error: insertError.message || 'Errore registrazione file AI-OS' },
        { status: 500 },
      )
    }

    const { data: signedData } = await supabase.storage
      .from('ai-os')
      .createSignedUrl(filePath, SIGNED_URL_SECONDS)

    return NextResponse.json({
      ok: true,
      file: mapAIOSFileRecord(
        inserted as Record<string, unknown>,
        signedData?.signedUrl ?? null,
      ),
    })
  } catch (error) {
    console.error('AI-OS upload exception:', error)

    if (uploadedPath) {
      try {
        const supabase = createServiceClient()
        await supabase.storage.from('ai-os').remove([uploadedPath])
      } catch {
        // best effort cleanup
      }
    }

    return NextResponse.json(
      { error: jsonError(error, 'Errore interno upload AI-OS') },
      { status: 500 },
    )
  }
}
