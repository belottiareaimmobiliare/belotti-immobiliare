import { google, drive_v3 } from 'googleapis'
import { Readable } from 'node:stream'

export type AiOsDriveFileKind =
  | 'folder'
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'text'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'file'

export type AiOsDriveFile = {
  id: string
  name: string
  mimeType: string
  kind: AiOsDriveFileKind
  size: string | null
  webViewLink: string | null
  webContentLink: string | null
  thumbnailLink: string | null
  iconLink: string | null
  createdTime: string | null
  modifiedTime: string | null
  parents: string[]
  previewUrl: string | null
  downloadUrl: string | null
}

type ServiceAccountConfig = {
  clientEmail: string
  privateKey: string
}

let driveClient: drive_v3.Drive | null = null

export const AI_OS_DRIVE_FIELDS =
  'id,name,mimeType,size,webViewLink,webContentLink,thumbnailLink,iconLink,createdTime,modifiedTime,parents'

function decodeServiceAccountFromBase64(): ServiceAccountConfig | null {
  const raw =
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 ||
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_KEY_BASE64

  if (!raw) return null

  const parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'))

  if (!parsed.client_email || !parsed.private_key) {
    throw new Error('Service account Base64 presente ma incompleto: mancano client_email/private_key.')
  }

  return {
    clientEmail: parsed.client_email,
    privateKey: String(parsed.private_key).replace(/\\n/g, '\n'),
  }
}

function getServiceAccountConfig(): ServiceAccountConfig {
  const fromBase64 = decodeServiceAccountFromBase64()
  if (fromBase64) return fromBase64

  const clientEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    process.env.GOOGLE_DRIVE_CLIENT_EMAIL

  const privateKey =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    process.env.GOOGLE_DRIVE_PRIVATE_KEY

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Config Google Drive mancante. Servono GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY oppure GOOGLE_SERVICE_ACCOUNT_KEY_BASE64.'
    )
  }

  return {
    clientEmail,
    privateKey: privateKey.replace(/\\n/g, '\n'),
  }
}

export function getAiOsRootFolderId() {
  const folderId =
    process.env.GOOGLE_DRIVE_AI_OS_ROOT_FOLDER_ID ||
    process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID

  if (!folderId) {
    throw new Error('Manca GOOGLE_DRIVE_AI_OS_ROOT_FOLDER_ID oppure GOOGLE_DRIVE_ROOT_FOLDER_ID.')
  }

  return folderId
}

export function getAiOsDrive() {
  if (driveClient) return driveClient

  const config = getServiceAccountConfig()

  const auth = new google.auth.JWT({
    email: config.clientEmail,
    key: config.privateKey,
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  driveClient = google.drive({
    version: 'v3',
    auth,
  })

  return driveClient
}

export function getDriveErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return 'Errore Drive non gestito.'
}

export function escapeDriveQueryValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

export function sanitizeAiOsFileName(name: string) {
  return name
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 180)
}

export function getAiOsFileKind(mimeType?: string | null): AiOsDriveFileKind {
  if (!mimeType) return 'file'

  if (mimeType === 'application/vnd.google-apps.folder') return 'folder'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('text/')) return 'text'

  if (mimeType === 'application/vnd.google-apps.document') return 'document'
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'spreadsheet'
  if (mimeType === 'application/vnd.google-apps.presentation') return 'presentation'

  return 'file'
}

export function normalizeAiOsDriveFile(file: drive_v3.Schema$File): AiOsDriveFile {
  const id = file.id || ''
  const mimeType = file.mimeType || 'application/octet-stream'
  const kind = getAiOsFileKind(mimeType)

  const canPreviewInternally =
    kind === 'image' ||
    kind === 'video' ||
    kind === 'audio' ||
    kind === 'pdf' ||
    kind === 'text'

  return {
    id,
    name: file.name || 'Senza nome',
    mimeType,
    kind,
    size: file.size || null,
    webViewLink: file.webViewLink || null,
    webContentLink: file.webContentLink || null,
    thumbnailLink: file.thumbnailLink || null,
    iconLink: file.iconLink || null,
    createdTime: file.createdTime || null,
    modifiedTime: file.modifiedTime || null,
    parents: file.parents || [],
    previewUrl: canPreviewInternally && id ? `/api/admin/ai-os/drive/file/${id}?raw=1` : null,
    downloadUrl: id ? `/api/admin/ai-os/drive/file/${id}?raw=1&download=1` : null,
  }
}

export async function listAiOsDriveFiles(parentId?: string, pageToken?: string | null) {
  const drive = getAiOsDrive()
  const folderId = parentId || getAiOsRootFolderId()

  const response = await drive.files.list({
    q: `'${escapeDriveQueryValue(folderId)}' in parents and trashed = false`,
    pageSize: 100,
    pageToken: pageToken || undefined,
    orderBy: 'folder,name_natural',
    fields: `nextPageToken,files(${AI_OS_DRIVE_FIELDS})`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  return {
    folderId,
    files: (response.data.files || []).map(normalizeAiOsDriveFile),
    nextPageToken: response.data.nextPageToken || null,
  }
}

export async function findAiOsFolder(parentId: string, name: string) {
  const drive = getAiOsDrive()
  const safeName = escapeDriveQueryValue(name)

  const response = await drive.files.list({
    q:
      `'${escapeDriveQueryValue(parentId)}' in parents and ` +
      `trashed = false and ` +
      `mimeType = 'application/vnd.google-apps.folder' and ` +
      `name = '${safeName}'`,
    pageSize: 1,
    fields: `files(${AI_OS_DRIVE_FIELDS})`,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  const found = response.data.files?.[0]
  return found ? normalizeAiOsDriveFile(found) : null
}

export async function createAiOsFolder(parentId: string, name: string) {
  const drive = getAiOsDrive()
  const cleanName = sanitizeAiOsFileName(name)

  if (!cleanName) {
    throw new Error('Nome cartella non valido.')
  }

  const response = await drive.files.create({
    requestBody: {
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: AI_OS_DRIVE_FIELDS,
    supportsAllDrives: true,
  })

  return normalizeAiOsDriveFile(response.data)
}

export async function ensureAiOsFolder(parentId: string, name: string) {
  const existing = await findAiOsFolder(parentId, name)
  if (existing) return existing
  return createAiOsFolder(parentId, name)
}

export async function ensureAiOsDesktopFolders() {
  const rootFolderId = getAiOsRootFolderId()

  const [immobili, strumenti, theme] = await Promise.all([
    ensureAiOsFolder(rootFolderId, 'Immobili'),
    ensureAiOsFolder(rootFolderId, 'Strumenti'),
    ensureAiOsFolder(rootFolderId, 'Theme'),
  ])

  return {
    rootFolderId,
    folders: {
      immobili,
      strumenti,
      theme,
    },
  }
}

export async function uploadAiOsDriveFile(params: {
  parentId?: string
  name: string
  mimeType: string
  buffer: Buffer
}) {
  const drive = getAiOsDrive()
  const parentId = params.parentId || getAiOsRootFolderId()
  const cleanName = sanitizeAiOsFileName(params.name)

  if (!cleanName) {
    throw new Error('Nome file non valido.')
  }

  const response = await drive.files.create({
    requestBody: {
      name: cleanName,
      parents: [parentId],
    },
    media: {
      mimeType: params.mimeType || 'application/octet-stream',
      body: Readable.from(params.buffer),
    },
    fields: AI_OS_DRIVE_FIELDS,
    supportsAllDrives: true,
  })

  return normalizeAiOsDriveFile(response.data)
}

export async function saveAiOsTextFile(params: {
  fileId?: string
  parentId?: string
  name?: string
  content: string
}) {
  const drive = getAiOsDrive()
  const body = Readable.from(Buffer.from(params.content || '', 'utf8'))

  if (params.fileId) {
    const response = await drive.files.update({
      fileId: params.fileId,
      requestBody: params.name ? { name: sanitizeAiOsFileName(params.name) } : undefined,
      media: {
        mimeType: 'text/plain; charset=utf-8',
        body,
      },
      fields: AI_OS_DRIVE_FIELDS,
      supportsAllDrives: true,
    })

    return normalizeAiOsDriveFile(response.data)
  }

  const parentId = params.parentId || getAiOsRootFolderId()
  const cleanName = sanitizeAiOsFileName(params.name || 'Nuovo documento.txt')

  const response = await drive.files.create({
    requestBody: {
      name: cleanName.endsWith('.txt') ? cleanName : `${cleanName}.txt`,
      parents: [parentId],
    },
    media: {
      mimeType: 'text/plain; charset=utf-8',
      body,
    },
    fields: AI_OS_DRIVE_FIELDS,
    supportsAllDrives: true,
  })

  return normalizeAiOsDriveFile(response.data)
}

export async function getAiOsDriveFileMetadata(fileId: string) {
  const drive = getAiOsDrive()

  const response = await drive.files.get({
    fileId,
    fields: AI_OS_DRIVE_FIELDS,
    supportsAllDrives: true,
  })

  return normalizeAiOsDriveFile(response.data)
}

export async function getAiOsDriveFileBuffer(fileId: string) {
  const drive = getAiOsDrive()

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'arraybuffer',
    }
  )

  return Buffer.from(response.data as ArrayBuffer)
}

export async function getAiOsDriveFileStream(fileId: string) {
  const drive = getAiOsDrive()

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
      supportsAllDrives: true,
    },
    {
      responseType: 'stream',
    }
  )

  return response.data as Readable
}
