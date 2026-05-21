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

export default function AIOSPraticheAgenziaPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [propertyData, setPropertyData] = useState<ToolPropertyData | null>(null)
  const [practiceState, setPracticeState] = useState<PracticeState>({})
  const [selectedOutput, setSelectedOutput] = useState<'pack' | 'owner' | 'technician'>('pack')
  const [generalNote, setGeneralNote] = useState('')
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
    return buildPracticePack(propertyData, practiceState, generalNote)
  }, [generalNote, practiceState, propertyData, selectedOutput])

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

      setPropertyData(nextData)

      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setPracticeState(parsed.practiceState ?? buildInitialPracticeState(nextData.property))
          setGeneralNote(parsed.generalNote ?? '')
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

            <div className="mt-4 grid grid-cols-3 gap-2">
              {([
                ['pack', 'Pacchetto'],
                ['owner', 'Proprietario'],
                ['technician', 'Tecnico'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedOutput(id)}
                  className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                    selectedOutput === id
                      ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                      : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                  }`}
                >
                  {label}
                </button>
              ))}
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
    </main>
  )
}
