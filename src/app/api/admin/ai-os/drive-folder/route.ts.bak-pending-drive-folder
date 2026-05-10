import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

function cleanText(value: unknown) {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned.length > 0 ? cleaned : null
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

    const fileMatch = url.pathname.match(/\/d\/([^/?#]+)/)
    if (fileMatch?.[1]) return decodeURIComponent(fileMatch[1])
  } catch {
    // valore non URL: lo trattiamo come possibile folder id
  }

  if (/^[a-zA-Z0-9_-]{12,}$/.test(raw)) {
    return raw
  }

  return null
}

function normalizeDriveFolderUrl(value: string) {
  const cleaned = value.trim()
  const folderId = extractDriveFolderId(cleaned)

  if (folderId && !cleaned.startsWith('http')) {
    return `https://drive.google.com/drive/folders/${folderId}`
  }

  return cleaned
}

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')?.trim()

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('property_drive_folders')
      .select('*')
      .eq('property_id', propertyId)
      .maybeSingle()

    if (error) {
      console.error('AI-OS drive folder GET error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore caricamento cartella Drive' },
        { status: 500 },
      )
    }

    return NextResponse.json({ driveFolder: data ?? null })
  } catch (error) {
    console.error('AI-OS drive folder GET exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore caricamento cartella Drive') },
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

    const propertyId = String(body?.propertyId ?? '').trim()
    const rawUrl = cleanText(body?.driveFolderUrl)
    const folderName = cleanText(body?.folderName)
    const notes = cleanText(body?.notes)
    const syncStatus = cleanText(body?.syncStatus) || 'linked'

    if (!propertyId) {
      return NextResponse.json({ error: 'propertyId mancante' }, { status: 400 })
    }

    if (!rawUrl) {
      return NextResponse.json({ error: 'Link cartella Drive obbligatorio' }, { status: 400 })
    }

    const driveFolderUrl = normalizeDriveFolderUrl(rawUrl)
    const driveFolderId = extractDriveFolderId(driveFolderUrl)

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('property_drive_folders')
      .upsert(
        {
          property_id: propertyId,
          folder_name: folderName,
          drive_folder_url: driveFolderUrl,
          drive_folder_id: driveFolderId,
          sync_status: syncStatus,
          notes,
        },
        {
          onConflict: 'property_id',
        },
      )
      .select('*')
      .single()

    if (error) {
      console.error('AI-OS drive folder POST error:', error)
      return NextResponse.json(
        { error: error.message || 'Errore salvataggio cartella Drive' },
        { status: 500 },
      )
    }

    return NextResponse.json({ driveFolder: data })
  } catch (error) {
    console.error('AI-OS drive folder POST exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio cartella Drive') },
      { status: 500 },
    )
  }
}
