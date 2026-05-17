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

type DriveFolder = {
  id: string
  name: string
  url?: string
}

type DriveFile = {
  id: string
  name: string
  url?: string
  mimeType?: string
  size?: number
  updatedAt?: string
}

function buildDriveFolderUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
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
  sourceItemId?: string
  targetFolderId?: string
  newName?: string
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
      newName: input.newName,
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

async function listDriveFolder(folderId: string) {
  const payload = await callDriveScript({
    action: 'listFolder',
    folderId,
  })

  return {
    folder: payload.folder ?? null,
    folders: Array.isArray(payload.folders) ? (payload.folders as DriveFolder[]) : [],
    files: Array.isArray(payload.files) ? (payload.files as DriveFile[]) : [],
  }
}

async function ensureTargetFolder(parentFolderId: string, targetFolderName: string) {
  const listPayload = await listDriveFolder(parentFolderId)

  const normalizedTarget = normalizeFolderName(targetFolderName)
  const existingFolder = listPayload.folders.find(
    (folder) => normalizeFolderName(folder?.name) === normalizedTarget,
  )

  if (existingFolder?.id) return existingFolder

  const createdPayload = await callDriveScript({
    action: 'createSubfolder',
    folderId: parentFolderId,
    folderName: targetFolderName,
  })

  if (!createdPayload?.folder?.id) {
    throw new Error('Cartella destinazione non creata su Drive.')
  }

  return createdPayload.folder as DriveFolder
}

async function isFolderInsideRoot(rootFolderId: string, targetFolderId: string) {
  if (!rootFolderId || !targetFolderId) return false
  if (rootFolderId === targetFolderId) return true

  const visited = new Set<string>()
  const queue = [rootFolderId]
  let depth = 0

  while (queue.length > 0 && depth < 8) {
    const batch = queue.splice(0, queue.length)

    for (const folderId of batch) {
      if (visited.has(folderId)) continue
      visited.add(folderId)

      const listed = await listDriveFolder(folderId)

      for (const folder of listed.folders) {
        if (folder.id === targetFolderId) return true
        queue.push(folder.id)
      }
    }

    depth += 1
  }

  return false
}

async function itemExistsInFolder(folderId: string, itemId: string) {
  const listed = await listDriveFolder(folderId)

  return (
    listed.folders.some((folder) => folder.id === itemId) ||
    listed.files.some((file) => file.id === itemId)
  )
}

async function getShareWorkspace(token: string, requestedFolderId?: string | null) {
  const { supabase, link, property, error } = await getValidShareLink(token)

  if (error || !link) {
    return {
      supabase,
      link: null,
      property: null,
      rootFolder: null,
      currentFolderId: '',
      error: error || 'Link non valido.',
    }
  }

  const folderConfig = getAiOsShareFolderConfig(link.recipient_role)
  const linkedDriveFolderId = cleanString(link.drive_folder_id)

  if (!linkedDriveFolderId) {
    return {
      supabase,
      link: null,
      property: null,
      rootFolder: null,
      currentFolderId: '',
      error: 'Cartella Drive non configurata per questo link.',
    }
  }

  const directDriveFolder = link.direct_drive_folder === true

  const rootFolder = directDriveFolder
    ? {
        id: linkedDriveFolderId,
        name: cleanString(link.target_folder_name) || folderConfig.targetFolderName,
        url: buildDriveFolderUrl(linkedDriveFolderId),
      }
    : await ensureTargetFolder(
        linkedDriveFolderId,
        cleanString(link.target_folder_name) || folderConfig.targetFolderName,
      )

  const currentFolderId = cleanString(requestedFolderId) || rootFolder.id
  const isAllowedFolder = await isFolderInsideRoot(rootFolder.id, currentFolderId)

  if (!isAllowedFolder) {
    return {
      supabase,
      link: null,
      property: null,
      rootFolder,
      currentFolderId: '',
      error: 'Cartella non autorizzata per questo link.',
    }
  }

  return {
    supabase,
    link,
    property,
    rootFolder,
    currentFolderId,
    error: null,
  }
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { token } = await context.params
    const { searchParams } = new URL(request.url)
    const requestedFolderId = searchParams.get('folderId')

    const workspace = await getShareWorkspace(token, requestedFolderId)

    if (workspace.error || !workspace.link || !workspace.rootFolder) {
      return NextResponse.json(
        { ok: false, error: workspace.error || 'Link non valido.' },
        { status: 404 },
      )
    }

    const folderConfig = getAiOsShareFolderConfig(workspace.link.recipient_role)
    const listed = await listDriveFolder(workspace.currentFolderId)

    return NextResponse.json({
      ok: true,
      link: {
        token: workspace.link.token,
        targetFolderName: workspace.link.target_folder_name || folderConfig.targetFolderName,
        recipientName: workspace.link.recipient_name,
        recipientRole: workspace.link.recipient_role,
        canUpload: workspace.link.can_upload,
        expiresAt: workspace.link.expires_at,
        maxUploadBytes: Number(workspace.link.max_upload_bytes || 4194304),
      },
      folderConfig,
      property: workspace.property,
      rootFolder: workspace.rootFolder,
      currentFolder: listed.folder ?? {
        id: workspace.currentFolderId,
        name:
          workspace.currentFolderId === workspace.rootFolder.id
            ? workspace.rootFolder.name
            : 'Sottocartella',
      },
      folders: listed.folders,
      files: listed.files,
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
    const contentType = request.headers.get('content-type') || ''

    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null)
      const action = cleanString(body?.action)
      const requestedFolderId = cleanString(body?.folderId)

      const workspace = await getShareWorkspace(token, requestedFolderId)

      if (workspace.error || !workspace.link || !workspace.rootFolder) {
        return NextResponse.json(
          { ok: false, error: workspace.error || 'Link non valido.' },
          { status: 404 },
        )
      }

      if (!workspace.link.can_upload) {
        return NextResponse.json(
          { ok: false, error: 'Questo link non consente modifiche.' },
          { status: 403 },
        )
      }

      if (action === 'createSubfolder') {
        const folderName = cleanString(body?.folderName)

        if (!folderName) {
          return NextResponse.json(
            { ok: false, error: 'Nome cartella mancante.' },
            { status: 400 },
          )
        }

        const payload = await callDriveScript({
          action: 'createSubfolder',
          folderId: workspace.currentFolderId,
          folderName,
        })

        return NextResponse.json({
          ok: true,
          folder: payload.folder ?? null,
        })
      }

      if (action === 'renameItem') {
        const sourceItemId = cleanString(body?.sourceItemId)
        const newName = cleanString(body?.newName)

        if (!sourceItemId || !newName) {
          return NextResponse.json(
            { ok: false, error: 'Elemento o nuovo nome mancante.' },
            { status: 400 },
          )
        }

        const exists = await itemExistsInFolder(workspace.currentFolderId, sourceItemId)

        if (!exists) {
          return NextResponse.json(
            { ok: false, error: 'Elemento non trovato nella cartella corrente.' },
            { status: 404 },
          )
        }

        const payload = await callDriveScript({
          action: 'renameItem',
          folderId: workspace.currentFolderId,
          sourceItemId,
          fileName: newName,
          newName,
        })

        return NextResponse.json({
          ok: true,
          item: payload.item ?? payload.file ?? payload.folder ?? null,
        })
      }

      if (action === 'deleteItem') {
        const sourceItemId = cleanString(body?.sourceItemId)

        if (!sourceItemId) {
          return NextResponse.json(
            { ok: false, error: 'Elemento mancante.' },
            { status: 400 },
          )
        }

        const exists = await itemExistsInFolder(workspace.currentFolderId, sourceItemId)

        if (!exists) {
          return NextResponse.json(
            { ok: false, error: 'Elemento non trovato nella cartella corrente.' },
            { status: 404 },
          )
        }

        const payload = await callDriveScript({
          action: 'deleteItem',
          folderId: workspace.currentFolderId,
          sourceItemId,
        })

        return NextResponse.json({
          ok: true,
          item: payload.item ?? null,
        })
      }

      if (action === 'moveItem') {
        const sourceItemId = cleanString(body?.sourceItemId)
        const targetFolderId = cleanString(body?.targetFolderId)

        if (!sourceItemId || !targetFolderId) {
          return NextResponse.json(
            { ok: false, error: 'Elemento o cartella destinazione mancante.' },
            { status: 400 },
          )
        }

        const sourceExists = await itemExistsInFolder(workspace.currentFolderId, sourceItemId)
        const targetAllowed = await isFolderInsideRoot(workspace.rootFolder.id, targetFolderId)

        if (!sourceExists || !targetAllowed) {
          return NextResponse.json(
            { ok: false, error: 'Spostamento non autorizzato.' },
            { status: 403 },
          )
        }

        const payload = await callDriveScript({
          action: 'moveItem',
          folderId: workspace.currentFolderId,
          sourceItemId,
          targetFolderId,
        })

        return NextResponse.json({
          ok: true,
          item: payload.item ?? payload.file ?? payload.folder ?? null,
        })
      }

      return NextResponse.json(
        { ok: false, error: 'Azione non riconosciuta.' },
        { status: 400 },
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files').filter((item): item is File => item instanceof File)
    const requestedFolderId = cleanString(formData.get('folderId'))

    const workspace = await getShareWorkspace(token, requestedFolderId)

    if (workspace.error || !workspace.link || !workspace.rootFolder) {
      return NextResponse.json(
        { ok: false, error: workspace.error || 'Link non valido.' },
        { status: 404 },
      )
    }

    if (!workspace.link.can_upload) {
      return NextResponse.json(
        { ok: false, error: 'Questo link non consente upload.' },
        { status: 403 },
      )
    }

    if (files.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Nessun file ricevuto.' },
        { status: 400 },
      )
    }

    const maxUploadBytes = Number(workspace.link.max_upload_bytes || 4194304)
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
        folderId: workspace.currentFolderId,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64Data: buffer.toString('base64'),
      })

      uploaded.push(payload.file ?? { name: file.name })
    }

    await workspace.supabase
      .from('ai_os_share_links')
      .update({
        use_count: Number(workspace.link.use_count || 0) + 1,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', workspace.link.id)

    return NextResponse.json({
      ok: true,
      property: workspace.property,
      folder: {
        id: workspace.currentFolderId,
      },
      uploaded,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: jsonError(error, 'Errore operazione AI-OS') },
      { status: 500 },
    )
  }
}
