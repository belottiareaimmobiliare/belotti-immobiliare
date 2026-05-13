'use client'

import { ChangeEvent, DragEvent, MouseEvent, WheelEvent, useEffect, useMemo, useState } from 'react'
import { JetBrains_Mono } from 'next/font/google'
import { createClient } from '@/lib/supabase/client'

const jetBrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

type AIOSFileKind = 'image' | 'video' | 'pdf' | 'txt' | 'plan' | 'generic'
type AIOSFileStatus = 'saved' | 'local' | 'uploading' | 'error'
type AIOSSection = 'root' | 'images' | 'docs'
type AIOSAgencyToolId =
  | 'visure'
  | 'owner-data'
  | 'owner-docs'
  | 'mandate'
  | 'checklist'
  | 'showcase'
  | 'social'
  | 'visit'
  | 'drive'

type AIOSAgencyTool = {
  id: AIOSAgencyToolId
  label: string
  icon: string
  description: string
  status: string
  primaryAction: string
}


type AIOSFile = {
  id: string
  name: string
  kind: AIOSFileKind
  size?: string
  sizeBytes?: number
  content?: string
  status?: AIOSFileStatus
  mimeType?: string
  previewUrl?: string
  storagePath?: string
  folderType?: AIOSSection
  customFolderId?: string | null
  propertyMediaId?: string
  isGalleryVisible?: boolean
  uploadProgress?: number
  uploadError?: string
  createdAt?: string
  updatedAt?: string
}

type AIOSDriveSettings = {
  id: string
  singleton_key: string
  drive_root_name?: string | null
  drive_root_url?: string | null
  drive_root_folder_id?: string | null
  large_file_threshold_mb: number
  storage_strategy: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

type AIOSDriveSettingsForm = {
  driveRootName: string
  driveRootUrl: string
  largeFileThresholdMb: string
  notes: string
}

type AIOSDriveFolder = {
  id: string
  property_id: string
  folder_name?: string | null
  drive_folder_url?: string | null
  drive_folder_id?: string | null
  sync_status: string
  notes?: string | null
  last_sync_at?: string | null
  created_at?: string
  updated_at?: string
}

type AIOSDriveFolderForm = {
  folderName: string
  driveFolderUrl: string
  syncStatus: string
  notes: string
}


type AIOSDriveExplorerFolder = {
  id: string
  name: string
  url: string
}

type AIOSDriveExplorerFile = {
  id: string
  name: string
  url: string
  mimeType?: string
  size?: number
  updatedAt?: string
}

type AIOSDriveExplorerData = {
  folder: AIOSDriveExplorerFolder | null
  folders: AIOSDriveExplorerFolder[]
  files: AIOSDriveExplorerFile[]
}

type AIOSDriveExplorerItem =
  | { type: 'folder'; folder: AIOSDriveExplorerFolder }
  | { type: 'file'; file: AIOSDriveExplorerFile }

type AIOSDriveItemContextMenu = {
  x: number
  y: number
  item: AIOSDriveExplorerItem
} | null

type AIOSCustomFolder = {
  id: string
  property_id: string
  parent_folder_type: AIOSSection
  parent_custom_folder_id?: string | null
  name: string
  sort_order?: number
  is_deleted?: boolean
  created_at?: string
  updated_at?: string
}

type AIOSFolder = {
  id: string
  name: string
  propertyRef: string
  address: string
  owner: string
  fileCount?: number
  visualState?: AIOSFolderVisualState
  visualReason?: string
  statusStats?: {
    fileCount?: number
    ownerCount?: number
    mandateCount?: number
    mandateActiveCount?: number
    checklistDoneCount?: number
    checklistExpectedCount?: number
    ownerDocsGoodCount?: number
    ownerDocsExpectedCount?: number
    driveCount?: number
  }
  files: AIOSFile[]
}

type AIOSContextMenu = {
  x: number
  y: number
  fileId: string
  fileName: string
} | null

type AIOSPropertyOwner = {
  id: string
  property_id: string
  owner_type: string
  role: string
  full_name: string
  email?: string | null
  phone?: string | null
  tax_code?: string | null
  vat_number?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  notes?: string | null
  is_primary: boolean
  created_at?: string
  updated_at?: string
}

type AIOSPropertyOwnerForm = {
  ownerType: string
  role: string
  fullName: string
  email: string
  phone: string
  taxCode: string
  vatNumber: string
  address: string
  city: string
  province: string
  notes: string
  isPrimary: boolean
}

type AIOSPropertyMandate = {
  id: string
  property_id: string
  owner_name: string
  mandate_type: string
  assignment_type: string
  status: string
  start_date?: string | null
  end_date?: string | null
  asking_price?: number | string | null
  commission_rate?: number | string | null
  flat_fee?: number | string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}

type AIOSPropertyMandateForm = {
  ownerName: string
  mandateType: string
  assignmentType: string
  status: string
  startDate: string
  endDate: string
  askingPrice: string
  commissionRate: string
  flatFee: string
  notes: string
}

type AIOSOwnerDocument = {
  id: string
  property_id: string
  document_key: string
  label: string
  status: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

type AIOSChecklistItem = {
  id: string
  property_id: string
  item_key: string
  label: string
  is_done: boolean
  notes?: string | null
  created_at?: string
  updated_at?: string
}

type AIOSDocumentRequest = {
  id: string
  property_id: string
  request_type: string
  status: string
  title: string
  notes?: string | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
}

type AIOSQuotaStatus = {
  total_bytes: number
  warn_total_bytes: number
  max_total_bytes: number
  remaining_total_bytes: number
  total_files: number
  max_total_files: number
  usage_percent: number
  is_warning: boolean
  is_blocked: boolean
}

const AI_OS_LARGE_FILE_THRESHOLD_BYTES = 45 * 1024 * 1024
const AI_OS_VIDEO_TARGET_BYTES = 42 * 1024 * 1024

const AI_OS_MAX_TOTAL_BYTES = 838860800
const AI_OS_WARN_TOTAL_BYTES = 681574400

const AI_OS_SECTIONS: Array<{
  id: Exclude<AIOSSection, 'root'>
  label: string
  icon: string
  description: string
}> = [
  {
    id: 'images',
    label: 'Immagini',
    icon: '🖼️',
    description: 'Solo foto e video. Le foto sono visibili anche nella galleria immobile.',
  },
  {
    id: 'docs',
    label: 'Docs e planimetrie',
    icon: '📐',
    description: 'Documenti, PDF, planimetrie, immagini, video e note TXT.',
  },
]


const AI_OS_AGENCY_TOOLS: AIOSAgencyTool[] = [
  {
    id: 'visure',
    label: 'Richiedi visura',
    icon: '🏛️',
    description: 'Prepara la richiesta di visure catastali, camerali o ipocatastali collegate all’immobile.',
    status: 'Pronto per integrazione API',
    primaryAction: 'Apri richiesta',
  },
  {
    id: 'owner-data',
    label: 'Dati proprietario',
    icon: '👤',
    description: 'Consulta e completa i dati del proprietario, locatore, venditore o referente società.',
    status: 'Anagrafica immobile',
    primaryAction: 'Apri dati',
  },
  {
    id: 'owner-docs',
    label: 'Documenti proprietario',
    icon: '🪪',
    description: 'Raccogli documenti identità, codice fiscale, deleghe e allegati riservati.',
    status: 'Fascicolo riservato',
    primaryAction: 'Gestisci documenti',
  },
  {
    id: 'mandate',
    label: 'Genera incarico',
    icon: '📝',
    description: 'Prepara incarico di vendita o locazione partendo dai dati già presenti.',
    status: 'Bozza operativa',
    primaryAction: 'Prepara incarico',
  },
  {
    id: 'checklist',
    label: 'Checklist documenti',
    icon: '✅',
    description: 'Controlla cosa manca prima della pubblicazione o della trattativa.',
    status: 'Controllo qualità',
    primaryAction: 'Apri checklist',
  },
  {
    id: 'showcase',
    label: 'Cartello vetrina',
    icon: '🧾',
    description: 'Genera un cartello vetrina con foto, prezzo, riferimento e QR alla scheda immobile.',
    status: 'Marketing immobile',
    primaryAction: 'Genera cartello',
  },
  {
    id: 'social',
    label: 'Crea post social',
    icon: '📲',
    description: 'Prepara testo social, CTA e contenuti promozionali dell’immobile.',
    status: 'Facebook / TikTok',
    primaryAction: 'Crea contenuto',
  },
  {
    id: 'visit',
    label: 'Fissa visita',
    icon: '📅',
    description: 'Segna una visita o un appuntamento collegato a immobile e richiesta ricevuta.',
    status: 'Agenda agenzia',
    primaryAction: 'Nuova visita',
  },
  {
    id: 'drive',
    label: 'Drive archivio',
    icon: '☁️',
    description: 'Collega la cartella Google Drive dell’immobile per video pesanti, originali e documenti grandi.',
    status: 'Archivio esterno free',
    primaryAction: 'Collega Drive',
  },
]

const AI_OS_VISURA_OPTIONS = [
  {
    id: 'cadastral_property',
    label: 'Visura catastale immobile',
    hint: 'Documento collegato ai dati catastali dell’immobile.',
  },
  {
    id: 'cadastral_subject',
    label: 'Visura catastale soggetto',
    hint: 'Documento collegato a codice fiscale o intestatario.',
  },
  {
    id: 'chamber_company',
    label: 'Visura camerale società',
    hint: 'Utile quando il proprietario o referente è una società.',
  },
  {
    id: 'mortgage',
    label: 'Visura ipotecaria / ipocatastale',
    hint: 'Controllo più avanzato su provenienza, gravami e formalità.',
  },
  {
    id: 'cadastral_plan',
    label: 'Planimetria catastale',
    hint: 'Da usare per recuperare o verificare la planimetria.',
  },
  {
    id: 'floor_plan_elaboration',
    label: 'Elaborato planimetrico',
    hint: 'Utile per immobili in condominio o complessi articolati.',
  },
]

const AI_OS_OWNER_DOCUMENTS = [
  { id: 'identity_document', label: 'Documento identità' },
  { id: 'tax_code_card', label: 'Codice fiscale / tessera sanitaria' },
  { id: 'signed_mandate', label: 'Incarico firmato' },
  { id: 'privacy_consent', label: 'Privacy / trattamento dati' },
  { id: 'delegation', label: 'Delega, se presente' },
  { id: 'company_document', label: 'Documento società / visura camerale' },
]

const AI_OS_CHECKLIST_ITEMS = [
  { id: 'owner_data', label: 'Dati proprietario completi' },
  { id: 'owner_identity', label: 'Documento identità proprietario' },
  { id: 'owner_tax_code', label: 'Codice fiscale proprietario' },
  { id: 'mandate_signed', label: 'Incarico firmato' },
  { id: 'cadastral_document', label: 'Visura catastale aggiornata' },
  { id: 'cadastral_plan', label: 'Planimetria catastale' },
  { id: 'energy_certificate', label: 'APE / classe energetica' },
  { id: 'media_ready', label: 'Foto e video caricati' },
]

const desktopFolders = [
  {
    id: 'properties',
    label: 'Immobili',
    icon: '📁',
    hint: 'Cartelle immobili',
  },
  {
    id: 'uploads',
    label: 'Upload',
    icon: '⬆️',
    hint: 'Foto e video',
  },
  {
    id: 'notes',
    label: 'Note TXT',
    icon: '📝',
    hint: 'File modificabili',
  },
  {
    id: 'settings',
    label: 'Aspetto',
    icon: '⚙️',
    hint: 'Solo admin',
  },
  {
    id: 'drive-settings',
    label: 'Drive',
    icon: '☁️',
    hint: 'Archivio free',
  },
]

function getFileKind(file: File): AIOSFileKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf') return 'pdf'
  if (file.name.toLowerCase().endsWith('.txt')) return 'txt'
  return 'generic'
}

function canUploadFileInSection(file: File, section: AIOSSection) {
  if (section !== 'images') return true

  return file.type.startsWith('image/') || file.type.startsWith('video/')
}

function getUploadAccept(section: AIOSSection) {
  if (section === 'images') return 'image/*,video/*'

  return undefined
}

function createEmptyDriveFolderForm(): AIOSDriveFolderForm {
  return {
    folderName: '',
    driveFolderUrl: '',
    syncStatus: 'pending_creation',
    notes: '',
  }
}

function createEmptyDriveSettingsForm(): AIOSDriveSettingsForm {
  return {
    driveRootName: 'Belotti AI-OS / Archivio Immobili',
    driveRootUrl: '',
    largeFileThresholdMb: '45',
    notes: 'Drive viene usato come archivio free per video e documenti pesanti. Supabase resta lo storage ufficiale per galleria pubblica e file sito.',
  }
}

function createEmptyMandateForm(prefillOwnerName = ''): AIOSPropertyMandateForm {
  return {
    ownerName: prefillOwnerName,
    mandateType: 'sale',
    assignmentType: 'exclusive',
    status: 'draft',
    startDate: '',
    endDate: '',
    askingPrice: '',
    commissionRate: '',
    flatFee: '',
    notes: '',
  }
}

function createEmptyOwnerForm(): AIOSPropertyOwnerForm {
  return {
    ownerType: 'person',
    role: 'owner',
    fullName: '',
    email: '',
    phone: '',
    taxCode: '',
    vatNumber: '',
    address: '',
    city: '',
    province: '',
    notes: '',
    isPrimary: false,
  }
}

function ownerRoleLabel(role: string) {
  if (role === 'owner') return 'Proprietario'
  if (role === 'co_owner') return 'Comproprietario'
  if (role === 'seller') return 'Venditore'
  if (role === 'landlord') return 'Locatore'
  if (role === 'company_representative') return 'Referente società'
  return role || 'Proprietario'
}

function ownerTypeLabel(type: string) {
  if (type === 'company') return 'Società'
  return 'Persona fisica'
}

function labelForDriveSyncStatus(status: string) {
  if (status === 'pending_creation') return 'Da creare'
  if (status === 'ready_to_import') return 'Pronto per import'
  if (status === 'synced') return 'Sync OK'
  return 'Collegato'
}

function classForDriveSyncStatus(status: string) {
  if (status === 'pending_creation') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'ready_to_import') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'synced') return 'border-[#A3BE8C]/30 bg-[#A3BE8C]/12 text-[#A3BE8C]'
  return 'border-[#88C0D0]/30 bg-[#88C0D0]/12 text-[#88C0D0]'
}

function labelForMandateStatus(status: string) {
  if (status === 'active') return 'Attivo'
  if (status === 'expired') return 'Scaduto'
  if (status === 'closed') return 'Chiuso'
  return 'Bozza'
}

function classForMandateStatus(status: string) {
  if (status === 'active') return 'border-[#A3BE8C]/30 bg-[#A3BE8C]/12 text-[#A3BE8C]'
  if (status === 'expired') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'closed') return 'border-[#88C0D0]/30 bg-[#88C0D0]/12 text-[#88C0D0]'
  return 'border-[#B48EAD]/25 bg-[#B48EAD]/10 text-[#E5E9F0]'
}

function labelForOwnerDocumentStatus(status: string) {
  if (status === 'missing') return 'Da ricevere'
  if (status === 'received') return 'Ricevuto'
  if (status === 'verified') return 'Verificato'
  if (status === 'not_needed') return 'Non necessario'
  return status || 'Da ricevere'
}

function classForOwnerDocumentStatus(status: string) {
  if (status === 'verified') return 'border-[#A3BE8C]/30 bg-[#A3BE8C]/12 text-[#A3BE8C]'
  if (status === 'received') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'not_needed') return 'border-[#88C0D0]/30 bg-[#88C0D0]/12 text-[#88C0D0]'
  return 'border-[#BF616A]/30 bg-[#BF616A]/10 text-[#BF616A]'
}

function labelForDocumentRequestStatus(status: string) {
  if (status === 'todo') return 'Da richiedere'
  if (status === 'working') return 'In lavorazione'
  if (status === 'completed') return 'Completata'
  if (status === 'cancelled') return 'Annullata'
  return status || 'Da verificare'
}

function classForDocumentRequestStatus(status: string) {
  if (status === 'completed') return 'border-[#A3BE8C]/30 bg-[#A3BE8C]/12 text-[#A3BE8C]'
  if (status === 'working') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'cancelled') return 'border-[#BF616A]/35 bg-[#BF616A]/12 text-[#BF616A]'
  return 'border-[#B48EAD]/25 bg-[#B48EAD]/10 text-[#E5E9F0]'
}

type AIOSFolderVisualState = 'off' | 'blue' | 'green' | 'yellow' | 'red'

function folderLedClass(state: AIOSFolderVisualState) {
  if (state === 'green') return 'bg-[#A3BE8C] shadow-[0_0_18px_rgba(163,190,140,0.95)] ring-[#A3BE8C]/45'
  if (state === 'yellow') return 'bg-[#EBCB8B] shadow-[0_0_18px_rgba(235,203,139,0.95)] ring-[#EBCB8B]/45'
  if (state === 'red') return 'bg-[#BF616A] shadow-[0_0_18px_rgba(191,97,106,0.95)] ring-[#BF616A]/45'
  if (state === 'blue') return 'bg-[#88C0D0] shadow-[0_0_18px_rgba(136,192,208,0.90)] ring-[#88C0D0]/45'
  return 'bg-[#5A6372] shadow-[0_0_10px_rgba(216,222,233,0.22)] ring-[#6B7484]/35'
}

function folderCardClass(state: AIOSFolderVisualState, isActive: boolean) {
  if (state === 'green') {
    return isActive
      ? 'border-[#A3BE8C]/70 bg-[#263528]/88 text-white shadow-[inset_4px_0_0_rgba(163,190,140,0.95),0_0_26px_rgba(163,190,140,0.18)]'
      : 'border-[#A3BE8C]/46 bg-[#222B28]/78 text-[#D8DEE9] shadow-[inset_4px_0_0_rgba(163,190,140,0.88),0_0_18px_rgba(163,190,140,0.10)] hover:border-[#A3BE8C]/70 hover:bg-[#263528]/92'
  }

  if (state === 'yellow') {
    return isActive
      ? 'border-[#EBCB8B]/76 bg-[#343023]/90 text-white shadow-[inset_4px_0_0_rgba(235,203,139,0.98),0_0_28px_rgba(235,203,139,0.20)]'
      : 'border-[#EBCB8B]/54 bg-[#2D2A22]/82 text-[#D8DEE9] shadow-[inset_4px_0_0_rgba(235,203,139,0.90),0_0_18px_rgba(235,203,139,0.12)] hover:border-[#EBCB8B]/78 hover:bg-[#343023]/92'
  }

  if (state === 'red') {
    return isActive
      ? 'border-[#BF616A]/78 bg-[#33252A]/90 text-white shadow-[inset_4px_0_0_rgba(191,97,106,0.98),0_0_28px_rgba(191,97,106,0.20)]'
      : 'border-[#BF616A]/54 bg-[#2D252B]/82 text-[#D8DEE9] shadow-[inset_4px_0_0_rgba(191,97,106,0.90),0_0_18px_rgba(191,97,106,0.12)] hover:border-[#BF616A]/78 hover:bg-[#33252A]/92'
  }

  if (state === 'blue') {
    return isActive
      ? 'border-[#88C0D0]/72 bg-[#243241]/90 text-white shadow-[inset_4px_0_0_rgba(136,192,208,0.95),0_0_26px_rgba(136,192,208,0.18)]'
      : 'border-[#88C0D0]/46 bg-[#222B37]/80 text-[#D8DEE9] shadow-[inset_4px_0_0_rgba(136,192,208,0.86),0_0_18px_rgba(136,192,208,0.10)] hover:border-[#88C0D0]/72 hover:bg-[#243241]/92'
  }

  return isActive
    ? 'border-[#6B7484]/62 bg-[#29313D]/88 text-white shadow-[inset_4px_0_0_rgba(107,116,132,0.75),0_0_18px_rgba(216,222,233,0.06)]'
    : 'border-[#4C566A]/54 bg-[#202632]/78 text-[#D8DEE9] shadow-[inset_4px_0_0_rgba(76,86,106,0.65)] hover:border-[#8FBCBB]/42 hover:bg-[#252D3A]/88'
}

function folderStateLabel(state: AIOSFolderVisualState) {
  if (state === 'green') return 'OK'
  if (state === 'yellow') return 'ATTESA'
  if (state === 'red') return 'CRITICO'
  if (state === 'blue') return 'POPOLATA'
  return 'VUOTA'
}

function folderStateTextClass(state: AIOSFolderVisualState) {
  if (state === 'green') return 'text-[#A3BE8C]'
  if (state === 'yellow') return 'text-[#EBCB8B]'
  if (state === 'red') return 'text-[#BF616A]'
  if (state === 'blue') return 'text-[#88C0D0]'
  return 'text-[#8A95A6]'
}

function agencyToolLedClass(toolId: AIOSAgencyToolId) {
  if (toolId === 'checklist') return 'bg-[#A3BE8C] shadow-[0_0_12px_rgba(163,190,140,0.80)]'
  if (toolId === 'visure' || toolId === 'owner-docs' || toolId === 'visit' || toolId === 'drive') {
    return 'bg-[#EBCB8B] shadow-[0_0_12px_rgba(235,203,139,0.78)]'
  }
  if (toolId === 'owner-data' || toolId === 'mandate' || toolId === 'showcase' || toolId === 'social') {
    return 'bg-[#88C0D0] shadow-[0_0_12px_rgba(136,192,208,0.75)]'
  }

  return 'bg-[#4C566A]'
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}


function readFileAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const result = String(reader.result || '')
      const commaIndex = result.indexOf(',')

      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result)
    }

    reader.onerror = () => reject(reader.error || new Error('Errore lettura file'))
    reader.readAsDataURL(file)
  })
}

function bytesToMb(bytes: number) {
  return bytes / 1024 / 1024
}

function formatQuotaMb(bytes: number) {
  return bytesToMb(bytes).toFixed(1)
}

function isGoogleDocsPreviewable(file: AIOSFile) {
  const mimeType = (file.mimeType ?? '').toLowerCase()
  const name = file.name.toLowerCase()

  return (
    mimeType === 'application/msword' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/vnd.ms-excel' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    mimeType === 'application/vnd.ms-powerpoint' ||
    mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
    name.endsWith('.doc') ||
    name.endsWith('.docx') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  )
}

function getGoogleDocsViewerUrl(fileUrl: string) {
  return `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(fileUrl)}`
}

function iconForFile(kind: AIOSFileKind) {
  switch (kind) {
    case 'image':
      return '🖼️'
    case 'video':
      return '🎥'
    case 'pdf':
      return '📄'
    case 'plan':
      return '📐'
    case 'txt':
      return '📝'
    default:
      return '📦'
  }
}

function AIOSQuotaBar({
  usedBytes,
  maxBytes,
  warnBytes,
  compact = false,
}: {
  usedBytes: number
  maxBytes: number
  warnBytes: number
  compact?: boolean
}) {
  const percent = Math.min(100, Math.max(0, (usedBytes / maxBytes) * 100))
  const isWarning = usedBytes >= warnBytes
  const isBlocked = usedBytes >= maxBytes

  return (
    <div
      className={`rounded-2xl border bg-[#2E3440]/35 backdrop-blur-2xl ${
        compact
          ? 'border-[#8FBCBB]/15 px-3 py-2'
          : 'border-[#8FBCBB]/20 px-4 py-3 shadow-2xl shadow-black/25'
      }`}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${ isBlocked ? 'bg-[#BF616A] shadow-[0_0_14px_rgba(248,113,113,0.9)]' : isWarning ? 'bg-[#D08770] shadow-[0_0_14px_rgba(253,186,116,0.9)]' : 'border border-[#A3BE8C]/55 bg-[#A3BE8C] shadow-[0_0_14px_rgba(110,231,183,0.9)]' } hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75`}
          />
          <span className="text-[10px] font-semibold uppercase tracking-[0.26em] text-[#88C0D0]/80">
            Quota
          </span>
        </div>

        <span className="font-mono text-[11px] font-semibold text-[#ECEFF4]">
          {formatQuotaMb(usedBytes)} MB / {formatQuotaMb(maxBytes)} MB
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full border border-[#8FBCBB]/10 bg-[#2E3440]/70">
        <div
          className={`h-full rounded-full transition-all duration-500 ${ isBlocked ? 'bg-[#BF616A] shadow-[0_0_18px_rgba(248,113,113,0.85)]' : isWarning ? 'bg-[#D08770] shadow-[0_0_18px_rgba(253,186,116,0.85)]' : 'border border-[#A3BE8C]/55 bg-[#A3BE8C] shadow-[0_0_18px_rgba(110,231,183,0.85)]' } hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function normalizeFileFromApi(file: AIOSFile): AIOSFile {
  return {
    ...file,
    status: 'saved',
    uploadProgress: undefined,
    uploadError: undefined,
  }
}

function uploadFileWithProgress({
  propertyId,
  folderType,
  file,
  onProgress,
}: {
  propertyId: string
  folderType: AIOSSection
  file: File
  onProgress: (progress: number) => void
}) {
  return new Promise<AIOSFile>((resolve, reject) => {
    let fakeProgress = 1
    let progressTimer: number | null = null

    const stopProgress = () => {
      if (progressTimer) {
        window.clearInterval(progressTimer)
        progressTimer = null
      }
    }

    const startProgress = () => {
      stopProgress()

      progressTimer = window.setInterval(() => {
        fakeProgress = Math.min(
          92,
          fakeProgress + Math.max(1, Math.round((92 - fakeProgress) / 8)),
        )

        onProgress(fakeProgress)

        if (fakeProgress >= 92) {
          stopProgress()
        }
      }, 280)
    }

    async function runUpload() {
      try {
        onProgress(1)

        const prepareResponse = await fetch('/api/admin/ai-os/prepare-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            folderType,
            fileName: file.name,
            mimeType: file.type || '',
            sizeBytes: file.size,
          }),
        })

        const preparePayload = await prepareResponse.json().catch(() => null)

        if (!prepareResponse.ok) {
          throw new Error(
            preparePayload?.error ||
              `Errore preparazione upload AI-OS. HTTP ${prepareResponse.status}`,
          )
        }

        const upload = preparePayload?.upload

        if (!upload?.path || !upload?.token || !upload?.bucket) {
          throw new Error('Signed upload URL non valido')
        }

        onProgress(5)
        startProgress()

        const supabase = createClient()

        const { error: uploadError } = await supabase.storage
          .from(upload.bucket)
          .uploadToSignedUrl(upload.path, upload.token, file, {
            contentType: file.type || undefined,
            upsert: false,
          })

        if (uploadError) {
          throw new Error(uploadError.message || 'Errore upload Supabase Storage')
        }

        stopProgress()
        onProgress(96)

        const completeResponse = await fetch('/api/admin/ai-os/complete-upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            propertyId,
            folderType,
            fileName: file.name,
            mimeType: file.type || '',
            sizeBytes: file.size,
            storagePath: upload.path,
            storageBucket: upload.bucket,
          }),
        })

        const completePayload = await completeResponse.json().catch(() => null)

        if (!completeResponse.ok || !completePayload?.file) {
          throw new Error(
            completePayload?.error ||
              `Errore completamento upload AI-OS. HTTP ${completeResponse.status}`,
          )
        }

        onProgress(100)
        resolve(normalizeFileFromApi(completePayload.file))
      } catch (error) {
        stopProgress()
        reject(error)
      }
    }

    void runUpload()
  })
}

export default function AIOSDesktop() {
  const [folders, setFolders] = useState<AIOSFolder[]>([])
  const [foldersLoading, setFoldersLoading] = useState(true)
  const [folderSearchQuery, setFolderSearchQuery] = useState('')
  const [activeFolderId, setActiveFolderId] = useState<string>('')
  const [activeSection, setActiveSection] = useState<AIOSSection>('root')
  const [activeCustomFolderId, setActiveCustomFolderId] = useState<string | null>(null)
  const [activeCustomFolderName, setActiveCustomFolderName] = useState('')
  const [customFolderTrail, setCustomFolderTrail] = useState<AIOSCustomFolder[]>([])
  const [customFolders, setCustomFolders] = useState<AIOSCustomFolder[]>([])
  const [customFoldersLoading, setCustomFoldersLoading] = useState(false)
  const [customFolderDialogOpen, setCustomFolderDialogOpen] = useState(false)
  const [customFolderDraft, setCustomFolderDraft] = useState('')
  const [customFolderSaving, setCustomFolderSaving] = useState(false)
  const [customFolderContextMenu, setCustomFolderContextMenu] = useState<{
    x: number
    y: number
    folderId: string
    folderName: string
  } | null>(null)
  const [renameCustomFolderDialog, setRenameCustomFolderDialog] = useState<{
    folderId: string
    folderName: string
  } | null>(null)
  const [renameCustomFolderDraft, setRenameCustomFolderDraft] = useState('')
  const [renameCustomFolderSaving, setRenameCustomFolderSaving] = useState(false)
  const [customFolderDeleting, setCustomFolderDeleting] = useState('')
  const [desktopWindowOpen, setDesktopWindowOpen] = useState(true)
  const [selectedTxtId, setSelectedTxtId] = useState<string | null>(null)
  const [txtDraft, setTxtDraft] = useState('')
  const [notice, setNotice] = useState('AI-OS avviato. Collegamento Supabase in corso.')
  const [startOpen, setStartOpen] = useState(false)
  const [mobileFolderOpen, setMobileFolderOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<AIOSFile | null>(null)
  const [largeFileQueue, setLargeFileQueue] = useState<File[]>([])
  const [largeFileDecisionOpen, setLargeFileDecisionOpen] = useState(false)
  const [previewZoom, setPreviewZoom] = useState(1)
  const [previewOrigin, setPreviewOrigin] = useState('center center')
  const [previewPan, setPreviewPan] = useState({ x: 0, y: 0 })
  const [previewDrag, setPreviewDrag] = useState<{
    startX: number
    startY: number
    panX: number
    panY: number
  } | null>(null)
  const [contextMenu, setContextMenu] = useState<AIOSContextMenu>(null)
  const [quotaStatus, setQuotaStatus] = useState<AIOSQuotaStatus | null>(null)
  const [driveSettings, setDriveSettings] = useState<AIOSDriveSettings | null>(null)
  const [driveSettingsLoading, setDriveSettingsLoading] = useState(false)
  const [driveSettingsSaving, setDriveSettingsSaving] = useState(false)
  const [driveFoldersCreating, setDriveFoldersCreating] = useState(false)
  const [driveSettingsOpen, setDriveSettingsOpen] = useState(false)
  const [driveSettingsForm, setDriveSettingsForm] = useState<AIOSDriveSettingsForm>(() => createEmptyDriveSettingsForm())
  const [driveFolder, setDriveFolder] = useState<AIOSDriveFolder | null>(null)
  const [driveFolderLoading, setDriveFolderLoading] = useState(false)
  const [driveFolderSaving, setDriveFolderSaving] = useState(false)
  const [driveFolderForm, setDriveFolderForm] = useState<AIOSDriveFolderForm>(() => createEmptyDriveFolderForm())
  const [driveExplorer, setDriveExplorer] = useState<AIOSDriveExplorerData | null>(null)
  const [driveExplorerLoading, setDriveExplorerLoading] = useState(false)
  const [driveExplorerError, setDriveExplorerError] = useState('')
  const [driveExplorerUploading, setDriveExplorerUploading] = useState(false)
  const [driveExplorerUploadMessage, setDriveExplorerUploadMessage] = useState('')
  const [driveExplorerPreviewFile, setDriveExplorerPreviewFile] = useState<AIOSDriveExplorerFile | null>(null)
  const [driveExplorerNewFolderName, setDriveExplorerNewFolderName] = useState('')
  const [driveExplorerCreatingFolder, setDriveExplorerCreatingFolder] = useState(false)
  const [driveExplorerIconSize, setDriveExplorerIconSize] = useState<24 | 32 | 48>(48)
  const [driveExplorerViewMode, setDriveExplorerViewMode] = useState<'grid' | 'list'>('grid')
  const [driveExplorerSearchQuery, setDriveExplorerSearchQuery] = useState('')
  const [selectedDriveItem, setSelectedDriveItem] = useState<AIOSDriveExplorerItem | null>(null)
  const [driveItemContextMenu, setDriveItemContextMenu] = useState<AIOSDriveItemContextMenu>(null)
  const [fileMoveUpdating, setFileMoveUpdating] = useState('')
  const [movePicker, setMovePicker] = useState<{ fileId: string; fileName: string } | null>(null)
  const [renameFileDialog, setRenameFileDialog] = useState<{ fileId: string; fileName: string } | null>(null)
  const [renameFileDraft, setRenameFileDraft] = useState('')
  const [renameFileSaving, setRenameFileSaving] = useState(false)
  const [movePickerTarget, setMovePickerTarget] = useState<AIOSSection | null>(null)
  const [movePickerLocation, setMovePickerLocation] = useState<AIOSSection>('root')
  const [movePickerFolders, setMovePickerFolders] = useState<AIOSCustomFolder[]>([])
  const [movePickerFoldersLoading, setMovePickerFoldersLoading] = useState(false)
  const [driveExplorerHistory, setDriveExplorerHistory] = useState<string[]>([])
  const [mediaSyncing, setMediaSyncing] = useState(false)
  const [activeAgencyToolId, setActiveAgencyToolId] = useState<AIOSAgencyToolId | null>('drive')
  const [documentRequests, setDocumentRequests] = useState<AIOSDocumentRequest[]>([])
  const [documentRequestsLoading, setDocumentRequestsLoading] = useState(false)
  const [documentRequestSaving, setDocumentRequestSaving] = useState<string | null>(null)
  const [documentRequestUpdating, setDocumentRequestUpdating] = useState<string | null>(null)
  const [propertyOwners, setPropertyOwners] = useState<AIOSPropertyOwner[]>([])
  const [propertyOwnersLoading, setPropertyOwnersLoading] = useState(false)
  const [propertyOwnerSaving, setPropertyOwnerSaving] = useState(false)
  const [propertyOwnerUpdating, setPropertyOwnerUpdating] = useState<string | null>(null)
  const [editingOwnerId, setEditingOwnerId] = useState<string | null>(null)
  const [ownerForm, setOwnerForm] = useState<AIOSPropertyOwnerForm>(() => createEmptyOwnerForm())
  const [checklistItems, setChecklistItems] = useState<AIOSChecklistItem[]>([])
  const [checklistLoading, setChecklistLoading] = useState(false)
  const [checklistUpdating, setChecklistUpdating] = useState<string | null>(null)
  const [ownerDocuments, setOwnerDocuments] = useState<AIOSOwnerDocument[]>([])
  const [ownerDocumentsLoading, setOwnerDocumentsLoading] = useState(false)
  const [ownerDocumentUpdating, setOwnerDocumentUpdating] = useState<string | null>(null)
  const [propertyMandates, setPropertyMandates] = useState<AIOSPropertyMandate[]>([])
  const [propertyMandatesLoading, setPropertyMandatesLoading] = useState(false)
  const [propertyMandateSaving, setPropertyMandateSaving] = useState(false)
  const [propertyMandateUpdating, setPropertyMandateUpdating] = useState<string | null>(null)
  const [editingMandateId, setEditingMandateId] = useState<string | null>(null)
  const [mandateForm, setMandateForm] = useState<AIOSPropertyMandateForm>(() => createEmptyMandateForm())

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) ?? null,
    [folders, activeFolderId],
  )

  const filteredFolders = useMemo(() => {
    const query = folderSearchQuery.trim().toLowerCase()

    if (query.length < 3) return folders

    return folders.filter((folder) => {
      return [folder.name, folder.propertyRef]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    })
  }, [folders, folderSearchQuery])

  const activeAgencyTool = useMemo(
    () => AI_OS_AGENCY_TOOLS.find((tool) => tool.id === activeAgencyToolId) ?? null,
    [activeAgencyToolId],
  )

  const getFolderVisualState = (folder: AIOSFolder): AIOSFolderVisualState => {
    if (
      folder.visualState === 'off' ||
      folder.visualState === 'blue' ||
      folder.visualState === 'green' ||
      folder.visualState === 'yellow' ||
      folder.visualState === 'red'
    ) {
      return folder.visualState
    }

    const count = Number(folder.fileCount ?? folder.files.length ?? 0)

    if (count > 0) return 'blue'

    return 'off'
  }

  const selectedTxt = useMemo(() => {
    if (!activeFolder || !selectedTxtId) return null
    return activeFolder.files.find((file) => file.id === selectedTxtId && file.kind === 'txt') ?? null
  }, [activeFolder, selectedTxtId])

  const localUsedBytes = useMemo(() => {
    return folders.reduce((folderTotal, folder) => {
      const filesTotal = folder.files.reduce((fileTotal, file) => {
        return fileTotal + Number(file.sizeBytes ?? 0)
      }, 0)

      return folderTotal + filesTotal
    }, 0)
  }, [folders])

  const quotaUsedBytes = Number(quotaStatus?.total_bytes ?? localUsedBytes)
  const quotaMaxBytes = Number(quotaStatus?.max_total_bytes ?? AI_OS_MAX_TOTAL_BYTES)
  const quotaWarnBytes = Number(quotaStatus?.warn_total_bytes ?? AI_OS_WARN_TOTAL_BYTES)

  async function loadQuota() {
    try {
      const response = await fetch('/api/admin/ai-os/quota', {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore quota AI-OS')
      }

      if (payload?.quota) {
        setQuotaStatus(payload.quota)
      }
    } catch (error) {
      console.error(error)
    }
  }

  async function syncPropertyMediaForFolder(propertyId: string, silent = false) {
    if (!propertyId) return 0

    if (!silent) {
      setMediaSyncing(true)
    }

    try {
      const response = await fetch('/api/admin/ai-os/sync-property-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore sincronizzazione media immobile')
      }

      const created = Number(payload?.created ?? 0)

      if (!silent) {
        setNotice(
          created > 0
            ? `Sincronizzati ${created} media immobile in AI-OS.`
            : 'Media immobile già sincronizzati in AI-OS.',
        )
      }

      return created
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sincronizzazione media immobile'

      if (!silent) {
        setNotice(message)
      }

      return 0
    } finally {
      if (!silent) {
        setMediaSyncing(false)
      }
    }
  }

  async function syncActiveFolderMedia() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    await syncPropertyMediaForFolder(activeFolderId, false)
    await loadFilesForFolder(activeFolderId, activeSection)
    void loadQuota()
  }

  async function loadFilesForFolder(propertyId: string, section: AIOSSection = activeSection, customFolderId: string | null = activeCustomFolderId) {
    // AI-OS folder transition: clear stale files from the previous level.
    // Evita l'effetto brutto: entro in una sottocartella, vedo i file della cartella padre,
    // poi sparisce tutto quando arriva la risposta API.
    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === propertyId ? { ...folder, files: [] } : folder,
      ),
    )

    setNotice(customFolderId ? 'Apertura sottocartella AI-OS...' : 'Caricamento file AI-OS...')

    try {
      if ((section === 'images' || section === 'docs') && !customFolderId) {
        await syncPropertyMediaForFolder(propertyId, true)
      }

      const params = new URLSearchParams({
        propertyId,
        folderType: section,
      })

      if (customFolderId) {
        params.set('customFolderId', customFolderId)
      }

      const response = await fetch(
        `/api/admin/ai-os/files?${params.toString()}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento file AI-OS')
      }

      const files = Array.isArray(payload?.files)
        ? payload.files.map((file: AIOSFile) => normalizeFileFromApi(file))
        : []

      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          folder.id === propertyId ? { ...folder, files, fileCount: files.length } : folder,
        ),
      )

      setNotice('File AI-OS caricati da Supabase.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento file'
      setNotice(message)
    }
  }

  async function loadCustomFolders(
    propertyId: string,
    parentFolderType: AIOSSection = activeSection,
    parentCustomFolderId: string | null = activeCustomFolderId,
  ) {
    if (!propertyId) return

    // AI-OS folder transition: clear stale custom folders from the previous level.
    setCustomFolders([])

    setCustomFoldersLoading(true)

    try {
      const params = new URLSearchParams({
        propertyId,
        parentFolderType,
      })

      if (parentCustomFolderId) {
        params.set('parentCustomFolderId', parentCustomFolderId)
      }

      const response = await fetch(
        `/api/admin/ai-os/custom-folders?${params.toString()}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento cartelle custom')
      }

      setCustomFolders(Array.isArray(payload?.folders) ? payload.folders : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento cartelle custom'
      setNotice(message)
    } finally {
      setCustomFoldersLoading(false)
    }
  }


  async function loadMovePickerFolders(
    propertyId: string,
    targetSection: AIOSSection,
    parentCustomFolderId: string | null = null,
  ) {
    if (!propertyId) return

    setMovePickerFolders([])
    setMovePickerFoldersLoading(true)

    try {
      const params = new URLSearchParams({
        propertyId,
        parentFolderType: targetSection,
      })

      if (parentCustomFolderId) {
        params.set('parentCustomFolderId', parentCustomFolderId)
      }

      const response = await fetch(
        `/api/admin/ai-os/custom-folders?${params.toString()}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento sottocartelle spostamento')
      }

      setMovePickerFolders(Array.isArray(payload?.folders) ? payload.folders : [])
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Errore caricamento sottocartelle spostamento'
      setNotice(message)
    } finally {
      setMovePickerFoldersLoading(false)
    }
  }

  function openCreateCustomFolderDialog() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    setCustomFolderDraft('')
    setCustomFolderDialogOpen(true)
  }

  async function saveCustomFolder() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    const name = customFolderDraft.trim()

    if (!name) {
      setNotice('Inserisci il nome della cartella.')
      return
    }

    setCustomFolderSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/custom-folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          parentFolderType: activeSection,
          parentCustomFolderId: activeCustomFolderId,
          name,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione cartella')
      }

      setNotice(`Cartella creata: ${payload?.folder?.name || name}`)
      setCustomFolderDialogOpen(false)
      setCustomFolderDraft('')

      await loadCustomFolders(activeFolderId, activeSection, activeCustomFolderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione cartella'
      setNotice(message)
    } finally {
      setCustomFolderSaving(false)
    }
  }

  function openCustomFolderContextMenu(event: MouseEvent<HTMLElement>, folder: AIOSCustomFolder) {
    event.preventDefault()
    event.stopPropagation()

    const menuWidth = 230
    const menuHeight = 160

    setContextMenu(null)
    setCustomFolderContextMenu({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
      folderId: folder.id,
      folderName: folder.name,
    })
  }

  function openRenameCustomFolderDialog(folderId: string, folderName: string) {
    setRenameCustomFolderDialog({ folderId, folderName })
    setRenameCustomFolderDraft(folderName)
    setCustomFolderContextMenu(null)
  }

  async function saveRenameCustomFolder() {
    if (!renameCustomFolderDialog) return

    const nextName = renameCustomFolderDraft.trim()

    if (!nextName) {
      setNotice('Inserisci un nome cartella valido.')
      return
    }

    setRenameCustomFolderSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/custom-folders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: renameCustomFolderDialog.folderId,
          name: nextName,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore rinomina cartella')
      }

      setCustomFolders((current) =>
        current.map((folder) =>
          folder.id === renameCustomFolderDialog.folderId
            ? { ...folder, name: payload?.folder?.name || nextName }
            : folder,
        ),
      )

      if (activeCustomFolderId === renameCustomFolderDialog.folderId) {
        setActiveCustomFolderName(payload?.folder?.name || nextName)
      }

      setNotice(`Cartella rinominata: ${payload?.folder?.name || nextName}`)
      setRenameCustomFolderDialog(null)
      setRenameCustomFolderDraft('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore rinomina cartella'
      setNotice(message)
    } finally {
      setRenameCustomFolderSaving(false)
    }
  }

  async function deleteCustomFolder(folderId: string, folderName: string) {
    const confirmed = window.confirm(
      `Eliminare la cartella "${folderName}"?\n\nLa cartella deve essere vuota.`,
    )

    if (!confirmed) return

    setCustomFolderDeleting(folderId)
    setCustomFolderContextMenu(null)

    try {
      const response = await fetch('/api/admin/ai-os/custom-folders', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderId }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore eliminazione cartella')
      }

      setCustomFolders((current) => current.filter((folder) => folder.id !== folderId))

      if (activeCustomFolderId === folderId) {
        setActiveCustomFolderId(null)
        setActiveCustomFolderName('')

        if (activeFolderId) {
          void loadFilesForFolder(activeFolderId, activeSection, null)
          void loadCustomFolders(activeFolderId, activeSection, null)
        }
      }

      setNotice(`Cartella eliminata: ${folderName}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione cartella'
      setNotice(message)
    } finally {
      setCustomFolderDeleting('')
    }
  }

  function openCustomFolder(folder: AIOSCustomFolder) {
    if (!activeFolderId) return

    const parentFolderType = folder.parent_folder_type || activeSection
    // AI-OS subfolder navigation: pulizia immediata della vista corrente.
    // Così non si vede per un attimo il contenuto della cartella padre dentro la sottocartella.
    setContextMenu(null)
    setCustomFolders([])
    setFolders((currentFolders) =>
      currentFolders.map((currentFolder) =>
        currentFolder.id === activeFolderId ? { ...currentFolder, files: [] } : currentFolder,
      ),
    )
    setNotice(`Apro sottocartella: ${folder.name}`)


    setActiveSection(parentFolderType)
    setActiveCustomFolderId(folder.id)
    setActiveCustomFolderName(folder.name)
    setCustomFolderTrail((currentTrail) => {
      const nextFolder: AIOSCustomFolder = {
        ...folder,
        parent_folder_type: parentFolderType,
      }

      const existingIndex = currentTrail.findIndex((item) => item.id === folder.id)

      if (existingIndex >= 0) {
        return [...currentTrail.slice(0, existingIndex), nextFolder]
      }

      return [...currentTrail, nextFolder]
    })
    setSelectedTxtId(null)
    setTxtDraft('')
    setNotice(`Apertura cartella: ${folder.name}`)

    void loadFilesForFolder(activeFolderId, parentFolderType, folder.id)
    void loadCustomFolders(activeFolderId, parentFolderType, folder.id)
  }

  function closeCustomFolder() {
    if (!activeFolderId) return

    setContextMenu(null)
    setCustomFolderContextMenu(null)
    setSelectedTxtId(null)
    setTxtDraft('')

    const previousFolder =
      customFolderTrail.length > 1 ? customFolderTrail[customFolderTrail.length - 2] : null

    if (previousFolder) {
      const parentFolderType = (previousFolder.parent_folder_type || activeSection) as AIOSSection
      const nextTrail = customFolderTrail.slice(0, -1)

      setCustomFolderTrail(nextTrail)
      setActiveSection(parentFolderType)
      setActiveCustomFolderId(previousFolder.id)
      setActiveCustomFolderName(previousFolder.name)
      setNotice(`Ritorno a ${previousFolder.name}.`)

      void loadFilesForFolder(activeFolderId, parentFolderType, previousFolder.id)
      void loadCustomFolders(activeFolderId, parentFolderType, previousFolder.id)
      return
    }

    setCustomFolderTrail([])
    setActiveCustomFolderId(null)
    setActiveCustomFolderName('')
    setNotice(`Ritorno a ${getSectionLabel(activeSection)}.`)

    void loadFilesForFolder(activeFolderId, activeSection, null)
    void loadCustomFolders(activeFolderId, activeSection, null)
  }


  // AI-OS restore: funzioni operative ripristinate dal backup File Manager PRO.

  async function loadPropertyOwners(propertyId: string) {
    if (!propertyId) return

    setPropertyOwnersLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/property-owners?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento proprietari')
      }

      setPropertyOwners(Array.isArray(payload?.owners) ? payload.owners : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento proprietari'
      setNotice(message)
    } finally {
      setPropertyOwnersLoading(false)
    }
  }

  function startNewOwnerForm() {
    setEditingOwnerId(null)
    setOwnerForm(createEmptyOwnerForm())
    setNotice('Nuovo proprietario pronto per la compilazione.')
  }

  function startEditOwnerForm(owner: AIOSPropertyOwner) {
    setEditingOwnerId(owner.id)
    setOwnerForm({
      ownerType: owner.owner_type || 'person',
      role: owner.role || 'owner',
      fullName: owner.full_name || '',
      email: owner.email || '',
      phone: owner.phone || '',
      taxCode: owner.tax_code || '',
      vatNumber: owner.vat_number || '',
      address: owner.address || '',
      city: owner.city || '',
      province: owner.province || '',
      notes: owner.notes || '',
      isPrimary: Boolean(owner.is_primary),
    })
    setNotice(`Modifica proprietario: ${owner.full_name}`)
  }

  function updateOwnerFormField<K extends keyof AIOSPropertyOwnerForm>(
    field: K,
    value: AIOSPropertyOwnerForm[K],
  ) {
    setOwnerForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function savePropertyOwner() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    if (!ownerForm.fullName.trim()) {
      setNotice('Nome proprietario obbligatorio.')
      return
    }

    setPropertyOwnerSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/property-owners', {
        method: editingOwnerId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId: editingOwnerId,
          propertyId: activeFolderId,
          ...ownerForm,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio proprietario')
      }

      if (payload?.owner) {
        setPropertyOwners((current) => {
          if (editingOwnerId) {
            return current.map((item) => (item.id === editingOwnerId ? payload.owner : item))
          }

          return [payload.owner, ...current]
        })
      }

      setEditingOwnerId(null)
      setOwnerForm(createEmptyOwnerForm())
      setNotice(`Proprietario salvato: ${payload?.owner?.full_name ?? ownerForm.fullName}`)
      void loadPropertyOwners(activeFolderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio proprietario'
      setNotice(message)
    } finally {
      setPropertyOwnerSaving(false)
    }
  }

  async function deletePropertyOwner(ownerId: string) {
    if (!activeFolderId) return

    setPropertyOwnerUpdating(ownerId)

    try {
      const response = await fetch('/api/admin/ai-os/property-owners', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ownerId,
          propertyId: activeFolderId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore eliminazione proprietario')
      }

      setPropertyOwners((current) => current.filter((item) => item.id !== ownerId))

      if (editingOwnerId === ownerId) {
        setEditingOwnerId(null)
        setOwnerForm(createEmptyOwnerForm())
      }

      setNotice('Proprietario eliminato.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione proprietario'
      setNotice(message)
    } finally {
      setPropertyOwnerUpdating(null)
    }
  }

  async function loadPropertyMandates(propertyId: string) {
    if (!propertyId) return

    setPropertyMandatesLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/mandates?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento incarichi')
      }

      setPropertyMandates(Array.isArray(payload?.mandates) ? payload.mandates : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento incarichi'
      setNotice(message)
    } finally {
      setPropertyMandatesLoading(false)
    }
  }

  function startNewMandateForm() {
    const primaryOwnerName =
      propertyOwners.find((owner) => owner.is_primary)?.full_name || activeFolder?.owner || ''

    setEditingMandateId(null)
    setMandateForm(createEmptyMandateForm(primaryOwnerName))
    setNotice('Nuova bozza incarico pronta.')
  }

  function startEditMandateForm(mandate: AIOSPropertyMandate) {
    setEditingMandateId(mandate.id)
    setMandateForm({
      ownerName: mandate.owner_name || '',
      mandateType: mandate.mandate_type || 'sale',
      assignmentType: mandate.assignment_type || 'exclusive',
      status: mandate.status || 'draft',
      startDate: mandate.start_date || '',
      endDate: mandate.end_date || '',
      askingPrice: mandate.asking_price != null ? String(mandate.asking_price) : '',
      commissionRate: mandate.commission_rate != null ? String(mandate.commission_rate) : '',
      flatFee: mandate.flat_fee != null ? String(mandate.flat_fee) : '',
      notes: mandate.notes || '',
    })
    setNotice(`Modifica incarico: ${mandate.owner_name}`)
  }

  function updateMandateFormField<K extends keyof AIOSPropertyMandateForm>(
    field: K,
    value: AIOSPropertyMandateForm[K],
  ) {
    setMandateForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function savePropertyMandate() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    if (!mandateForm.ownerName.trim()) {
      setNotice('Nome proprietario obbligatorio.')
      return
    }

    setPropertyMandateSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/mandates', {
        method: editingMandateId ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mandateId: editingMandateId,
          propertyId: activeFolderId,
          ...mandateForm,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio incarico')
      }

      if (payload?.mandate) {
        setPropertyMandates((current) => {
          if (editingMandateId) {
            return current.map((item) => (item.id === editingMandateId ? payload.mandate : item))
          }

          return [payload.mandate, ...current]
        })
      }

      setEditingMandateId(null)
      setMandateForm(createEmptyMandateForm(propertyOwners.find((owner) => owner.is_primary)?.full_name || activeFolder?.owner || ''))
      setNotice(`Incarico salvato: ${payload?.mandate?.owner_name ?? mandateForm.ownerName}`)
      void loadPropertyMandates(activeFolderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio incarico'
      setNotice(message)
    } finally {
      setPropertyMandateSaving(false)
    }
  }

  async function deletePropertyMandate(mandateId: string) {
    if (!activeFolderId) return

    setPropertyMandateUpdating(mandateId)

    try {
      const response = await fetch('/api/admin/ai-os/mandates', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mandateId,
          propertyId: activeFolderId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore eliminazione incarico')
      }

      setPropertyMandates((current) => current.filter((item) => item.id !== mandateId))

      if (editingMandateId === mandateId) {
        setEditingMandateId(null)
        setMandateForm(createEmptyMandateForm(propertyOwners.find((owner) => owner.is_primary)?.full_name || activeFolder?.owner || ''))
      }

      setNotice('Incarico eliminato.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione incarico'
      setNotice(message)
    } finally {
      setPropertyMandateUpdating(null)
    }
  }

  async function loadOwnerDocuments(propertyId: string) {
    if (!propertyId) return

    setOwnerDocumentsLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/owner-documents?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento documenti proprietario')
      }

      setOwnerDocuments(Array.isArray(payload?.documents) ? payload.documents : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento documenti proprietario'
      setNotice(message)
    } finally {
      setOwnerDocumentsLoading(false)
    }
  }

  async function updateOwnerDocumentStatus(documentKey: string, label: string, status: string) {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    setOwnerDocumentUpdating(documentKey)

    try {
      const response = await fetch('/api/admin/ai-os/owner-documents', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          documentKey,
          label,
          status,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore aggiornamento documento proprietario')
      }

      if (payload?.document) {
        setOwnerDocuments((current) => {
          const exists = current.some((item) => item.document_key === documentKey)

          if (exists) {
            return current.map((item) => (item.document_key === documentKey ? payload.document : item))
          }

          return [...current, payload.document]
        })
      }

      setNotice(`${label}: ${labelForOwnerDocumentStatus(status)}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore aggiornamento documento proprietario'
      setNotice(message)
    } finally {
      setOwnerDocumentUpdating(null)
    }
  }

  async function loadChecklist(propertyId: string) {
    if (!propertyId) return

    setChecklistLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/checklist?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento checklist')
      }

      setChecklistItems(Array.isArray(payload?.items) ? payload.items : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento checklist'
      setNotice(message)
    } finally {
      setChecklistLoading(false)
    }
  }

  async function toggleChecklistItem(itemKey: string, label: string, nextDone: boolean) {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    setChecklistUpdating(itemKey)

    try {
      const response = await fetch('/api/admin/ai-os/checklist', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          itemKey,
          label,
          isDone: nextDone,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore aggiornamento checklist')
      }

      if (payload?.item) {
        setChecklistItems((current) => {
          const exists = current.some((item) => item.item_key === itemKey)

          if (exists) {
            return current.map((item) => (item.item_key === itemKey ? payload.item : item))
          }

          return [...current, payload.item]
        })
      }

      setNotice(`${label}: ${nextDone ? 'completato' : 'rimesso da completare'}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore aggiornamento checklist'
      setNotice(message)
    } finally {
      setChecklistUpdating(null)
    }
  }

  async function loadDocumentRequests(propertyId: string) {
    if (!propertyId) return

    setDocumentRequestsLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/document-requests?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento richieste documenti')
      }

      setDocumentRequests(Array.isArray(payload?.requests) ? payload.requests : [])
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento richieste documenti'
      setNotice(message)
    } finally {
      setDocumentRequestsLoading(false)
    }
  }

  async function createDocumentRequest(requestType: string) {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    setDocumentRequestSaving(requestType)

    try {
      const response = await fetch('/api/admin/ai-os/document-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          requestType,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione richiesta documento')
      }

      if (payload?.request) {
        setDocumentRequests((current) => [payload.request, ...current])
      }

      setNotice(`Richiesta salvata: ${payload?.request?.title ?? 'documento'} · ${activeFolder?.name ?? 'immobile'}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione richiesta documento'
      setNotice(message)
    } finally {
      setDocumentRequestSaving(null)
    }
  }

  async function updateDocumentRequestStatus(requestId: string, status: string) {
    setDocumentRequestUpdating(requestId)

    try {
      const response = await fetch('/api/admin/ai-os/document-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          status,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore aggiornamento richiesta documento')
      }

      if (payload?.request) {
        setDocumentRequests((current) =>
          current.map((item) => (item.id === requestId ? payload.request : item)),
        )
      }

      setNotice(`Richiesta aggiornata: ${labelForDocumentRequestStatus(status)}.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore aggiornamento richiesta documento'
      setNotice(message)
    } finally {
      setDocumentRequestUpdating(null)
    }
  }

  async function deleteDocumentRequest(requestId: string) {
    setDocumentRequestUpdating(requestId)

    try {
      const response = await fetch('/api/admin/ai-os/document-requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore eliminazione richiesta documento')
      }

      setDocumentRequests((current) => current.filter((item) => item.id !== requestId))
      setNotice('Richiesta documento eliminata.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione richiesta documento'
      setNotice(message)
    } finally {
      setDocumentRequestUpdating(null)
    }
  }

  function buildSuggestedDriveFolderName(folder: AIOSFolder | null) {
    if (!folder) return 'AI-OS - Nuovo immobile'

    const safeName = folder.name
      .replace(/[^a-zA-Z0-9À-ÿ ._-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return `${folder.propertyRef} - ${safeName}`.trim()
  }

  async function copySuggestedDriveFolderName() {
    const value = driveFolderForm.folderName || buildSuggestedDriveFolderName(activeFolder)

    try {
      await navigator.clipboard.writeText(value)
      setNotice(`Nome cartella copiato: ${value}`)
    } catch {
      setNotice(value)
    }
  }

  async function loadDriveFolder(propertyId: string) {
    if (!propertyId) return

    setDriveFolderLoading(true)

    try {
      const response = await fetch(
        `/api/admin/ai-os/drive-folder?propertyId=${encodeURIComponent(propertyId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento cartella Drive immobile')
      }

      const nextDriveFolder = payload?.driveFolder ?? null
      setDriveFolder(nextDriveFolder)

      if (nextDriveFolder) {
        setDriveFolderForm({
          folderName: nextDriveFolder.folder_name || buildSuggestedDriveFolderName(activeFolder),
          driveFolderUrl: nextDriveFolder.drive_folder_url || '',
          syncStatus: nextDriveFolder.sync_status || 'linked',
          notes: nextDriveFolder.notes || '',
        })
      } else {
        setDriveFolderForm({
          ...createEmptyDriveFolderForm(),
          folderName: buildSuggestedDriveFolderName(activeFolder),
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento cartella Drive immobile'
      setNotice(message)
    } finally {
      setDriveFolderLoading(false)
    }
  }

  async function loadDriveExplorer(folderId?: string | null) {
    const targetFolderId = String(folderId || driveFolder?.drive_folder_id || '').trim()

    if (!targetFolderId) {
      setDriveExplorer(null)
      setDriveExplorerError('Cartella Drive immobile non ancora collegata.')
      return
    }

    setDriveExplorerLoading(true)
    setDriveExplorerError('')

    try {
      const response = await fetch(
        `/api/admin/ai-os/drive-explorer?folderId=${encodeURIComponent(targetFolderId)}`,
        { cache: 'no-store' },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore lettura Drive immobile')
      }

      setDriveExplorer({
        folder: payload?.folder ?? null,
        folders: Array.isArray(payload?.folders) ? payload.folders : [],
        files: Array.isArray(payload?.files) ? payload.files : [],
      })

      setNotice('Drive immobile aggiornato dentro AI-OS.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore lettura Drive immobile'
      setDriveExplorerError(message)
      setNotice(message)
    } finally {
      setDriveExplorerLoading(false)
    }
  }

  async function uploadFilesToDriveExplorerFolder(
    folderId: string | null | undefined,
    files: File[],
  ) {
    const targetFolderId = String(folderId || '').trim()

    if (!targetFolderId) {
      setDriveExplorerUploadMessage('Cartella Drive non disponibile.')
      return
    }

    if (files.length === 0) return

    const directUploadLimitBytes = 4 * 1024 * 1024
    const tooLargeFiles = files.filter((file) => file.size > directUploadLimitBytes)
    const uploadableFiles = files.filter((file) => file.size <= directUploadLimitBytes)

    if (tooLargeFiles.length > 0) {
      const folderUrl = driveExplorer?.folder?.url || driveFolder?.drive_folder_url || ''

      setNotice(
        `${tooLargeFiles.length} file troppo grande/i per upload diretto AI-OS: apri Drive e caricali nella cartella corrente.`,
      )

      if (folderUrl) {
        window.open(folderUrl, '_blank', 'noopener,noreferrer')
      }
    }

    if (uploadableFiles.length === 0) return

    setDriveExplorerUploading(true)
    setDriveExplorerUploadMessage(`Upload Drive in corso: ${uploadableFiles.length} file...`)

    try {
      for (const file of uploadableFiles) {
        const base64Data = await readFileAsBase64(file)

        const response = await fetch('/api/admin/ai-os/drive-explorer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            folderId: targetFolderId,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            base64Data,
          }),
        })

        const payload = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(payload?.error || `Errore upload Drive: ${file.name}`)
        }
      }

      setDriveExplorerUploadMessage(`Upload completato: ${uploadableFiles.length} file.`)
      setNotice(`Drive immobile aggiornato: ${uploadableFiles.length} file caricato/i.`)
      void loadDriveExplorer(targetFolderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore upload su Drive'
      setDriveExplorerUploadMessage(message)
      setNotice(message)
    } finally {
      setDriveExplorerUploading(false)
    }
  }

  function openDriveExplorerFolder(folderId: string) {
    const targetFolderId = String(folderId || '').trim()
    const currentFolderId = String(driveExplorer?.folder?.id || driveFolder?.drive_folder_id || '').trim()

    if (!targetFolderId) return

    if (currentFolderId && currentFolderId !== targetFolderId) {
      setDriveExplorerHistory((currentHistory) => [...currentHistory, currentFolderId])
    }

    setDriveExplorerPreviewFile(null)
    setSelectedDriveItem(null)
    setDriveItemContextMenu(null)
    void loadDriveExplorer(targetFolderId)
  }

  function openDriveExplorerRootFolder() {
    if (!driveFolder?.drive_folder_id) return

    setDriveExplorerHistory([])
    setDriveExplorerPreviewFile(null)
    setSelectedDriveItem(null)
    setDriveItemContextMenu(null)
    void loadDriveExplorer(driveFolder.drive_folder_id)
  }

  function goBackDriveExplorerFolder() {
    const previousFolderId = driveExplorerHistory[driveExplorerHistory.length - 1]

    if (!previousFolderId) {
      openDriveExplorerRootFolder()
      return
    }

    setDriveExplorerHistory((currentHistory) => currentHistory.slice(0, -1))
    setDriveExplorerPreviewFile(null)
    setSelectedDriveItem(null)
    setDriveItemContextMenu(null)
    void loadDriveExplorer(previousFolderId)
  }

  function driveExplorerTileClass() {
    if (driveExplorerIconSize === 24) {
      return 'group flex min-h-[82px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-2 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12'
    }

    if (driveExplorerIconSize === 32) {
      return 'group flex min-h-[98px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12'
    }

    return 'group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12'
  }

  function driveExplorerIconTextClass() {
    if (driveExplorerIconSize === 24) return 'text-2xl'
    if (driveExplorerIconSize === 32) return 'text-3xl'
    return 'text-4xl'
  }

  function driveFilePreviewUrl(file: AIOSDriveExplorerFile | null) {
    if (!file?.id) return ''
    return `https://drive.google.com/file/d/${file.id}/preview`
  }

  function isDriveImageFile(file: AIOSDriveExplorerFile | null) {
    if (!file) return false

    const mimeType = String(file.mimeType || '').toLowerCase()
    const name = String(file.name || '').toLowerCase()

    return (
      mimeType.startsWith('image/') ||
      /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(name)
    )
  }

  function driveFileThumbnailUrl(file: AIOSDriveExplorerFile | null) {
    if (!file?.id) return ''
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w640`
  }

  function driveFileDownloadUrl(file: AIOSDriveExplorerFile | null) {
    if (!file?.id) return ''
    return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(file.id)}`
  }

  function openDriveExplorerItem(item: AIOSDriveExplorerItem) {
    setDriveItemContextMenu(null)
    setSelectedDriveItem(item)

    if (item.type === 'folder') {
      openDriveExplorerFolder(item.folder.id)
      return
    }

    if (item.file.url) {
      window.open(item.file.url, '_blank', 'noopener,noreferrer')
    }
  }

  function openDriveItemContextMenu(
    event: MouseEvent<HTMLElement>,
    item: AIOSDriveExplorerItem,
  ) {
    event.preventDefault()
    event.stopPropagation()

    const menuWidth = 320
    const menuHeight = item.type === 'file' ? 276 : 230

    setSelectedDriveItem(item)
    setDriveItemContextMenu({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
      item,
    })
  }

  async function copyDriveItemLink(item: AIOSDriveExplorerItem) {
    const url = item.type === 'folder' ? item.folder.url : item.file.url
    const name = item.type === 'folder' ? item.folder.name : item.file.name

    try {
      await navigator.clipboard.writeText(url)
      setNotice(`Link copiato: ${name}`)
    } catch {
      setNotice(url)
    } finally {
      setDriveItemContextMenu(null)
    }
  }

  function driveItemName(item: AIOSDriveExplorerItem | null) {
    if (!item) return ''
    return item.type === 'folder' ? item.folder.name : item.file.name
  }

  async function createDriveExplorerSubfolder() {
    const targetFolderId = String(driveExplorer?.folder?.id || driveFolder?.drive_folder_id || '').trim()
    const folderName = driveExplorerNewFolderName.trim()

    if (!targetFolderId) {
      setNotice('Cartella Drive non disponibile.')
      return
    }

    if (!folderName) {
      setNotice('Inserisci il nome della sottocartella.')
      return
    }

    setDriveExplorerCreatingFolder(true)

    try {
      const response = await fetch('/api/admin/ai-os/drive-explorer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubfolder',
          folderId: targetFolderId,
          folderName,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione sottocartella Drive')
      }

      setDriveExplorerNewFolderName('')
      setNotice(`Sottocartella Drive pronta: ${payload?.folder?.name || folderName}`)
      void loadDriveExplorer(targetFolderId)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione sottocartella Drive'
      setNotice(message)
    } finally {
      setDriveExplorerCreatingFolder(false)
    }
  }

  function updateDriveFolderFormField<K extends keyof AIOSDriveFolderForm>(
    field: K,
    value: AIOSDriveFolderForm[K],
  ) {
    setDriveFolderForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveDriveFolder() {
    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile.')
      return
    }

    setDriveFolderSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/drive-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          ...driveFolderForm,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio cartella Drive immobile')
      }

      setDriveFolder(payload?.driveFolder ?? null)

      if (payload?.driveFolder) {
        setDriveFolderForm({
          folderName: payload.driveFolder.folder_name || buildSuggestedDriveFolderName(activeFolder),
          driveFolderUrl: payload.driveFolder.drive_folder_url || '',
          syncStatus: payload.driveFolder.sync_status || 'pending_creation',
          notes: payload.driveFolder.notes || '',
        })
      }

      setNotice('Cartella Drive immobile collegata al fascicolo.')
      void loadFolders()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio cartella Drive immobile'
      setNotice(message)
    } finally {
      setDriveFolderSaving(false)
    }
  }

  async function loadDriveSettings() {
    setDriveSettingsLoading(true)

    try {
      const response = await fetch('/api/admin/ai-os/drive-settings', {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento impostazioni Drive')
      }

      const settings = payload?.settings ?? null
      setDriveSettings(settings)

      if (settings) {
        setDriveSettingsForm({
          driveRootName: settings.drive_root_name || 'Belotti AI-OS / Archivio Immobili',
          driveRootUrl: settings.drive_root_url || '',
          largeFileThresholdMb: String(settings.large_file_threshold_mb || 50),
          notes: settings.notes || '',
        })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento impostazioni Drive'
      setNotice(message)
    } finally {
      setDriveSettingsLoading(false)
    }
  }

  function updateDriveSettingsFormField<K extends keyof AIOSDriveSettingsForm>(
    field: K,
    value: AIOSDriveSettingsForm[K],
  ) {
    setDriveSettingsForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function createMissingDriveFolders() {
    setDriveFoldersCreating(true)

    try {
      const response = await fetch('/api/admin/ai-os/drive-folders/create-missing', {
        method: 'POST',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione cartelle Drive immobili')
      }

      setNotice(
        `Drive: ${payload.created || 0} cartelle create, ${payload.alreadyLinked || 0} già presenti/sistemate, ${payload.failed || 0} errori.`,
      )

      void loadFolders()
      if (activeFolderId) {
        void loadDriveFolder(activeFolderId)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione cartelle Drive immobili'
      setNotice(message)
    } finally {
      setDriveFoldersCreating(false)
    }
  }

  async function saveDriveSettings() {
    setDriveSettingsSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/drive-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driveSettingsForm),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio impostazioni Drive')
      }

      setDriveSettings(payload?.settings ?? null)
      setNotice(`Impostazioni Google Drive salvate. Cartelle immobili preconfigurate automaticamente.`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio impostazioni Drive'
      setNotice(message)
    } finally {
      setDriveSettingsSaving(false)
    }
  }

  function openDriveSettingsPanel() {
    setDriveSettingsOpen(true)
    setStartOpen(false)
    setDesktopWindowOpen(true)
    setNotice('Impostazioni Drive archivio aperte.')
    void loadDriveSettings()
  }

  async function loadFolders() {
    setFoldersLoading(true)

    try {
      const response = await fetch('/api/admin/ai-os/folders', {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento cartelle AI-OS')
      }

      const nextFolders: AIOSFolder[] = Array.isArray(payload?.folders)
        ? payload.folders.map((folder: AIOSFolder) => ({
            ...folder,
            fileCount: Number(folder.fileCount ?? folder.files?.length ?? 0),
            visualState: folder.visualState,
            visualReason: folder.visualReason,
            statusStats: folder.statusStats,
            files: [],
          }))
        : []

      setFolders(nextFolders)

      const firstFolderId = nextFolders[0]?.id ?? ''
      setActiveFolderId((current) => {
        if (current && nextFolders.some((folder) => folder.id === current)) {
          void loadFilesForFolder(current, activeSection)
          void loadDocumentRequests(current)
          void loadPropertyOwners(current)
          void loadChecklist(current)
          void loadOwnerDocuments(current)
          void loadPropertyMandates(current)
          return current
        }

        if (firstFolderId) {
          void loadFilesForFolder(firstFolderId, activeSection)
          void loadDocumentRequests(firstFolderId)
          void loadPropertyOwners(firstFolderId)
          void loadChecklist(firstFolderId)
          void loadOwnerDocuments(firstFolderId)
          void loadPropertyMandates(firstFolderId)
        }

        return firstFolderId
      })

      setNotice(
        nextFolders.length > 0
          ? 'Check fascicoli completato: LED cartelle aggiornati.'
          : 'Nessun immobile trovato per AI-OS.',
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore caricamento AI-OS'
      setNotice(message)
    } finally {
      setFoldersLoading(false)
    }
  }

  useEffect(() => {
    void loadFolders()
    void loadQuota()
    void loadDriveSettings()
  }, [])

  useEffect(() => {
    if (String(activeAgencyToolId) === 'drive' && activeFolderId) {
      void loadDriveSettings()
      void loadDriveFolder(activeFolderId)
    }
  }, [activeAgencyToolId, activeFolderId])

  useEffect(() => {
    if (String(activeAgencyToolId) === 'drive' && driveFolder?.drive_folder_id) {
      void loadDriveExplorer(driveFolder.drive_folder_id)
    }
  }, [activeAgencyToolId, driveFolder?.drive_folder_id])

  useEffect(() => {
    setPreviewZoom(1)
    setPreviewOrigin('center center')
    setPreviewPan({ x: 0, y: 0 })
    setPreviewDrag(null)
  }, [previewFile?.id])

  const updateFileInFolder = (
    folderId: string,
    fileId: string,
    updater: (file: AIOSFile) => AIOSFile,
  ) => {
    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              files: folder.files.map((file) =>
                file.id === fileId ? updater(file) : file,
              ),
            }
          : folder,
      ),
    )
  }

  const replaceFileInFolder = (folderId: string, fileId: string, nextFile: AIOSFile) => {
    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === folderId
          ? {
              ...folder,
              files: folder.files.map((file) =>
                file.id === fileId ? nextFile : file,
              ),
            }
          : folder,
      ),
    )
  }

  const removeFileFromFolders = (fileId: string) => {
    setFolders((currentFolders) =>
      currentFolders.map((folder) => {
        const hadFile = folder.files.some((file) => file.id === fileId)
        const nextFiles = folder.files.filter((file) => file.id !== fileId)

        return {
          ...folder,
          files: nextFiles,
          fileCount: hadFile
            ? Math.max(0, Number(folder.fileCount ?? folder.files.length) - 1)
            : Number(folder.fileCount ?? folder.files.length),
        }
      }),
    )
  }

  const uploadFilesToActiveFolder = (uploadableFiles: File[]) => {
    if (!activeFolderId || uploadableFiles.length === 0) return

    const targetFolderId = activeFolderId
    const targetSection = activeSection
    const targetCustomFolderId = activeCustomFolderId

    uploadableFiles.forEach((file) => {
      const tempId = `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`
      const previewUrl = URL.createObjectURL(file)

      const tempFile: AIOSFile = {
        id: tempId,
        name: file.name,
        kind: getFileKind(file),
        size: formatFileSize(file.size),
        sizeBytes: file.size,
        status: 'uploading',
        mimeType: file.type || undefined,
        previewUrl,
        uploadProgress: 1,
      }

      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          folder.id === targetFolderId
            ? {
                ...folder,
                files: [tempFile, ...folder.files],
                fileCount: Math.max(folder.files.length + 1, Number(folder.fileCount ?? 0) + 1),
              }
            : folder,
        ),
      )

      setNotice(`Upload avviato: ${file.name}`)

      void uploadFileWithProgress({
        propertyId: targetFolderId,
        folderType: targetSection,
        file,
        onProgress: (progress) => {
          updateFileInFolder(activeFolderId, tempId, (currentFile) => ({
            ...currentFile,
            uploadProgress: progress,
          }))
        },
      })
        .then((uploadedFile) => {
          URL.revokeObjectURL(previewUrl)
          replaceFileInFolder(targetFolderId, tempId, uploadedFile)
          setNotice(`Upload completato: ${uploadedFile.name}`)
          void loadQuota()
        })
        .catch((error) => {
          const message =
            error instanceof Error ? error.message : 'Errore durante upload file'

          updateFileInFolder(activeFolderId, tempId, (currentFile) => ({
            ...currentFile,
            status: 'error',
            uploadProgress: 100,
            uploadError: message,
          }))

          setNotice(message)
          void loadQuota()
        })
    })
  }

  const addFilesToActiveFolder = (files: File[]) => {
    if (!activeFolderId || files.length === 0) return

    const sectionAllowedFiles = files.filter((file) =>
      canUploadFileInSection(file, activeSection),
    )

    const rejectedFilesCount = files.length - sectionAllowedFiles.length

    if (rejectedFilesCount > 0) {
      setNotice(
        activeSection === 'images'
          ? `${rejectedFilesCount} file ignorato/i: nella cartella Immagini puoi caricare solo immagini o video.`
          : `${rejectedFilesCount} file ignorato/i.`,
      )
    }

    if (sectionAllowedFiles.length === 0) return

    const largeFiles = sectionAllowedFiles.filter((file) => file.size > AI_OS_LARGE_FILE_THRESHOLD_BYTES)
    const normalFiles = sectionAllowedFiles.filter((file) => file.size <= AI_OS_LARGE_FILE_THRESHOLD_BYTES)

    if (normalFiles.length > 0) {
      uploadFilesToActiveFolder(normalFiles)
    }

    if (largeFiles.length > 0) {
      setLargeFileQueue(largeFiles)
      setLargeFileDecisionOpen(true)
      setNotice(
        `${largeFiles.length} file sopra 45 MB: scegli se ridurli o archiviarli su Google Drive.`,
      )
    }
  }

  const closeLargeFileDecision = () => {
    setLargeFileDecisionOpen(false)
    setLargeFileQueue([])
    setNotice('Upload file grande annullato.')
  }

  const sendLargeFilesToDriveArchive = async () => {
    setLargeFileDecisionOpen(false)

    if (!activeFolderId) {
      setNotice('Seleziona prima una cartella immobile per aprire il Drive dedicato.')
      return
    }

    const driveWindow = window.open('about:blank', '_blank', 'noopener,noreferrer')

    try {
      setNotice('Apertura Drive immobile in corso...')

      let nextDriveFolder: AIOSDriveFolder | null = driveFolder

      if (!nextDriveFolder?.drive_folder_url) {
        const createResponse = await fetch('/api/admin/ai-os/drive-folders/create-missing', {
          method: 'POST',
        })

        const createPayload = await createResponse.json().catch(() => null)

        if (!createResponse.ok) {
          throw new Error(createPayload?.error || 'Errore creazione cartella Drive immobile')
        }

        const folderResponse = await fetch(
          `/api/admin/ai-os/drive-folder?propertyId=${encodeURIComponent(activeFolderId)}`,
          { cache: 'no-store' },
        )

        const folderPayload = await folderResponse.json().catch(() => null)

        if (!folderResponse.ok) {
          throw new Error(folderPayload?.error || 'Errore lettura cartella Drive immobile')
        }

        nextDriveFolder = folderPayload?.driveFolder ?? null
        setDriveFolder(nextDriveFolder)

        if (nextDriveFolder) {
          setDriveFolderForm({
            folderName: nextDriveFolder.folder_name || buildSuggestedDriveFolderName(activeFolder),
            driveFolderUrl: nextDriveFolder.drive_folder_url || '',
            syncStatus: nextDriveFolder.sync_status || 'pending_creation',
            notes: nextDriveFolder.notes || '',
          })
        }
      }

      const driveUrl = nextDriveFolder?.drive_folder_url || ''

      if (!driveUrl) {
        if (driveWindow && !driveWindow.closed) {
          driveWindow.close()
        }

        setNotice('Cartella Drive immobile non ancora disponibile. Apri la nuvoletta Drive e crea le cartelle immobili.')
        return
      }

      if (driveWindow) {
        driveWindow.location.href = driveUrl
      } else {
        window.open(driveUrl, '_blank', 'noopener,noreferrer')
      }

      setNotice(
        largeFileQueue.length > 0
          ? `Apri Drive immobile: carica lì ${largeFileQueue.length} file sopra 45 MB. Supabase resta per file leggeri.`
          : 'Drive immobile aperto.',
      )

      setLargeFileQueue([])
    } catch (error) {
      if (driveWindow && !driveWindow.closed) {
        driveWindow.close()
      }

      const message = error instanceof Error ? error.message : 'Errore apertura Drive immobile'
      setNotice(message)
    }
  }

  const reduceLargeVideos = () => {
    const videoFiles = largeFileQueue.filter((file) => file.type.startsWith('video/'))

    if (videoFiles.length === 0) {
      setNotice('Riduzione disponibile solo per video. Per PDF/documenti grandi apri il Drive dell’immobile.')
      return
    }

    setNotice(
      `Riduzione video pronta come prossimo step: target circa ${formatFileSize(AI_OS_VIDEO_TARGET_BYTES)} usando compressione browser open-source.`,
    )
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    addFilesToActiveFolder(Array.from(event.dataTransfer.files))
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFilesToActiveFolder(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const openTxtEditor = (file: AIOSFile) => {
    if (file.status === 'uploading') return

    setSelectedTxtId(file.id)
    setTxtDraft(file.content ?? '')
    setDesktopWindowOpen(true)
    setNotice(`Editor aperto: ${file.name}`)
  }

  const openFile = (file: AIOSFile) => {
    if (file.status === 'uploading') {
      setNotice(`Upload in corso: ${file.name} ${file.uploadProgress ?? 0}%`)
      return
    }

    if (file.kind === 'txt') {
      openTxtEditor(file)
      return
    }

    setPreviewFile(file)
    setNotice(`Anteprima file aperta: ${file.name}`)
  }

  const openFileContextMenu = (
    event: MouseEvent<HTMLElement>,
    file: AIOSFile,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    const menuWidth = 276
    const menuHeight = 214

    setCustomFolderContextMenu(null)

    setContextMenu({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - menuWidth - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - menuHeight - 8)),
      fileId: file.id,
      fileName: file.name,
    })
  }

  const deleteFileById = async (fileId: string) => {
    const fileToDelete = folders
      .flatMap((folder) => folder.files)
      .find((file) => file.id === fileId)

    if (!fileToDelete) {
      setContextMenu(null)
      return
    }

    if (fileToDelete.previewUrl && fileToDelete.id.startsWith('upload-')) {
      URL.revokeObjectURL(fileToDelete.previewUrl)
    }

    if (fileToDelete.id.startsWith('upload-') || fileToDelete.status === 'error') {
      removeFileFromFolders(fileId)
      setContextMenu(null)
      setNotice(`File "${fileToDelete.name}" rimosso dalla lista.`)
      return
    }

    try {
      const response = await fetch('/api/admin/ai-os/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileId }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore eliminazione file AI-OS')
      }

      removeFileFromFolders(fileId)

      if (selectedTxtId === fileId) {
        setSelectedTxtId(null)
        setTxtDraft('')
      }

      if (previewFile?.id === fileId) {
        setPreviewFile(null)
      }

      setNotice(`File "${fileToDelete.name}" eliminato.`)
      void loadQuota()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore eliminazione file'
      setNotice(message)
    } finally {
      setContextMenu(null)
    }
  }

  const saveTxtDraft = async () => {
    if (!activeFolder || !selectedTxt) return

    try {
      const response = await fetch('/api/admin/ai-os/txt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolder.id,
          fileId: selectedTxt.id,
          fileName: selectedTxt.name,
          content: txtDraft,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio TXT')
      }

      const savedFile = normalizeFileFromApi(payload.file)

      replaceFileInFolder(activeFolder.id, selectedTxt.id, savedFile)
      setSelectedTxtId(savedFile.id)
      setNotice(`File "${savedFile.name}" salvato su Supabase.`)
      void loadQuota()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore salvataggio TXT'
      setNotice(message)
    }
  }

  const createTxtFile = async () => {
    if (!activeFolderId) return

    if (activeSection === 'images') {
      setNotice('Nella cartella Immagini puoi caricare solo immagini o video.')
      return
    }

    const fileName = `nuova-nota-${new Date().toISOString().slice(0, 10)}.txt`

    try {
      const response = await fetch('/api/admin/ai-os/txt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: activeFolderId,
          folderType: activeSection,
          customFolderId: activeCustomFolderId,
          fileName,
          content: '',
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione TXT')
      }

      const createdFile = normalizeFileFromApi(payload.file)

      setFolders((currentFolders) =>
        currentFolders.map((folder) =>
          folder.id === activeFolderId
            ? {
                ...folder,
                files: [createdFile, ...folder.files],
                fileCount: Math.max(folder.files.length + 1, Number(folder.fileCount ?? 0) + 1),
              }
            : folder,
        ),
      )

      setSelectedTxtId(createdFile.id)
      setTxtDraft(createdFile.content ?? '')
      setDesktopWindowOpen(true)
      setNotice(`Creato nuovo file TXT: ${createdFile.name}`)
      void loadQuota()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore creazione TXT'
      setNotice(message)
    }
  }

  const openMainFolder = () => {
    setDesktopWindowOpen(true)
    setStartOpen(false)
    setNotice(activeFolder ? `Cartella aperta: ${activeFolder.name}` : 'Cartelle AI-OS aperte.')
  }

  const refreshActiveFolder = () => {
    if (!activeFolderId) {
      setNotice('Nessuna cartella selezionata da aggiornare.')
      return
    }

    setNotice('Aggiornamento cartella AI-OS in corso...')
    void loadFilesForFolder(activeFolderId, activeSection)
    void loadDocumentRequests(activeFolderId)
    void loadPropertyOwners(activeFolderId)
    void loadChecklist(activeFolderId)
    void loadOwnerDocuments(activeFolderId)
    void loadPropertyMandates(activeFolderId)
    void loadQuota()
  }

  const selectFolder = (folder: AIOSFolder, mobile = false) => {
    setActiveFolderId(folder.id)
    setDriveSettingsOpen(false)
    setActiveSection('root')
    setSelectedTxtId(null)
    setTxtDraft('')
    setDesktopWindowOpen(true)
    setMobileFolderOpen(mobile)
    setStartOpen(false)
    setNotice(`Cartella aperta: ${folder.name}`)
    void loadFilesForFolder(folder.id, 'root')
    void loadDocumentRequests(folder.id)
    void loadPropertyOwners(folder.id)
    void loadChecklist(folder.id)
    void loadOwnerDocuments(folder.id)
    void loadPropertyMandates(folder.id)
  }

  const handlePreviewWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!previewFile) return

    event.preventDefault()

    const rect = event.currentTarget.getBoundingClientRect()
    const xPercent = ((event.clientX - rect.left) / rect.width) * 100
    const yPercent = ((event.clientY - rect.top) / rect.height) * 100

    setPreviewOrigin(
      `${Math.max(0, Math.min(100, xPercent)).toFixed(2)}% ${Math.max(
        0,
        Math.min(100, yPercent),
      ).toFixed(2)}%`,
    )

    const direction = event.deltaY < 0 ? 1 : -1

    setPreviewZoom((currentZoom) => {
      const step = event.altKey ? 0.1 : 0.18
      const nextZoom = Number(
        Math.max(0.5, Math.min(4, currentZoom + direction * step)).toFixed(2),
      )

      if (nextZoom <= 1) {
        setPreviewPan({ x: 0, y: 0 })
      }

      return nextZoom
    })
  }

  const resetPreviewZoom = () => {
    setPreviewZoom(1)
    setPreviewOrigin('center center')
    setPreviewPan({ x: 0, y: 0 })
    setPreviewDrag(null)
  }

  const startPreviewDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (previewZoom <= 1) return

    event.preventDefault()

    setPreviewDrag({
      startX: event.clientX,
      startY: event.clientY,
      panX: previewPan.x,
      panY: previewPan.y,
    })
  }

  const movePreviewDrag = (event: MouseEvent<HTMLDivElement>) => {
    if (!previewDrag || previewZoom <= 1) return

    event.preventDefault()

    setPreviewPan({
      x: previewDrag.panX + event.clientX - previewDrag.startX,
      y: previewDrag.panY + event.clientY - previewDrag.startY,
    })
  }

  const stopPreviewDrag = () => {
    setPreviewDrag(null)
  }

  const getSectionLabel = (sectionId: AIOSSection) => {
    if (sectionId === 'root') return ''

    return AI_OS_SECTIONS.find((section) => section.id === sectionId)?.label ?? ''
  }

  const getActivePath = () => {
    const folderName = activeFolder?.name ?? 'Immobile'
    const sectionLabel = getSectionLabel(activeSection)

    return `x:/${folderName}/${sectionLabel ? `${sectionLabel}/` : ''}`
  }

  const renderPathBar = (mobile = false) => {
    return (
      <div
        className={`mb-4 rounded-2xl border border-[#8FBCBB]/15 bg-[#202632]/78 px-4 py-3 font-mono text-[#D8DEE9] shadow-[inset_0_0_22px_rgba(16,185,129,0.06)] ${
          mobile ? 'text-[11px]' : 'text-xs'
        }`}
      >
        <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-[#8FBCBB]/70">
          <span className="h-1.5 w-1.5 rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] shadow-[0_0_12px_rgba(110,231,183,0.8)] hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75" />
          Percorso
        </div>
        <div className="truncate text-[#ECEFF4]">{activeCustomFolderName ? `${getActivePath()} / ${activeCustomFolderName}` : getActivePath()}</div>
      </div>
    )
  }

  const openSubFolder = (section: Exclude<AIOSSection, 'root'>) => {
    setActiveSection(section)
    setActiveCustomFolderId(null)
    setActiveCustomFolderName('')
    setCustomFolderTrail([])
    setSelectedTxtId(null)
    setTxtDraft('')

    if (activeFolderId) {
      setNotice(`Apertura ${getSectionLabel(section)}...`)
      void loadFilesForFolder(activeFolderId, section, null)
      void loadCustomFolders(activeFolderId, section, null)
    }
  }

  const openRootFolder = () => {
    setActiveSection('root')
    setActiveCustomFolderId(null)
    setActiveCustomFolderName('')
    setCustomFolderTrail([])
    setSelectedTxtId(null)
    setTxtDraft('')

    if (activeFolderId) {
      setNotice('Apertura root cartella immobile...')
      void loadFilesForFolder(activeFolderId, 'root', null)
      void loadCustomFolders(activeFolderId, 'root', null)
    }
  }

  const openAgencyTool = (toolId: AIOSAgencyToolId) => {
    const tool = AI_OS_AGENCY_TOOLS.find((item) => item.id === toolId)

    setActiveAgencyToolId(toolId)
    setDesktopWindowOpen(true)
    setNotice(
      `${tool?.label ?? 'Strumento agenzia'} aperto per ${activeFolder?.name ?? 'cartella immobile'}.`,
    )
  }

  const closeAgencyTool = () => {
    setActiveAgencyToolId(null)
    setNotice(activeFolder ? `Cartella aperta: ${activeFolder.name}` : 'Strumenti agenzia chiusi.')
  }

  const renderAgencyToolDetails = () => {
    if (!activeAgencyTool) return null

    return (
      <div className="mb-4 rounded-3xl border border-[#B48EAD]/38 bg-[#242B38]/88 p-4 shadow-[0_18px_70px_rgba(0,0,0,0.42)]">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.28em] text-[#B48EAD]/80">
              Strumento selezionato
            </p>
            <h3 className="mt-1 flex items-center gap-2 text-lg font-semibold text-white">
              <span>{activeAgencyTool.icon}</span>
              <span>{activeAgencyTool.label}</span>
            </h3>
            <p className="mt-1 max-w-3xl text-xs leading-5 text-[#D8DEE9]/62">
              {activeAgencyTool.description}
            </p>
          </div>

          <button
            type="button"
            onClick={closeAgencyTool}
            className="rounded-full border border-[#BF616A]/55 bg-[#BF616A]/20 px-4 py-2 text-xs font-bold text-[#FFD9DD] shadow-[0_0_16px_rgba(191,97,106,0.20)] transition hover:bg-[#BF616A]/34 hover:text-white"
          >
            Chiudi
          </button>
        </div>

        {activeAgencyTool.id === 'visure' ? (
          <div className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {AI_OS_VISURA_OPTIONS.map((option) => {
                const isSaving = documentRequestSaving === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    disabled={Boolean(documentRequestSaving)}
                    onClick={() => createDocumentRequest(option.id)}
                    className="rounded-2xl border border-[#8FBCBB]/15 bg-[#252B36]/82 p-3 text-left transition hover:border-[#B48EAD]/45 hover:bg-[#B48EAD]/12 disabled:cursor-wait disabled:opacity-60"
                  >
                    <p className="text-sm font-semibold text-white">
                      {isSaving ? 'Salvataggio...' : option.label}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#D8DEE9]/55">
                      {option.hint}
                    </p>
                  </button>
                )
              })}
            </div>

            <div className="rounded-2xl border border-[#8FBCBB]/12 bg-[#242B38]/78 p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                    Storico richieste
                  </p>
                  <p className="mt-1 text-sm text-[#D8DEE9]/58">
                    Richieste documentali salvate per questa cartella immobile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => activeFolderId && loadDocumentRequests(activeFolderId)}
                  className="rounded-full border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-3 py-1.5 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#A3BE8C]/18"
                >
                  Aggiorna
                </button>
              </div>

              {documentRequestsLoading ? (
                <p className="text-sm text-[#D8DEE9]/55">Caricamento richieste...</p>
              ) : documentRequests.length > 0 ? (
                <div className="space-y-2">
                  {documentRequests.map((request) => {
                    const isUpdating = documentRequestUpdating === request.id

                    return (
                      <div
                        key={request.id}
                        className="rounded-2xl border border-[#8FBCBB]/10 bg-[#3B4252]/30 px-3 py-3"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{request.title}</p>
                            <p className="text-xs text-[#D8DEE9]/48">
                              {request.created_at
                                ? new Date(request.created_at).toLocaleString('it-IT')
                                : 'Data non disponibile'}
                            </p>
                          </div>

                          <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${classForDocumentRequestStatus(request.status)}`}>
                            {labelForDocumentRequestStatus(request.status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateDocumentRequestStatus(request.id, 'working')}
                            className="rounded-full border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 px-3 py-1.5 text-[11px] font-semibold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            In lavorazione
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateDocumentRequestStatus(request.id, 'completed')}
                            className="rounded-full border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-3 py-1.5 text-[11px] font-semibold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Completata
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateDocumentRequestStatus(request.id, 'cancelled')}
                            className="rounded-full border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-1.5 text-[11px] font-semibold text-[#BF616A] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Annulla
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => deleteDocumentRequest(request.id)}
                            className="rounded-full border border-[#D8DEE9]/15 bg-[#2E3440]/40 px-3 py-1.5 text-[11px] font-semibold text-[#D8DEE9]/70 transition hover:bg-[#D8DEE9]/10 disabled:cursor-wait disabled:opacity-50"
                          >
                            Elimina
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-[#D8DEE9]/55">
                  Nessuna richiesta salvata per questo immobile.
                </p>
              )}
            </div>
          </div>
        ) : activeAgencyTool.id === 'owner-data' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#8FBCBB]/15 bg-[#242B38]/82 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                    Proprietari collegati
                  </p>
                  <p className="mt-1 text-sm text-[#D8DEE9]/58">
                    Proprietario, comproprietari, società o referenti collegati al fascicolo immobile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startNewOwnerForm}
                  className="rounded-full border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#A3BE8C]/18"
                >
                  + Aggiungi proprietario
                </button>
              </div>

              {propertyOwnersLoading ? (
                <p className="text-sm text-[#D8DEE9]/55">Caricamento proprietari...</p>
              ) : propertyOwners.length > 0 ? (
                <div className="grid gap-3">
                  {propertyOwners.map((owner) => {
                    const isUpdating = propertyOwnerUpdating === owner.id

                    return (
                      <div
                        key={owner.id}
                        className="rounded-2xl border border-[#8FBCBB]/12 bg-[#2E3440]/38 p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-white">
                                {owner.full_name}
                              </p>
                              {owner.is_primary ? (
                                <span className="rounded-full border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#A3BE8C]">
                                  principale
                                </span>
                              ) : null}
                            </div>

                            <p className="mt-1 text-xs text-[#D8DEE9]/52">
                              {ownerRoleLabel(owner.role)} · {ownerTypeLabel(owner.owner_type)}
                            </p>

                            <div className="mt-2 grid gap-1 text-xs text-[#D8DEE9]/62 sm:grid-cols-2">
                              {owner.phone ? <p>📞 {owner.phone}</p> : null}
                              {owner.email ? <p>✉️ {owner.email}</p> : null}
                              {owner.tax_code ? <p>CF: {owner.tax_code}</p> : null}
                              {owner.vat_number ? <p>P.IVA: {owner.vat_number}</p> : null}
                              {owner.address ? <p className="sm:col-span-2">📍 {owner.address}</p> : null}
                              {owner.notes ? <p className="sm:col-span-2">📝 {owner.notes}</p> : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => startEditOwnerForm(owner)}
                              className="rounded-full border border-[#B48EAD]/25 bg-[#B48EAD]/10 px-3 py-1.5 text-[11px] font-semibold text-[#E5E9F0] transition hover:bg-[#B48EAD]/18 disabled:cursor-wait disabled:opacity-50"
                            >
                              Modifica
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => deletePropertyOwner(owner.id)}
                              className="rounded-full border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-1.5 text-[11px] font-semibold text-[#BF616A] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-50"
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/30 p-4 text-sm text-[#D8DEE9]/58">
                  Nessun proprietario salvato. Puoi aggiungere il primo proprietario del fascicolo.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#B48EAD]/32 bg-[#242B38]/90 p-4 shadow-[0_0_24px_rgba(180,142,173,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#B48EAD]/75">
                {editingOwnerId ? 'Modifica proprietario' : 'Nuovo proprietario'}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Tipo soggetto
                  <select
                    value={ownerForm.ownerType}
                    onChange={(event) => updateOwnerFormField('ownerType', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  >
                    <option value="person">Persona fisica</option>
                    <option value="company">Società</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Ruolo
                  <select
                    value={ownerForm.role}
                    onChange={(event) => updateOwnerFormField('role', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  >
                    <option value="owner">Proprietario</option>
                    <option value="co_owner">Comproprietario</option>
                    <option value="seller">Venditore</option>
                    <option value="landlord">Locatore</option>
                    <option value="company_representative">Referente società</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  Nome / Ragione sociale *
                  <input
                    value={ownerForm.fullName}
                    onChange={(event) => updateOwnerFormField('fullName', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Mario Rossi oppure Immobiliare Esempio SRL"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Telefono
                  <input
                    value={ownerForm.phone}
                    onChange={(event) => updateOwnerFormField('phone', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="+39 ..."
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Email
                  <input
                    value={ownerForm.email}
                    onChange={(event) => updateOwnerFormField('email', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="nome@email.it"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Codice fiscale
                  <input
                    value={ownerForm.taxCode}
                    onChange={(event) => updateOwnerFormField('taxCode', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="RSSMRA..."
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  P.IVA
                  <input
                    value={ownerForm.vatNumber}
                    onChange={(event) => updateOwnerFormField('vatNumber', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="01234567890"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  Indirizzo
                  <input
                    value={ownerForm.address}
                    onChange={(event) => updateOwnerFormField('address', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Via, numero civico, comune"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Città
                  <input
                    value={ownerForm.city}
                    onChange={(event) => updateOwnerFormField('city', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Bergamo"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Provincia
                  <input
                    value={ownerForm.province}
                    onChange={(event) => updateOwnerFormField('province', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="BG"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  Note riservate
                  <textarea
                    value={ownerForm.notes}
                    onChange={(event) => updateOwnerFormField('notes', event.target.value)}
                    className="mt-1 min-h-[86px] w-full resize-none rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Note interne non visibili sul sito..."
                  />
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-[#8FBCBB]/12 bg-[#2E3440]/35 px-3 py-2 text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={ownerForm.isPrimary}
                    onChange={(event) => updateOwnerFormField('isPrimary', event.target.checked)}
                    className="h-4 w-4 accent-[#A3BE8C]"
                  />
                  Imposta come proprietario principale
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={propertyOwnerSaving}
                  onClick={savePropertyOwner}
                  className="rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] transition disabled:cursor-wait disabled:opacity-60 hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                >
                  {propertyOwnerSaving ? 'Salvataggio...' : editingOwnerId ? 'Salva modifiche' : 'Salva proprietario'}
                </button>

                <button
                  type="button"
                  onClick={startNewOwnerForm}
                  className="rounded-full border border-[#D8DEE9]/15 bg-[#2E3440]/40 px-4 py-2 text-xs font-semibold text-[#D8DEE9]/70 transition hover:bg-[#D8DEE9]/10"
                >
                  Pulisci form
                </button>
              </div>
            </div>
          </div>
        ) : activeAgencyTool.id === 'checklist' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#8FBCBB]/12 bg-[#242B38]/78 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                    Stato fascicolo
                  </p>
                  <p className="mt-1 text-sm text-[#D8DEE9]/58">
                    Spunta i documenti completati per capire subito se l’immobile è pronto.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => activeFolderId && loadChecklist(activeFolderId)}
                  className="rounded-full border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-3 py-1.5 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#A3BE8C]/18"
                >
                  Aggiorna
                </button>
              </div>

              {checklistLoading ? (
                <p className="text-sm text-[#D8DEE9]/55">Caricamento checklist...</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {AI_OS_CHECKLIST_ITEMS.map((item) => {
                    const savedItem = checklistItems.find((entry) => entry.item_key === item.id)
                    const isDone = Boolean(savedItem?.is_done)
                    const isUpdating = checklistUpdating === item.id

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => toggleChecklistItem(item.id, item.label, !isDone)}
                        className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-left transition disabled:cursor-wait disabled:opacity-60 ${
                          isDone
                            ? 'border-[#A3BE8C]/30 bg-[#A3BE8C]/12'
                            : 'border-[#8FBCBB]/12 bg-[#3B4252]/32 hover:border-[#B48EAD]/35 hover:bg-[#B48EAD]/10'
                        }`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                          isDone
                            ? 'border-[#A3BE8C]/35 bg-[#A3BE8C]/20 text-[#A3BE8C]'
                            : 'border-[#8FBCBB]/25 bg-[#2E3440]/65 text-[#88C0D0]'
                        }`}>
                          {isDone ? '✓' : '□'}
                        </span>
                        <span className={`text-sm ${isDone ? 'text-[#E5E9F0]' : 'text-[#D8DEE9]/78'}`}>
                          {item.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : activeAgencyTool.id === 'mandate' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#8FBCBB]/15 bg-[#242B38]/82 p-4">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                    Incarichi collegati
                  </p>
                  <p className="mt-1 text-sm text-[#D8DEE9]/58">
                    Bozze e incarichi attivi per questo immobile.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={startNewMandateForm}
                  className="rounded-full border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#A3BE8C]/18"
                >
                  + Nuovo incarico
                </button>
              </div>

              {propertyMandatesLoading ? (
                <p className="text-sm text-[#D8DEE9]/55">Caricamento incarichi...</p>
              ) : propertyMandates.length > 0 ? (
                <div className="grid gap-3">
                  {propertyMandates.map((mandate) => {
                    const isUpdating = propertyMandateUpdating === mandate.id

                    return (
                      <div
                        key={mandate.id}
                        className="rounded-2xl border border-[#8FBCBB]/12 bg-[#2E3440]/38 p-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-semibold text-white">
                                {mandate.owner_name}
                              </p>
                              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${classForMandateStatus(mandate.status)}`}>
                                {labelForMandateStatus(mandate.status)}
                              </span>
                            </div>

                            <p className="mt-1 text-xs text-[#D8DEE9]/52">
                              {mandate.mandate_type === 'rent' ? 'Affitto' : 'Vendita'} · {mandate.assignment_type === 'non_exclusive' ? 'Non esclusivo' : 'Esclusivo'}
                            </p>

                            <div className="mt-2 grid gap-1 text-xs text-[#D8DEE9]/62 sm:grid-cols-2">
                              {mandate.start_date ? <p>Inizio: {mandate.start_date}</p> : null}
                              {mandate.end_date ? <p>Scadenza: {mandate.end_date}</p> : null}
                              {mandate.asking_price != null ? <p>Prezzo: € {mandate.asking_price}</p> : null}
                              {mandate.commission_rate != null ? <p>Provvigione: {mandate.commission_rate}%</p> : null}
                              {mandate.flat_fee != null ? <p>Compenso fisso: € {mandate.flat_fee}</p> : null}
                              {mandate.notes ? <p className="sm:col-span-2">📝 {mandate.notes}</p> : null}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => startEditMandateForm(mandate)}
                              className="rounded-full border border-[#B48EAD]/25 bg-[#B48EAD]/10 px-3 py-1.5 text-[11px] font-semibold text-[#E5E9F0] transition hover:bg-[#B48EAD]/18 disabled:cursor-wait disabled:opacity-50"
                            >
                              Modifica
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => deletePropertyMandate(mandate.id)}
                              className="rounded-full border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-1.5 text-[11px] font-semibold text-[#BF616A] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-50"
                            >
                              Elimina
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/30 p-4 text-sm text-[#D8DEE9]/58">
                  Nessun incarico salvato. Puoi creare la prima bozza direttamente da qui.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#B48EAD]/32 bg-[#242B38]/90 p-4 shadow-[0_0_24px_rgba(180,142,173,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-[#B48EAD]/75">
                {editingMandateId ? 'Modifica incarico' : 'Nuovo incarico'}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  Proprietario / referente *
                  <input
                    value={mandateForm.ownerName}
                    onChange={(event) => updateMandateFormField('ownerName', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Mario Rossi"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Tipo incarico
                  <select
                    value={mandateForm.mandateType}
                    onChange={(event) => updateMandateFormField('mandateType', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  >
                    <option value="sale">Vendita</option>
                    <option value="rent">Affitto</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Assegnazione
                  <select
                    value={mandateForm.assignmentType}
                    onChange={(event) => updateMandateFormField('assignmentType', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  >
                    <option value="exclusive">Esclusivo</option>
                    <option value="non_exclusive">Non esclusivo</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Stato
                  <select
                    value={mandateForm.status}
                    onChange={(event) => updateMandateFormField('status', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  >
                    <option value="draft">Bozza</option>
                    <option value="active">Attivo</option>
                    <option value="expired">Scaduto</option>
                    <option value="closed">Chiuso</option>
                  </select>
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Data inizio
                  <input
                    type="date"
                    value={mandateForm.startDate}
                    onChange={(event) => updateMandateFormField('startDate', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Data fine
                  <input
                    type="date"
                    value={mandateForm.endDate}
                    onChange={(event) => updateMandateFormField('endDate', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none focus:border-[#B48EAD]/60"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Prezzo richiesto
                  <input
                    type="number"
                    step="0.01"
                    value={mandateForm.askingPrice}
                    onChange={(event) => updateMandateFormField('askingPrice', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="250000"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Provvigione %
                  <input
                    type="number"
                    step="0.01"
                    value={mandateForm.commissionRate}
                    onChange={(event) => updateMandateFormField('commissionRate', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="3"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70">
                  Compenso fisso
                  <input
                    type="number"
                    step="0.01"
                    value={mandateForm.flatFee}
                    onChange={(event) => updateMandateFormField('flatFee', event.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="0"
                  />
                </label>

                <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                  Note incarico
                  <textarea
                    value={mandateForm.notes}
                    onChange={(event) => updateMandateFormField('notes', event.target.value)}
                    className="mt-1 min-h-[86px] w-full resize-none rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Condizioni, accordi, dettagli utili..."
                  />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={propertyMandateSaving}
                  onClick={savePropertyMandate}
                  className="rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] transition disabled:cursor-wait disabled:opacity-60 hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                >
                  {propertyMandateSaving ? 'Salvataggio...' : editingMandateId ? 'Salva modifiche' : 'Salva incarico'}
                </button>

                <button
                  type="button"
                  onClick={startNewMandateForm}
                  className="rounded-full border border-[#D8DEE9]/15 bg-[#2E3440]/40 px-4 py-2 text-xs font-semibold text-[#D8DEE9]/70 transition hover:bg-[#D8DEE9]/10"
                >
                  Pulisci form
                </button>
              </div>
            </div>
          </div>
        ) : activeAgencyTool.id === 'owner-docs' ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#8FBCBB]/12 bg-[#242B38]/78 p-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                    Documenti proprietario
                  </p>
                  <p className="mt-1 text-sm text-[#D8DEE9]/58">
                    Stato dei documenti riservati del proprietario o della società collegata.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => activeFolderId && loadOwnerDocuments(activeFolderId)}
                  className="rounded-full border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-3 py-1.5 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#A3BE8C]/18"
                >
                  Aggiorna
                </button>
              </div>

              {ownerDocumentsLoading ? (
                <p className="text-sm text-[#D8DEE9]/55">Caricamento documenti proprietario...</p>
              ) : (
                <div className="grid gap-3">
                  {AI_OS_OWNER_DOCUMENTS.map((document) => {
                    const savedDocument = ownerDocuments.find((entry) => entry.document_key === document.id)
                    const status = savedDocument?.status || 'missing'
                    const isUpdating = ownerDocumentUpdating === document.id

                    return (
                      <div
                        key={document.id}
                        className="rounded-2xl border border-[#8FBCBB]/22 bg-[#242B38]/88 p-3 shadow-[0_0_18px_rgba(143,188,187,0.05)]"
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-white">{document.label}</p>
                            <p className="mt-1 text-xs text-[#D8DEE9]/50">
                              Aggiorna lo stato quando il documento viene ricevuto o verificato.
                            </p>
                          </div>

                          <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${classForOwnerDocumentStatus(status)}`}>
                            {labelForOwnerDocumentStatus(status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateOwnerDocumentStatus(document.id, document.label, 'missing')}
                            className="rounded-full border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-1.5 text-[11px] font-semibold text-[#BF616A] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Da ricevere
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateOwnerDocumentStatus(document.id, document.label, 'received')}
                            className="rounded-full border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 px-3 py-1.5 text-[11px] font-semibold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Ricevuto
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateOwnerDocumentStatus(document.id, document.label, 'verified')}
                            className="rounded-full border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-3 py-1.5 text-[11px] font-semibold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Verificato
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() => updateOwnerDocumentStatus(document.id, document.label, 'not_needed')}
                            className="rounded-full border border-[#88C0D0]/25 bg-[#88C0D0]/10 px-3 py-1.5 text-[11px] font-semibold text-[#88C0D0] transition hover:bg-[#88C0D0]/18 disabled:cursor-wait disabled:opacity-50"
                          >
                            Non necessario
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className={`${String(activeAgencyToolId) === "drive" ? "hidden" : ""} rounded-2xl border border-[#B48EAD]/15 bg-[#242B38]/76 p-4`}>
              <p className="text-sm font-semibold text-white">Dove caricare i file</p>
              <p className="mt-2 text-xs leading-5 text-[#D8DEE9]/60">
                I PDF o le immagini dei documenti possono essere caricati nella sotto-cartella “Docs e planimetrie”.
                Nel prossimo step collegheremo ogni documento al file specifico caricato.
              </p>
              <button
                type="button"
                onClick={() => openSubFolder('docs')}
                className="mt-4 rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
              >
                Apri Docs e planimetrie
              </button>
            </div>
          </div>
        ) : activeAgencyTool.id === 'drive' ? (
          <div className="aios-drive-manager aios-drive-clean">
            <div className="overflow-hidden rounded-[28px] border border-[#3B4252]/70 bg-[#070A10]/94 shadow-[0_28px_120px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(236,239,244,0.045)]">
              <div className="border-b border-[#3B4252]/70 bg-[#0B1018]/96 px-4 py-3">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#D8DEE9]/72">
                      <span className="text-[#ECEFF4]">Il mio Drive</span>
                      <span className="text-[#4C566A]">›</span>
                      <span className="rounded-full border border-[#4C566A]/70 bg-[#111827] px-3 py-1 text-[#D8DEE9]">
                        AI-OS
                      </span>
                      <span className="text-[#4C566A]">›</span>
                      <span>Immobili</span>
                      {driveExplorer?.folder?.name ? (
                        <>
                          <span className="text-[#4C566A]">›</span>
                          <span className="max-w-[420px] truncate text-[#A3BE8C]">
                            {driveExplorer.folder.name}
                          </span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex overflow-hidden rounded-full border border-[#4C566A]/70 bg-[#0F1621] p-1 shadow-inner">
                      <button
                        type="button"
                        onClick={() => setDriveExplorerViewMode('list')}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          driveExplorerViewMode === 'list'
                            ? 'bg-[#5E81AC] text-white shadow-[0_0_18px_rgba(94,129,172,0.32)]'
                            : 'text-[#D8DEE9]/62 hover:bg-[#1A2330] hover:text-[#ECEFF4]'
                        }`}
                        title="Vista elenco"
                      >
                        ☰
                      </button>

                      <button
                        type="button"
                        onClick={() => setDriveExplorerViewMode('grid')}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          driveExplorerViewMode === 'grid'
                            ? 'bg-[#5E81AC] text-white shadow-[0_0_18px_rgba(94,129,172,0.32)]'
                            : 'text-[#D8DEE9]/62 hover:bg-[#1A2330] hover:text-[#ECEFF4]'
                        }`}
                        title="Vista griglia"
                      >
                        ▦
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={driveExplorerHistory.length === 0}
                      onClick={goBackDriveExplorerFolder}
                      className="rounded-full border border-[#4C566A]/70 bg-[#111827] px-4 py-2 text-xs font-bold text-[#D8DEE9] transition hover:border-[#8FBCBB]/45 hover:bg-[#151F2E] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ← Indietro
                    </button>

                    <button
                      type="button"
                      onClick={openDriveExplorerRootFolder}
                      className="rounded-full border border-[#4C566A]/70 bg-[#111827] px-4 py-2 text-xs font-bold text-[#D8DEE9] transition hover:border-[#8FBCBB]/45 hover:bg-[#151F2E]"
                    >
                      Cartella immobile
                    </button>

                    <button
                      type="button"
                      onClick={() => loadDriveExplorer(driveExplorer?.folder?.id || driveFolder?.drive_folder_id)}
                      className="rounded-full border border-[#4C566A]/70 bg-[#111827] px-4 py-2 text-xs font-bold text-[#D8DEE9] transition hover:border-[#B48EAD]/45 hover:bg-[#151F2E]"
                    >
                      Aggiorna
                    </button>

                    {driveExplorer?.folder?.url ? (
                      <a
                        href={driveExplorer.folder.url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
                      >
                        Apri in Drive
                      </a>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex min-h-11 flex-1 items-center gap-3 rounded-full border border-[#3B4252]/80 bg-[#06080D]/86 px-4 shadow-[inset_0_1px_0_rgba(236,239,244,0.03)]">
                    <span className="text-[#8FBCBB]">⌕</span>
                    <input
                      value={driveExplorerSearchQuery}
                      onChange={(event) => setDriveExplorerSearchQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#ECEFF4] outline-none placeholder:text-[#D8DEE9]/34"
                      placeholder="Cerca in questa cartella Drive..."
                    />
                    {driveExplorerSearchQuery.trim() ? (
                      <button
                        type="button"
                        onClick={() => setDriveExplorerSearchQuery('')}
                        className="grid h-7 w-7 place-items-center rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 text-sm font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/20"
                        aria-label="Svuota ricerca Drive"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {driveFolder?.drive_folder_id ? (
                      <label className="cursor-pointer rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#101820] shadow-[0_0_24px_rgba(163,190,140,0.18)] transition hover:bg-[#111827] hover:text-[#A3BE8C]">
                        Carica file
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(event) => {
                            void uploadFilesToDriveExplorerFolder(
                              driveExplorer?.folder?.id || driveFolder.drive_folder_id,
                              Array.from(event.target.files ?? []),
                            )
                            event.currentTarget.value = ''
                          }}
                        />
                      </label>
                    ) : null}

                    <div className="flex min-w-[280px] items-center gap-2 rounded-full border border-[#3B4252]/75 bg-[#06080D]/86 p-1">
                      <input
                        value={driveExplorerNewFolderName}
                        onChange={(event) => setDriveExplorerNewFolderName(event.target.value)}
                        className="min-w-0 flex-1 rounded-full border-0 bg-transparent px-3 py-1.5 text-xs font-semibold text-white outline-none placeholder:text-[#D8DEE9]/34"
                        placeholder="Nuova cartella..."
                      />
                      <button
                        type="button"
                        disabled={driveExplorerCreatingFolder}
                        onClick={createDriveExplorerSubfolder}
                        className="rounded-full border border-[#88C0D0]/35 bg-[#88C0D0]/12 px-3 py-1.5 text-xs font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/20 disabled:cursor-wait disabled:opacity-60"
                      >
                        {driveExplorerCreatingFolder ? 'Creo...' : '+ Cartella'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {driveFolderLoading ? (
                <div className="p-6">
                  <div className="rounded-3xl border border-[#3B4252]/70 bg-[#0B1018]/82 p-6 text-sm font-semibold text-[#D8DEE9]/62">
                    Caricamento cartella Drive immobile...
                  </div>
                </div>
              ) : driveFolder?.drive_folder_id ? (
                <div
                  onDrop={(event) => {
                    event.preventDefault()
                    void uploadFilesToDriveExplorerFolder(
                      driveExplorer?.folder?.id || driveFolder.drive_folder_id,
                      Array.from(event.dataTransfer.files),
                    )
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  className="min-h-[650px] bg-[#080B11]/72 p-5"
                >
                  {driveExplorerUploading ? (
                    <div className="mb-4 rounded-2xl border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 p-3 text-xs font-semibold text-[#EBCB8B]">
                      Upload in corso...
                    </div>
                  ) : driveExplorerUploadMessage ? (
                    <div className="mb-4 rounded-2xl border border-[#4C566A]/55 bg-[#0B1018]/82 p-3 text-xs leading-5 text-[#D8DEE9]/60">
                      {driveExplorerUploadMessage}
                    </div>
                  ) : null}

                  {driveExplorerLoading ? (
                    <div className="rounded-3xl border border-[#3B4252]/70 bg-[#0B1018]/82 p-6 text-sm font-semibold text-[#D8DEE9]/62">
                      Lettura Drive immobile...
                    </div>
                  ) : driveExplorerError ? (
                    <div className="rounded-3xl border border-[#BF616A]/25 bg-[#BF616A]/10 p-6 text-sm font-semibold text-[#FFCCD2]">
                      {driveExplorerError}
                    </div>
                  ) : (
                    <div className="aios-drive-file-space min-h-[590px] rounded-[24px] border border-dashed border-[#3B4252]/50 bg-[#05070B]/34 p-6">
                      {driveExplorer?.folders?.length || driveExplorer?.files?.length ? (
                        driveExplorerViewMode === 'list' ? (
                          <div className="overflow-hidden rounded-2xl border border-[#3B4252]/70 bg-[#0B1018]/70">
                            <div className="grid grid-cols-[minmax(0,1fr)_170px_130px] border-b border-[#3B4252]/70 bg-[#0F1621]/90 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-[#D8DEE9]/52">
                              <span>Nome</span>
                              <span>Tipo</span>
                              <span className="text-right">Dimensione</span>
                            </div>

                            <div className="divide-y divide-[#3B4252]/55">
                              {(driveExplorer?.folders ?? [])
                                .filter((folder) =>
                                  !driveExplorerSearchQuery.trim() ||
                                  folder.name.toLowerCase().includes(driveExplorerSearchQuery.trim().toLowerCase())
                                )
                                .map((folder) => (
                                  <button
                                    key={folder.id}
                                    type="button"
                                    onClick={() => setSelectedDriveItem({ type: 'folder', folder })}
                                    onDoubleClick={() => openDriveExplorerFolder(folder.id)}
                                    onContextMenu={(event) => openDriveItemContextMenu(event, { type: 'folder', folder })}
                                    className={`grid w-full grid-cols-[minmax(0,1fr)_170px_130px] items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition ${
                                      selectedDriveItem?.type === 'folder' && selectedDriveItem.folder.id === folder.id
                                        ? 'bg-[#0B5CAD] text-white'
                                        : 'text-[#ECEFF4] hover:bg-[#1F1F1F]'
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-3">
                                      <span className="aios-folder-icon-mini" />
                                      <span className="truncate">{folder.name}</span>
                                    </span>
                                    <span className="text-[#D8DEE9]/52">Cartella</span>
                                    <span className="text-right text-[#D8DEE9]/42">—</span>
                                  </button>
                                ))}

                              {(driveExplorer?.files ?? [])
                                .filter((file) =>
                                  !driveExplorerSearchQuery.trim() ||
                                  file.name.toLowerCase().includes(driveExplorerSearchQuery.trim().toLowerCase())
                                )
                                .map((file) => (
                                  <button
                                    key={file.id}
                                    type="button"
                                    onClick={() => setSelectedDriveItem({ type: 'file', file })}
                                    onDoubleClick={() => file.url && window.open(file.url, '_blank', 'noopener,noreferrer')}
                                    onContextMenu={(event) => openDriveItemContextMenu(event, { type: 'file', file })}
                                    className={`grid w-full grid-cols-[minmax(0,1fr)_170px_130px] items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition ${
                                      selectedDriveItem?.type === 'file' && selectedDriveItem.file.id === file.id
                                        ? 'bg-[#0B5CAD] text-white'
                                        : 'text-[#ECEFF4] hover:bg-[#1F1F1F]'
                                    }`}
                                  >
                                    <span className="flex min-w-0 items-center gap-3">
                                      <span className="aios-file-icon-mini" />
                                      <span className="truncate">{file.name}</span>
                                    </span>
                                    <span className="truncate text-[#D8DEE9]/52">
                                      {file.mimeType || 'File'}
                                    </span>
                                    <span className="text-right text-[#D8DEE9]/42">
                                      {file.size ? formatFileSize(Number(file.size)) : '—'}
                                    </span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        ) : (
                          <div className="aios-drive-icon-grid">
                            {(driveExplorer?.folders ?? [])
                              .filter((folder) =>
                                !driveExplorerSearchQuery.trim() ||
                                folder.name.toLowerCase().includes(driveExplorerSearchQuery.trim().toLowerCase())
                              )
                              .map((folder) => (
                                <button
                                  key={folder.id}
                                  type="button"
                                  onClick={() => setSelectedDriveItem({ type: 'folder', folder })}
                                  onDoubleClick={() => openDriveExplorerFolder(folder.id)}
                                  onContextMenu={(event) => openDriveItemContextMenu(event, { type: 'folder', folder })}
                                  className={`aios-drive-icon-item ${
                                    selectedDriveItem?.type === 'folder' && selectedDriveItem.folder.id === folder.id
                                      ? 'aios-drive-icon-item-selected'
                                      : ''
                                  }`}
                                >
                                  <span className="aios-folder-icon" />
                                  <span className="aios-drive-icon-label">
                                    {folder.name}
                                  </span>
                                </button>
                              ))}

                            {(driveExplorer?.files ?? [])
                              .filter((file) =>
                                !driveExplorerSearchQuery.trim() ||
                                file.name.toLowerCase().includes(driveExplorerSearchQuery.trim().toLowerCase())
                              )
                              .map((file) => (
                                <button
                                  key={file.id}
                                  type="button"
                                  onClick={() => setSelectedDriveItem({ type: 'file', file })}
                                  onDoubleClick={() => file.url && window.open(file.url, '_blank', 'noopener,noreferrer')}
                                  onContextMenu={(event) => openDriveItemContextMenu(event, { type: 'file', file })}
                                  className={`aios-drive-icon-item ${
                                    selectedDriveItem?.type === 'file' && selectedDriveItem.file.id === file.id
                                      ? 'aios-drive-icon-item-selected'
                                      : ''
                                  }`}
                                >
                                  <span className={`aios-drive-file-thumb ${isDriveImageFile(file) ? 'aios-drive-file-thumb-image' : ''}`}>
                                    <span className="aios-file-icon" />
                                    {isDriveImageFile(file) ? (
                                      <img
                                        src={driveFileThumbnailUrl(file)}
                                        alt=""
                                        loading="lazy"
                                        onError={(event) => {
                                          event.currentTarget.style.display = 'none'
                                        }}
                                      />
                                    ) : null}
                                  </span>
                                  <span className="aios-drive-icon-label">
                                    {file.name}
                                  </span>
                                </button>
                              ))}
                          </div>
                        )
                      ) : (
                        <div className="flex min-h-[520px] items-center justify-center text-center">
                          <div>
                            <span className="aios-folder-icon aios-folder-icon-empty mx-auto" />
                            <p className="mt-5 text-sm font-bold text-[#ECEFF4]">Cartella vuota</p>
                            <p className="mt-1 text-xs text-[#D8DEE9]/50">
                              Trascina qui file, crea una cartella o apri Google Drive.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <div className="rounded-3xl border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 p-6 text-sm text-[#D8DEE9]/70">
                    <p className="text-base font-bold text-[#ECEFF4]">
                      Cartella Drive immobile non pronta
                    </p>
                    <p className="mt-2 max-w-3xl leading-6">
                      Crea o sincronizza la struttura Drive-first dell’agenzia. AI-OS creerà
                      le cartelle immobili e la struttura standard dentro Google Drive.
                    </p>

                    <button
                      type="button"
                      onClick={createMissingDriveFolders}
                      className="mt-5 rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-5 py-2 text-xs font-bold text-[#101820] transition hover:bg-[#101820] hover:text-[#A3BE8C]"
                    >
                      Crea/sistema cartelle immobili in Drive
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#8FBCBB]/15 bg-[#242B38]/82 p-4">
            <p className="text-sm font-semibold text-white">
              {activeAgencyTool.primaryAction}
            </p>
            <p className="mt-2 text-xs leading-5 text-[#D8DEE9]/60">
              Primo step UI completato. Nel prossimo giro colleghiamo questo strumento a dati reali,
              documenti, PDF o tabelle Supabase dedicate.
            </p>
            <button
              type="button"
              onClick={() =>
                setNotice(`${activeAgencyTool.label}: azione pronta per collegamento database/API.`)
              }
              className="mt-4 rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
            >
              {activeAgencyTool.primaryAction}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderSectionSwitcher = (mobile = false) => {
    if (activeSection !== 'root') {
      const sectionLabel = getSectionLabel(activeSection)

      return (
        <div className="mb-4 rounded-3xl border border-[#B48EAD]/20 bg-[#3B4252]/18 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.28em] text-[#B48EAD]/75">
                Sotto-cartella aperta
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold text-white">
                {activeSection === 'images' ? '🖼️' : '📐'} {sectionLabel}
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#D8DEE9]/55">
                {activeSection === 'images'
                  ? 'Qui puoi caricare solo immagini e video.'
                  : 'Qui puoi caricare TXT, immagini, video, PDF e documenti.'}
              </p>
            </div>

            <button
              type="button"
              onClick={openRootFolder}
              className="rounded-full border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/18"
            >
              ← Torna alla root
            </button>
          </div>
        </div>
      )
    }

    if (String(activeAgencyToolId) === 'drive') {
      return <>{renderAgencyToolDetails()}</>
    }

    return (
      <>
        <div
          onDrop={handleDrop}
          onDragOver={(event) => event.preventDefault()}
          className="mb-4 rounded-3xl border border-dashed border-[#8FBCBB]/28 bg-[#252B36]/88 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.36)] transition hover:border-[#A3BE8C]/45"
        >
          <div className="mb-4 rounded-2xl border border-[#8FBCBB]/12 bg-[#151A23]/72 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#8FBCBB]/65">
              Percorso AI-OS
            </p>
            <p className="mt-1 truncate text-xs font-semibold text-[#D8DEE9]/72">
              📁 {activeFolder?.name || 'Cartella immobile'} / {activeCustomFolderName || getSectionLabel(activeSection)}
            </p>
          </div>

          <div className="mb-4 rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/56 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/70">
              Azioni rapide nella cartella aperta
            </p>
            <p className="mt-1 text-xs leading-5 text-[#D8DEE9]/55">
              Trascina file nella cartella aperta oppure usa i pulsanti rapidi.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] shadow-[0_0_18px_rgba(163,190,140,0.18)] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75">
                Carica file
                <input
                  type="file"
                  multiple
                  accept={getUploadAccept(activeSection)}
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>

              <label className="cursor-pointer rounded-full border border-[#8FBCBB]/28 bg-[#202632]/86 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#8FBCBB]/12">
                Fotocamera
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>

              <label className="cursor-pointer rounded-full border border-[#8FBCBB]/28 bg-[#202632]/86 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#8FBCBB]/12">
                Video
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </label>

              <button
                type="button"
                onClick={createTxtFile}
                className="rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] shadow-[0_0_18px_rgba(163,190,140,0.18)] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
              >
                + Nuovo TXT
              </button>

              <button
                type="button"
                onClick={openCreateCustomFolderDialog}
                className="rounded-full border border-[#8FBCBB]/28 bg-[#202632]/86 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#8FBCBB]/12"
              >
                + Nuova cartella
              </button>
            </div>
          </div>

          <div className={`min-h-[420px] rounded-[28px] border border-dashed border-[#8FBCBB]/18 bg-[#151A23]/42 p-4 grid content-start gap-3 ${mobile ? 'grid-cols-2' : 'sm:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-8'}`}>
            {activeCustomFolderId ? (
              <button
                type="button"
                onClick={closeCustomFolder}
                className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12 active:scale-[0.98]"
              >
                <span className="mb-2 text-4xl">↩️</span>
                <span className="line-clamp-2 text-xs font-bold leading-4 text-[#ECEFF4]">
                  Indietro
                </span>
              </button>
            ) : (
              AI_OS_SECTIONS.map((section) => (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => openSubFolder(section.id)}
                  title={section.description}
                  className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12 active:scale-[0.98]"
                >
                  <span className="mb-2 text-4xl">📁</span>

                  <span className="line-clamp-2 text-xs font-bold leading-4 text-[#ECEFF4]">
                    {section.label}
                  </span>
                </button>
              ))
            )}

            {customFoldersLoading ? (
              <div className="rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-4 text-center text-xs text-[#D8DEE9]/60">
                Caricamento cartelle...
              </div>
            ) : (
              customFolders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => openCustomFolder(folder)}
                  onContextMenu={(event) => openCustomFolderContextMenu(event, folder)}
                  className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12 active:scale-[0.98]"
                >
                  <span className="mb-2 text-4xl">📁</span>

                  <span className="line-clamp-2 text-xs font-bold leading-4 text-[#ECEFF4]">
                    {folder.name}
                  </span>
                </button>
              ))
            )}

            {activeFolder && activeFolder.files.length > 0
              ? activeFolder.files.map((file) => renderFileCard(file, mobile))
              : null}
          </div>
        </div>

        <div className="mb-4 rounded-3xl border border-[#8FBCBB]/22 bg-[#252B36]/88 p-4 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#B48EAD]/78">
                Strumenti Agenzia
              </p>
              <h4 className="mt-1 text-base font-semibold text-white">
                Azioni rapide sul fascicolo immobile
              </h4>
            </div>
            <p className="text-xs text-[#D8DEE9]/50">
              Visure, proprietario, incarichi, marketing e visite.
            </p>
          </div>

          <div className={`grid gap-2 ${mobile ? 'grid-cols-1' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
            {AI_OS_AGENCY_TOOLS.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => openAgencyTool(tool.id)}
                title={tool.description}
                className={`group rounded-2xl border p-3 text-left transition active:scale-[0.99] ${
                  activeAgencyToolId === tool.id
                    ? 'border-[#B48EAD]/70 bg-[#B48EAD]/24 shadow-[0_0_30px_rgba(180,142,173,0.22)]'
                    : 'border-[#8FBCBB]/22 bg-[#202632]/86 shadow-[0_0_18px_rgba(143,188,187,0.04)] hover:border-[#B48EAD]/52 hover:bg-[#B48EAD]/16'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{tool.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${agencyToolLedClass(tool.id)}`} />
                      <p className="text-sm font-semibold leading-tight text-white">
                        {tool.label}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#D8DEE9]/62">
                      {tool.status}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        {renderAgencyToolDetails()}
      </>
    )
  }

  function moveTargetDescription(section: AIOSSection) {
    if (section === 'images') return 'Foto, immagini e video pubblicabili'
    if (section === 'docs') return 'Documenti, PDF, planimetrie e note'
    return 'Root cartella immobile'
  }

  function moveTargetIcon(section: AIOSSection) {
    if (section === 'images') return '🖼️'
    if (section === 'docs') return '📐'
    return '📁'
  }

  function moveTargetLabel(section: AIOSSection) {
    if (section === 'images') return 'Immagini'
    if (section === 'docs') return 'Docs e planimetrie'
    return 'Root'
  }

  function availableMoveTargets(currentSection: AIOSSection = activeSection) {
    return (['root', 'images', 'docs'] as AIOSSection[]).filter((section) => section !== currentSection)
  }

  function openRenameFileDialogFromContext(fileId: string, fileName: string) {
    setRenameFileDialog({ fileId, fileName })
    setRenameFileDraft(fileName)
    setContextMenu(null)
  }

  async function saveRenameFile() {
    if (!renameFileDialog) return

    const nextName = renameFileDraft.trim()

    if (!nextName) {
      setNotice('Inserisci un nome file valido.')
      return
    }

    setRenameFileSaving(true)

    try {
      const response = await fetch('/api/admin/ai-os/rename-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: renameFileDialog.fileId,
          fileName: nextName,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore rinomina file')
      }

      const renamedFile = payload?.file ? normalizeFileFromApi(payload.file) : null

      if (renamedFile && activeFolderId) {
        replaceFileInFolder(activeFolderId, renameFileDialog.fileId, renamedFile)
      } else if (activeFolderId) {
        void loadFilesForFolder(activeFolderId, activeSection, activeCustomFolderId)
      }

      if (selectedTxtId === renameFileDialog.fileId) {
        setSelectedTxtId(renameFileDialog.fileId)
      }

      setNotice(`File rinominato: ${nextName}`)
      setRenameFileDialog(null)
      setRenameFileDraft('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore rinomina file'
      setNotice(message)
    } finally {
      setRenameFileSaving(false)
    }
  }

  function openMovePickerFromContext(fileId: string, fileName: string) {
    setMovePicker({ fileId, fileName })
    setMovePickerTarget(null)
    setMovePickerLocation('root')
    setMovePickerFolders([])
    setContextMenu(null)
    setCustomFolderContextMenu(null)
  }

  async function moveFileToSection(file: Pick<AIOSFile, 'id'>, targetSection: AIOSSection, targetCustomFolderId: string | null = null) {
    if (!file?.id) return

    setFileMoveUpdating(file.id)

    try {
      const response = await fetch('/api/admin/ai-os/move-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          targetSection,
          targetCustomFolderId,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore spostamento file')
      }

      const targetFolderLabel = targetCustomFolderId
        ? movePickerFolders.find((folder) => folder.id === targetCustomFolderId)?.name || 'sottocartella'
        : moveTargetLabel(targetSection)

      setNotice(`File spostato in ${targetFolderLabel}.`)
      setMovePicker(null)
      setMovePickerTarget(null)
      setMovePickerLocation('root')
      setMovePickerFolders([])

      setFolders((currentFolders) =>
        currentFolders.map((folder) => {
          if (folder.id !== activeFolderId) return folder

          const nextFiles = folder.files.filter((item) => item.id !== file.id)

          return {
            ...folder,
            files: nextFiles,
            fileCount: Math.max(0, Number(folder.fileCount ?? folder.files.length) - 1),
          }
        }),
      )

      if (selectedTxtId === file.id) {
        setSelectedTxtId(null)
        setTxtDraft('')
      }

      if (previewFile?.id === file.id) {
        setPreviewFile(null)
      }

      if (activeFolderId) {
        void loadFilesForFolder(activeFolderId, activeSection)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore spostamento file'
      setNotice(message)
    } finally {
      setFileMoveUpdating('')
    }
  }

  const renderFileCard = (file: AIOSFile, mobile = false) => {
    const isUploading = file.status === 'uploading'
    const isError = file.status === 'error'
    const progress = Math.max(0, Math.min(100, Number(file.uploadProgress ?? 0)))

    return (
      <div
        key={file.id}
        role="button"
        tabIndex={0}
        onClick={() => openFile(file)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            openFile(file)
          }
        }}
        onContextMenu={(event) => openFileContextMenu(event, file)}
        className={`group relative cursor-pointer overflow-hidden rounded-2xl border text-left transition active:scale-[0.99] ${
          mobile ? 'w-full p-3' : 'p-4'
        } ${
          isError
            ? 'border-[#BF616A]/45 bg-[#BF616A]/10'
            : selectedTxtId === file.id
              ? 'border-[#8FBCBB]/38 bg-[#111827]/90 shadow-[0_0_28px_rgba(143,188,187,0.08)]'
              : 'border-[#4C566A]/45 bg-[#0B1018]/78 hover:border-[#8FBCBB]/28 hover:bg-[#111827]/88 hover:shadow-[0_14px_36px_rgba(0,0,0,0.32)]'
        }`}
      >
        {isUploading ? (
          <span
            className="absolute inset-y-0 left-0 z-0 bg-[#B48EAD]/25 shadow-[0_0_22px_rgba(167,139,250,0.45)] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        ) : null}

        {isUploading ? (
          <span className="absolute inset-0 z-0 bg-[linear-gradient(90deg,transparent,rgba(167,139,250,0.16),transparent)]" />
        ) : null}

        <div className="relative z-10 flex items-start gap-3">
          <span className={mobile ? 'text-2xl' : 'text-3xl'}>{iconForFile(file.kind)}</span>

          <div className="min-w-0 flex-1">
            <p className={`truncate font-medium text-white ${mobile ? 'text-sm' : ''}`}>
              {file.name}
            </p>

            <p className="mt-1 text-xs text-[#D8DEE9]/55">
              {file.size ?? '—'} ·{' '}
              {isUploading
                ? `upload ${progress}%`
                : isError
                  ? 'errore'
                  : file.status === 'local'
                    ? 'locale'
                    : 'salvato'}
            </p>

            {isUploading ? (
              <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#3B4252]/65">
                <div
                  className="h-full rounded-full bg-violet-300/80 shadow-[0_0_14px_rgba(196,181,253,0.85)] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : null}

            {file.isGalleryVisible ? (
              <span className="mt-2 inline-flex rounded-full border border-[#B48EAD]/25 bg-[#B48EAD]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#E5E9F0]">
                Visibile in immobile
              </span>
            ) : null}

            {isError ? (
              <p className="mt-2 line-clamp-2 text-xs text-[#BF616A]/80">
                {file.uploadError ?? 'Upload non riuscito'}
              </p>
            ) : file.kind === 'txt' ? (
              <p className="mt-2 text-xs text-[#E5E9F0]/80">
                {mobile ? 'Tocca per modificare' : 'clicca per modificare'}
              </p>
            ) : (
              <p className="mt-2 text-xs text-[#D8DEE9]/45">
                {mobile ? 'Tocca per anteprima fullscreen' : 'clicca per anteprima'}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <main className={`${jetBrainsMono.className} aios-nord fixed inset-0 z-[9999] h-dvh w-screen overflow-hidden bg-[#2E3440] text-[#D8DEE9] antialiased`}>
      <div className="aios-nordic-bg absolute inset-0 bg-[radial-gradient(circle_at_16%_12%,rgba(94,129,172,0.26),transparent_32%),radial-gradient(circle_at_78%_18%,rgba(143,188,187,0.15),transparent_28%),radial-gradient(circle_at_76%_84%,rgba(180,142,173,0.16),transparent_30%),linear-gradient(135deg,#111827_0%,#151A23_42%,#1B202B_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(136,192,208,.32)_1px,transparent_1px),linear-gradient(90deg,rgba(136,192,208,.32)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,rgba(0,0,0,0.35))]" />

      <section className="relative z-10 flex h-[calc(100dvh-56px)] flex-col overflow-hidden p-3 md:hidden">
        {!mobileFolderOpen ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <header className="mb-4 shrink-0">
              <p className="text-xs uppercase tracking-[0.42em] text-[#8FBCBB]/80">
                Area Immobiliare
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-white">
                AI-OS Mobile
              </h1>
              <p className="mt-2 text-sm leading-6 text-[#D8DEE9]/65">
                Seleziona una cartella immobile per caricare foto, video, documenti o note.
              </p>

              <div className="mt-3">
                <AIOSQuotaBar
                  usedBytes={quotaUsedBytes}
                  maxBytes={quotaMaxBytes}
                  warnBytes={quotaWarnBytes}
                  compact
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto rounded-[28px] border border-[#8FBCBB]/15 bg-[#2E3440]/30 p-3 backdrop-blur-2xl">
              <div className="mb-3 flex items-center justify-between px-1">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8FBCBB]/70">
                    Cartelle
                  </p>
                  <h2 className="text-lg font-semibold text-white">Immobili</h2>
                </div>
                <span className="rounded-full bg-[#A3BE8C]/15 px-3 py-1 text-xs text-[#D8DEE9]">
                  {folders.length}
                </span>
              </div>

              {foldersLoading ? (
                <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/20 p-6 text-sm text-[#D8DEE9]/70">
                  Caricamento cartelle AI-OS...
                </div>
              ) : folders.length > 0 ? (
                <div className="space-y-2">
                  {filteredFolders.map((folder) => {
                    const visualState = getFolderVisualState(folder)

                    return (
                      <button
                        key={folder.id}
                        type="button"
                        onClick={() => selectFolder(folder, true)}
                        className={`w-full rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99] ${folderCardClass(visualState, activeFolderId === folder.id)}`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                            <span className={`absolute -right-1 top-0 h-3.5 w-3.5 rounded-full ring-2 ring-[#202632] ${folderLedClass(visualState)}`} />
                            <span className="text-3xl">📁</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 items-center justify-between gap-2">
                              <p className="truncate text-base font-semibold text-white">
                                {folder.name}
                              </p>
                              <span className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] ${folderStateTextClass(visualState)}`}>
                                {folderStateLabel(visualState)}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#D8DEE9]/60">
                              Rif. {folder.propertyRef} · {folder.fileCount ?? folder.files.length} file
                            </p>
                            <p className="mt-1 truncate text-xs text-[#D8DEE9]/45">
                              {folder.address}
                            </p>
                            {folder.visualReason ? (
                              <p className="mt-1 line-clamp-1 text-[11px] text-[#D8DEE9]/48">
                                {folder.visualReason}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/20 p-6 text-center text-sm text-[#D8DEE9]/60">
                  Nessuna cartella immobile disponibile.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <header className="mb-3 shrink-0 rounded-[24px] border border-[#8FBCBB]/15 bg-[#2E3440]/30 p-4 backdrop-blur-2xl">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#8FBCBB]/70">
                    Cartella aperta
                  </p>
                  <h1 className="mt-1 truncate text-xl font-semibold text-white">
                    {activeFolder?.name ?? 'Cartella'}
                  </h1>
                  {activeFolder ? (
                    <p className="mt-1 truncate text-xs text-[#D8DEE9]/55">
                      Rif. {activeFolder.propertyRef} · {activeFolder.address}
                    </p>
                  ) : null}
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <button
                    type="button"
                    onClick={refreshActiveFolder}
                    className="rounded-full border border-[#B48EAD]/25 bg-[#B48EAD]/10 px-3 py-2 text-xs font-semibold text-[#E5E9F0] transition active:scale-[0.98] hover:bg-[#B48EAD]/18"
                  >
                    Aggiorna
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileFolderOpen(false)
                      setSelectedTxtId(null)
                      setTxtDraft('')
                      setNotice('Lista cartelle aperta.')
                    }}
                    className="rounded-full border border-[#8FBCBB]/20 px-3 py-2 text-xs font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                  >
                    Chiudi cartella
                  </button>
                </div>
              </div>

              <div className="mt-3">
                <AIOSQuotaBar
                  usedBytes={quotaUsedBytes}
                  maxBytes={quotaMaxBytes}
                  warnBytes={quotaWarnBytes}
                  compact
                />
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-auto rounded-[28px] border border-[#8FBCBB]/15 bg-[#2E3440]/30 p-3 backdrop-blur-2xl">
              {activeSection !== 'root' ? renderPathBar(true) : null}

              {renderSectionSwitcher(true)}

              <div
                onDrop={handleDrop}
                onDragOver={(event) => event.preventDefault()}
                className="rounded-3xl border border-dashed border-[#8FBCBB]/20 bg-[#2E3440]/15 p-3"
              >
                <p className="text-sm font-semibold text-white">
                  {activeSection === 'images' ? 'Carica immagini o video' : 'Carica contenuti nella cartella'}
                </p>
                <p className="mt-1 text-xs leading-5 text-[#D8DEE9]/55">
                  {activeSection === 'images' ? 'Accetta solo immagini e video. Le immagini saranno visibili anche nella galleria immobile.' : activeSection === 'docs' ? 'Accetta TXT, immagini, video, PDF e documenti. PDF e immagini possono comparire nelle planimetrie.' : 'Qui puoi caricare file sparsi nella root dell’immobile.'}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-3 py-3 text-sm font-semibold text-[#1F2A24] transition active:scale-[0.98] hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75">
                    File
                    <input type="file" multiple accept={getUploadAccept(activeSection)} className="hidden" onChange={handleFileInput} />
                  </label>

                  <button
                    type="button"
                    onClick={createTxtFile}
                    className={`rounded-2xl border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-3 py-3 text-sm font-semibold text-[#D8DEE9] transition active:scale-[0.98] ${
                      activeSection === 'images' ? 'hidden' : ''
                    }`}
                  >
                    Nuovo TXT
                  </button>

                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#8FBCBB]/25 bg-[#2E3440]/30 px-3 py-3 text-sm font-semibold text-[#D8DEE9] transition active:scale-[0.98]">
                    Fotocamera
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-center rounded-2xl border border-[#8FBCBB]/25 bg-[#2E3440]/30 px-3 py-3 text-sm font-semibold text-[#D8DEE9] transition active:scale-[0.98]">
                    Video
                    <input
                      type="file"
                      accept="video/*"
                      capture="environment"
                      className="hidden"
                      onChange={handleFileInput}
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {activeFolder && activeFolder.files.length > 0 ? (
                  activeFolder.files.map((file) => renderFileCard(file, true))
                ) : (
                  <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/20 p-6 text-center">
                    <p className="text-4xl">📂</p>
                    <p className="mt-3 text-sm font-semibold text-white">Cartella vuota</p>
                    <p className="mt-1 text-xs text-[#D8DEE9]/55">
                      Carica una foto, un video, un documento o crea una nota TXT.
                    </p>
                  </div>
                )}
              </div>

              {selectedTxt ? (
                <div className="mt-4 rounded-3xl border border-[#B48EAD]/25 bg-[#3B4252]/20 p-3">
                  <div className="mb-3">
                    <p className="text-xs uppercase tracking-[0.25em] text-[#B48EAD]/75">
                      Editor TXT
                    </p>
                    <h3 className="truncate text-base font-semibold text-white">
                      {selectedTxt.name}
                    </h3>
                  </div>

                  <textarea
                    value={txtDraft}
                    onChange={(event) => setTxtDraft(event.target.value)}
                    className="min-h-[240px] w-full resize-y rounded-2xl border border-[#B48EAD]/20 bg-[#2E3440]/80 p-4 font-mono text-sm text-[#D8DEE9] outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                    placeholder="Scrivi o modifica la nota..."
                  />

                  <button
                    type="button"
                    onClick={saveTxtDraft}
                    className="mt-3 w-full rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 text-sm font-semibold text-[#1F2A24] transition active:scale-[0.98] hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                  >
                    Salva TXT
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <section className="relative z-10 hidden h-[calc(100dvh-56px)] w-full md:flex">
        <aside className="flex w-[118px] shrink-0 flex-col items-center gap-4 px-3 py-5 md:w-[142px]">
          <button
            type="button"
            onClick={openMainFolder}
            className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-[#8FBCBB]/0 px-2 py-3 text-center transition hover:border-[#8FBCBB]/25 hover:bg-[#A3BE8C]/10"
          >
            <span className="text-4xl drop-shadow-[0_0_16px_rgba(16,185,129,0.55)]">📁</span>
            <span className="text-xs font-semibold text-[#ECEFF4]">Immobili</span>
          </button>

          {desktopFolders.slice(1).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === 'drive-settings') {
                  openDriveSettingsPanel()
                  return
                }

                setDriveSettingsOpen(false)
                setDesktopWindowOpen(true)
                setStartOpen(false)
              }}
              className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-[#8FBCBB]/0 px-2 py-3 text-center transition hover:border-[#B48EAD]/30 hover:bg-[#B48EAD]/10"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs font-semibold text-[#ECEFF4]/90">{item.label}</span>
            </button>
          ))}
        </aside>

        <div className="relative min-w-0 flex-1 p-3 md:p-5">
          <header className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.48em] text-[#8FBCBB]/80">
                Area Immobiliare
              </p>
              <h1 className="text-2xl font-semibold text-white md:text-3xl">
                AI-OS Desktop
              </h1>
            </div>

            <div className="hidden min-w-[320px] md:block">
              <AIOSQuotaBar
                usedBytes={quotaUsedBytes}
                maxBytes={quotaMaxBytes}
                warnBytes={quotaWarnBytes}
              />
            </div>
          </header>

          {desktopWindowOpen ? (
            <section className="h-[calc(100dvh-142px)] overflow-hidden rounded-[28px] border border-[#8FBCBB]/24 bg-[#202632]/92 shadow-2xl shadow-black/60 backdrop-blur-2xl">
              <div className="flex items-center justify-between border-b border-[#8FBCBB]/15 bg-[#202632]/78 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-xl">📁</span>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold text-white md:text-base">
                      {driveSettingsOpen ? 'Impostazioni Drive' : 'Cartella Immobili'}
                    </h2>
                    <div className="mt-0.5 flex max-w-[min(720px,70vw)] flex-wrap items-center gap-1 text-[11px] font-semibold text-[#D8DEE9]/55">
                      <span>AI-OS</span>
                      {activeFolder ? (
                        <>
                          <span className="text-[#6B7280]">/</span>
                          <span className="truncate">{activeFolder.name}</span>
                          <span className="text-[#6B7280]">/</span>
                          <span>{getSectionLabel(activeSection)}</span>
                          {customFolderTrail.map((folder) => (
                            <span key={folder.id} className="inline-flex min-w-0 items-center gap-1">
                              <span className="text-[#6B7280]">/</span>
                              <span className="max-w-[160px] truncate text-[#ECEFF4]">
                                {folder.name}
                              </span>
                            </span>
                          ))}
                        </>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#D8DEE9]/45">{notice}</p>
                  </div>
                </div>

                <div className="ml-5 mr-auto hidden w-[min(520px,38vw)] md:block">
                  <div className="flex h-10 items-center gap-3 rounded-full border border-[#8FBCBB]/35 bg-[#202632]/84 px-3 shadow-[0_0_18px_rgba(143,188,187,0.10)] transition focus-within:border-[#A3BE8C]/75 focus-within:bg-[#1B202B]/95 focus-within:shadow-[0_0_24px_rgba(163,190,140,0.18)]">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/12 text-[11px] font-bold text-[#A3BE8C]">
                      ⌕
                    </span>

                    <input
                      value={folderSearchQuery}
                      onChange={(event) => setFolderSearchQuery(event.target.value)}
                      className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#E5E9F0] outline-none placeholder:text-[#D8DEE9]/38"
                      placeholder="Titolo o codice immobile..."
                    />

                    {folderSearchQuery.trim() ? (
                      <button
                        type="button"
                        onClick={() => setFolderSearchQuery('')}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[#BF616A]/30 bg-[#BF616A]/12 text-sm font-bold leading-none text-[#FFCCD2] transition hover:bg-[#BF616A]/28 hover:text-white"
                        aria-label="Svuota ricerca"
                      >
                        ×
                      </button>
                    ) : (
                      <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#8FBCBB]/50">
                        min 3
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setDesktopWindowOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BF616A]/65 bg-[#BF616A]/14 text-2xl font-bold leading-none text-[#FFCCD2] shadow-[0_0_18px_rgba(191,97,106,0.20)] transition hover:bg-[#BF616A]/34 hover:text-white"
                  aria-label="Chiudi finestra"
                >
                  ×
                </button>
              </div>

              <div className="grid h-[calc(100%-53px)] grid-cols-1 overflow-hidden lg:grid-cols-[320px_minmax(0,1fr)_390px]">
                <aside className="border-b border-[#8FBCBB]/10 bg-[#1F2530]/72 p-4 lg:border-b-0 lg:border-r flex min-h-0 flex-col overflow-hidden">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.34em] text-[#8FBCBB]/70">
                        Cartelle
                      </p>
                      <h3 className="text-lg font-semibold text-white">Immobili</h3>
                    </div>
                    <span className="rounded-full bg-[#A3BE8C]/15 px-3 py-1 text-xs text-[#88C0D0]">
                      {folderSearchQuery.trim().length >= 3 ? `${filteredFolders.length}/${folders.length}` : folders.length}
                    </span>
                  </div>

                  {foldersLoading ? (
                    <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#1E2430]/74 p-4 text-sm text-[#D8DEE9]/60">
                      Caricamento...
                    </div>
                  ) : (
                    <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 pb-6 [scrollbar-color:rgba(143,188,187,0.45)_rgba(32,38,50,0.55)] [scrollbar-width:thin]">
                      {filteredFolders.map((folder) => {
                        const visualState = getFolderVisualState(folder)
                        const isActiveFolder = activeFolderId === folder.id

                        return (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => selectFolder(folder)}
                            className={`w-full rounded-2xl border px-3 py-3 text-left transition ${folderCardClass(visualState, isActiveFolder)}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="relative flex h-8 w-8 shrink-0 items-center justify-center">
                                <span className={`absolute -right-1 top-0 h-3.5 w-3.5 rounded-full ring-2 ring-[#202632] ${folderLedClass(visualState)}`} />
                                <span className="text-2xl">📂</span>
                              </span>
                              <div className="min-w-0 flex-1">
                                <div className="flex min-w-0 items-center justify-between gap-2">
                                  <p className="truncate font-medium leading-tight">{folder.name}</p>
                                  <span className={`shrink-0 text-[9px] font-bold uppercase tracking-[0.14em] ${folderStateTextClass(visualState)}`}>
                                    {folderStateLabel(visualState)}
                                  </span>
                                </div>
                                <p className="mt-1 text-xs text-[#88C0D0]/72">
                                  Rif. {folder.propertyRef} · {folder.fileCount ?? folder.files.length} file
                                </p>
                                {folder.visualReason ? (
                                  <p className="mt-1 line-clamp-1 text-[11px] text-[#D8DEE9]/56">
                                    {folder.visualReason}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {!foldersLoading && folderSearchQuery.trim().length >= 3 && folders.length > 0 && filteredFolders.length === 0 ? (
                    <div className="mt-3 rounded-2xl border border-[#EBCB8B]/20 bg-[#EBCB8B]/8 p-3 text-xs leading-5 text-[#EBCB8B]">
                      Nessun immobile trovato per titolo o codice inserito.
                    </div>
                  ) : null}
                </aside>

                <section className="min-h-0 overflow-auto p-4">
                  {driveSettingsOpen ? (
                    <div className="rounded-[28px] border border-[#88C0D0]/24 bg-[#202632]/86 p-5 shadow-[0_0_34px_rgba(136,192,208,0.08)]">
                      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-[0.32em] text-[#88C0D0]/75">
                            AI-OS Drive globale
                          </p>
                          <h2 className="mt-1 text-2xl font-semibold text-white">
                            Cartella Google Drive di progetto
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D8DEE9]/62">
                            Qui imposti la cartella Drive principale da usare come archivio free per video pesanti,
                            documenti grandi e originali non pubblicati. Non modifica login, OTP, QR o accessi fotografi.
                          </p>
                        </div>

                        {driveSettings?.drive_root_url ? (
                          <a
                            href={driveSettings.drive_root_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#88C0D0]/35 bg-[#88C0D0]/12 px-4 py-2 text-xs font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/20"
                          >
                            Apri Drive root
                          </a>
                        ) : null}
                      </div>

                      {driveSettingsLoading ? (
                        <div className="rounded-2xl border border-[#8FBCBB]/14 bg-[#242B38]/70 p-4 text-sm text-[#D8DEE9]/62">
                          Caricamento impostazioni Drive...
                        </div>
                      ) : (
                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                          <div className="rounded-2xl border border-[#B48EAD]/22 bg-[#242B38]/86 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-[#B48EAD]/75">
                              Configurazione
                            </p>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2">
                              <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                                Nome cartella Drive root
                                <input
                                  value={driveSettingsForm.driveRootName}
                                  onChange={(event) => updateDriveSettingsFormField('driveRootName', event.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#202632]/90 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                                  placeholder="Belotti AI-OS / Archivio Immobili"
                                />
                              </label>

                              <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                                Link cartella Google Drive root
                                <input
                                  value={driveSettingsForm.driveRootUrl}
                                  onChange={(event) => updateDriveSettingsFormField('driveRootUrl', event.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#202632]/90 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                                  placeholder="https://drive.google.com/drive/folders/..."
                                />
                              </label>

                              <label className="text-xs font-semibold text-[#D8DEE9]/70">
                                Soglia file grandi MB
                                <input
                                  type="number"
                                  min="1"
                                  value={driveSettingsForm.largeFileThresholdMb}
                                  onChange={(event) => updateDriveSettingsFormField('largeFileThresholdMb', event.target.value)}
                                  className="mt-1 w-full rounded-2xl border border-[#8FBCBB]/15 bg-[#202632]/90 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                                  placeholder="50"
                                />
                              </label>

                              <label className="text-xs font-semibold text-[#D8DEE9]/70 sm:col-span-2">
                                Note operative
                                <textarea
                                  value={driveSettingsForm.notes}
                                  onChange={(event) => updateDriveSettingsFormField('notes', event.target.value)}
                                  className="mt-1 min-h-[110px] w-full resize-none rounded-2xl border border-[#8FBCBB]/15 bg-[#202632]/90 px-3 py-2 text-sm text-white outline-none placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                                  placeholder="Strategia archivio, regole per fotografi, video pesanti..."
                                />
                              </label>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                disabled={driveSettingsSaving}
                                onClick={saveDriveSettings}
                                className="rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-xs font-bold text-[#1F2A24] shadow-[0_0_18px_rgba(163,190,140,0.22)] transition hover:bg-[#1F2A24] disabled:cursor-wait disabled:opacity-60 hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                              >
                                {driveSettingsSaving ? 'Salvataggio...' : 'Salva impostazioni Drive'}
                              </button>

                              <button
                                type="button"
                                disabled={driveFoldersCreating}
                                onClick={createMissingDriveFolders}
                                className="rounded-full border border-[#88C0D0]/35 bg-[#88C0D0]/12 px-4 py-2 text-xs font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/20 disabled:cursor-wait disabled:opacity-60"
                              >
                                {driveFoldersCreating ? 'Creazione cartelle...' : 'Crea/sistema cartelle immobili in Drive'}
                              </button>

                              {driveSettingsForm.driveRootUrl.trim() ? (
                                <a
                                  href={driveSettingsForm.driveRootUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="rounded-full border border-[#88C0D0]/25 bg-[#88C0D0]/10 px-4 py-2 text-xs font-semibold text-[#E5E9F0] transition hover:bg-[#88C0D0]/18"
                                >
                                  Apri link inserito
                                </a>
                              ) : null}
                            </div>
                          </div>

                          <aside className="rounded-2xl border border-[#8FBCBB]/18 bg-[#242B38]/82 p-4">
                            <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/75">
                              Regola storage
                            </p>

                            <div className="mt-4 space-y-3 text-sm leading-6 text-[#D8DEE9]/66">
                              <p>
                                <span className="font-bold text-[#A3BE8C]">Supabase</span> resta per immagini ottimizzate,
                                planimetrie pubbliche e file necessari al sito.
                              </p>
                              <p>
                                <span className="font-bold text-[#88C0D0]">Google Drive</span> resta archivio free per originali,
                                video pesanti e documenti oltre soglia.
                              </p>
                              <p>
                                Soglia Supabase: <span className="font-bold text-[#EBCB8B]">{driveSettingsForm.largeFileThresholdMb || '45'} MB</span>.
                              </p>
                              <p className="text-xs text-[#D8DEE9]/46">
                                Questa impostazione non tocca OAuth admin, QR login, OTP o accessi fotografi.
                              </p>
                            </div>
                          </aside>
                        </div>
                      )}
                    </div>
                  ) : (
                  <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.32em] text-[#8FBCBB]/70">
                        Finestra aperta
                      </p>
                      <h2 className="text-2xl font-semibold text-white">
                        {activeFolder?.name ?? 'Nessuna cartella'}
                      </h2>
                      {activeFolder ? (
                        <p className="mt-1 text-sm text-[#D8DEE9]/65">
                          {activeFolder.address} · Proprietario: {activeFolder.owner}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={refreshActiveFolder}
                        className="rounded-full border border-[#B48EAD]/45 bg-[#B48EAD]/18 px-4 py-2 text-sm font-semibold text-[#F4E9F2] shadow-[0_0_18px_rgba(180,142,173,0.14)] transition hover:bg-[#B48EAD]/30 hover:text-white"
                      >
                        Aggiorna
                      </button>

                      <button
                        type="button"
                        onClick={createTxtFile}
                        className={`rounded-full border border-[#A3BE8C]/45 bg-[#A3BE8C]/18 px-4 py-2 text-sm font-semibold text-[#DFF2D6] shadow-[0_0_18px_rgba(163,190,140,0.14)] transition hover:bg-[#A3BE8C]/30 hover:text-white ${
                          activeSection === 'images' ? 'hidden' : ''
                        }`}
                      >
                        + Nuovo TXT
                      </button>
                    </div>
                  </div>

                  {activeSection !== 'root' ? renderPathBar() : null}

                  {renderSectionSwitcher()}

                  <div hidden={activeSection === 'root'}
                    onDrop={handleDrop}
                    onDragOver={(event) => event.preventDefault()}
                    className="min-h-[520px] rounded-3xl border border-dashed border-[#8FBCBB]/25 bg-[#1F2530]/72 p-4"
                  >
                    <div className={`${activeSection === "root" ? "hidden" : ""} ${String(activeAgencyToolId) === "drive" ? "hidden" : ""} mb-4 rounded-2xl border border-[#8FBCBB]/10 bg-[#242B38]/78 p-4`}>
                      <p className="text-sm font-medium text-white">
                        Trascina qui foto, video, planimetrie o documenti
                      </p>
                      <p className="mt-1 text-xs text-[#D8DEE9]/60">
                        {activeSection === 'images' ? 'Solo immagini e video. Le immagini sono collegate anche alla galleria immobile.' : activeSection === 'docs' ? 'TXT, immagini, video, PDF e documenti. PDF e immagini possono comparire nelle planimetrie.' : 'Root della cartella: carica qui file sparsi non collegati alla galleria.'}
                      </p>

                      <div hidden={activeSection === 'root'} className="mt-4 flex flex-wrap gap-2">
                        <label className="cursor-pointer rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-sm font-bold text-[#1F2A24] shadow-[0_0_18px_rgba(163,190,140,0.24)] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75">
                          Carica file
                          <input type="file" multiple accept={getUploadAccept(activeSection)} className="hidden" onChange={handleFileInput} />
                        </label>

                        <label className="cursor-pointer rounded-full border border-[#8FBCBB]/30 bg-[#2E3440]/30 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10">
                          Fotocamera
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileInput}
                          />
                        </label>

                        <label className="cursor-pointer rounded-full border border-[#8FBCBB]/30 bg-[#2E3440]/30 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10">
                          Video
                          <input
                            type="file"
                            accept="video/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileInput}
                          />
                        </label>

                        <button
                          type="button"
                          onClick={createTxtFile}
                          className="rounded-full border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-2 text-sm font-bold text-[#1F2A24] shadow-[0_0_18px_rgba(163,190,140,0.24)] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                        >
                          + Nuovo TXT
                        </button>

                        <button
                          type="button"
                          onClick={openCreateCustomFolderDialog}
                          className="rounded-full border border-[#8FBCBB]/30 bg-[#2E3440]/30 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                        >
                          + Nuova cartella
                        </button>
                      </div>
                    </div>

                    {customFolders.length > 0 || (activeFolder && activeFolder.files.length > 0) ? (
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {activeCustomFolderId ? (
                          <button
                            type="button"
                            onClick={closeCustomFolder}
                            className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12 active:scale-[0.98]"
                          >
                            <span className="mb-2 text-4xl">↩️</span>
                            <span className="line-clamp-2 text-xs font-bold leading-4 text-[#ECEFF4]">
                              Indietro
                            </span>
                          </button>
                        ) : null}

                        {customFolders.map((folder) => (
                          <button
                            key={folder.id}
                            type="button"
                            onClick={() => openCustomFolder(folder)}
                  onContextMenu={(event) => openCustomFolderContextMenu(event, folder)}
                            className="group flex min-h-[118px] flex-col items-center justify-center rounded-2xl border border-[#8FBCBB]/12 bg-[#202632]/58 p-3 text-center transition hover:border-[#88C0D0]/55 hover:bg-[#88C0D0]/12 active:scale-[0.98]"
                          >
                            <span className="mb-2 text-4xl">📁</span>
                            <span className="line-clamp-2 text-xs font-bold leading-4 text-[#ECEFF4]">
                              {folder.name}
                            </span>
                          </button>
                        ))}

                        {activeFolder && activeFolder.files.length > 0
                          ? activeFolder.files.map((file) => renderFileCard(file))
                          : null}
                      </div>
                    ) : (
                      <div className={`${String(activeAgencyToolId) === "drive" ? "hidden" : ""} flex min-h-[300px] items-center justify-center rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/20 text-center`}>
                        <div className={`${activeSection === "root" ? "hidden" : ""}`}>
                          <p className="text-4xl">📂</p>
                          <p className="mt-3 font-medium text-white">Cartella vuota</p>
                          <p className="mt-1 text-sm text-[#D8DEE9]/55">
                            Carica o crea una cartella.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  </>
                  )}
                </section>

                <aside className="min-h-0 overflow-auto border-t border-[#8FBCBB]/10 bg-[#1E2430]/74 p-4 lg:border-l lg:border-t-0">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-[0.32em] text-[#8FBCBB]/70">
                      Editor TXT
                    </p>
                    <h3 className="truncate text-lg font-semibold text-white">
                      {selectedTxt?.name ?? 'Nessun file aperto'}
                    </h3>
                  </div>

                  {selectedTxt ? (
                    <div className="space-y-3">
                      <textarea
                        value={txtDraft}
                        onChange={(event) => setTxtDraft(event.target.value)}
                        className="min-h-[330px] w-full resize-none rounded-2xl border border-[#8FBCBB]/15 bg-[#2E3440]/80 p-4 font-mono text-sm text-[#D8DEE9] outline-none transition placeholder:text-[#D8DEE9]/30 focus:border-[#B48EAD]/60"
                        placeholder="Scrivi le note del fotografo..."
                      />

                      <button
                        type="button"
                        onClick={saveTxtDraft}
                        className="w-full rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 font-semibold text-[#1F2A24] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                      >
                        Salva TXT
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-[#8FBCBB]/10 bg-[#2E3440]/25 p-4 text-sm text-[#D8DEE9]/60">
                      Apri un file `.txt` dalla cartella per modificarlo.
                    </div>
                  )}

                  <div className="mt-4 rounded-2xl border border-[#8FBCBB]/10 bg-[#A3BE8C]/5 p-4 text-xs leading-relaxed text-[#D8DEE9]/65">
                    Sistema reale:
                    <br />
                    Supabase Storage, quote DB, signed URL, TXT nel database.
                  </div>
                </aside>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {driveItemContextMenu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[10092] cursor-default bg-transparent"
            aria-label="Chiudi menu Drive"
            onClick={() => setDriveItemContextMenu(null)}
          />

          <div
            className="aios-drive-context-menu fixed z-[10096] w-[320px] overflow-hidden rounded-xl border border-[#3C4043] bg-[#1F1F1F] py-2 text-sm text-[#E8EAED] shadow-[0_18px_60px_rgba(0,0,0,0.58)]"
            style={{
              left: driveItemContextMenu.x,
              top: driveItemContextMenu.y,
            }}
          >
            <div className="border-b border-[#3C4043] px-4 pb-2 pt-1">
              <p className="truncate text-xs font-semibold text-[#C4C7C5]">
                {driveItemName(driveItemContextMenu.item)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => openDriveExplorerItem(driveItemContextMenu.item)}
              className="aios-drive-menu-row"
            >
              <span>↗</span>
              <span>{driveItemContextMenu.item.type === 'folder' ? 'Apri cartella' : 'Apri file'}</span>
            </button>

            {driveItemContextMenu.item.type === 'file' ? (
              <a
                href={driveFileDownloadUrl(driveItemContextMenu.item.file)}
                target="_blank"
                rel="noreferrer"
                className="aios-drive-menu-row"
                onClick={() => setDriveItemContextMenu(null)}
              >
                <span>⇩</span>
                <span>Scarica</span>
              </a>
            ) : null}

            <button
              type="button"
              onClick={() => void copyDriveItemLink(driveItemContextMenu.item)}
              className="aios-drive-menu-row"
            >
              <span>🔗</span>
              <span>Copia link</span>
            </button>

            <a
              href={driveItemContextMenu.item.type === 'folder' ? driveItemContextMenu.item.folder.url : driveItemContextMenu.item.file.url}
              target="_blank"
              rel="noreferrer"
              className="aios-drive-menu-row"
              onClick={() => setDriveItemContextMenu(null)}
            >
              <span>☁</span>
              <span>Apri in Google Drive</span>
            </a>

            <div className="my-2 border-t border-[#3C4043]" />

            <button
              type="button"
              onClick={() => {
                setDriveItemContextMenu(null)
                setNotice('Rinomina/elimina direttamente da Google Drive per ora. Nel prossimo step le colleghiamo via Apps Script.')
              }}
              className="aios-drive-menu-row aios-drive-menu-row-muted"
            >
              <span>⋯</span>
              <span>Altre azioni</span>
            </button>
          </div>
        </>
      ) : null}

      {customFolderContextMenu && !contextMenu ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[10040] cursor-default bg-transparent"
            aria-label="Chiudi menu cartella"
            onClick={() => setCustomFolderContextMenu(null)}
          />

          <div
            className="aios-context-menu aios-folder-context-menu aios-nordic-black fixed z-[10095] w-[276px] overflow-hidden rounded-2xl border border-[#3C4043] bg-[#111111]/98 p-2 text-[#E8EAED] shadow-2xl shadow-black/70"
            style={{
              left: customFolderContextMenu.x,
              top: customFolderContextMenu.y,
            }}
          >
            <p className="mb-1 truncate px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8FBCBB]/70">
              {customFolderContextMenu.folderName}
            </p>

            <button
              type="button"
              onClick={() =>
                openRenameCustomFolderDialog(
                  customFolderContextMenu.folderId,
                  customFolderContextMenu.folderName,
                )
              }
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-[#D8DEE9]/82 transition hover:bg-[#A3BE8C]/12 hover:text-[#A3BE8C]"
            >
              <span>✏️</span>
              <span>Rinomina cartella...</span>
            </button>

            <button
              type="button"
              disabled={customFolderDeleting === customFolderContextMenu.folderId}
              onClick={() =>
                deleteCustomFolder(
                  customFolderContextMenu.folderId,
                  customFolderContextMenu.folderName,
                )
              }
              className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-[#FFCCD2] transition hover:bg-[#BF616A]/14 hover:text-white disabled:cursor-wait disabled:opacity-50"
            >
              <span>🗑️</span>
              <span>
                {customFolderDeleting === customFolderContextMenu.folderId
                  ? 'Elimino...'
                  : 'Elimina cartella'}
              </span>
            </button>
          </div>
        </>
      ) : null}

      {renameCustomFolderDialog ? (
        <div className="fixed inset-0 z-[10090] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-[#3C4043] bg-[#111111] text-[#E8EAED] shadow-2xl shadow-black/80">
            <div className="border-b border-[#3C4043] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/75">
                Rinomina cartella
              </p>
              <h3 className="mt-2 truncate text-xl font-semibold text-[#E8EAED]">
                {renameCustomFolderDialog.folderName}
              </h3>
            </div>

            <div className="px-6 py-5">
              <label className="text-sm font-semibold text-[#D8DEE9]/80">
                Nuovo nome
                <input
                  value={renameCustomFolderDraft}
                  onChange={(event) => setRenameCustomFolderDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveRenameCustomFolder()
                    }
                  }}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-[#8A8D91]/55 bg-[#1B1B1B] px-4 py-3 text-sm font-semibold text-[#E8EAED] outline-none transition placeholder:text-[#9AA0A6] focus:border-[#AECBFA]"
                  placeholder="Nome cartella..."
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#3C4043] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setRenameCustomFolderDialog(null)
                  setRenameCustomFolderDraft('')
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#AECBFA] transition hover:bg-[#1F1F1F]"
              >
                Annulla
              </button>

              <button
                type="button"
                disabled={renameCustomFolderSaving || !renameCustomFolderDraft.trim()}
                onClick={() => void saveRenameCustomFolder()}
                className="rounded-full bg-[#AECBFA] px-6 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#C6DAFF] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {renameCustomFolderSaving ? 'Salvataggio...' : 'Rinomina'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {customFolderDialogOpen ? (
        <div className="fixed inset-0 z-[10090] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-[#3C4043] bg-[#111111] text-[#E8EAED] shadow-2xl shadow-black/80">
            <div className="border-b border-[#3C4043] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/75">
                Nuova cartella
              </p>
              <h3 className="mt-2 truncate text-xl font-semibold text-[#E8EAED]">
                {activeFolder?.name || 'Cartella immobile'} / {activeCustomFolderName || getSectionLabel(activeSection)}
              </h3>
            </div>

            <div className="px-6 py-5">
              <label className="text-sm font-semibold text-[#D8DEE9]/80">
                Nome cartella
                <input
                  value={customFolderDraft}
                  onChange={(event) => setCustomFolderDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveCustomFolder()
                    }
                  }}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-[#8A8D91]/55 bg-[#1B1B1B] px-4 py-3 text-sm font-semibold text-[#E8EAED] outline-none transition placeholder:text-[#9AA0A6] focus:border-[#AECBFA]"
                  placeholder="Esempio: APE, Visure, Contratto..."
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#3C4043] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setCustomFolderDialogOpen(false)
                  setCustomFolderDraft('')
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#AECBFA] transition hover:bg-[#1F1F1F]"
              >
                Annulla
              </button>

              <button
                type="button"
                disabled={customFolderSaving || !customFolderDraft.trim()}
                onClick={() => void saveCustomFolder()}
                className="rounded-full bg-[#AECBFA] px-6 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#C6DAFF] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {customFolderSaving ? 'Creazione...' : 'Crea'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {renameFileDialog ? (
        <div className="fixed inset-0 z-[10090] flex items-center justify-center bg-black/55 p-6 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[22px] border border-[#3C4043] bg-[#111111] text-[#E8EAED] shadow-2xl shadow-black/80">
            <div className="border-b border-[#3C4043] px-6 py-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[#8FBCBB]/75">
                Rinomina file
              </p>
              <h3 className="mt-2 truncate text-xl font-semibold text-[#E8EAED]">
                {renameFileDialog.fileName}
              </h3>
            </div>

            <div className="px-6 py-5">
              <label className="text-sm font-semibold text-[#D8DEE9]/80">
                Nuovo nome
                <input
                  value={renameFileDraft}
                  onChange={(event) => setRenameFileDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      void saveRenameFile()
                    }
                  }}
                  autoFocus
                  className="mt-2 w-full rounded-xl border border-[#8A8D91]/55 bg-[#1B1B1B] px-4 py-3 text-sm font-semibold text-[#E8EAED] outline-none transition placeholder:text-[#9AA0A6] focus:border-[#AECBFA]"
                  placeholder="Nome file..."
                />
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-[#3C4043] px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setRenameFileDialog(null)
                  setRenameFileDraft('')
                }}
                className="rounded-full px-4 py-2 text-sm font-medium text-[#AECBFA] transition hover:bg-[#1F1F1F]"
              >
                Annulla
              </button>

              <button
                type="button"
                disabled={renameFileSaving || !renameFileDraft.trim()}
                onClick={() => void saveRenameFile()}
                className="rounded-full bg-[#AECBFA] px-6 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#C6DAFF] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {renameFileSaving ? 'Salvataggio...' : 'Rinomina'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {movePicker ? (
        <div className="fixed inset-0 z-[10080] flex items-center justify-center bg-black/62 p-6 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[18px] border border-[#3C4043] bg-[#111111] text-[#E8EAED] shadow-2xl shadow-black/80">
            <div className="px-6 pb-3 pt-5">
              <h3 className="max-w-[92%] text-[26px] font-normal leading-tight tracking-[-0.02em] text-[#E8EAED]">
                Sposta “{movePicker.fileName}”
              </h3>

              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-[#E8EAED]">
                <span>Posizione attuale:</span>
                <span className="inline-flex items-center gap-2 rounded-lg border border-[#8A8D91] bg-[#1B1B1B] px-3 py-1.5 text-[#E8EAED]">
                  <span>📁</span>
                  <span>{moveTargetLabel(activeSection)}</span>
                </span>
              </div>
            </div>

            <div className="px-5">
              <button
                type="button"
                onClick={() => {
                  if (movePickerLocation === 'root') {
                    setMovePickerTarget(null)
                    return
                  }

                  setMovePickerLocation('root')
                  setMovePickerTarget(null)
                  setMovePickerFolders([])
                }}
                className="mb-3 inline-flex items-center gap-3 rounded-md px-1 py-2 text-sm font-medium text-[#E8EAED] transition hover:bg-[#2A2A2A]"
              >
                <span className="text-2xl leading-none">←</span>
                <span>{movePickerLocation === 'root' ? 'Più posizioni' : 'Indietro'}</span>
              </button>

              <div className="mb-2 flex items-center gap-2 text-sm text-[#E8EAED]">
                <span>AI-OS</span>
                {movePickerLocation !== 'root' ? (
                  <>
                    <span className="text-[#9AA0A6]">›</span>
                    <span className="font-semibold">{moveTargetLabel(movePickerLocation)}</span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="border-y border-[#3C4043]">
              <div className="grid grid-cols-[minmax(0,1fr)_190px_104px] bg-[#111111] px-5 py-2 text-sm text-[#C4C7C5]">
                <span>Nome ↑</span>
                <span>Data di modifica ▾</span>
                <span className="text-right">Azione</span>
              </div>

              <div className="max-h-[330px] overflow-y-auto">
                
                {/* AI-OS move custom folders */}
                {movePickerLocation !== 'root' ? (
                  <div className="mb-3 rounded-2xl border border-[#4C566A]/55 bg-[#070A10]/72 p-3 shadow-[inset_0_1px_0_rgba(236,239,244,0.035)]">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#8FBCBB]/70">
                          Sottocartelle disponibili
                        </p>
                        <p className="mt-1 text-xs text-[#D8DEE9]/55">
                          Dentro {moveTargetLabel(movePickerLocation)} puoi scegliere una sottocartella specifica.
                        </p>
                      </div>
                    </div>

                    {movePickerFoldersLoading ? (
                      <div className="rounded-2xl border border-[#4C566A]/45 bg-[#0B1018]/72 p-4 text-sm font-semibold text-[#D8DEE9]/62">
                        Caricamento sottocartelle...
                      </div>
                    ) : movePickerFolders.length > 0 ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {movePickerFolders.map((folder) => {
                          const targetSection = (folder.parent_folder_type || movePickerLocation) as AIOSSection

                          return (
                            <button
                              key={folder.id}
                              type="button"
                              disabled={fileMoveUpdating === movePicker.fileId}
                              onClick={() => {
                                void moveFileToSection(
                                  { id: movePicker.fileId },
                                  targetSection,
                                  folder.id,
                                )
                              }}
                              className="group flex min-h-[44px] items-center gap-3 rounded-2xl border border-[#4C566A]/55 bg-[#0B1018]/82 px-3 py-2 text-left text-xs font-semibold text-[#E5E9F0] transition hover:border-[#8FBCBB]/35 hover:bg-[#121A26]"
                            >
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#4C566A]/50 bg-[#111827] text-base shadow-inner">
                                📁
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate">{folder.name}</span>
                                <span className="mt-0.5 block text-[10px] font-medium text-[#D8DEE9]/42">
                                  dentro {moveTargetLabel(targetSection)}
                                </span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[#4C566A]/55 bg-[#0B1018]/62 p-4 text-center text-sm text-[#D8DEE9]/55">
                        Nessuna sottocartella in {moveTargetLabel(movePickerLocation)}.
                      </div>
                    )}
                  </div>
                ) : null}

{movePickerLocation === 'root' ? (
                  (['images', 'docs'] as AIOSSection[]).map((targetSection) => {
                    const selected = movePickerTarget === targetSection

                    return (
                      <div
                        key={targetSection}
                        onClick={() => setMovePickerTarget(targetSection)}
                        onDoubleClick={() => {
                          void moveFileToSection({ id: movePicker.fileId }, targetSection)
                          setMovePicker(null)
                          setMovePickerTarget(null)
                          setMovePickerLocation('root')
                        }}
                        className={`group grid cursor-pointer grid-cols-[minmax(0,1fr)_190px_104px] items-center gap-3 px-5 py-2 text-left transition ${
                          selected
                            ? 'bg-[#3A3A3A] text-[#E8EAED]'
                            : 'text-[#E8EAED] hover:bg-[#2F2F2F]'
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="text-xl">{moveTargetIcon(targetSection)}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-base">
                              {moveTargetLabel(targetSection)}
                            </span>
                            <span className="block truncate text-xs text-[#9AA0A6]">
                              {moveTargetDescription(targetSection)}
                            </span>
                          </span>
                        </div>

                        <span className="text-sm text-[#C4C7C5]">
                          Cartella AI-OS
                        </span>

                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            disabled={fileMoveUpdating === movePicker.fileId}
                            onClick={(event) => {
                              event.stopPropagation()
                              void moveFileToSection({ id: movePicker.fileId }, targetSection)
                              setMovePicker(null)
                              setMovePickerTarget(null)
                              setMovePickerLocation('root')
                            }}
                            className={`rounded-full px-4 py-1 text-sm font-semibold transition ${
                              selected
                                ? 'bg-[#202124] text-[#AECBFA]'
                                : 'bg-[#202124] text-[#AECBFA] opacity-0 group-hover:opacity-100'
                            } disabled:cursor-wait disabled:opacity-45`}
                          >
                            Sposta
                          </button>

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              setMovePickerLocation(targetSection)
                              setMovePickerTarget(null)
                              void loadMovePickerFolders(activeFolderId, targetSection, null)
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-2xl text-[#E8EAED] transition hover:bg-[#4A4A4A]"
                            title={`Apri ${moveTargetLabel(targetSection)}`}
                          >
                            ›
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="flex min-h-[150px] items-center justify-center px-6 py-10 text-center text-sm text-[#9AA0A6]">
                    <div>
                      <p className="text-3xl">📂</p>
                      <p className="mt-2 font-medium text-[#E8EAED]">
                        Nessuna sottocartella
                      </p>
                      <p className="mt-1">
                        Puoi spostare il file direttamente qui con il pulsante “Sposta”.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-5">
              <button
                type="button"
                onClick={() => setNotice('Creazione nuova cartella AI-OS: prossimo step.')}
                className="inline-flex items-center gap-2 rounded-full border border-[#8A8D91] bg-transparent px-4 py-2 text-sm font-medium text-[#AECBFA] transition hover:bg-[#1F1F1F]"
              >
                <span>⊞</span>
                <span>Nuova cartella</span>
              </button>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setMovePicker(null)
                    setMovePickerTarget(null)
                    setMovePickerLocation('root')
                  }}
                  className="rounded-full px-4 py-2 text-sm font-medium text-[#AECBFA] transition hover:bg-[#1F1F1F]"
                >
                  Annulla
                </button>

                <button
                  type="button"
                  disabled={
                    fileMoveUpdating === movePicker.fileId ||
                    (movePickerTarget ?? movePickerLocation) === activeSection
                  }
                  onClick={() => {
                    const targetSection = movePickerTarget ?? movePickerLocation

                    if (targetSection === activeSection) return

                    void moveFileToSection({ id: movePicker.fileId }, targetSection)
                    setMovePicker(null)
                    setMovePickerTarget(null)
                    setMovePickerLocation('root')
                  }}
                  className="rounded-full bg-[#AECBFA] px-7 py-2 text-sm font-semibold text-[#202124] transition hover:bg-[#C6DAFF] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {fileMoveUpdating === movePicker.fileId ? 'Sposto...' : 'Sposta'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {largeFileDecisionOpen ? (
        <div className="fixed inset-0 z-[10080] flex items-center justify-center bg-black/62 p-4 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-[28px] border border-[#EBCB8B]/25 bg-[#202632]/96 p-5 shadow-2xl shadow-black/60">
            <div className="flex items-start gap-3">
              <span className="text-3xl">⚠️</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs uppercase tracking-[0.28em] text-[#EBCB8B]/80">
                  File grande rilevato
                </p>
                <h3 className="mt-1 text-xl font-semibold text-white">
                  Upload sopra 45 MB
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#D8DEE9]/68">
                  AI-OS usa Supabase per i file pubblicabili e Google Drive come archivio free per video/documenti pesanti.
                  Puoi provare a ridurre i video oppure spostarli nella cartella Drive dell’immobile.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#8FBCBB]/12 bg-[#2E3440]/48 p-3">
              <p className="text-xs uppercase tracking-[0.22em] text-[#8FBCBB]/70">
                File in attesa
              </p>
              <div className="mt-2 space-y-2">
                {largeFileQueue.map((file) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between gap-3 rounded-xl bg-[#202632]/80 px-3 py-2 text-xs"
                  >
                    <span className="min-w-0 truncate text-[#E5E9F0]">{file.name}</span>
                    <span className="shrink-0 text-[#EBCB8B]">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={reduceLargeVideos}
                className="rounded-2xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/12 px-4 py-3 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18"
              >
                Riduci video
              </button>

              <button
                type="button"
                onClick={sendLargeFilesToDriveArchive}
                className="rounded-2xl border border-[#88C0D0]/25 bg-[#88C0D0]/12 px-4 py-3 text-sm font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/18"
              >
                Apri Drive immobile
              </button>

              <button
                type="button"
                onClick={closeLargeFileDecision}
                className="rounded-2xl border border-[#BF616A]/25 bg-[#BF616A]/12 px-4 py-3 text-sm font-bold text-[#BF616A] transition hover:bg-[#BF616A]/18"
              >
                Annulla
              </button>
            </div>

          </div>
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="fixed inset-0 z-[10015]"
          onClick={() => setContextMenu(null)}
          onContextMenu={(event) => {
            event.preventDefault()
            setContextMenu(null)
          }}
        >
          <div
            className="aios-context-menu aios-file-context-menu aios-nordic-dark aios-nordic-black fixed z-[10095] w-[276px] overflow-hidden rounded-[20px] border border-[#4C566A]/70 bg-[#151A23]/96 p-2 text-xs font-semibold text-[#E5E9F0] shadow-[0_22px_80px_rgba(0,0,0,0.62),0_0_0_1px_rgba(236,239,244,0.035),inset_0_1px_0_rgba(236,239,244,0.055)] backdrop-blur-2xl"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-[#8FBCBB]/10 px-3 py-2">
              <p className="truncate text-xs font-semibold text-[#D8DEE9]/75">
                {contextMenu.fileName}
              </p>
            </div>

                            <button
                type="button"
                onClick={() => openRenameFileDialogFromContext(contextMenu.fileId, contextMenu.fileName)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-[#D8DEE9]/78 transition hover:bg-[#A3BE8C]/12 hover:text-[#A3BE8C]"
              >
                <span>✏️</span>
                <span>Rinomina...</span>
              </button>

<button
                type="button"
                onClick={() => openMovePickerFromContext(contextMenu.fileId, contextMenu.fileName)}
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs font-semibold text-[#D8DEE9]/78 transition hover:bg-[#A3BE8C]/12 hover:text-[#A3BE8C]"
              >
                <span>↪️</span>
                <span>Sposta...</span>
              </button>

<button
              type="button"
              onClick={() => {
                void deleteFileById(contextMenu.fileId)
              }}
              className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#BF616A] transition hover:bg-[#BF616A]/18 hover:text-red-50"
            >
              <span>🗑️</span>
              <span>Elimina file</span>
            </button>

            <button
              type="button"
              onClick={() => setContextMenu(null)}
              className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#D8DEE9]/75 transition hover:bg-[#A3BE8C]/10 hover:text-[#ECEFF4]"
            >
              <span>↩️</span>
              <span>Annulla</span>
            </button>
          </div>
        </div>
      ) : null}

      {previewFile ? (
        <section className="fixed inset-0 z-[10020] flex flex-col bg-[#2E3440]/96 text-white">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#8FBCBB]/15 bg-[#2E3440]/80 px-4 backdrop-blur-2xl">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.35em] text-[#8FBCBB]/70">
                Anteprima file
              </p>
              <h2 className="truncate text-sm font-semibold text-white md:text-base">
                {iconForFile(previewFile.kind)} {previewFile.name}
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center overflow-hidden rounded-full border border-[#B48EAD]/25 bg-[#3B4252]/35 text-xs font-semibold text-[#ECEFF4] shadow-[0_0_18px_rgba(124,58,237,0.16)]">
                <button
                  type="button"
                  onClick={() =>
                    setPreviewZoom((value) =>
                      Math.max(0.5, Number((value - 0.25).toFixed(2))),
                    )
                  }
                  className="px-3 py-2 transition hover:bg-[#B48EAD]/20"
                  aria-label="Riduci zoom"
                >
                  −
                </button>

                <span className="min-w-[58px] border-x border-[#B48EAD]/15 px-3 py-2 text-center font-mono">
                  {Math.round(previewZoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPreviewZoom((value) =>
                      Math.min(3, Number((value + 0.25).toFixed(2))),
                    )
                  }
                  className="px-3 py-2 transition hover:bg-[#B48EAD]/20"
                  aria-label="Aumenta zoom"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={resetPreviewZoom}
                className="hidden rounded-full border border-[#8FBCBB]/20 bg-[#A3BE8C]/10 px-3 py-2 text-xs font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/18 sm:inline-flex"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#BF616A]/30 text-xl text-[#BF616A] transition hover:bg-[#BF616A]/20"
                aria-label="Chiudi anteprima"
              >
                ×
              </button>
            </div>
          </header>

          <div
            className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-4"
            onWheel={handlePreviewWheel}
            onDoubleClick={resetPreviewZoom}
          >
            {previewFile.previewUrl && previewFile.kind === 'image' ? (
              <div
                className={`flex h-full w-full items-center justify-center overflow-hidden rounded-2xl ${
                  previewZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                }`}
                onMouseDown={startPreviewDrag}
                onMouseMove={movePreviewDrag}
                onMouseUp={stopPreviewDrag}
                onMouseLeave={stopPreviewDrag}
              >
                <img
                  src={previewFile.previewUrl}
                  alt={previewFile.name}
                  draggable={false}
                  className="max-h-[calc(100dvh-7rem)] max-w-full select-none rounded-2xl object-contain shadow-2xl shadow-black transition-transform duration-150"
                  style={{
                    transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewZoom})`,
                    transformOrigin: previewOrigin,
                  }}
                />
              </div>
            ) : null}

            {previewFile.previewUrl && previewFile.kind === 'video' ? (
              <video
                src={previewFile.previewUrl}
                controls
                autoPlay
                className="max-h-full max-w-full rounded-2xl shadow-2xl shadow-black"
              />
            ) : null}

            {previewFile.previewUrl &&
            (previewFile.kind === 'pdf' ||
              previewFile.kind === 'plan' ||
              previewFile.mimeType === 'application/pdf') ? (
              <div
                className={`h-full w-full overflow-hidden rounded-2xl border border-[#8FBCBB]/15 bg-white ${
                  previewZoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
                }`}
                onMouseDown={startPreviewDrag}
                onMouseMove={movePreviewDrag}
                onMouseUp={stopPreviewDrag}
                onMouseLeave={stopPreviewDrag}
              >
                <iframe
                  src={previewFile.previewUrl}
                  title={previewFile.name}
                  className="h-full w-full bg-white transition-transform duration-150"
                  style={{
                    transform: `translate3d(${previewPan.x}px, ${previewPan.y}px, 0) scale(${previewZoom})`,
                    transformOrigin: previewOrigin,
                  }}
                />
              </div>
            ) : null}
            {previewFile.previewUrl &&
            previewFile.kind !== 'image' &&
            previewFile.kind !== 'video' &&
            previewFile.kind !== 'pdf' &&
            previewFile.kind !== 'plan' &&
            previewFile.mimeType !== 'application/pdf' &&
            isGoogleDocsPreviewable(previewFile) ? (
              <div className="w-full max-w-2xl rounded-3xl border border-[#B48EAD]/25 bg-[#2E3440]/90 p-6 text-center shadow-2xl shadow-black/60 backdrop-blur-2xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-[#B48EAD]/25 bg-[#B48EAD]/10 text-4xl shadow-[0_0_28px_rgba(167,139,250,0.22)]">
                  📦
                </div>

                <p className="mt-5 text-xs uppercase tracking-[0.34em] text-[#B48EAD]/75">
                  Documento Office
                </p>

                <h3 className="mt-2 break-words text-xl font-semibold text-white">
                  {previewFile.name}
                </h3>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#D8DEE9]/65">
                  Google Docs Viewer può bloccare l’anteprima quando viene incorporato dentro AI-OS.
                  Aprilo in una nuova scheda oppure scarica/apri il file originale tramite link temporaneo sicuro.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <a
                    href={getGoogleDocsViewerUrl(previewFile.previewUrl)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#B48EAD]/30 bg-[#B48EAD]/15 px-5 py-3 text-sm font-semibold text-[#ECEFF4] transition hover:bg-[#B48EAD]/25"
                  >
                    Apri con Google Docs
                  </a>

                  <a
                    href={previewFile.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-5 py-3 text-sm font-semibold text-[#1F2A24] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                  >
                    Apri / scarica originale
                  </a>
                </div>

                <p className="mt-4 text-xs leading-5 text-[#D8DEE9]/40">
                  Il link originale è una signed URL temporanea di Supabase: resta privato e non pubblico fisso.
                </p>
              </div>
            ) : null}

            {previewFile.previewUrl &&
            previewFile.kind !== 'image' &&
            previewFile.kind !== 'video' &&
            previewFile.kind !== 'pdf' &&
            previewFile.kind !== 'plan' &&
            previewFile.mimeType !== 'application/pdf' &&
            !isGoogleDocsPreviewable(previewFile) ? (
              <div className="w-full max-w-xl rounded-3xl border border-[#8FBCBB]/20 bg-[#2E3440]/25 p-6 text-center shadow-2xl shadow-black/50">
                <div className="text-5xl">{iconForFile(previewFile.kind)}</div>
                <h3 className="mt-4 text-xl font-semibold text-white">{previewFile.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#D8DEE9]/65">
                  Questo tipo di documento potrebbe non essere visualizzabile direttamente dal browser.
                  Puoi aprirlo o scaricarlo tramite il file originale.
                </p>

                <a
                  href={previewFile.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-5 py-3 text-sm font-semibold text-[#1F2A24] transition hover:bg-[#1F2A24] hover:text-[#A3BE8C] hover:border-[#A3BE8C]/75"
                >
                  Apri documento
                </a>
              </div>
            ) : null}

            {!previewFile.previewUrl ? (
              <div className="w-full max-w-xl rounded-3xl border border-[#8FBCBB]/20 bg-[#2E3440]/25 p-6 text-center shadow-2xl shadow-black/50">
                <div className="text-5xl">{iconForFile(previewFile.kind)}</div>
                <h3 className="mt-4 text-xl font-semibold text-white">{previewFile.name}</h3>
                <p className="mt-2 text-sm leading-6 text-[#D8DEE9]/65">
                  Anteprima non disponibile. Ricarica la cartella o riprova.
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <footer className="relative z-20 flex h-14 items-center justify-between border-t border-[#8FBCBB]/15 bg-[#2E3440]/72 px-3 backdrop-blur-2xl md:hidden">
        <div className="relative">
          {startOpen ? (
            <div className="absolute bottom-14 left-0 w-[290px] overflow-hidden rounded-3xl border border-[#8FBCBB]/20 bg-[#2E3440]/95 text-[#ECEFF4] shadow-2xl shadow-black/60 backdrop-blur-2xl">
              <div className="border-b border-[#8FBCBB]/10 p-4">
                <p className="text-xs uppercase tracking-[0.32em] text-[#8FBCBB]/70">
                  Account
                </p>
                <p className="mt-2 font-semibold text-white">Omar Martalò</p>
                <p className="text-xs text-[#D8DEE9]/55">Administrator</p>
              </div>

              <div className="space-y-2 p-3">
                <button
                  type="button"
                  onClick={() => {
                    setMobileFolderOpen(false)
                    setSelectedTxtId(null)
                    setTxtDraft('')
                    setStartOpen(false)
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                >
                  Lista cartelle
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/admin'
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                >
                  Chiudi AI-OS e torna alla Dashboard
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setStartOpen((value) => !value)}
            className="rounded-2xl border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/18"
          >
            Start
          </button>
        </div>

        <div className="min-w-0 flex-1 px-3 text-right text-xs font-medium text-[#D8DEE9]/55">
          {mobileFolderOpen && activeFolder ? (
            <span className="block truncate">📁 {activeFolder.name}</span>
          ) : (
            <span>Lista cartelle</span>
          )}
        </div>
      </footer>

      <footer className="relative z-20 hidden h-14 items-center justify-between border-t border-[#8FBCBB]/15 bg-[#2E3440]/72 px-3 backdrop-blur-2xl md:flex">
        <div className="relative">
          {startOpen ? (
            <div className="absolute bottom-14 left-0 w-[310px] overflow-hidden rounded-3xl border border-[#8FBCBB]/20 bg-[#2E3440]/95 text-[#ECEFF4] shadow-2xl shadow-black/60 backdrop-blur-2xl">
              <div className="border-b border-[#8FBCBB]/10 p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-[#8FBCBB]/70">Account</p>
                <p className="mt-2 font-semibold text-white">Omar Martalò</p>
                <p className="text-xs text-[#D8DEE9]/55">Administrator</p>
              </div>

              <div className="space-y-2 p-3">
                <button
                  type="button"
                  onClick={openMainFolder}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                >
                  Apri cartella Immobili
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/admin'
                  }}
                  className="w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/10"
                >
                  Chiudi AI-OS e torna alla Dashboard
                </button>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setStartOpen((value) => !value)}
            className="rounded-2xl border border-[#8FBCBB]/25 bg-[#A3BE8C]/10 px-4 py-2 text-sm font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/18"
          >
            Start
          </button>
        </div>

        {desktopWindowOpen && activeFolder ? (
          <button
            type="button"
            onClick={openMainFolder}
            className="hidden max-w-[360px] truncate rounded-xl border border-[#8FBCBB]/30 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-semibold text-[#D8DEE9] transition hover:bg-[#A3BE8C]/18 md:block"
            title={activeFolder.name}
          >
            📁 {activeFolder.name}
          </button>
        ) : (
          <div className="hidden md:block" />
        )}

        <div className="text-xs text-[#D8DEE9]/45">
          AI-OS · Supabase Storage
        </div>
      </footer>
    </main>
  )
}
