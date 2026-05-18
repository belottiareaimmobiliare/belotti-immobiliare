import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'
import {
  AI_OS_DRIVE_STANDARD_FOLDERS,
  normalizeDriveFolderName,
} from '@/lib/ai-os/drive-standard-folders'

export const dynamic = 'force-dynamic'

type DriveFolder = {
  id: string
  name: string
  url?: string
}

type PropertyRow = {
  id: string
  title?: string | null
  reference_code?: string | null
  comune?: string | null
  property_type?: string | null
  contract_type?: string | null
  status?: string | null
}

type PropertyDriveFolderRow = {
  property_id: string
  folder_name?: string | null
  drive_folder_id?: string | null
  drive_folder_url?: string | null
  sync_status?: string | null
}

function canRunAutopilot(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function buildDriveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${folderId}`
}

function buildPropertyDriveFolderName(property: PropertyRow) {
  const id = cleanString(property.id)
  const title = cleanString(property.title)
  const referenceCode = cleanString(property.reference_code)
  const comune = cleanString(property.comune)
  const propertyType = cleanString(property.property_type)

  const fallbackName = [propertyType, comune].filter(Boolean).join(' ') || `Immobile ${id.slice(0, 8)}`
  const rawName = `${referenceCode || id.slice(0, 8)} - ${title || fallbackName}`

  return rawName
    .replace(/[^a-zA-Z0-9À-ÿ ._-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150)
}

async function callDriveScript(input: {
  action: string
  folderId: string
  folderName?: string
}) {
  const scriptUrl = process.env.AIOS_DRIVE_APP_SCRIPT_URL
  const token = process.env.AIOS_DRIVE_APP_SCRIPT_TOKEN

  if (!scriptUrl || !token) {
    throw new Error('Connettore Drive non configurato')
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
    throw new Error(payload?.error || 'Errore Drive')
  }

  return payload
}

async function listDriveFolder(folderId: string) {
  const payload = await callDriveScript({
    action: 'listFolder',
    folderId,
  })

  return Array.isArray(payload.folders) ? (payload.folders as DriveFolder[]) : []
}

async function ensureSubfolder(parentFolderId: string, folderName: string) {
  const childFolders = await listDriveFolder(parentFolderId)
  const normalizedTarget = normalizeDriveFolderName(folderName)

  const existing = childFolders.find(
    (folder) => normalizeDriveFolderName(folder.name) === normalizedTarget,
  )

  if (existing?.id) {
    return {
      id: existing.id,
      name: existing.name || folderName,
      url: existing.url || buildDriveFolderUrl(existing.id),
      created: false,
    }
  }

  const payload = await callDriveScript({
    action: 'createSubfolder',
    folderId: parentFolderId,
    folderName,
  })

  if (!payload?.folder?.id) {
    throw new Error(`Cartella non creata: ${folderName}`)
  }

  return {
    id: payload.folder.id,
    name: payload.folder.name || folderName,
    url: payload.folder.url || buildDriveFolderUrl(payload.folder.id),
    created: true,
  }
}

async function ensurePropertyRootFolder(input: {
  rootFolderId: string
  property: PropertyRow
  existingDriveFolder?: PropertyDriveFolderRow | null
}) {
  const existingId = cleanString(input.existingDriveFolder?.drive_folder_id)
  const suggestedName = buildPropertyDriveFolderName(input.property)

  if (existingId && !existingId.startsWith('aios-property-')) {
    return {
      id: existingId,
      name: cleanString(input.existingDriveFolder?.folder_name) || suggestedName,
      url: cleanString(input.existingDriveFolder?.drive_folder_url) || buildDriveFolderUrl(existingId),
      created: false,
    }
  }

  const rootChildren = await listDriveFolder(input.rootFolderId)
  const normalizedTarget = normalizeDriveFolderName(suggestedName)

  const existingFolder = rootChildren.find(
    (folder) => normalizeDriveFolderName(folder.name) === normalizedTarget,
  )

  if (existingFolder?.id) {
    return {
      id: existingFolder.id,
      name: existingFolder.name || suggestedName,
      url: existingFolder.url || buildDriveFolderUrl(existingFolder.id),
      created: false,
    }
  }

  const created = await callDriveScript({
    action: 'createSubfolder',
    folderId: input.rootFolderId,
    folderName: suggestedName,
  })

  if (!created?.folder?.id) {
    throw new Error(`Cartella immobile non creata: ${suggestedName}`)
  }

  return {
    id: created.folder.id,
    name: created.folder.name || suggestedName,
    url: created.folder.url || buildDriveFolderUrl(created.folder.id),
    created: true,
  }
}

export async function POST() {
  try {
    const profile = await requireAdminProfile()

    if (!canRunAutopilot(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data: settings, error: settingsError } = await supabase
      .from('ai_os_drive_settings')
      .select('drive_root_folder_id, drive_root_url, drive_root_name')
      .eq('singleton_key', 'default')
      .maybeSingle()

    if (settingsError) {
      return NextResponse.json(
        { error: settingsError.message || 'Errore lettura impostazioni Drive' },
        { status: 500 },
      )
    }

    const rootFolderId = cleanString(settings?.drive_root_folder_id)

    if (!rootFolderId) {
      return NextResponse.json(
        { error: 'Cartella root Drive non configurata. Apri Impostazioni Drive e collega la root Immobili.' },
        { status: 409 },
      )
    }

    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('id, title, reference_code, comune, property_type, contract_type, status')
      .order('updated_at', { ascending: false })
      .limit(1000)

    if (propertiesError) {
      return NextResponse.json(
        { error: propertiesError.message || 'Errore lettura immobili' },
        { status: 500 },
      )
    }

    const { data: existingDriveFolders, error: existingDriveFoldersError } = await supabase
      .from('property_drive_folders')
      .select('property_id, folder_name, drive_folder_id, drive_folder_url, sync_status')
      .limit(1000)

    if (existingDriveFoldersError) {
      return NextResponse.json(
        { error: existingDriveFoldersError.message || 'Errore lettura cartelle Drive immobili' },
        { status: 500 },
      )
    }

    const existingByPropertyId = new Map<string, PropertyDriveFolderRow>()

    for (const row of existingDriveFolders ?? []) {
      existingByPropertyId.set(cleanString(row.property_id), row as PropertyDriveFolderRow)
    }

    let processedProperties = 0
    let createdPropertyFolders = 0
    let existingPropertyFolders = 0
    let createdSubfolders = 0
    let existingSubfolders = 0
    let savedPropertyFolders = 0
    let savedSubfolders = 0
    const errors: string[] = []

    for (const property of (properties ?? []) as PropertyRow[]) {
      const propertyId = cleanString(property.id)

      if (!propertyId) continue

      try {
        processedProperties += 1

        const existingDriveFolder = existingByPropertyId.get(propertyId) ?? null
        const propertyRootFolder = await ensurePropertyRootFolder({
          rootFolderId,
          property,
          existingDriveFolder,
        })

        if (propertyRootFolder.created) {
          createdPropertyFolders += 1
        } else {
          existingPropertyFolders += 1
        }

        const { error: propertyFolderUpsertError } = await supabase
          .from('property_drive_folders')
          .upsert(
            {
              property_id: propertyId,
              folder_name: propertyRootFolder.name,
              drive_folder_url: propertyRootFolder.url,
              drive_folder_id: propertyRootFolder.id,
              sync_status: 'synced',
              notes: 'AI-OS Autopilot: cartella immobile Drive pronta, anche per bozze.',
              last_sync_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'property_id' },
          )

        if (propertyFolderUpsertError) {
          throw new Error(propertyFolderUpsertError.message || 'Errore salvataggio cartella immobile Drive')
        }

        savedPropertyFolders += 1

        const subfolderRows = []

        for (const standardFolder of AI_OS_DRIVE_STANDARD_FOLDERS) {
          const ensuredSubfolder = await ensureSubfolder(propertyRootFolder.id, standardFolder.name)

          if (ensuredSubfolder.created) {
            createdSubfolders += 1
          } else {
            existingSubfolders += 1
          }

          subfolderRows.push({
            property_id: propertyId,
            folder_key: standardFolder.key,
            folder_name: standardFolder.name,
            drive_folder_id: ensuredSubfolder.id,
            drive_folder_url: ensuredSubfolder.url,
            updated_at: new Date().toISOString(),
          })
        }

        const { error: subfolderUpsertError } = await supabase
          .from('property_drive_subfolders')
          .upsert(subfolderRows, { onConflict: 'property_id,folder_key' })

        if (subfolderUpsertError) {
          throw new Error(subfolderUpsertError.message || 'Errore salvataggio sottocartelle Drive')
        }

        savedSubfolders += subfolderRows.length
      } catch (error) {
        errors.push(
          `${buildPropertyDriveFolderName(property)}: ${
            error instanceof Error ? error.message : 'Errore Drive Autopilot'
          }`,
        )
      }
    }

    return NextResponse.json({
      ok: true,
      rootFolderId,
      processedProperties,
      createdPropertyFolders,
      existingPropertyFolders,
      createdSubfolders,
      existingSubfolders,
      savedPropertyFolders,
      savedSubfolders,
      errors,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore AI-OS Drive Autopilot') },
      { status: 500 },
    )
  }
}
