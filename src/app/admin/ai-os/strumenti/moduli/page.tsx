'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

type TemplateItem = {
  id: string
  title: string
  description: string
  content: string
}

const DEFAULT_TEMPLATES: TemplateItem[] = [
  {
    id: 'incarico-vendita',
    title: 'Lettera incarico vendita',
    description: 'Bozza operativa per incarico di mediazione/vendita.',
    content: `LETTERA DI INCARICO / MEDIAZIONE IMMOBILIARE

Data: {{data_documento}}

AGENZIA
{{agenzia_nome}}
Agente/referente: {{agente_nome}}

PROPRIETARIO / REFERENTE
Nome e cognome: {{proprietario_nome}}
Codice fiscale: {{proprietario_cf}}
Email: {{proprietario_email}}
Telefono: {{proprietario_telefono}}

IMMOBILE
Riferimento: {{immobile_riferimento}}
Titolo: {{immobile_titolo}}
Contratto: {{immobile_contratto}}
Tipologia: {{immobile_tipologia}}
Indirizzo/Zona: {{immobile_indirizzo}}
Comune: {{immobile_comune}}
Prezzo richiesto: {{immobile_prezzo}}
Superficie: {{immobile_superficie}}
Locali: {{immobile_locali}}
Bagni: {{immobile_bagni}}
Classe energetica: {{immobile_classe_energetica}}

DESCRIZIONE IMMOBILE
{{immobile_descrizione}}

DOCUMENTI ACQUISITI / DA ACQUISIRE
{{documenti_proprietario}}

CHECKLIST OPERATIVA
{{checklist}}

NOTE OPERATIVE
{{note_interne}}

La presente bozza è generata automaticamente da AI-OS e deve essere verificata dall’agenzia prima della firma o dell’invio al cliente.

Firma proprietario: ___________________________

Firma agenzia: _______________________________`,
  },
  {
    id: 'richiesta-documenti',
    title: 'Richiesta documenti proprietario',
    description: 'Testo da inviare al proprietario per recuperare documentazione mancante.',
    content: `Oggetto: Documenti necessari per immobile {{immobile_riferimento}}

Buongiorno {{proprietario_nome}},

per procedere correttamente con la gestione dell’immobile:

{{immobile_titolo}}
{{immobile_indirizzo}}
{{immobile_comune}}

le chiediamo di inviarci, appena possibile, la documentazione utile alla verifica e alla preparazione della pratica.

DOCUMENTI / CONTROLLI
{{documenti_proprietario}}

CHECKLIST
{{checklist}}

NOTE
{{note_interne}}

Rimaniamo a disposizione per qualsiasi chiarimento.

Cordiali saluti

{{agenzia_nome}}
{{agente_nome}}`,
  },
  {
    id: 'scheda-raccolta-dati',
    title: 'Scheda raccolta dati proprietario',
    description: 'Scheda editabile per raccogliere e verificare dati anagrafici e immobile.',
    content: `SCHEDA RACCOLTA DATI PROPRIETARIO

Data compilazione: {{data_documento}}

DATI PROPRIETARIO
Nome e cognome: {{proprietario_nome}}
Codice fiscale: {{proprietario_cf}}
Email: {{proprietario_email}}
Telefono: {{proprietario_telefono}}

DATI IMMOBILE
Riferimento: {{immobile_riferimento}}
Titolo: {{immobile_titolo}}
Contratto: {{immobile_contratto}}
Tipologia: {{immobile_tipologia}}
Indirizzo/Zona: {{immobile_indirizzo}}
Comune: {{immobile_comune}}
Prezzo richiesto: {{immobile_prezzo}}
Superficie: {{immobile_superficie}}
Locali: {{immobile_locali}}
Bagni: {{immobile_bagni}}
Classe energetica: {{immobile_classe_energetica}}

DESCRIZIONE
{{immobile_descrizione}}

DOCUMENTI
{{documenti_proprietario}}

NOTE AGENZIA
{{note_interne}}

Conferma dati proprietario: ___________________________

Firma: _____________________________________________`,
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

function formatDateToday() {
  return new Date().toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
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

function buildDocumentsText(ownerDocuments: Record<string, any>[]) {
  if (!ownerDocuments?.length) {
    return '- Nessun documento proprietario ancora registrato in AI-OS.'
  }

  return ownerDocuments
    .map((doc, index) => {
      const title = clean(doc.title || doc.document_title || doc.document_type || doc.name, `Documento ${index + 1}`)
      const status = clean(doc.status || doc.document_status || doc.state, 'da verificare')
      const notes = optional(doc.notes || doc.note)

      return `- ${title} · stato: ${status}${notes ? ` · note: ${notes}` : ''}`
    })
    .join('\n')
}

function buildChecklistText(checklist: Record<string, any>[]) {
  if (!checklist?.length) {
    return '- Nessuna checklist ancora registrata in AI-OS.'
  }

  return checklist
    .map((item) => {
      const title = clean(item.title || item.label || item.item_label || item.item_key, 'Controllo')
      const done = item.is_done || item.done || item.completed ? '[x]' : '[ ]'
      const notes = optional(item.notes || item.note)

      return `${done} ${title}${notes ? ` · ${notes}` : ''}`
    })
    .join('\n')
}

function buildInitialFields(data: ToolPropertyData | null) {
  const property = data?.property ?? {}
  const owner = data?.owners?.[0] ?? null

  return {
    data_documento: formatDateToday(),
    agenzia_nome: 'Area Immobiliare',
    agente_nome: 'Gianfederico Belotti',

    proprietario_nome: ownerName(owner),
    proprietario_cf: pickFirst(owner?.fiscal_code, owner?.tax_code, owner?.codice_fiscale),
    proprietario_email: pickFirst(owner?.email, owner?.mail),
    proprietario_telefono: pickFirst(owner?.phone, owner?.mobile, owner?.telephone, owner?.telefono),

    immobile_riferimento: clean(property.reference_code, '—'),
    immobile_titolo: clean(property.title, '—'),
    immobile_contratto: clean(property.contract_type, '—'),
    immobile_tipologia: clean(property.property_type, '—'),
    immobile_indirizzo: [property.address, property.frazione].filter(Boolean).join(', ') || '—',
    immobile_comune: [property.comune || property.city, property.province].filter(Boolean).join(' · ') || '—',
    immobile_prezzo: formatCurrency(property.price),
    immobile_superficie: property.surface ? `${property.surface} mq` : '—',
    immobile_locali: clean(property.rooms, '—'),
    immobile_bagni: clean(property.bathrooms, '—'),
    immobile_classe_energetica: clean(property.energy_class, '—'),
    immobile_descrizione: clean(property.description, 'Descrizione non presente nella scheda immobile.'),

    documenti_proprietario: buildDocumentsText(data?.ownerDocuments ?? []),
    checklist: buildChecklistText(data?.checklist ?? []),
    note_interne: '',
  }
}

function mergeTemplate(template: string, fields: Record<string, string>) {
  let output = template

  for (const [key, value] of Object.entries(fields)) {
    output = output.replaceAll(`{{${key}}}`, value || '—')
  }

  return output.replace(/\{\{[^}]+\}\}/g, '—')
}

function fieldLabel(key: string) {
  const labels: Record<string, string> = {
    data_documento: 'Data documento',
    agenzia_nome: 'Agenzia',
    agente_nome: 'Agente / referente',
    proprietario_nome: 'Proprietario nome',
    proprietario_cf: 'Proprietario codice fiscale',
    proprietario_email: 'Proprietario email',
    proprietario_telefono: 'Proprietario telefono',
    immobile_riferimento: 'Riferimento immobile',
    immobile_titolo: 'Titolo immobile',
    immobile_contratto: 'Contratto',
    immobile_tipologia: 'Tipologia',
    immobile_indirizzo: 'Indirizzo / zona',
    immobile_comune: 'Comune',
    immobile_prezzo: 'Prezzo',
    immobile_superficie: 'Superficie',
    immobile_locali: 'Locali',
    immobile_bagni: 'Bagni',
    immobile_classe_energetica: 'Classe energetica',
    immobile_descrizione: 'Descrizione completa',
    documenti_proprietario: 'Documenti proprietario',
    checklist: 'Checklist',
    note_interne: 'Note interne',
  }

  return labels[key] ?? key
}

export default function AIOSModuliCompilabiliPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [loadingProperty, setLoadingProperty] = useState(false)

  const [propertyData, setPropertyData] = useState<ToolPropertyData | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATES[0].id)
  const [customTemplate, setCustomTemplate] = useState<TemplateItem | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [reviewContent, setReviewContent] = useState('')
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [notice, setNotice] = useState('')

  const templates = useMemo(() => {
    return customTemplate ? [customTemplate, ...DEFAULT_TEMPLATES] : DEFAULT_TEMPLATES
  }, [customTemplate])

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId) ?? templates[0]

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

  function regenerateContent(nextFields = fields, nextTemplate = selectedTemplate) {
    const merged = mergeTemplate(nextTemplate.content, nextFields)
    setReviewContent(merged)
    setNotice('Anteprima rigenerata dai dati correnti.')
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

      const nextFields = buildInitialFields(nextData)

      setPropertyData(nextData)
      setFields(nextFields)
      setReviewContent(mergeTemplate(selectedTemplate.content, nextFields))
      setNotice('Dati acquisiti automaticamente. Ora puoi modificarli e revisionare il documento.')
    } catch (error) {
      setPropertyData(null)
      setFields({})
      setReviewContent('')
      setNotice(error instanceof Error ? error.message : 'Errore caricamento dati immobile')
    } finally {
      setLoadingProperty(false)
    }
  }

  function updateField(key: string, value: string) {
    setFields((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function handleTemplateChange(templateId: string) {
    const nextTemplate = templates.find((template) => template.id === templateId) ?? templates[0]
    setSelectedTemplateId(templateId)

    if (Object.keys(fields).length > 0) {
      setReviewContent(mergeTemplate(nextTemplate.content, fields))
      setNotice('Template cambiato e anteprima rigenerata.')
    }
  }

  async function importTemplate(file: File | null) {
    if (!file) return

    const content = await file.text()
    const imported: TemplateItem = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^.]+$/, ''),
      description: 'Template importato da file.',
      content,
    }

    setCustomTemplate(imported)
    setSelectedTemplateId(imported.id)

    if (Object.keys(fields).length > 0) {
      setReviewContent(mergeTemplate(imported.content, fields))
    }

    setNotice(`Template importato: ${file.name}`)
  }

  async function copyReview() {
    if (!reviewContent) return

    try {
      await navigator.clipboard.writeText(reviewContent)
      setNotice('Documento copiato.')
    } catch {
      setNotice('Copia non riuscita: seleziona il testo e copialo manualmente.')
    }
  }

  function downloadTxt() {
    if (!reviewContent) return

    const ref = clean(fields.immobile_riferimento, 'immobile')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const blob = new Blob([reviewContent], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${ref}-${selectedTemplate.id}.txt`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  function saveDraftLocal() {
    if (!selectedPropertyId || !reviewContent) {
      setNotice('Seleziona un immobile e genera un contenuto prima di salvare la bozza.')
      return
    }

    const key = `aios-module-draft:${selectedPropertyId}:${selectedTemplate.id}`

    localStorage.setItem(
      key,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        fields,
        content: reviewContent,
        templateId: selectedTemplate.id,
        templateTitle: selectedTemplate.title,
      }),
    )

    setNotice('Bozza salvata localmente su questo browser.')
  }

  function loadDraftLocal() {
    if (!selectedPropertyId) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    const key = `aios-module-draft:${selectedPropertyId}:${selectedTemplate.id}`
    const raw = localStorage.getItem(key)

    if (!raw) {
      setNotice('Nessuna bozza locale trovata per questo immobile/template.')
      return
    }

    try {
      const draft = JSON.parse(raw)
      setFields(draft.fields ?? fields)
      setReviewContent(draft.content ?? '')
      setNotice('Bozza locale caricata.')
    } catch {
      setNotice('Bozza locale non leggibile.')
    }
  }

  async function createPdf() {
    if (!reviewContent) {
      setNotice('Nessun documento da convertire in PDF.')
      return
    }

    setPdfGenerating(true)
    setNotice('Creo PDF...')

    try {
      const ref = clean(fields.immobile_riferimento, 'immobile')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const response = await fetch('/api/admin/ai-os/tools/document-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedTemplate.title,
          content: reviewContent,
          filename: `${ref}-${selectedTemplate.id}`,
        }),
      })

      const blob = await response.blob()

      if (!response.ok) {
        const text = await blob.text().catch(() => '')
        throw new Error(text || 'Errore generazione PDF')
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${ref}-${selectedTemplate.id}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setNotice('PDF generato.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore generazione PDF')
    } finally {
      setPdfGenerating(false)
    }
  }

  useEffect(() => {
    void loadFolders()

    const params = new URLSearchParams(window.location.search)
    const propertyId = params.get('propertyId')

    if (propertyId) {
      void loadProperty(propertyId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fieldEntries = Object.entries(fields)

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS / Strumenti
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Moduli compilabili
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Acquisisci dati da immobile, proprietari, documenti e checklist. Modifica i campi, revisiona il testo finale e genera il PDF solo alla fine.
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
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-sm font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18"
            >
              Importa template
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.html"
              className="hidden"
              onChange={(event) => void importTemplate(event.target.files?.[0] ?? null)}
            />
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
                    setFields({})
                    setReviewContent('')
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
                setFields({})
                setReviewContent('')
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

            {loadingFolders ? (
              <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 px-4 py-3 text-sm text-[#D1D5DB]/62">
                Caricamento immobili...
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[330px_minmax(0,430px)_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Template
            </p>

            <div className="mt-4 grid gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handleTemplateChange(template.id)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selectedTemplateId === template.id
                      ? 'border-[#A3BE8C]/55 bg-[#A3BE8C]/12'
                      : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
                  }`}
                >
                  <p className="text-sm font-black text-white">{template.title}</p>
                  <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/55">{template.description}</p>
                </button>
              ))}
            </div>
          </aside>

          <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                  Dati acquisiti
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  Campi modificabili
                </h2>
              </div>

              <button
                type="button"
                disabled={!propertyData}
                onClick={() => {
                  const nextFields = buildInitialFields(propertyData)
                  setFields(nextFields)
                  regenerateContent(nextFields)
                }}
                className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
              >
                Riacquisisci dati
              </button>
            </div>

            {loadingProperty ? (
              <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
                Caricamento dati immobile...
              </div>
            ) : null}

            {fieldEntries.length > 0 ? (
              <div className="max-h-[820px] space-y-3 overflow-y-auto pr-1">
                {fieldEntries.map(([key, value]) => {
                  const isLong = key === 'immobile_descrizione' || key === 'documenti_proprietario' || key === 'checklist' || key === 'note_interne'

                  return (
                    <label key={key} className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-[0.16em] text-[#D1D5DB]/48">
                        {fieldLabel(key)}
                      </span>

                      {isLong ? (
                        <textarea
                          value={value}
                          onChange={(event) => updateField(key, event.target.value)}
                          className="min-h-[118px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-[#8FBCBB]/55"
                        />
                      ) : (
                        <input
                          value={value}
                          onChange={(event) => updateField(key, event.target.value)}
                          className="w-full rounded-2xl border border-[#374151] bg-[#0B1220] px-4 py-3 text-sm text-white outline-none transition focus:border-[#8FBCBB]/55"
                        />
                      )}
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
                Seleziona un immobile per acquisire automaticamente i dati.
              </div>
            )}
          </section>

          <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                  Revisione finale
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {selectedTemplate.title}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!Object.keys(fields).length}
                  onClick={() => regenerateContent()}
                  className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
                >
                  Rigenera anteprima
                </button>

                <button
                  type="button"
                  disabled={!reviewContent}
                  onClick={copyReview}
                  className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:opacity-40"
                >
                  Copia
                </button>

                <button
                  type="button"
                  disabled={!reviewContent}
                  onClick={downloadTxt}
                  className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:opacity-40"
                >
                  Scarica TXT
                </button>

                <button
                  type="button"
                  disabled={!reviewContent}
                  onClick={saveDraftLocal}
                  className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-xs font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:opacity-40"
                >
                  Salva bozza
                </button>

                <button
                  type="button"
                  disabled={!selectedPropertyId}
                  onClick={loadDraftLocal}
                  className="rounded-full border border-[#B48EAD]/35 bg-[#B48EAD]/10 px-4 py-2 text-xs font-bold text-[#F2D5F7] transition hover:bg-[#B48EAD]/18 disabled:opacity-40"
                >
                  Carica bozza
                </button>

                <button
                  type="button"
                  disabled={!reviewContent || pdfGenerating}
                  onClick={() => void createPdf()}
                  className="rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 px-4 py-2 text-xs font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-40"
                >
                  {pdfGenerating ? 'Creo PDF...' : 'Crea PDF'}
                </button>
              </div>
            </div>

            <textarea
              value={reviewContent}
              onChange={(event) => setReviewContent(event.target.value)}
              className="min-h-[820px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] p-5 font-mono text-sm leading-6 text-[#E5E7EB] outline-none"
              placeholder="Seleziona un immobile, controlla i campi e rigenera l’anteprima..."
            />
          </section>
        </section>
      </div>
    </main>
  )
}
