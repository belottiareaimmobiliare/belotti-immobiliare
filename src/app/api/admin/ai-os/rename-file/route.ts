import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError, mapAIOSFileRecord } from '@/lib/ai-os'

function cleanFileName(value: unknown) {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180)

  return cleaned.length > 0 ? cleaned : null
}

async function tryRenameFile(input: {
  fileId: string
  fileName: string
}) {
  const supabase = createServiceClient()

  const nameColumns = ['name', 'file_name', 'filename', 'display_name']

  let lastError: unknown = null

  for (const columnName of nameColumns) {
    const { data, error } = await supabase
      .from('ai_os_files')
      .update({
        [columnName]: input.fileName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.fileId)
      .eq('is_deleted', false)
      .select('*')
      .maybeSingle()

    if (!error && data) {
      return data
    }

    lastError = error
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Impossibile rinominare il file: colonna nome non trovata.')
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const fileId = String(body?.fileId ?? '').trim()
    const fileName = cleanFileName(body?.fileName)

    if (!fileId) {
      return NextResponse.json({ error: 'fileId mancante' }, { status: 400 })
    }

    if (!fileName) {
      return NextResponse.json({ error: 'Nome file mancante' }, { status: 400 })
    }

    const record = await tryRenameFile({ fileId, fileName })
    const file = mapAIOSFileRecord(record as Record<string, unknown>)

    return NextResponse.json({
      ok: true,
      file,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore rinomina file AI-OS') },
      { status: 500 },
    )
  }
}
