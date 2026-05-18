import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'

export const dynamic = 'force-dynamic'

function canManageDriveSharing(role: string) {
  return role === 'administrator' || role === 'owner' || role === 'secretary'
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

async function callDriveScript(input: {
  action: string
  folderId: string
  emailAddress: string
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
    const shareLinkId = cleanString(body?.shareLinkId)

    if (!shareLinkId) {
      return NextResponse.json(
        { error: 'shareLinkId mancante' },
        { status: 400 },
      )
    }

    const supabase = createServiceClient()

    const { data: shareLink, error: shareLinkError } = await supabase
      .from('ai_os_share_links')
      .select('id, drive_folder_id, target_folder_name, recipient_email, recipient_name, is_active, revoked_at')
      .eq('id', shareLinkId)
      .maybeSingle()

    if (shareLinkError) {
      return NextResponse.json(
        { error: shareLinkError.message || 'Errore lettura condivisione' },
        { status: 500 },
      )
    }

    if (!shareLink) {
      return NextResponse.json(
        { error: 'Condivisione non trovata' },
        { status: 404 },
      )
    }

    const folderId = cleanString(shareLink.drive_folder_id)
    const emailAddress = cleanString(shareLink.recipient_email || shareLink.recipient_name).toLowerCase()

    if (!folderId || !emailAddress) {
      return NextResponse.json(
        { error: 'Condivisione incompleta: cartella o email mancanti' },
        { status: 400 },
      )
    }

    await callDriveScript({
      action: 'removeFolderPermission',
      folderId,
      emailAddress,
    })

    const revokedAt = new Date().toISOString()

    const { error: updateError } = await supabase
      .from('ai_os_share_links')
      .update({
        is_active: false,
        revoked_at: revokedAt,
        revoked_by: profile.id,
        updated_at: revokedAt,
      })
      .eq('id', shareLinkId)

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || 'Permesso rimosso da Drive, ma storico non aggiornato' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      ok: true,
      revoked: {
        id: shareLinkId,
        folderId,
        folderName: shareLink.target_folder_name,
        emailAddress,
        revokedAt,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore revoca accesso Drive') },
      { status: 500 },
    )
  }
}
