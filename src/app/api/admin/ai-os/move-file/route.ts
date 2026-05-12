import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

type AIOSFileSection = 'root' | 'images' | 'docs'

const allowedSections: AIOSFileSection[] = ['root', 'images', 'docs']

async function tryUpdateFileSection(input: {
  fileId: string
  targetSection: AIOSFileSection
  targetCustomFolderId?: string | null
}) {
  const supabase = createServiceClient()

  let nextFolderType = input.targetSection
  let nextCustomFolderId = input.targetCustomFolderId ?? null

  if (nextCustomFolderId) {
    const { data: customFolder, error: customFolderError } = await supabase
      .from('ai_os_custom_folders')
      .select('id, parent_folder_type')
      .eq('id', nextCustomFolderId)
      .eq('is_deleted', false)
      .maybeSingle()

    if (customFolderError) {
      throw new Error(customFolderError.message || 'Errore lettura cartella destinazione')
    }

    if (!customFolder) {
      throw new Error('Cartella destinazione non trovata')
    }

    nextFolderType = String(customFolder.parent_folder_type || 'root') as AIOSFileSection
  }

  const patch: Record<string, unknown> = {
    folder_type: nextFolderType,
    custom_folder_id: nextCustomFolderId,
    updated_at: new Date().toISOString(),
  }

  if (nextFolderType !== 'images') {
    patch.is_gallery_visible = false
  }

  const { data, error } = await supabase
    .from('ai_os_files')
    .update(patch)
    .eq('id', input.fileId)
    .eq('is_deleted', false)
    .select('*')
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Errore spostamento file')
  }

  return data
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
    const targetCustomFolderId = String(body?.targetCustomFolderId ?? '').trim() || null

    if (!fileId) {
      return NextResponse.json({ error: 'fileId mancante' }, { status: 400 })
    }

    if (!allowedSections.includes(targetSection)) {
      return NextResponse.json({ error: 'Cartella destinazione non valida' }, { status: 400 })
    }

    const file = await tryUpdateFileSection({
      fileId,
      targetSection,
      targetCustomFolderId,
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
