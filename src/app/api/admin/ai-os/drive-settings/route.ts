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

function buildPropertyDriveFolderName(property: Record<string, unknown>) {
  const id = String(property.id ?? '')
  const title = String(property.title ?? '').trim()
  const referenceCode = String(property.reference_code ?? '').trim()
  const comune = String(property.comune ?? '').trim()
  const propertyType = String(property.property_type ?? '').trim()

  const fallbackName = [propertyType, comune].filter(Boolean).join(' ') || `Immobile ${id.slice(0, 8)}`
  const rawName = `${referenceCode || id.slice(0, 8)} - ${title || fallbackName}`

  return rawName
    .replace(/[^a-zA-Z0-9À-ÿ ._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}

async function ensurePropertyDriveFolderPlaceholders(supabase: ReturnType<typeof createServiceClient>) {
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select('id, title, reference_code, comune, property_type')
    .limit(1000)

  if (propertiesError) {
    console.error('AI-OS drive settings properties preload error:', propertiesError)
    return { created: 0, error: propertiesError.message }
  }

  const rows = (properties ?? [])
    .map((property) => ({
      property_id: property.id,
      folder_name: buildPropertyDriveFolderName(property as Record<string, unknown>),
      drive_folder_url: null,
      drive_folder_id: null,
      sync_status: 'pending_creation',
      notes: 'Drive-first: cartella immobile preconfigurata da AI-OS. La struttura reale viene creata/sincronizzata in Google Drive.',
    }))
    .filter((row) => row.property_id)

  if (rows.length === 0) {
    return { created: 0, error: null }
  }

  const { error: upsertError } = await supabase
    .from('property_drive_folders')
    .upsert(rows, {
      onConflict: 'property_id',
      ignoreDuplicates: true,
    })

  if (upsertError) {
    console.error('AI-OS drive settings placeholders upsert error:', upsertError)
    return { created: 0, error: upsertError.message }
  }

  return { created: rows.length, error: null }
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
          storage_strategy: 'drive_first_google_drive',
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

    const placeholders = await ensurePropertyDriveFolderPlaceholders(supabase)

    return NextResponse.json({
      settings: data,
      propertyDriveFolders: {
        configured: placeholders.created,
        error: placeholders.error,
      },
    })
  } catch (error) {
    console.error('AI-OS drive settings POST exception:', error)

    return NextResponse.json(
      { error: jsonError(error, 'Errore salvataggio impostazioni Drive') },
      { status: 500 },
    )
  }
}
