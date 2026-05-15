export type AiOsShareRecipientRole = 'photographer' | 'owner' | 'collaborator' | 'client'

export type AiOsShareFolderConfig = {
  role: AiOsShareRecipientRole
  label: string
  targetFolderName: string
  title: string
  description: string
  accept: string
  primaryAction: string
  secondaryAction: string
  allowCamera: boolean
  allowVideo: boolean
}

export const AI_OS_SHARE_FOLDER_CONFIGS: Record<AiOsShareRecipientRole, AiOsShareFolderConfig> = {
  photographer: {
    role: 'photographer',
    label: 'Fotografo',
    targetFolderName: 'Bozze Immagini e Video',
    title: 'Carica foto e video',
    description:
      'Area riservata al fotografo: i file vengono caricati solo nella cartella bozze dell’immobile.',
    accept: 'image/*,video/*',
    primaryAction: '📷 Fotocamera',
    secondaryAction: '🎥 Video',
    allowCamera: true,
    allowVideo: true,
  },
  owner: {
    role: 'owner',
    label: 'Proprietario immobile',
    targetFolderName: 'Documenti Proprietario',
    title: 'Carica documenti proprietario',
    description:
      'Area riservata al proprietario: carica documenti, PDF e foto dei documenti richiesti dall’agenzia.',
    accept:
      'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    primaryAction: '📄 Documento',
    secondaryAction: '📷 Foto documento',
    allowCamera: true,
    allowVideo: false,
  },
  collaborator: {
    role: 'collaborator',
    label: 'Collaboratore / tecnico',
    targetFolderName: 'Documenti e Planimetrie',
    title: 'Carica materiale tecnico',
    description:
      'Area riservata al collaboratore: carica planimetrie, PDF, immagini e documentazione tecnica.',
    accept:
      'image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    primaryAction: '📁 Carica file',
    secondaryAction: '📷 Foto',
    allowCamera: true,
    allowVideo: true,
  },
  client: {
    role: 'client',
    label: 'Cliente',
    targetFolderName: 'Documenti Cliente',
    title: 'Carica documenti cliente',
    description:
      'Area riservata al cliente: carica solo i documenti richiesti per questa pratica.',
    accept:
      'image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    primaryAction: '📄 Documento',
    secondaryAction: '📷 Foto documento',
    allowCamera: true,
    allowVideo: false,
  },
}

export function normalizeAiOsShareRole(value: unknown): AiOsShareRecipientRole {
  const role = String(value ?? '').trim().toLowerCase()

  if (role === 'owner') return 'owner'
  if (role === 'collaborator') return 'collaborator'
  if (role === 'client') return 'client'

  return 'photographer'
}

export function getAiOsShareFolderConfig(value: unknown): AiOsShareFolderConfig {
  return AI_OS_SHARE_FOLDER_CONFIGS[normalizeAiOsShareRole(value)]
}

export function getAiOsShareTargetFolderName(role: unknown, fallback?: unknown) {
  const custom = String(fallback ?? '').trim()

  if (custom) return custom

  return getAiOsShareFolderConfig(role).targetFolderName
}
