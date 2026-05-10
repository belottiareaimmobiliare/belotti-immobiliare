import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : null
}

function cleanNumber(value: unknown, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : fallback
}

function extractDriveFolderId(value: string) {
  const raw = value.trim()

  if (!raw) return null

  try {
    const url = new URL(raw)

    const foldersMatch = url.pathname.match(/\/folders\/([^/?#]+)/)
    if (foldersMatch?.[1]) return decodeURIComponent(foldersMatch[1])

    const idParam = url.searchParams.get('id')
    if (idParam) return idParam
  } catch {
    // se non è URL, può essere direttamente l'id cartella
  }

  if (/^[a-zA-Z0-9_-]{12,}$/.test(raw)) {
    return raw
  }

  return null
}

function normalizeDriveFolderUrl(value: string | null) {
  if (!value) return null

  const cleaned = value.trim()
  const folderId = extractDriveFolderId(cleaned)

  if (folderId && !cleaned.startsWith('http')) {
    return `https://drive.google.com/drive/folders/${folderId}`
  }

  return cleaned
}

export async function GET() {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_os_drive_settings')
      .select('*')
      .eq('singleton_key', 'default')
      .maybeSingle()

    if (error) {
      console.error('AI-OS drive settings GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento impostazioni Drive' },
        { status: 500 },
      )
    }

    return NextResponse.json({ settings: data ?? null })
  } catch (error) {
    console.error('AI-OS drive settings GET exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento impostazioni Drive') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)

    const driveRootName = cleanText(body?.driveRootName)
    const driveRootUrl = normalizeDriveFolderUrl(cleanText(body?.driveRootUrl))
    const driveRootFolderId = driveRootUrl ? extractDriveFolderId(driveRootUrl) : null
    const largeFileThresholdMb = cleanNumber(body?.largeFileThresholdMb, 50)
    const notes = cleanText(body?.notes)

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('ai_os_drive_settings')
      .upsert(
        {
          singleton_key: 'default',
          drive_root_name: driveRootName,
          drive_root_url: driveRootUrl,
          drive_root_folder_id: driveRootFolderId,
          large_file_threshold_mb: largeFileThresholdMb,
          storage_strategy: 'supabase_public_drive_archive',
          notes,
        },
        {
          onConflict: 'singleton_key',
        },
      )
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS drive settings POST error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore salvataggio impostazioni Drive' },
        { status: 500 },
      )
    }

    return NextResponse.json({ settings: data })
  } catch (error) {
    console.error('AI-OS drive settings POST exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio impostazioni Drive') },
      { status: 500 },
    )
  }
}
