import { NextResponse } from 'next/server'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { canUseAIOS, jsonError } from '@/lib/ai-os'
import {
  canUseAiOsProperty,
  getAiOsWorkspaceAccess,
} from '@/lib/ai-os/workspace-access'

const MAX_DRIVE_EXPLORER_UPLOAD_BYTES = 4 * 1024 * 1024

function isVirtualDriveFolderId(value: unknown) {
  return String(value || '').trim().startsWith('aios-property-')
}

async function callDriveScript(input: {
  action: string
  folderId: string
  folderName?: string
  fileName?: string
  mimeType?: string
  base64Data?: string
  sourceItemId?: string
  targetFolderId?: string
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
      fileName: input.fileName,
      mimeType: input.mimeType,
      base64Data: input.base64Data,
      sourceItemId: input.sourceItemId,
      targetFolderId: input.targetFolderId,
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

export async function GET(request: Request) {
  try {
    const profile = await requireAdminProfile()

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')?.trim()
    const folderIdParam = searchParams.get('folderId')?.trim()

    const supabase = createServiceClient()
    const workspaceAccess = await getAiOsWorkspaceAccess(supabase, profile)

    if (!canUseAIOS(profile) && !workspaceAccess.isActiveWorkspaceUser) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    if (propertyId) {
      const canViewProperty = await canUseAiOsProperty(supabase, profile, propertyId, 'view')

      if (!canViewProperty) {
        return NextResponse.json(
          { error: 'Non autorizzato su questa cartella immobile' },
          { status: 403 },
        )
      }
    } else if (!workspaceAccess.canSeeAllProperties) {
      return NextResponse.json(
        { error: 'propertyId obbligatorio per utenti con accesso limitato' },
        { status: 403 },
      )
    }

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

    if (isVirtualDriveFolderId(folderId)) {
      return NextResponse.json(
        {
          error:
            'Cartella Drive reale non ancora creata. Attendi la sincronizzazione automatica oppure premi Aggiorna.',
        },
        { status: 409 },
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

export async function POST(request: Request) {
  try {
    const profile = await requireAdminProfile()

    const body = await request.json().catch(() => null)
    const action = String(body?.action ?? 'uploadFile').trim()
    const folderId = String(body?.folderId ?? '').trim()
    const propertyId = String(body?.propertyId ?? '').trim()

    const supabase = createServiceClient()
    const workspaceAccess = await getAiOsWorkspaceAccess(supabase, profile)

    if (!canUseAIOS(profile) && !workspaceAccess.isActiveWorkspaceUser) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
    }

    const requiredAction =
      action === 'uploadFile'
        ? 'upload'
        : action === 'createSubfolder' || action === 'moveItem'
          ? 'manage'
          : 'view'

    if (propertyId) {
      const canUseProperty = await canUseAiOsProperty(supabase, profile, propertyId, requiredAction)

      if (!canUseProperty) {
        return NextResponse.json(
          { error: 'Non autorizzato a modificare questa cartella immobile' },
          { status: 403 },
        )
      }
    } else if (!workspaceAccess.canSeeAllProperties) {
      return NextResponse.json(
        { error: 'propertyId obbligatorio per utenti con accesso limitato' },
        { status: 403 },
      )
    }

    if (!folderId) {
      return NextResponse.json(
        { error: 'folderId mancante' },
        { status: 400 },
      )
    }

    if (isVirtualDriveFolderId(folderId)) {
      return NextResponse.json(
        {
          error:
            'Cartella Drive reale non ancora creata. Attendi la sincronizzazione automatica oppure premi Aggiorna.',
        },
        { status: 409 },
      )
    }

    if (action === 'moveItem') {
      const sourceItemId = String(body?.sourceItemId ?? '').trim()
      const targetFolderId = String(body?.targetFolderId ?? '').trim() || folderId

      if (!sourceItemId) {
        return NextResponse.json(
          { error: 'sourceItemId mancante' },
          { status: 400 },
        )
      }

      if (!targetFolderId) {
        return NextResponse.json(
          { error: 'targetFolderId mancante' },
          { status: 400 },
        )
      }

      const payload = await callDriveScript({
        action: 'moveItem',
        folderId,
        sourceItemId,
        targetFolderId,
      })

      const movedItem = payload.item ?? payload.file ?? payload.folder ?? null
      const movedItemId = String(movedItem?.id || payload.id || '').trim()

      if (!movedItemId) {
        return NextResponse.json(
          {
            error:
              'Apps Script ha risposto OK ma non ha confermato lo spostamento. Aggiorna il connettore Drive con action moveItem.',
          },
          { status: 502 },
        )
      }

      return NextResponse.json({
        ok: true,
        item: movedItem,
      })
    }

    if (action === 'createSubfolder') {
      const folderName = String(body?.folderName ?? '').trim()

      if (!folderName) {
        return NextResponse.json(
          { error: 'Nome sottocartella mancante' },
          { status: 400 },
        )
      }

      const payload = await callDriveScript({
        action: 'createSubfolder',
        folderId,
        folderName,
      })

      return NextResponse.json({
        ok: true,
        folder: payload.folder ?? null,
      })
    }

    const fileName = String(body?.fileName ?? '').trim()
    const mimeType = String(body?.mimeType ?? 'application/octet-stream').trim()
    const base64Data = String(body?.base64Data ?? '').trim()

    if (!fileName || !base64Data) {
      return NextResponse.json(
        { error: 'Dati upload Drive mancanti' },
        { status: 400 },
      )
    }

    const sizeBytes = Buffer.byteLength(base64Data, 'base64')

    if (sizeBytes > MAX_DRIVE_EXPLORER_UPLOAD_BYTES) {
      return NextResponse.json(
        {
          error:
            'File troppo grande per upload diretto AI-OS. Apri la cartella Drive e caricalo lì.',
        },
        { status: 413 },
      )
    }

    const payload = await callDriveScript({
      action: 'uploadFile',
      folderId,
      fileName,
      mimeType,
      base64Data,
    })

    return NextResponse.json({
      ok: true,
      file: payload.file ?? null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: jsonError(error, 'Errore operazione Drive') },
      { status: 500 },
    )
  }
}
