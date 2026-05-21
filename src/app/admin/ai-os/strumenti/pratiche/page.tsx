'use client'

import { useEffect, useMemo, useState } from 'react'

type WorkspaceFolder = {
  id: string
  name: string
  propertyRef?: string | null
  address?: string | null
  contractType?: string | null
}

type ToolPropertyData = {
  property: Record<string, any>
  owners: Record<string, any>[]
  ownerDocuments: Record<string, any>[]
  checklist: Record<string, any>[]
  driveFolder: Record<string, any> | null
  driveSubfolders: Record<string, any>[]
}

type PracticeStatus = 'todo' | 'requested' | 'received' | 'not_needed'

type PracticeItem = {
  id: string
  title: string
  category: string
  description: string
  requiredFor: 'all' | 'vendita' | 'affitto'
  defaultStatus: PracticeStatus
  requestText: string
}

type PracticeState = Record<string, {
  status: PracticeStatus
  note: string
}>

type PracticeOutput =
  | 'pack'
  | 'owner'
  | 'technician'
  | 'mail-visura-catastale'
  | 'mail-planimetria-catastale'
  | 'mail-visura-ipotecaria'
  | 'mail-ape'
  | 'mail-geometra'
  | 'mail-amministratore'
  | 'mail-notaio'

type PracticeContacts = {
  visureEmail: string
  technicianEmail: string
  apeEmail: string
  condominiumEmail: string
  notaryEmail: string
  ownerEmail: string
}

const PRACTICE_OUTPUT_BUTTONS: Array<{ id: PracticeOutput; label: string }> = [
  { id: 'pack', label: 'Pacchetto' },
  { id: 'owner', label: 'Proprietario' },
  { id: 'technician', label: 'Tecnico' },
  { id: 'mail-visura-catastale', label: 'Mail visura' },
  { id: 'mail-planimetria-catastale', label: 'Mail planimetria' },
  { id: 'mail-visura-ipotecaria', label: 'Mail ipotecaria' },
  { id: 'mail-ape', label: 'Mail APE' },
  { id: 'mail-geometra', label: 'Mail geometra' },
  { id: 'mail-amministratore', label: 'Mail condominio' },
  { id: 'mail-notaio', label: 'Mail notaio' },
]

const PRACTICE_ITEMS: PracticeItem[] = [
  {
    id: 'visura-catastale',
    title: 'Visura catastale',
    category: 'Catasto',
    description: 'Serve per verificare dati catastali, intestazione, categoria, consistenza e rendita.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Richiedere visura catastale aggiornata dell’immobile, con dati intestatario e identificativi catastali.',
  },
  {
    id: 'planimetria-catastale',
    title: 'Planimetria catastale',
    category: 'Catasto',
    description: 'Serve per confronto con stato di fatto e verifica conformità catastale.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Richiedere planimetria catastale aggiornata e verificare coerenza con lo stato reale dell’immobile.',
  },
  {
    id: 'visura-ipotecaria',
    title: 'Visura ipotecaria / ispezione ipotecaria',
    category: 'Conservatoria',
    description: 'Serve per verificare formalità, gravami, ipoteche, pignoramenti o trascrizioni rilevanti.',
    requiredFor: 'vendita',
    defaultStatus: 'todo',
    requestText: 'Richiedere ispezione ipotecaria aggiornata sul proprietario e sull’immobile per verificare eventuali gravami.',
  },
  {
    id: 'atto-provenienza',
    title: 'Atto di provenienza / rogito',
    category: 'Documenti proprietà',
    description: 'Serve per ricostruire provenienza e titolarità dell’immobile.',
    requiredFor: 'vendita',
    defaultStatus: 'todo',
    requestText: 'Richiedere copia dell’atto di provenienza/rogito o titolo di proprietà dell’immobile.',
  },
  {
    id: 'ape',
    title: 'APE - Attestato Prestazione Energetica',
    category: 'Energia',
    description: 'Documento normalmente necessario per vendita/locazione e pubblicazione corretta.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Verificare se APE è disponibile e in corso di validità. Se mancante, richiedere nuovo APE a tecnico abilitato.',
  },
  {
    id: 'conformita-urbanistica',
    title: 'Conformità urbanistica',
    category: 'Tecnico',
    description: 'Verifica coerenza tra stato di fatto, titoli edilizi e pratiche comunali.',
    requiredFor: 'vendita',
    defaultStatus: 'todo',
    requestText: 'Richiedere verifica conformità urbanistica a tecnico/geometra con eventuale accesso atti comunale.',
  },
  {
    id: 'conformita-catastale',
    title: 'Conformità catastale',
    category: 'Tecnico',
    description: 'Verifica coerenza tra planimetria catastale e stato reale dell’immobile.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Verificare conformità catastale tra planimetria e stato di fatto. Segnalare eventuali difformità.',
  },
  {
    id: 'documenti-identita',
    title: 'Documenti proprietario',
    category: 'Anagrafica',
    description: 'Carta identità, codice fiscale, recapiti e dati anagrafici completi.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Richiedere documento identità, codice fiscale e recapiti aggiornati del proprietario/referente.',
  },
  {
    id: 'antiriciclaggio',
    title: 'Modulo antiriciclaggio',
    category: 'Compliance',
    description: 'Scheda necessaria per adeguata verifica cliente quando prevista.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Preparare scheda antiriciclaggio e raccogliere i dati necessari per adeguata verifica.',
  },
  {
    id: 'condominio',
    title: 'Documenti condominiali',
    category: 'Condominio',
    description: 'Spese condominiali, regolamento, delibere rilevanti, amministratore.',
    requiredFor: 'all',
    defaultStatus: 'todo',
    requestText: 'Richiedere spese condominiali aggiornate, dati amministratore, regolamento e ultime delibere rilevanti.',
  },
  {
    id: 'locazione',
    title: 'Documenti per locazione',
    category: 'Affitto',
    description: 'Dati per contratto di locazione, cauzione, canone, eventuali certificazioni.',
    requiredFor: 'affitto',
    defaultStatus: 'todo',
    requestText: 'Raccogliere dati necessari per locazione: canone, cauzione, durata, disponibilità, documenti proprietario e conduttore.',
  },
  {
    id: 'cdu',
    title: 'CDU / destinazione urbanistica',
    category: 'Terreni',
    description: 'Utile soprattutto per terreni o immobili con aree di pertinenza da verificare.',
    requiredFor: 'vendita',
    defaultStatus: 'not_needed',
    requestText: 'Valutare se serve CDU o verifica destinazione urbanistica, soprattutto in presenza di terreno/area pertinenziale.',
  },
]

function clean(value: unknown, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function optional(value: unknown) {
  return String(value ?? '').trim()
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function formatCurrency(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) return 'prezzo su richiesta'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function pickFirst(...values: unknown[]) {
  for (const value of values) {
    const text = optional(value)
    if (text) return text
  }

  return ''
}

function ownerName(owner: Record<string, any> | null | undefined) {
  if (!owner) return ''
  return pickFirst(
    owner.full_name,
    owner.name,
    owner.display_name,
    owner.owner_name,
    [owner.first_name, owner.last_name].filter(Boolean).join(' '),
  )
}

function createEmptyPracticeContacts(): PracticeContacts {
  return {
    visureEmail: '',
    technicianEmail: '',
    apeEmail: '',
    condominiumEmail: '',
    notaryEmail: '',
    ownerEmail: '',
  }
}

function practiceContactsStorageKey(propertyId?: string) {
  return propertyId ? `aios-practice-contacts:${propertyId}` : 'aios-practice-contacts:global'
}

function loadPracticeContacts(propertyId?: string): PracticeContacts {
  const fallback = createEmptyPracticeContacts()

  if (typeof window === 'undefined') return fallback

  const keys = [
    practiceContactsStorageKey(propertyId),
    practiceContactsStorageKey(),
  ]

  for (const key of keys) {
    const raw = localStorage.getItem(key)
    if (!raw) continue

    try {
      return {
        ...fallback,
        ...JSON.parse(raw),
      }
    } catch {
      // ignoro JSON rotto
    }
  }

  return fallback
}

function getRecipientForPracticeOutput(output: PracticeOutput, contacts: PracticeContacts) {
  if (output === 'owner') return contacts.ownerEmail
  if (output === 'technician' || output === 'mail-geometra') return contacts.technicianEmail
  if (
    output === 'mail-visura-catastale' ||
    output === 'mail-planimetria-catastale' ||
    output === 'mail-visura-ipotecaria'
  ) {
    return contacts.visureEmail
  }

  if (output === 'mail-ape') return contacts.apeEmail || contacts.technicianEmail
  if (output === 'mail-amministratore') return contacts.condominiumEmail
  if (output === 'mail-notaio') return contacts.notaryEmail

  return ''
}

function buildInitialPracticeState(property: Record<string, any> | null): PracticeState {
  const contract = normalize(property?.contract_type)

  return Object.fromEntries(
    PRACTICE_ITEMS.map((item) => {
      let status = item.defaultStatus

      if (item.requiredFor === 'vendita' && contract === 'affitto') {
        status = 'not_needed'
      }

      if (item.requiredFor === 'affitto' && contract !== 'affitto') {
        status = 'not_needed'
      }

      return [
        item.id,
        {
          status,
          note: '',
        },
      ]
    }),
  )
}

function statusLabel(status: PracticeStatus) {
  if (status === 'todo') return 'Da fare'
  if (status === 'requested') return 'Richiesto'
  if (status === 'received') return 'Ricevuto'
  return 'Non necessario'
}

function statusClass(status: PracticeStatus) {
  if (status === 'received') return 'border-[#A3BE8C]/45 bg-[#A3BE8C]/12 text-[#A3BE8C]'
  if (status === 'requested') return 'border-[#EBCB8B]/45 bg-[#EBCB8B]/12 text-[#EBCB8B]'
  if (status === 'not_needed') return 'border-[#6B7280]/35 bg-[#6B7280]/10 text-[#D1D5DB]/55'
  return 'border-[#BF616A]/35 bg-[#BF616A]/10 text-[#FFCCD2]'
}

function buildPropertySummary(data: ToolPropertyData | null) {
  const property = data?.property ?? {}
  const owner = data?.owners?.[0] ?? null

  const cadastral = [
    property.foglio ? `Foglio: ${property.foglio}` : '',
    property.particella ? `Particella: ${property.particella}` : '',
    property.subalterno ? `Subalterno: ${property.subalterno}` : '',
    property.categoria_catastale ? `Categoria catastale: ${property.categoria_catastale}` : '',
    property.rendita_catastale ? `Rendita catastale: ${property.rendita_catastale}` : '',
  ].filter(Boolean)

  return [
    `Riferimento: ${clean(property.reference_code)}`,
    `Titolo: ${clean(property.title)}`,
    `Contratto: ${clean(property.contract_type)}`,
    `Tipologia: ${clean(property.property_type)}`,
    `Prezzo: ${formatCurrency(property.price)}`,
    `Indirizzo/Zona: ${[property.address, property.frazione].filter(Boolean).join(', ') || '—'}`,
    `Comune: ${[property.comune || property.city, property.province].filter(Boolean).join(' · ') || '—'}`,
    `Superficie: ${property.surface ? `${property.surface} mq` : '—'}`,
    `Locali: ${clean(property.rooms)}`,
    `Bagni: ${clean(property.bathrooms)}`,
    `Classe energetica: ${clean(property.energy_class)}`,
    '',
    'PROPRIETARIO / REFERENTE',
    `Nome: ${ownerName(owner) || '—'}`,
    `Email: ${pickFirst(owner?.email, owner?.mail) || '—'}`,
    `Telefono: ${pickFirst(owner?.phone, owner?.mobile, owner?.telephone, owner?.telefono) || '—'}`,
    `Codice fiscale: ${pickFirst(owner?.fiscal_code, owner?.tax_code, owner?.codice_fiscale) || '—'}`,
    '',
    'DATI CATASTALI',
    cadastral.length ? cadastral.join('\n') : 'Dati catastali non ancora presenti nella scheda.',
  ].join('\n')
}

function buildPracticePack(
  data: ToolPropertyData | null,
  state: PracticeState,
  generalNote: string,
) {
  const property = data?.property ?? {}
  const ref = clean(property.reference_code, '—')
  const title = clean(property.title, 'Immobile selezionato')

  const rows = PRACTICE_ITEMS.map((item) => {
    const current = state[item.id] ?? { status: item.defaultStatus, note: '' }

    return [
      `## ${item.title}`,
      `Categoria: ${item.category}`,
      `Stato: ${statusLabel(current.status)}`,
      `Quando serve: ${item.requiredFor === 'all' ? 'Vendita e affitto' : item.requiredFor}`,
      `Cosa fare: ${item.requestText}`,
      current.note ? `Note: ${current.note}` : '',
    ].filter(Boolean).join('\n')
  }).join('\n\n')

  const missing = PRACTICE_ITEMS
    .filter((item) => {
      const status = state[item.id]?.status ?? item.defaultStatus
      return status === 'todo' || status === 'requested'
    })
    .map((item) => `- ${item.title}: ${statusLabel(state[item.id]?.status ?? item.defaultStatus)}`)
    .join('\n') || '- Nessuna attività aperta.'

  return [
    'PACCHETTO PRATICA AGENZIA AI-OS',
    '',
    `Immobile: ${title}`,
    `Riferimento: ${ref}`,
    `Data: ${new Date().toLocaleDateString('it-IT')}`,
    '',
    '============================================================',
    'RIEPILOGO IMMOBILE',
    '============================================================',
    buildPropertySummary(data),
    '',
    '============================================================',
    'ATTIVITÀ APERTE / DA SEGUIRE',
    '============================================================',
    missing,
    '',
    '============================================================',
    'DETTAGLIO PRATICHE',
    '============================================================',
    rows,
    '',
    '============================================================',
    'NOTE GENERALI',
    '============================================================',
    generalNote || '—',
  ].join('\n')
}

function buildOwnerRequestText(data: ToolPropertyData | null, state: PracticeState) {
  const property = data?.property ?? {}
  const owner = data?.owners?.[0] ?? null

  const missing = PRACTICE_ITEMS
    .filter((item) => {
      const status = state[item.id]?.status ?? item.defaultStatus
      return status === 'todo' || status === 'requested'
    })
    .map((item) => `- ${item.title}`)
    .join('\n') || '- Al momento non risultano documenti mancanti.'

  return [
    `Oggetto: Documenti necessari per immobile ${clean(property.reference_code, '')}`,
    '',
    `Buongiorno ${ownerName(owner) || ''},`,
    '',
    'per procedere correttamente con la gestione dell’immobile indicato, le chiediamo di inviarci o confermarci la seguente documentazione/informazione:',
    '',
    missing,
    '',
    'Immobile:',
    `${clean(property.title, '—')}`,
    `${[property.address, property.frazione, property.comune || property.city, property.province].filter(Boolean).join(', ')}`,
    '',
    'Rimaniamo a disposizione per eventuali chiarimenti.',
    '',
    'Cordiali saluti',
    'Area Immobiliare',
  ].join('\n')
}

function buildTechnicianRequestText(data: ToolPropertyData | null, state: PracticeState) {
  const property = data?.property ?? {}

  const technicalItems = PRACTICE_ITEMS
    .filter((item) => ['Catasto', 'Conservatoria', 'Tecnico', 'Energia', 'Terreni'].includes(item.category))
    .filter((item) => {
      const status = state[item.id]?.status ?? item.defaultStatus
      return status !== 'received' && status !== 'not_needed'
    })
    .map((item) => `- ${item.title}: ${item.requestText}`)
    .join('\n') || '- Nessuna richiesta tecnica aperta.'

  return [
    `Oggetto: Verifiche tecniche immobile ${clean(property.reference_code, '')}`,
    '',
    'Buongiorno,',
    '',
    'chiediamo supporto per le seguenti verifiche/documenti relativi all’immobile:',
    '',
    buildPropertySummary(data),
    '',
    'Richieste:',
    technicalItems,
    '',
    'Grazie.',
    'Area Immobiliare',
  ].join('\n')
}

type PracticeMissingField = {
  key: string
  label: string
  value: string
  multiline?: boolean
  contactKey?: keyof PracticeContacts
}

function isPracticeEmailOutput(output: PracticeOutput) {
  return output.startsWith('mail-') || output === 'owner' || output === 'technician'
}

function getManualField(overrides: Record<string, string>, key: string, fallback = '') {
  return optional(overrides[key]) || fallback
}

function buildCadastralText(property: Record<string, any>, overrides: Record<string, string>) {
  const manual = optional(overrides.cadastralData)
  if (manual) return manual

  return [
    property.foglio ? `Foglio: ${property.foglio}` : '',
    property.particella ? `Particella: ${property.particella}` : '',
    property.subalterno ? `Subalterno: ${property.subalterno}` : '',
    property.categoria_catastale ? `Categoria catastale: ${property.categoria_catastale}` : '',
    property.rendita_catastale ? `Rendita catastale: ${property.rendita_catastale}` : '',
  ].filter(Boolean).join('\n')
}

function buildEmailContext(data: ToolPropertyData | null, overrides: Record<string, string>) {
  const property = data?.property ?? {}
  const owner = data?.owners?.[0] ?? null

  const addressFallback = [property.address, property.frazione, property.comune || property.city, property.province]
    .filter(Boolean)
    .join(', ')

  return {
    ref: getManualField(overrides, 'propertyReference', clean(property.reference_code, '')),
    title: getManualField(overrides, 'propertyTitle', clean(property.title, '')),
    address: getManualField(overrides, 'propertyAddress', addressFallback),
    contract: getManualField(overrides, 'propertyContract', clean(property.contract_type, '')),
    type: getManualField(overrides, 'propertyType', clean(property.property_type, '')),
    surface: getManualField(overrides, 'propertySurface', property.surface ? `${property.surface} mq` : ''),
    energyClass: getManualField(overrides, 'energyClass', clean(property.energy_class, '')),
    price: getManualField(overrides, 'propertyPrice', formatCurrency(property.price)),
    cadastralData: buildCadastralText(property, overrides),
    ownerName: getManualField(overrides, 'ownerName', ownerName(owner)),
    ownerEmail: getManualField(overrides, 'ownerEmail', pickFirst(owner?.email, owner?.mail)),
    ownerPhone: getManualField(overrides, 'ownerPhone', pickFirst(owner?.phone, owner?.mobile, owner?.telephone, owner?.telefono)),
    ownerFiscalCode: getManualField(overrides, 'ownerFiscalCode', pickFirst(owner?.fiscal_code, owner?.tax_code, owner?.codice_fiscale)),
  }
}

function buildEmailPropertySummary(data: ToolPropertyData | null, overrides: Record<string, string>) {
  const ctx = buildEmailContext(data, overrides)

  return [
    `Riferimento: ${ctx.ref || '—'}`,
    `Titolo: ${ctx.title || '—'}`,
    `Contratto: ${ctx.contract || '—'}`,
    `Tipologia: ${ctx.type || '—'}`,
    `Prezzo: ${ctx.price || '—'}`,
    `Indirizzo/Zona: ${ctx.address || '—'}`,
    `Superficie: ${ctx.surface || '—'}`,
    `Classe energetica: ${ctx.energyClass || '—'}`,
    '',
    'PROPRIETARIO / REFERENTE',
    `Nome: ${ctx.ownerName || '—'}`,
    `Email: ${ctx.ownerEmail || '—'}`,
    `Telefono: ${ctx.ownerPhone || '—'}`,
    `Codice fiscale: ${ctx.ownerFiscalCode || '—'}`,
    '',
    'DATI CATASTALI',
    ctx.cadastralData || 'Dati catastali non ancora presenti nella scheda AI-OS.',
  ].join('\n')
}

function getMissingFieldsForOutput(
  data: ToolPropertyData | null,
  output: PracticeOutput,
  contacts: PracticeContacts,
  overrides: Record<string, string>,
): PracticeMissingField[] {
  if (!isPracticeEmailOutput(output)) return []

  const ctx = buildEmailContext(data, overrides)
  const missing: PracticeMissingField[] = []

  function addIfMissing(
    key: string,
    label: string,
    value: string,
    options?: { multiline?: boolean; contactKey?: keyof PracticeContacts },
  ) {
    if (!optional(value)) {
      missing.push({
        key,
        label,
        value: '',
        multiline: options?.multiline,
        contactKey: options?.contactKey,
      })
    }
  }

  if (output === 'owner') {
    addIfMissing('ownerEmail', 'Email proprietario', contacts.ownerEmail || ctx.ownerEmail, { contactKey: 'ownerEmail' })
    addIfMissing('ownerName', 'Nome proprietario', ctx.ownerName)
  }

  if (output === 'technician' || output === 'mail-geometra') {
    addIfMissing('technicianEmail', 'Email geometra / tecnico', contacts.technicianEmail, { contactKey: 'technicianEmail' })
  }

  if (
    output === 'mail-visura-catastale' ||
    output === 'mail-planimetria-catastale' ||
    output === 'mail-visura-ipotecaria'
  ) {
    addIfMissing('visureEmail', 'Email servizio visure / catasto', contacts.visureEmail, { contactKey: 'visureEmail' })
    addIfMissing('ownerName', 'Nome proprietario / referente', ctx.ownerName)
    addIfMissing('ownerFiscalCode', 'Codice fiscale proprietario', ctx.ownerFiscalCode)
    addIfMissing('cadastralData', 'Dati catastali disponibili', ctx.cadastralData, { multiline: true })
  }

  if (output === 'mail-ape') {
    addIfMissing('apeEmail', 'Email tecnico APE', contacts.apeEmail || contacts.technicianEmail, { contactKey: 'apeEmail' })
    addIfMissing('propertySurface', 'Superficie immobile', ctx.surface)
  }

  if (output === 'mail-amministratore') {
    addIfMissing('condominiumEmail', 'Email amministratore condominio', contacts.condominiumEmail, { contactKey: 'condominiumEmail' })
    addIfMissing('ownerName', 'Nome proprietario / referente', ctx.ownerName)
  }

  if (output === 'mail-notaio') {
    addIfMissing('notaryEmail', 'Email notaio', contacts.notaryEmail, { contactKey: 'notaryEmail' })
    addIfMissing('ownerName', 'Nome proprietario / referente', ctx.ownerName)
    addIfMissing('ownerFiscalCode', 'Codice fiscale proprietario', ctx.ownerFiscalCode)
    addIfMissing('cadastralData', 'Dati catastali disponibili', ctx.cadastralData, { multiline: true })
  }

  addIfMissing('propertyReference', 'Riferimento immobile', ctx.ref)
  addIfMissing('propertyTitle', 'Titolo immobile', ctx.title)
  addIfMissing('propertyAddress', 'Indirizzo / zona immobile', ctx.address)

  return missing
}

function buildPracticeEmailSubject(
  data: ToolPropertyData | null,
  output: PracticeOutput,
  overrides: Record<string, string> = {},
) {
  const ctx = buildEmailContext(data, overrides)
  const prefix = ctx.ref ? `${ctx.ref} - ${ctx.title || 'immobile'}` : ctx.title || 'immobile'

  if (output === 'mail-visura-catastale') return `Richiesta visura catastale - ${prefix}`
  if (output === 'mail-planimetria-catastale') return `Richiesta planimetria catastale - ${prefix}`
  if (output === 'mail-visura-ipotecaria') return `Richiesta ispezione ipotecaria/ipocatastale - ${prefix}`
  if (output === 'mail-ape') return `Richiesta APE / verifica energetica - ${prefix}`
  if (output === 'mail-geometra') return `Richiesta verifiche tecniche immobile - ${prefix}`
  if (output === 'mail-amministratore') return `Richiesta documenti condominiali - ${prefix}`
  if (output === 'mail-notaio') return `Richiesta documentazione notarile - ${prefix}`

  return `Richiesta documenti immobile - ${prefix}`
}

function buildPracticeEmailDraft(
  data: ToolPropertyData | null,
  state: PracticeState,
  output: PracticeOutput,
  generalNote: string,
  overrides: Record<string, string> = {},
) {
  const ctx = buildEmailContext(data, overrides)

  const ownerBlock = [
    `Nome: ${ctx.ownerName || '—'}`,
    `Email: ${ctx.ownerEmail || '—'}`,
    `Telefono: ${ctx.ownerPhone || '—'}`,
    `Codice fiscale: ${ctx.ownerFiscalCode || '—'}`,
  ].join('\n')

  const openItems = PRACTICE_ITEMS
    .filter((item) => {
      const status = state[item.id]?.status ?? item.defaultStatus
      return status === 'todo' || status === 'requested'
    })
    .map((item) => `- ${item.title}: ${item.requestText}`)
    .join('\n') || '- Nessuna attività aperta indicata.'

  const subject = buildPracticeEmailSubject(data, output, overrides)

  let recipientHint = 'A: [inserire destinatario]'
  let body = ''

  if (output === 'mail-visura-catastale') {
    recipientHint = 'A: tecnico / servizio visure / referente catastale'
    body = [
      'Buongiorno,',
      '',
      'chiediamo cortesemente la visura catastale aggiornata per il seguente immobile:',
      '',
      `Riferimento agenzia: ${ctx.ref || '—'}`,
      `Immobile: ${ctx.title || '—'}`,
      `Indirizzo/Zona: ${ctx.address || '—'}`,
      '',
      'Dati catastali disponibili:',
      ctx.cadastralData || '—',
      '',
      'Proprietario / referente:',
      ownerBlock,
      '',
      'Se servono ulteriori dati, restiamo a disposizione.',
      '',
      'Grazie.',
      'Area Immobiliare',
    ].join('\n')
  } else if (output === 'mail-planimetria-catastale') {
    recipientHint = 'A: tecnico / servizio visure / referente catastale'
    body = [
      'Buongiorno,',
      '',
      'chiediamo cortesemente la planimetria catastale aggiornata dell’immobile sotto indicato, utile per confronto con lo stato di fatto e verifica di conformità.',
      '',
      `Riferimento agenzia: ${ctx.ref || '—'}`,
      `Immobile: ${ctx.title || '—'}`,
      `Indirizzo/Zona: ${ctx.address || '—'}`,
      '',
      'Dati catastali disponibili:',
      ctx.cadastralData || '—',
      '',
      'Proprietario / referente:',
      ownerBlock,
      '',
      'Grazie.',
      'Area Immobiliare',
    ].join('\n')
  } else if (output === 'mail-visura-ipotecaria') {
    recipientHint = 'A: notaio / consulente / servizio ispezioni ipotecarie'
    body = [
      'Buongiorno,',
      '',
      'chiediamo cortesemente ispezione ipotecaria/ipocatastale aggiornata per verificare formalità, gravami, ipoteche, pignoramenti o trascrizioni rilevanti.',
      '',
      `Riferimento agenzia: ${ctx.ref || '—'}`,
      `Immobile: ${ctx.title || '—'}`,
      `Indirizzo/Zona: ${ctx.address || '—'}`,
      '',
      'Proprietario / referente:',
      ownerBlock,
      '',
      'Dati catastali disponibili:',
      ctx.cadastralData || '—',
      '',
      'Grazie.',
      'Area Immobiliare',
    ].join('\n')
  } else if (output === 'mail-ape') {
    recipientHint = 'A: tecnico certificatore / geometra'
    body = [
      'Buongiorno,',
      '',
      'chiediamo verifica disponibilità APE oppure predisposizione di nuovo Attestato di Prestazione Energetica per il seguente immobile:',
      '',
      `Riferimento agenzia: ${ctx.ref || '—'}`,
      `Immobile: ${ctx.title || '—'}`,
      `Contratto: ${ctx.contract || '—'}`,
      `Tipologia: ${ctx.type || '—'}`,
      `Indirizzo/Zona: ${ctx.address || '—'}`,
      `Superficie: ${ctx.surface || '—'}`,
      `Classe energetica attuale in scheda: ${ctx.energyClass || '—'}`,
      '',
      'Proprietario / referente:',
      ownerBlock,
      '',
      'Grazie.',
      'Area Immobiliare',
    ].join('\n')
  } else if (output === 'mail-geometra') {
    recipientHint = 'A: geometra / tecnico incaricato'
    body = [
      'Buongiorno,',
      '',
      'chiediamo supporto per le verifiche tecniche relative al seguente immobile:',
      '',
      buildEmailPropertySummary(data, overrides),
      '',
      'Richieste aperte:',
      openItems,
      '',
      generalNote ? `Note agenzia:\n${generalNote}\n` : '',
      'L’obiettivo è verificare coerenza tra documentazione, stato di fatto, planimetria catastale e situazione urbanistica.',
      '',
      'Grazie.',
      'Area Immobiliare',
    ].filter(Boolean).join('\n')
  } else if (output === 'mail-amministratore') {
    recipientHint = 'A: amministratore condominio'
    body = [
      'Buongiorno,',
      '',
      'chiediamo cortesemente, per l’immobile sotto indicato, la documentazione condominiale utile alla gestione della pratica:',
      '',
      `Riferimento agenzia: ${ctx.ref || '—'}`,
      `Immobile: ${ctx.title || '—'}`,
      `Indirizzo/Zona: ${ctx.address || '—'}`,
      '',
      'Documenti richiesti:',
      '- spese condominiali ordinarie aggiornate',
      '- eventuali spese straordinarie deliberate o previste',
      '- regolamento condominiale, se disponibile',
      '- ultime delibere rilevanti',
      '- dati amministratore e riferimenti condominio',
      '',
      'Proprietario / referente:',
      ownerBlock,
      '',
      'Grazie.',
      'Area Immobiliare',
    ].join('\n')
  } else if (output === 'mail-notaio') {
    recipientHint = 'A: notaio / studio notarile'
    body = [
      'Buongiorno,',
      '',
      'chiediamo cortesemente supporto/documentazione per la verifica preliminare dell’immobile sotto indicato:',
      '',
      buildEmailPropertySummary(data, overrides),
      '',
      'Documenti/verifiche utili:',
      '- atto di provenienza / rogito',
      '- eventuali trascrizioni o formalità rilevanti',
      '- eventuali note su vincoli, gravami o provenienza',
      '- documentazione utile per futura compravendita',
      '',
      generalNote ? `Note agenzia:\n${generalNote}\n` : '',
      'Grazie.',
      'Area Immobiliare',
    ].filter(Boolean).join('\n')
  } else {
    return buildOwnerRequestText(data, state)
  }

  return [
    recipientHint,
    '',
    `Oggetto: ${subject}`,
    '',
    'Testo mail:',
    '',
    body,
  ].join('\n')
}

function buildPracticeMailTo(
  data: ToolPropertyData | null,
  output: PracticeOutput,
  body: string,
  contacts: PracticeContacts,
  overrides: Record<string, string> = {},
) {
  const subject = buildPracticeEmailSubject(data, output, overrides)
  const recipient = getRecipientForPracticeOutput(output, contacts)

  const cleanBody = body
    .replace(/^A:.*\n\n/iu, '')
    .replace(/^Oggetto:.*\n\n/iu, '')
    .replace(/^Testo mail:\n\n/iu, '')

  return `mailto:${encodeURIComponent(recipient)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(cleanBody)}`
}

export default function AIOSPraticheAgenziaPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [propertyData, setPropertyData] = useState<ToolPropertyData | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>({})
  const [selectedOutput, setSelectedOutput] = useState<PracticeOutput>('pack')
  const [generalNote, setGeneralNote] = useState('')
  const [practiceContacts, setPracticeContacts] = useState<PracticeContacts>(() => createEmptyPracticeContacts())
  const [mailFieldOverrides, setMailFieldOverrides] = useState<Record<string, string>>({})
  const [mailFieldsModalOutput, setMailFieldsModalOutput] = useState<PracticeOutput | null>(null)
  const [modalFieldValues, setModalFieldValues] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')

  const filteredFolders = useMemo(() => {
    const q = normalize(query)

    return folders.filter((folder) => {
      const contractType = normalize(folder.contractType)

      if (contractFilter !== 'all' && contractType !== contractFilter) return false
      if (q.length < 3 && contractFilter === 'all') return false
      if (q.length < 3) return true

      const haystack = [
        folder.name,
        folder.propertyRef,
        folder.address,
        folder.contractType,
      ].filter(Boolean).join(' ').toLowerCase()

      return haystack.includes(q)
    })
  }, [contractFilter, folders, query])

  const outputText = useMemo(() => {
    if (selectedOutput === 'owner') return buildOwnerRequestText(propertyData, practiceState)
    if (selectedOutput === 'technician') return buildTechnicianRequestText(propertyData, practiceState)
    if (selectedOutput.startsWith('mail-')) {
      return buildPracticeEmailDraft(propertyData, practiceState, selectedOutput, generalNote, mailFieldOverrides)
    }

    return buildPracticePack(propertyData, practiceState, generalNote)
  }, [generalNote, mailFieldOverrides, practiceState, propertyData, selectedOutput])

  const selectedOutputMissingFields = useMemo(() => {
    return getMissingFieldsForOutput(propertyData, selectedOutput, practiceContacts, mailFieldOverrides)
  }, [mailFieldOverrides, practiceContacts, propertyData, selectedOutput])

  const modalMissingFields = useMemo(() => {
    if (!mailFieldsModalOutput) return []
    return getMissingFieldsForOutput(propertyData, mailFieldsModalOutput, practiceContacts, mailFieldOverrides)
  }, [mailFieldOverrides, mailFieldsModalOutput, practiceContacts, propertyData])

  function openPracticeOutput(output: PracticeOutput) {
    setSelectedOutput(output)

    const missing = getMissingFieldsForOutput(propertyData, output, practiceContacts, mailFieldOverrides)

    if (isPracticeEmailOutput(output) && missing.length > 0) {
      setModalFieldValues(Object.fromEntries(missing.map((field) => [field.key, field.value || ''])))
      setMailFieldsModalOutput(output)
      return
    }
  }

  function saveMissingMailFields() {
    const nextOverrides = { ...mailFieldOverrides }
    const nextContacts = { ...practiceContacts }

    for (const field of modalMissingFields) {
      const value = optional(modalFieldValues[field.key])
      if (!value) continue

      if (field.contactKey) {
        nextContacts[field.contactKey] = value
      } else {
        nextOverrides[field.key] = value
      }
    }

    setPracticeContacts(nextContacts)
    setMailFieldOverrides(nextOverrides)
    setMailFieldsModalOutput(null)
    setModalFieldValues({})
    setNotice('Campi mancanti salvati e mail aggiornata.')
  }

  function openEmailFromModal() {
    if (!mailFieldsModalOutput) return

    const missing = getMissingFieldsForOutput(propertyData, mailFieldsModalOutput, practiceContacts, mailFieldOverrides)

    if (missing.length > 0) {
      setNotice('Compila e salva prima i campi mancanti.')
      return
    }

    const draft = mailFieldsModalOutput.startsWith('mail-')
      ? buildPracticeEmailDraft(propertyData, practiceState, mailFieldsModalOutput, generalNote, mailFieldOverrides)
      : outputText

    window.location.href = buildPracticeMailTo(
      propertyData,
      mailFieldsModalOutput,
      draft,
      practiceContacts,
      mailFieldOverrides,
    )
  }

  async function loadFolders() {
    setLoadingFolders(true)

    try {
      const response = await fetch('/api/admin/ai-os/workspace/immobili', { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok) throw new Error(payload?.error || 'Errore caricamento immobili')

      setFolders(Array.isArray(payload?.folders) ? payload.folders : [])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento immobili')
    } finally {
      setLoadingFolders(false)
    }
  }

  async function loadProperty(propertyId: string) {
    if (!propertyId) return

    setSelectedPropertyId(propertyId)
    setLoadingProperty(true)
    setNotice('')

    try {
      const response = await fetch(`/api/admin/ai-os/tools/property/${propertyId}`, {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore caricamento dati immobile')
      }

      const nextData: ToolPropertyData = {
        property: payload.property,
        owners: Array.isArray(payload.owners) ? payload.owners : [],
        ownerDocuments: Array.isArray(payload.ownerDocuments) ? payload.ownerDocuments : [],
        checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
        driveFolder: payload.driveFolder ?? null,
        driveSubfolders: Array.isArray(payload.driveSubfolders) ? payload.driveSubfolders : [],
      }

      const localKey = `aios-pratiche:${propertyId}`
      const saved = localStorage.getItem(localKey)

      const loadedContacts = loadPracticeContacts(propertyId)
      const owner = nextData.owners?.[0] ?? null
      const ownerEmail = pickFirst(owner?.email, owner?.mail)

      setPracticeContacts({
        ...loadedContacts,
        ownerEmail: loadedContacts.ownerEmail || ownerEmail,
      })
      setMailFieldOverrides({})

      setPropertyData(nextData)

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPracticeState(parsed.practiceState ?? buildInitialPracticeState(nextData.property))
          setGeneralNote(parsed.generalNote ?? '')
          if (parsed.practiceContacts) {
            setPracticeContacts((current) => ({
              ...current,
              ...parsed.practiceContacts,
            }))
          }
          if (parsed.mailFieldOverrides) {
            setMailFieldOverrides(parsed.mailFieldOverrides)
          }
          setNotice('Pratica caricata con stato salvato localmente.')
        } catch {
          setPracticeState(buildInitialPracticeState(nextData.property))
          setGeneralNote('')
          setNotice('Dati immobile caricati. Stato pratica inizializzato.')
        }
      } else {
        setPracticeState(buildInitialPracticeState(nextData.property))
        setGeneralNote('')
        setNotice('Dati immobile caricati. Stato pratica inizializzato.')
      }
    } catch (error) {
      setPropertyData(null)
      setPracticeState({})
                    setPracticeContacts(createEmptyPracticeContacts())
      setGeneralNote('')
      setNotice(error instanceof Error ? error.message : 'Errore caricamento dati immobile')
    } finally {
      setLoadingProperty(false)
    }
  }

  function updatePractice(id: string, patch: Partial<{ status: PracticeStatus; note: string }>) {
    setPracticeState((current) => ({
      ...current,
      [id]: {
        status: patch.status ?? current[id]?.status ?? 'todo',
        note: patch.note ?? current[id]?.note ?? '',
      },
    }))
  }

  function updatePracticeContact(key: keyof PracticeContacts, value: string) {
    setPracticeContacts((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function savePracticeContacts() {
    const key = practiceContactsStorageKey(selectedPropertyId || undefined)

    localStorage.setItem(key, JSON.stringify(practiceContacts))

    if (!selectedPropertyId) {
      localStorage.setItem(practiceContactsStorageKey(), JSON.stringify(practiceContacts))
    }

    setNotice('Contatti pratica salvati.')
  }

  function saveLocal() {
    if (!selectedPropertyId) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    localStorage.setItem(
      `aios-pratiche:${selectedPropertyId}`,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        practiceState,
        generalNote,
        practiceContacts,
        mailFieldOverrides,
      }),
    )

    setNotice('Stato pratica salvato localmente su questo browser.')
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(outputText)
      setNotice('Testo copiato.')
    } catch {
      setNotice('Copia non riuscita: seleziona il testo e copialo manualmente.')
    }
  }

  function openEmailClient() {
    if (!propertyData) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    if (!selectedOutput.startsWith('mail-') && selectedOutput !== 'owner' && selectedOutput !== 'technician') {
      setNotice('Seleziona una mail operativa prima di aprire il client email.')
      return
    }

    const missing = getMissingFieldsForOutput(propertyData, selectedOutput, practiceContacts, mailFieldOverrides)

    if (missing.length > 0) {
      setModalFieldValues(Object.fromEntries(missing.map((field) => [field.key, field.value || ''])))
      setMailFieldsModalOutput(selectedOutput)
      setNotice('Compila i campi mancanti prima di aprire la mail.')
      return
    }

    window.location.href = buildPracticeMailTo(propertyData, selectedOutput, outputText, practiceContacts, mailFieldOverrides)
  }

  function downloadTxt() {
    const ref = clean(propertyData?.property?.reference_code, 'immobile')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const blob = new Blob([outputText], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${ref}-pratiche-agenzia.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  useEffect(() => {
    void loadFolders()

    const params = new URLSearchParams(window.location.search)
    const propertyId = params.get('propertyId')

    if (propertyId) {
      void loadProperty(propertyId)
    }
  }, [])

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS / Strumenti
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Pratiche agenzia e visure
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Sportello operativo per preparare visure, documenti, verifiche tecniche, richieste al proprietario e pacchetto pratica.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/ai-os/strumenti'}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
            >
              Torna a Strumenti
            </button>

            <button
              type="button"
              disabled={!selectedPropertyId}
              onClick={() => window.location.href = `/admin/ai-os/strumenti/moduli?propertyId=${selectedPropertyId}`}
              className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-sm font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:opacity-40"
            >
              Apri moduli compilabili
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold leading-6 text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        <section className="mb-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
            Selezione immobile
          </p>

          <div className="mt-4 grid gap-3">
            <div className="grid grid-cols-3 gap-2">
              {(['all', 'vendita', 'affitto'] as const).map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => {
                    setContractFilter(filter)
                    setSelectedPropertyId('')
                    setPropertyData(null)
                    setPracticeState({})
                  }}
                  className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                    contractFilter === filter
                      ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                      : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                  }`}
                >
                  {filter === 'all' ? 'Tutti' : filter === 'vendita' ? 'Vendite' : 'Affitti'}
                </button>
              ))}
            </div>

            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedPropertyId('')
                setPropertyData(null)
                setPracticeState({})
              }}
              className="w-full rounded-2xl border border-[#8FBCBB]/45 bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#A3BE8C]/70"
              placeholder="Cerca da 3 caratteri per codice, titolo o indirizzo..."
            />

            {(query.trim().length >= 3 || contractFilter !== 'all') ? (
              <select
                value={selectedPropertyId}
                onChange={(event) => void loadProperty(event.target.value)}
                className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
              >
                <option value="">
                  {filteredFolders.length > 0
                    ? `Seleziona immobile (${filteredFolders.length} risultati)...`
                    : 'Nessun immobile trovato'}
                </option>

                {filteredFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                    {folder.contractType ? ` · ${folder.contractType}` : ''}
                    {folder.address ? ` · ${folder.address}` : ''}
                  </option>
                ))}
              </select>
            ) : null}

            {loadingFolders || loadingProperty ? (
              <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 px-4 py-3 text-sm text-[#D1D5DB]/62">
                {loadingProperty ? 'Caricamento dati immobile...' : 'Caricamento immobili...'}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                  Checklist pratica
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Visure, documenti e verifiche
                </h2>
              </div>

              <button
                type="button"
                disabled={!selectedPropertyId}
                onClick={saveLocal}
                className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
              >
                Salva stato pratica
              </button>
            </div>

            {!propertyData ? (
              <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
                Seleziona un immobile per avviare la pratica.
              </div>
            ) : (
              <div className="grid gap-3">
                {PRACTICE_ITEMS.map((item) => {
                  const current = practiceState[item.id] ?? {
                    status: item.defaultStatus,
                    note: '',
                  }

                  return (
                    <article
                      key={item.id}
                      className="rounded-3xl border border-[#374151] bg-[#111827]/70 p-4"
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-white">{item.title}</h3>
                            <span className="rounded-full border border-[#8FBCBB]/25 bg-[#8FBCBB]/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[#8FBCBB]">
                              {item.category}
                            </span>
                            <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${statusClass(current.status)}`}>
                              {statusLabel(current.status)}
                            </span>
                          </div>

                          <p className="mt-2 text-sm leading-6 text-[#D1D5DB]/65">
                            {item.description}
                          </p>

                          <p className="mt-2 text-xs leading-5 text-[#D1D5DB]/50">
                            {item.requestText}
                          </p>
                        </div>

                        <select
                          value={current.status}
                          onChange={(event) => updatePractice(item.id, {
                            status: event.target.value as PracticeStatus,
                          })}
                          className="rounded-2xl border border-[#374151] bg-[#0B1220] px-3 py-2 text-xs font-bold text-white outline-none"
                        >
                          <option value="todo">Da fare</option>
                          <option value="requested">Richiesto</option>
                          <option value="received">Ricevuto</option>
                          <option value="not_needed">Non necessario</option>
                        </select>
                      </div>

                      <textarea
                        value={current.note}
                        onChange={(event) => updatePractice(item.id, {
                          note: event.target.value,
                        })}
                        className="mt-3 min-h-[70px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/55"
                        placeholder="Note interne su questa pratica..."
                      />
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <aside className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Output operativo
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2">
              {PRACTICE_OUTPUT_BUTTONS.map(({ id, label }) => {
                const missingCount = getMissingFieldsForOutput(propertyData, id, practiceContacts, mailFieldOverrides).length
                const isSelected = selectedOutput === id
                const isMailButton = isPracticeEmailOutput(id)

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => openPracticeOutput(id)}
                    title={missingCount > 0 ? `${missingCount} campi da completare` : undefined}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                      missingCount > 0 && isMailButton
                        ? 'border-[#D08770]/70 bg-[#D08770]/18 text-[#FFD6C2] hover:bg-[#D08770]/28'
                        : isSelected
                          ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                          : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    <span>{label}</span>
                    {missingCount > 0 && isMailButton ? (
                      <span className="ml-1 rounded-full bg-[#D08770]/25 px-1.5 py-0.5 text-[10px] text-[#FFD6C2]">
                        {missingCount}
                      </span>
                    ) : null}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 rounded-2xl border border-[#8FBCBB]/15 bg-[#111827]/70 p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8FBCBB]/65">
                    Rubrica pratica
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/52">
                    Questi indirizzi vengono usati dal tasto Apri email.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={savePracticeContacts}
                  className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-3 py-1.5 text-[11px] font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18"
                >
                  Salva contatti
                </button>
              </div>

              <div className="grid gap-2">
                {([
                  ['visureEmail', 'Servizio visure / catasto'],
                  ['technicianEmail', 'Geometra / tecnico'],
                  ['apeEmail', 'Tecnico APE'],
                  ['condominiumEmail', 'Amministratore condominio'],
                  ['notaryEmail', 'Notaio'],
                  ['ownerEmail', 'Proprietario'],
                ] as Array<[keyof PracticeContacts, string]>).map(([key, label]) => (
                  <label key={key} className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#D1D5DB]/45">
                      {label}
                    </span>
                    <input
                      value={practiceContacts[key]}
                      onChange={(event) => updatePracticeContact(key, event.target.value)}
                      className="w-full rounded-2xl border border-[#374151] bg-[#0B1220] px-3 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/55"
                      placeholder="email@dominio.it"
                    />
                  </label>
                ))}
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[#D1D5DB]/48">
                Note generali pratica
              </span>
              <textarea
                value={generalNote}
                onChange={(event) => setGeneralNote(event.target.value)}
                className="min-h-[110px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/55"
                placeholder="Es. chiamare proprietario, attendere geometra, controllare difformità..."
              />
            </label>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!propertyData}
                onClick={() => void copyOutput()}
                className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
              >
                Copia
              </button>

              <button
                type="button"
                disabled={!propertyData}
                onClick={downloadTxt}
                className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-xs font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:opacity-40"
              >
                Scarica TXT
              </button>

              <button
                type="button"
                disabled={!propertyData || (!selectedOutput.startsWith('mail-') && selectedOutput !== 'owner' && selectedOutput !== 'technician')}
                onClick={openEmailClient}
                className={`rounded-full border px-4 py-2 text-xs font-bold transition disabled:opacity-40 ${
                  selectedOutputMissingFields.length > 0
                    ? 'border-[#D08770]/45 bg-[#D08770]/14 text-[#FFD6C2] hover:bg-[#D08770]/22'
                    : 'border-[#88C0D0]/35 bg-[#88C0D0]/10 text-[#88C0D0] hover:bg-[#88C0D0]/18'
                }`}
              >
                {selectedOutputMissingFields.length > 0 ? `Completa campi (${selectedOutputMissingFields.length})` : 'Apri email'}
              </button>
            </div>

            <textarea
              readOnly
              value={propertyData ? outputText : ''}
              className="mt-4 min-h-[760px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] p-4 font-mono text-xs leading-5 text-[#E5E7EB] outline-none"
              placeholder="Seleziona un immobile per generare il pacchetto pratica..."
            />
          </aside>
        </section>
      </div>

        {mailFieldsModalOutput ? (
          <div className="fixed inset-0 z-[12000] grid place-items-center bg-black/72 px-4 py-6 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[30px] border border-[#D08770]/35 bg-[#111827] shadow-[0_30px_120px_rgba(0,0,0,0.75)]">
              <div className="flex items-start justify-between gap-4 border-b border-[#374151] bg-[#0B1220] px-5 py-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#D08770]">
                    Campi mancanti
                  </p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    Completa la mail prima dell’invio
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/58">
                    AI-OS ha preparato la bozza con i dati disponibili. Compila qui ciò che non è riuscito a recuperare dalla scheda o dai documenti caricati.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMailFieldsModalOutput(null)
                    setModalFieldValues({})
                  }}
                  className="rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 px-4 py-2 text-xs font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/20"
                >
                  Chiudi
                </button>
              </div>

              <div className="grid max-h-[calc(92vh-88px)] gap-0 overflow-y-auto xl:grid-cols-[420px_minmax(0,1fr)]">
                <section className="border-b border-[#374151] p-5 xl:border-b-0 xl:border-r">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#D08770]/85">
                    Da compilare
                  </p>

                  {modalMissingFields.length > 0 ? (
                    <div className="mt-4 grid gap-3">
                      {modalMissingFields.map((field) => (
                        <label key={field.key} className="block">
                          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#D1D5DB]/55">
                            {field.label}
                          </span>

                          {field.multiline ? (
                            <textarea
                              value={modalFieldValues[field.key] ?? ''}
                              onChange={(event) => setModalFieldValues((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))}
                              className="min-h-[112px] w-full resize-y rounded-2xl border border-[#D08770]/35 bg-[#0B1220] px-3 py-2 text-xs leading-5 text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#D08770]/70"
                              placeholder="Inserisci dato mancante..."
                            />
                          ) : (
                            <input
                              value={modalFieldValues[field.key] ?? ''}
                              onChange={(event) => setModalFieldValues((current) => ({
                                ...current,
                                [field.key]: event.target.value,
                              }))}
                              className="w-full rounded-2xl border border-[#D08770]/35 bg-[#0B1220] px-3 py-2 text-xs font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#D08770]/70"
                              placeholder="Inserisci dato mancante..."
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-2xl border border-[#A3BE8C]/30 bg-[#A3BE8C]/10 p-4 text-sm text-[#A3BE8C]">
                      Tutti i campi necessari risultano compilati.
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={saveMissingMailFields}
                      className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18"
                    >
                      Salva campi
                    </button>

                    <button
                      type="button"
                      onClick={openEmailFromModal}
                      className="rounded-full border border-[#88C0D0]/35 bg-[#88C0D0]/10 px-4 py-2 text-xs font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/18"
                    >
                      Apri email
                    </button>
                  </div>
                </section>

                <section className="p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8FBCBB]/70">
                    Anteprima mail
                  </p>

                  <textarea
                    readOnly
                    value={
                      mailFieldsModalOutput.startsWith('mail-')
                        ? buildPracticeEmailDraft(propertyData, practiceState, mailFieldsModalOutput, generalNote, mailFieldOverrides)
                        : outputText
                    }
                    className="mt-4 min-h-[620px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] p-4 font-mono text-xs leading-5 text-[#E5E7EB] outline-none"
                  />
                </section>
              </div>
            </div>
          </div>
        ) : null}

    </main>
  )
}
