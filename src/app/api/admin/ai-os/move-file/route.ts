import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

type AIOSFileSection = 'root' | 'images' | 'docs'

const allowedSections: AIOSFileSection[] = ['root', 'images', 'docs']

async function tryUpdateFileSection(input: {
  fileId: string
  targetSection: AIOSFileSection
}) {
  const supabase = createServiceClient()

  const sectionColumns = ['section', 'folder_section', 'folder_key']

  let lastError: unknown = null

  for (const columnName of sectionColumns) {
    const patch: Record<string, unknown> = {
      [columnName]: input.targetSection,
      updated_at: new Date().toISOString(),
    }

    if (input.targetSection !== 'images') {
      patch.is_gallery_visible = false
    }

    const { data, error } = await supabase
      .from('ai_os_files')
      .update(patch)
      .eq('id', input.fileId)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle()

    if (!error) {
      return data
    }

    lastError = error
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Impossibile spostare il file: colonna sezione non trovata.')
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const fileId = String(body?.fileId ?? '').trim()
    const targetSection = String(body?.targetSection ?? '').trim() as AIOSFileSection

    if (!fileId) {
      return NextResponse.json({ error: 'fileId mancante' }, { status: 400 })
    }

    if (!allowedSections.includes(targetSection)) {
      return NextResponse.json({ error: 'Cartella destinazione non valida' }, { status: 400 })
    }

    const file = await tryUpdateFileSection({
      fileId,
      targetSection,
    })

    return NextResponse.json({
      ok: true,
      file,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore spostamento file AI-OS') },
      { status: 500 },
    )
  }
}
