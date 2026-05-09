import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const fileId = String(body?.fileId ?? '').trim()

    if (!fileId) {
      return NextResponse.json({ error: 'fileId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: file, error: fetchError } = await supabase
      .from('ai_os_files')
      .select('*')
      .eq('id', fileId)
      .maybeSingle()

    if (fetchError) {
      console.error('AI-OS delete fetch error:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!file) {
      return NextResponse.json({ error: 'File non trovato' }, { status: 404 })
    }

    const storagePath = file.storage_path ? String(file.storage_path) : ''

    if (storagePath) {
      const { error: storageError } = await supabase.storage
        .from('ai-os')
        .remove([storagePath])

      if (storageError) {
        console.error('AI-OS storage delete error:', storageError)
      }
    }

    const { error: updateError } = await supabase
      .from('ai_os_files')
      .update({
        is_deleted: true,
        storage_path: null,
      })
      .eq('id', fileId)

    if (updateError) {
      console.error('AI-OS delete db error:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('AI-OS delete exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore eliminazione file AI-OS') },
      { status: 500 },
    )
  }
}
