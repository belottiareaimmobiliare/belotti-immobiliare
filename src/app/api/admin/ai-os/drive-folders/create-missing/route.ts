import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

type DriveFolder = {
  id: string
  name: string
  url: string
}

type DriveStructureNode = {
  name: string
  children?: DriveStructureNode[]
}

const PROPERTY_DRIVE_STRUCTURE: DriveStructureNode[] = [
  { name: 'Foto' },
  { name: 'Video' },
  {
    name: 'Docs e planimetrie',
    children: [
      { name: 'APE' },
      { name: 'Visure' },
      { name: 'Planimetrie catastali' },
      { name: 'Documenti tecnici' },
    ],
  },
  { name: 'Incarico' },
  { name: 'Proprietari' },
  { name: 'Note operative' },
  { name: 'Pubblicazione' },
]

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

function buildDriveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

function cleanDriveName(value: unknown, fallback = 'Cartella') {
  const cleaned = String(value ?? '')
    .replace(/[\\/:*?"<>|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)

  return cleaned || fallback
}

function buildPropertyDriveFolderName(property: Record<string, unknown>) {
  const id = String(property.id ?? '')
  const title = String(property.title ?? '').trim()
  const referenceCode = String(property.reference_code ?? '').trim()
  const comune = String(property.comune ?? '').trim()
  const propertyType = String(property.property_type ?? '').trim()

  const fallbackName = [propertyType, comune].filter(Boolean).join(' ') || `Immobile ${id.slice(0, 8)}`
  const rawName = `${referenceCode || id.slice(0, 8)} - ${title || fallbackName}`

  return cleanDriveName(rawName, `Immobile ${id.slice(0, 8)}`)
}

async function callDriveScript(input: {
  action: string
  folderId?: string
  folderName?: string
  propertyId?: string
}) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error(
      'Connettore Drive non configurato: mancano AIOS_DRIVE_APP_SCRIPT_URL o AIOS_DRIVE_APP_SCRIPT_TOKEN',
    )
  }

  const response = await fetch(scriptUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
    },
    body: JSON.stringify({
      token,
      action: input.action,
      folderId: input.folderId,
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
    throw new Error(payload?.error || 'Errore operazione Drive')
  }

  return payload
}

async function listDriveFolders(folderId: string): Promise<DriveFolder[]> {
  const payload = await callDriveScript({
    action: 'listFolder',
    folderId,
  })

  return Array.isArray(payload?.folders)
    ? payload.folders
        .map((folder: any) => ({
          id: String(folder.id || ''),
          name: String(folder.name || ''),
          url: String(folder.url || (folder.id ? buildDriveFolderUrl(String(folder.id)) : '')),
        }))
        .filter((folder: DriveFolder) => folder.id && folder.name)
    : []
}

async function ensureDriveSubfolder(input: {
  parentFolderId: string
  folderName: string
  propertyId?: string
}) {
  const folderName = cleanDriveName(input.folderName)
  const folders = await listDriveFolders(input.parentFolderId)
  const existing = folders.find(
    (folder) => folder.name.trim().toLowerCase() === folderName.toLowerCase(),
  )

  if (existing) return existing

  const payload = await callDriveScript({
    action: 'createSubfolder',
    folderId: input.parentFolderId,
    folderName,
    propertyId: input.propertyId,
  })

  const folder = payload?.folder ?? payload
  const id = String(folder?.id || '')
  const name = String(folder?.name || folderName)
  const url = String(folder?.url || (id ? buildDriveFolderUrl(id) : ''))

  if (!id) {
    throw new Error(`Drive non ha restituito l'id della cartella "${folderName}"`)
  }

  return { id, name, url }
}

async function ensureDriveStructure(
  parentFolder: DriveFolder,
  nodes: DriveStructureNode[],
  propertyId: string,
) {
  const createdOrFound: Array<DriveFolder & { children?: DriveFolder[] }> = []

  for (const node of nodes) {
    const folder = await ensureDriveSubfolder({
      parentFolderId: parentFolder.id,
      folderName: node.name,
      propertyId,
    })

    const children = node.children?.length
      ? await ensureDriveStructure(folder, node.children, propertyId)
      : []

    createdOrFound.push({
      ...folder,
      children,
    })
  }

  return createdOrFound
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
    let structured = 0
    const errors: string[] = []
    const synced: Array<{
      propertyId: string
      folderName: string
      folderId: string
      folderUrl: string
      subfolders: unknown[]
    }> = []

    for (const property of properties ?? []) {
      const propertyId = String(property.id ?? '')
      if (!propertyId) continue

      const existing = existingByPropertyId.get(propertyId)
      const existingId = String(existing?.drive_folder_id || '').trim()
      const existingUrl = String(existing?.drive_folder_url || '').trim()

      const folderName =
        cleanDriveName(existing?.folder_name, '') ||
        buildPropertyDriveFolderName(property as Record<string, unknown>)

      try {
        const propertyDriveFolder = existingId
          ? {
              id: existingId,
              name: folderName,
              url: existingUrl || buildDriveFolderUrl(existingId),
            }
          : await ensureDriveSubfolder({
              parentFolderId: rootFolderId,
              folderName,
              propertyId,
            })

        const subfolders = await ensureDriveStructure(
          propertyDriveFolder,
          PROPERTY_DRIVE_STRUCTURE,
          propertyId,
        )

        structured += 1

        if (existingId) {
          alreadyLinked += 1
        } else {
          created += 1
        }

        const { error: upsertError } = await supabase
          .from('property_drive_folders')
          .upsert(
            {
              property_id: propertyId,
              folder_name: propertyDriveFolder.name || folderName,
              drive_folder_url: propertyDriveFolder.url,
              drive_folder_id: propertyDriveFolder.id,
              sync_status: 'synced',
              notes:
                'Drive-first: cartella immobile e struttura standard create/sincronizzate automaticamente da AI-OS.',
              last_sync_at: new Date().toISOString(),
            },
            {
              onConflict: 'property_id',
            },
          )

        if (upsertError) throw new Error(upsertError.message)

        synced.push({
          propertyId,
          folderName: propertyDriveFolder.name || folderName,
          folderId: propertyDriveFolder.id,
          folderUrl: propertyDriveFolder.url,
          subfolders,
        })
      } catch (error) {
        failed += 1
        const message = error instanceof Error ? error.message : 'Errore sconosciuto'
        errors.push(`${folderName}: ${message}`)
      }
    }

    return NextResponse.json({
      ok: failed === 0,
      mode: 'drive_first',
      created,
      alreadyLinked,
      structured,
      failed,
      errors: errors.slice(0, 10),
      synced: synced.slice(0, 20),
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore creazione/sincronizzazione cartelle Drive immobili') },
      { status: 500 },
    )
  }
}
