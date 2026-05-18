import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
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


function roleForFolderKey(folderKey: string) {
  if (folderKey === 'owner_documents') return 'owner'
  if (folderKey === 'plans_documents') return 'collaborator'
  if (folderKey === 'agency_material') return 'collaborator'
  if (folderKey === 'site_publication') return 'collaborator'
  return 'photographer'
}

function createShareToken() {
  return randomBytes(24).toString('hex')
}

function buildAiOsShareUrl(request: Request, token: string) {
  const origin = new URL(request.url).origin
  return `${origin}/ai-os/share/${token}`
}

function defaultShareExpiry() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()
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

    const shareToken = createShareToken()
    const aiOsUrl = buildAiOsShareUrl(request, shareToken)
    const recipientRole = roleForFolderKey(folderKey)
    const folderName = subfolder?.folder_name || standardFolder.name
    const folderUrl = subfolder?.drive_folder_url || `https://drive.google.com/drive/folders/${folderId}`

    const { error: shareLinkError } = await supabase
      .from('ai_os_share_links')
      .insert({
        token: shareToken,
        property_id: propertyId,
        folder_key: folderKey,
        drive_folder_id: folderId,
        target_folder_name: folderName,
        recipient_name: emailAddress,
        recipient_email: emailAddress,
        recipient_role: recipientRole,
        can_upload: permissionRole !== 'reader',
        drive_permission_role: permissionRole,
        max_upload_bytes: 50 * 1024 * 1024,
        expires_at: defaultShareExpiry(),
        is_active: true,
        direct_drive_folder: true,
        created_by: profile.id,
        updated_at: new Date().toISOString(),
      })

    if (shareLinkError) {
      throw new Error(shareLinkError.message || 'Errore generazione link AI-OS fallback')
    }

    return NextResponse.json({
      ok: true,
      shared: {
        propertyId,
        folderKey,
        folderName,
        folderId,
        folderUrl,
        aiOsUrl,
        emailAddress,
        permissionRole,
        recipientRole,
      },
      aiOsUrl,
      drive: payload.permission ?? payload.result ?? null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore condivisione cartella Drive') },
      { status: 500 },
    )
  }
}
