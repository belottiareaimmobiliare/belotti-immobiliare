import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

function extractDriveFolderId(value: string | null | undefined) {
  const raw = String(value || '').trim()

  if (!raw) return null

  try {
    const url = new URL(raw)
    const foldersMatch = url.pathname.match(/\/folders\/([^/?#]+)/)
    if (foldersMatch?.[1]) return decodeURIComponent(foldersMatch[1])

    const idParam = url.searchParams.get('id')
    if (idParam) return idParam
  } catch {
    // può essere direttamente l'id cartella
  }

  if (/^[a-zA-Z0-9_-]{12,}$/.test(raw)) return raw

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
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}

async function createDriveFolderWithAppsScript(input: {
  folderName: string
  propertyId: string
}) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('Connettore Drive non configurato: mancano AIOS_DRIVE_APP_SCRIPT_URL o AIOS_DRIVE_APP_SCRIPT_TOKEN')
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      folderName: input.folderName,
      propertyId: input.propertyId,
    }),
  })

  const text = await response.text()
  let payload: any = null

  try {
    payload = JSON.parse(text)
  } catch {
    throw new Error(`Risposta Drive non valida: ${text.slice(0, 180)}`)
  }

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error || 'Errore creazione cartella Drive')
  }

  return {
    id: String(payload.id || ''),
    name: String(payload.name || input.folderName),
    url: String(payload.url || ''),
  }
}

export async function POST() {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data: settings, error: settingsError } = await supabase
      .from('ai_os_drive_settings')
      .select('*')
      .eq('singleton_key', 'default')
      .maybeSingle()

    if (settingsError) {
      return NextResponse.json(
        { error: settingsError.message || 'Errore lettura impostazioni Drive' },
        { status: 500 },
      )
    }

    const rootFolderId =
      String(settings?.drive_root_folder_id || '').trim() ||
      extractDriveFolderId(settings?.drive_root_url)

    if (!rootFolderId) {
      return NextResponse.json(
        { error: 'Imposta prima la cartella Drive root dell’agenzia dalla nuvoletta Drive.' },
        { status: 400 },
      )
    }

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, reference_code, comune, property_type')
      .limit(1000)

    if (propertiesError) {
      return NextResponse.json(
        { error: propertiesError.message || 'Errore lettura immobili' },
        { status: 500 },
      )
    }

    const propertyIds = (properties ?? [])
      .map((property) => String(property.id ?? ''))
      .filter(Boolean)

    const { data: existingRows, error: existingError } = await supabase
      .from('property_drive_folders')
      .select('*')
      .in('property_id', propertyIds)

    if (existingError) {
      return NextResponse.json(
        { error: existingError.message || 'Errore lettura cartelle Drive immobili' },
        { status: 500 },
      )
    }

    const existingByPropertyId = new Map(
      (existingRows ?? []).map((row) => [String(row.property_id), row]),
    )

    let created = 0
    let alreadyLinked = 0
    let failed = 0
    const errors: string[] = []

    for (const property of properties ?? []) {
      const propertyId = String(property.id ?? '')
      if (!propertyId) continue

      const existing = existingByPropertyId.get(propertyId)
      const existingUrl = String(existing?.drive_folder_url || '').trim()
      const existingId = String(existing?.drive_folder_id || '').trim()

      if (existingUrl && existingId) {
        alreadyLinked += 1
        continue
      }

      const folderName =
        String(existing?.folder_name || '').trim() ||
        buildPropertyDriveFolderName(property as Record<string, unknown>)

      try {
        const driveFolder = await createDriveFolderWithAppsScript({
          folderName,
          propertyId,
        })

        const { error: upsertError } = await supabase
          .from('property_drive_folders')
          .upsert(
            {
              property_id: propertyId,
              folder_name: driveFolder.name || folderName,
              drive_folder_url: driveFolder.url,
              drive_folder_id: driveFolder.id,
              sync_status: 'synced',
              notes: 'Cartella Drive creata automaticamente da AI-OS sotto la root agenzia.',
              last_sync_at: new Date().toISOString(),
            },
            {
              onConflict: 'property_id',
            },
          )

        if (upsertError) throw new Error(upsertError.message)

        created += 1
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'Errore sconosciuto'
        errors.push(`${folderName}: ${message}`)
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      created,
      alreadyLinked,
      failed,
      errors: errors.slice(0, 10),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione cartelle Drive immobili') },
      { status: 500 },
    )
  }
}
