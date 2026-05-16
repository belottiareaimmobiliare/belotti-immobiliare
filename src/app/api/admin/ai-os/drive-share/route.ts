import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'
import { getStandardFolderByKey } from '@/lib/ai-os/drive-standard-folders'

export const dynamic = 'force-dynamic'

function canManageDriveSharing(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function cleanEmail(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function cleanPermission(value: unknown) {
  const valueString = cleanString(value)

  if (valueString === 'reader') return 'reader'
  return 'writer'
}

async function callDriveScript(input: {
  action: string
  folderId: string
  emailAddress: string
  permissionRole: 'reader' | 'writer'
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
      emailAddress: input.emailAddress,
      permissionRole: input.permissionRole,
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

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canManageDriveSharing(profile.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const propertyId = cleanString(body?.propertyId)
    const folderKey = cleanString(body?.folderKey)
    const emailAddress = cleanEmail(body?.emailAddress)
    const permissionRole = cleanPermission(body?.permissionRole)

    if (!propertyId || !folderKey || !emailAddress) {
      return NextResponse.json(
        { error: 'Seleziona immobile, cartella precisa ed email Gmail destinatario.' },
        { status: 400 },
      )
    }

    const standardFolder = getStandardFolderByKey(folderKey)

    if (!standardFolder) {
      return NextResponse.json(
        { error: 'Cartella standard non valida.' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { data: subfolder, error: subfolderError } = await supabase
      .from('property_drive_subfolders')
      .select('property_id, folder_key, folder_name, drive_folder_id, drive_folder_url')
      .eq('property_id', propertyId)
      .eq('folder_key', folderKey)
      .maybeSingle()

    if (subfolderError) {
      return NextResponse.json(
        { error: subfolderError.message || 'Errore lettura sottocartella Drive' },
        { status: 500 },
      )
    }

    const folderId = cleanString(subfolder?.drive_folder_id)

    if (!folderId) {
      return NextResponse.json(
        { error: 'Sottocartella Drive non ancora preparata. Premi prima Aggiorna/Prepara cartelle.' },
        { status: 409 },
      )
    }

    const payload = await callDriveScript({
      action: 'shareFolder',
      folderId,
      emailAddress,
      permissionRole,
    })

    return NextResponse.json({
      ok: true,
      shared: {
        propertyId,
        folderKey,
        folderName: subfolder?.folder_name || standardFolder.name,
        folderId,
        folderUrl: subfolder?.drive_folder_url || `https://drive.google.com/drive/folders/${folderId}`,
        emailAddress,
        permissionRole,
      },
      drive: payload.permission ?? payload.result ?? null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore condivisione cartella Drive') },
      { status: 500 },
    )
  }
}
