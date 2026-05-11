import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'

async function callDriveScript(input: {
  action: string
  folderId: string
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
    throw new Error(payload?.error || 'Errore lettura Drive')
  }

  return payload
}

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    if (!canUseAIOS(profile)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')?.trim()
    const folderIdParam = searchParams.get('folderId')?.trim()

    const supabase = createServiceClient()

    let folderId = folderIdParam || ''

    if (!folderId && propertyId) {
      const { data, error } = await supabase
        .from('property_drive_folders')
        .select('drive_folder_id')
        .eq('property_id', propertyId)
        .maybeSingle()

      if (error) {
        return NextResponse.json(
          { error: error.message || 'Errore lettura cartella Drive immobile' },
          { status: 500 },
        )
      }

      folderId = String(data?.drive_folder_id || '').trim()
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'Cartella Drive immobile non collegata' },
        { status: 400 },
      )
    }

    const payload = await callDriveScript({
      action: 'listFolder',
      folderId,
    })

    return NextResponse.json({
      ok: true,
      folder: payload.folder ?? null,
      folders: Array.isArray(payload.folders) ? payload.folders : [],
      files: Array.isArray(payload.files) ? payload.files : [],
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore lettura Drive immobile') },
      { status: 500 },
    )
  }
}
