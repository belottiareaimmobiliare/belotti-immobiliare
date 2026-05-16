export type AiOsDriveStandardFolderKey =
  | 'draft_media'
  | 'owner_documents'
  | 'plans_documents'
  | 'agency_material'
  | 'site_publication'

export type AiOsDriveStandardFolder = {
  key: AiOsDriveStandardFolderKey
  name: string
  description: string
}

export const AI_OS_DRIVE_STANDARD_FOLDERS: AiOsDriveStandardFolder[] = [
  {
    key: 'draft_media',
    name: 'Bozze Immagini e Video',
    description: 'Fotografi e incaricati media. Possono caricare foto e video, ma non salire alla cartella immobile.',
  },
  {
    key: 'owner_documents',
    name: 'Documenti Proprietario',
    description: 'Proprietario immobile. Documenti personali, deleghe, certificati e file richiesti.',
  },
  {
    key: 'plans_documents',
    name: 'Documenti e Planimetrie',
    description: 'Tecnici e collaboratori. Planimetrie, PDF, APE e documentazione tecnica.',
  },
  {
    key: 'agency_material',
    name: 'Materiale Agenzia',
    description: 'Materiale interno agenzia. Da condividere solo con utenti interni o collaboratori fidati.',
  },
  {
    key: 'site_publication',
    name: 'Pubblicazione Sito',
    description: 'File pronti per pubblicazione, caroselli, immagini finali e materiale approvato.',
  },
]

export function normalizeDriveFolderName(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function getStandardFolderByKey(value: unknown) {
  const key = String(value ?? '').trim()
  return AI_OS_DRIVE_STANDARD_FOLDERS.find((folder) => folder.key === key) ?? null
}
