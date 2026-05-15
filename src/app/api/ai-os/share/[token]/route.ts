import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { jsonError } from '@/lib/ai-os'
import { getAiOsShareFolderConfig } from '@/lib/ai-os/share-folders'

export const dynamic = 'force-dynamic'

type RouteContext = {
  params: Promise<{
    token: string
  }>
}

function cleanString(value: unknown) {
  return String(value ?? '').trim()
}

function isExpired(expiresAt: string | null | undefined) {
  if (!expiresAt) return false
  return new Date(expiresAt).getTime() < Date.now()
}

function normalizeFolderName(value: unknown) {
  return cleanString(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

async function callDriveScript(input: {
  action: string
  folderId: string
  folderName?: string
  fileName?: string
  mimeType?: string
  base64Data?: string
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

async function getValidShareLink(token: string) {
  const supabase = createServiceClient()

  const { data: link, error } = await supabase
    .from('ai_os_share_links')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  if (error) {
    throw new Error(error.message || 'Errore lettura link AI-OS')
  }

  if (!link || !link.is_active) {
    return { supabase, link: null, property: null, error: 'Link non valido o disattivato.' }
  }

  if (isExpired(link.expires_at)) {
    return { supabase, link: null, property: null, error: 'Link scaduto.' }
  }

  const { data: property } = await supabase
    .from('properties')
    .select('id, title, reference_code, comune, province, address')
    .eq('id', link.property_id)
    .maybeSingle()

  return { supabase, link, property, error: null }
}

async function ensureTargetFolder(parentFolderId: string, targetFolderName: string) {
  const listPayload = await callDriveScript({
    action: 'listFolder',
    folderId: parentFolderId,
  })

  const normalizedTarget = normalizeFolderName(targetFolderName)
  const existingFolder = Array.isArray(listPayload.folders)
    ? listPayload.folders.find((folder: any) => normalizeFolderName(folder?.name) === normalizedTarget)
    : null

  if (existingFolder?.id) return existingFolder

  const createdPayload = await callDriveScript({
    action: 'createSubfolder',
    folderId: parentFolderId,
    folderName: targetFolderName,
  })

  if (!createdPayload?.folder?.id) {
    throw new Error('Cartella destinazione non creata su Drive.')
  }

  return createdPayload.folder
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    const { link, property, error } = await getValidShareLink(token)

    if (error || !link) {
      return NextResponse.json(
        { ok: false, error: error || 'Link non valido.' },
        { status: 404 },
      )
    }

    const folderConfig = getAiOsShareFolderConfig(link.recipient_role)

    return NextResponse.json({
      ok: true,
      link: {
        token: link.token,
        targetFolderName: link.target_folder_name || folderConfig.targetFolderName,
        recipientName: link.recipient_name,
        recipientRole: link.recipient_role,
        canUpload: link.can_upload,
        expiresAt: link.expires_at,
        maxUploadBytes: Number(link.max_upload_bytes || 4194304),
      },
      folderConfig,
      property,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: jsonError(error, 'Errore caricamento link AI-OS') },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    const { supabase, link, property, error } = await getValidShareLink(token)

    if (error || !link) {
      return NextResponse.json(
        { ok: false, error: error || 'Link non valido.' },
        { status: 404 },
      )
    }

    if (!link.can_upload) {
      return NextResponse.json(
        { ok: false, error: 'Questo link non consente upload.' },
        { status: 403 },
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files').filter((item): item is File => item instanceof File)

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Nessun file ricevuto.' },
        { status: 400 },
      )
    }

    const maxUploadBytes = Number(link.max_upload_bytes || 4194304)

    const targetFolder = await ensureTargetFolder(
      cleanString(link.drive_folder_id),
      cleanString(link.target_folder_name) || 'Bozze Immagini e Video',
    )

    const uploaded: any[] = []

    for (const file of files) {
      if (file.size > maxUploadBytes) {
        return NextResponse.json(
          {
            ok: false,
            error: `File troppo grande: ${file.name}. Limite attuale ${Math.round(maxUploadBytes / 1024 / 1024)} MB.`,
          },
          { status: 413 },
        )
      }

      const buffer = Buffer.from(await file.arrayBuffer())

      const payload = await callDriveScript({
        action: 'uploadFile',
        folderId: targetFolder.id,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data: buffer.toString('base64'),
      })

      uploaded.push(payload.file ?? { name: file.name })
    }

    await supabase
      .from('ai_os_share_links')
      .update({
        use_count: Number(link.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', link.id)

    return NextResponse.json({
      ok: true,
      property,
      folder: targetFolder,
      uploaded,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: jsonError(error, 'Errore upload AI-OS') },
      { status: 500 },
    )
  }
}
