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

type GeneratedDocument = {
  id: string
  title: string
  description: string
  content: string
}

function clean(value: unknown, fallback = '—') {
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function formatCurrency(value: unknown) {
  const amount = Number(value)

  if (!Number.isFinite(amount) || amount <= 0) return '—'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(value: unknown) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'short',
    }).format(new Date(String(value)))
  } catch {
    return String(value)
  }
}

function yesNo(value: unknown) {
  return value === true ? 'Sì' : 'No'
}

function buildTemplateVariables(data: ToolPropertyData | null, generatedAt: Date) {
  const property = data?.property ?? {}
  const owners = data?.owners ?? []
  const firstOwner = owners[0] ?? {}
  const ownerDocuments = data?.ownerDocuments ?? []
  const checklist = data?.checklist ?? []
  const subfolders = data?.driveSubfolders ?? []

  const today = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(generatedAt)

  const ownerDocumentsText = ownerDocuments.length > 0
    ? ownerDocuments.map((doc) => `- ${clean(doc.label)}: ${clean(doc.status, 'non verificato')}`).join('\n')
    : 'Documenti proprietario non ancora caricati in AI-OS.'

  const checklistText = checklist.length > 0
    ? checklist.map((item) => `- ${clean(item.label)}: ${clean(item.status, 'da fare')}`).join('\n')
    : 'Checklist non ancora compilata.'

  const driveFoldersText = subfolders.length > 0
    ? subfolders.map((folder) => `- ${clean(folder.folder_name)}: ${clean(folder.drive_folder_url)}`).join('\n')
    : 'Cartelle Drive non ancora preparate.'

  return {
    data_generazione: today,
    oggi: today,

    riferimento: clean(property.reference_code, ''),
    titolo: clean(property.title, ''),
    slug: clean(property.slug, ''),
    stato: clean(property.status, ''),
    descrizione: clean(property.description, ''),
    prezzo: formatCurrency(property.price),
    prezzo_numero: clean(property.price, ''),
    prezzo_precedente: formatCurrency(property.previous_price),

    contratto: clean(property.contract_type, ''),
    tipologia: clean(property.property_type, ''),
    condizione: clean(property.condition, ''),
    disponibilita: clean(property.availability, ''),

    indirizzo: clean(property.address, ''),
    comune: clean(property.comune || property.city, ''),
    provincia: clean(property.province, ''),
    frazione: clean(property.frazione, ''),
    zona: clean(property.area, ''),
    localizzazione: propertyLocation(property),

    superficie: clean(property.surface, ''),
    locali: clean(property.rooms, ''),
    bagni: clean(property.bathrooms, ''),
    piano: clean(property.floor, ''),
    piani_totali: clean(property.total_floors, ''),
    anno_costruzione: clean(property.year_built, ''),
    classe_energetica: clean(property.energy_class, ''),
    epgl: clean(property.energy_epgl, ''),
    riscaldamento: `${clean(property.heating_type, '')} ${clean(property.heating_source, '')}`.trim(),

    garage: yesNo(property.has_garage),
    posto_auto: yesNo(property.has_parking),
    giardino: yesNo(property.has_garden),
    ascensore: yesNo(property.has_elevator),
    asta: yesNo(property.is_auction),

    proprietario_nome: clean(firstOwner.full_name, ''),
    proprietario_email: clean(firstOwner.email, ''),
    proprietario_telefono: clean(firstOwner.phone, ''),
    proprietario_cf: clean(firstOwner.tax_code, ''),
    proprietari_elenco: owners.length > 0
      ? owners.map((owner, index) => `${index + 1}. ${clean(owner.full_name)} - ${clean(owner.email)} - ${clean(owner.phone)}`).join('\n')
      : 'Nessun proprietario registrato.',

    documenti_proprietario: ownerDocumentsText,
    checklist: checklistText,
    cartelle_drive: driveFoldersText,
    link_drive_immobile: clean(data?.driveFolder?.drive_folder_url, ''),
  } satisfies Record<string, string>
}

function applyTemplateVariables(template: string, variables: Record<string, string>) {
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key) => {
    return variables[String(key)] ?? `{{${key}}}`
  })
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function propertyLocation(property: Record<string, any>) {
  return [
    property.address,
    property.frazione,
    property.comune || property.city,
    property.province,
  ].filter(Boolean).join(', ') || '—'
}

function propertyHeadline(property: Record<string, any>) {
  return `${clean(property.reference_code, 'Senza rif.')} - ${clean(property.title, 'Immobile senza titolo')}`
}

function buildDocuments(data: ToolPropertyData | null, generatedAt: Date): GeneratedDocument[] {
  if (!data?.property) return []

  const property = data.property
  const owners = data.owners ?? []
  const ownerDocuments = data.ownerDocuments ?? []
  const checklist = data.checklist ?? []
  const subfolders = data.driveSubfolders ?? []
  const today = new Intl.DateTimeFormat('it-IT', { dateStyle: 'long' }).format(generatedAt)

  const ownersBlock = owners.length > 0
    ? owners.map((owner, index) => [
        `Proprietario ${index + 1}`,
        `Nome: ${clean(owner.full_name)}`,
        `Ruolo: ${clean(owner.role)}`,
        `Tipo: ${clean(owner.owner_type)}`,
        `Email: ${clean(owner.email)}`,
        `Telefono: ${clean(owner.phone)}`,
        `Codice fiscale / P.IVA: ${clean(owner.tax_code)}`,
      ].join('\n')).join('\n\n')
    : 'Nessun proprietario ancora registrato in AI-OS.'

  const docsBlock = ownerDocuments.length > 0
    ? ownerDocuments.map((doc) => `- ${clean(doc.label)}: ${clean(doc.status, 'non verificato')}`).join('\n')
    : [
        '- Documento identità proprietario',
        '- Codice fiscale proprietario',
        '- Atto di provenienza',
        '- Visura catastale aggiornata',
        '- Planimetria catastale',
        '- APE / certificazione energetica',
        '- Regolamento condominiale se presente',
        '- Ultime spese condominiali se presenti',
      ].join('\n')

  const checklistBlock = checklist.length > 0
    ? checklist.map((item) => `- ${clean(item.label)}: ${clean(item.status, 'da fare')}`).join('\n')
    : [
        '- Dati proprietario verificati',
        '- Dati immobile completi',
        '- Documenti minimi ricevuti',
        '- Foto / video caricati',
        '- Descrizione commerciale pronta',
        '- Prezzo e condizioni verificati',
      ].join('\n')

  const driveBlock = subfolders.length > 0
    ? subfolders.map((folder) => `- ${clean(folder.folder_name)}: ${clean(folder.drive_folder_url)}`).join('\n')
    : 'Sottocartelle Drive non ancora lette o non preparate.'

  const propertyBlock = [
    `Riferimento: ${clean(property.reference_code)}`,
    `Titolo: ${clean(property.title)}`,
    `Contratto: ${clean(property.contract_type)}`,
    `Tipologia: ${clean(property.property_type)}`,
    `Stato annuncio: ${clean(property.status)}`,
    `Prezzo: ${formatCurrency(property.price)}`,
    `Indirizzo/Zona: ${propertyLocation(property)}`,
    `Superficie: ${clean(property.surface)} mq`,
    `Locali: ${clean(property.rooms)}`,
    `Bagni: ${clean(property.bathrooms)}`,
    `Piano: ${clean(property.floor)}/${clean(property.total_floors)}`,
    `Anno costruzione: ${clean(property.year_built)}`,
    `Condizione: ${clean(property.condition)}`,
    `Disponibilità: ${clean(property.availability)}`,
    `Classe energetica: ${clean(property.energy_class)}`,
    `EPgl: ${clean(property.energy_epgl)}`,
    `Riscaldamento: ${clean(property.heating_type)} - ${clean(property.heating_source)}`,
    `Spese condominiali: ${formatCurrency(property.condo_fees_amount)} ${clean(property.condo_fees_period, '')}`,
    `Garage: ${yesNo(property.has_garage)}`,
    `Posto auto: ${yesNo(property.has_parking)}`,
    `Giardino: ${yesNo(property.has_garden)}`,
    `Ascensore: ${yesNo(property.has_elevator)}`,
    `Asta: ${yesNo(property.is_auction)}`,
  ].join('\n')

  return [
    {
      id: 'mandato-bozza',
      title: 'Mandato / incarico - bozza',
      description: 'Bozza operativa con dati immobile e proprietari da usare come base.',
      content: [
        'MANDATO / INCARICO DI MEDIAZIONE IMMOBILIARE - BOZZA OPERATIVA',
        '',
        `Data generazione: ${today}`,
        '',
        'AGENZIA',
        'Area Immobiliare',
        '',
        'IMMOBILE',
        propertyBlock,
        '',
        'PROPRIETARI / REFERENTI',
        ownersBlock,
        '',
        'CONDIZIONI ECONOMICHE DA COMPLETARE',
        `Prezzo richiesto: ${formatCurrency(property.price)}`,
        'Provvigione agenzia: ______________________________',
        'Durata incarico: ______________________________',
        'Esclusiva: ☐ Sì ☐ No',
        'Note particolari: ______________________________',
        '',
        'DOCUMENTI DA ALLEGARE / VERIFICARE',
        docsBlock,
        '',
        'FIRME',
        'Proprietario/i: ______________________________',
        'Agenzia: ______________________________',
        '',
        'NOTE',
        'Documento generato da AI-OS come bozza operativa. Prima dell’utilizzo reale verificare sempre dati, clausole e condizioni contrattuali.',
      ].join('\n'),
    },
    {
      id: 'raccolta-dati-proprietario',
      title: 'Scheda raccolta dati proprietario',
      description: 'Scheda da usare al telefono o in appuntamento per completare dati e documenti.',
      content: [
        'SCHEDA RACCOLTA DATI PROPRIETARIO',
        '',
        `Data generazione: ${today}`,
        '',
        'IMMOBILE',
        propertyBlock,
        '',
        'DATI PROPRIETARIO / REFERENTE',
        ownersBlock,
        '',
        'DATI DA COMPLETARE',
        'Residenza: ______________________________',
        'Documento identità: ______________________________',
        'Scadenza documento: ______________________________',
        'IBAN per eventuali accordi: ______________________________',
        'Regime fiscale / note: ______________________________',
        '',
        'DOCUMENTI RICHIESTI',
        docsBlock,
        '',
        'CARTELLE DRIVE DISPONIBILI',
        driveBlock,
        '',
        'NOTE OPERATORE',
        '____________________________________________________________',
        '____________________________________________________________',
        '____________________________________________________________',
      ].join('\n'),
    },
    {
      id: 'checklist-documenti',
      title: 'Checklist documenti',
      description: 'Controllo documentale iniziale per capire cosa manca.',
      content: [
        'CHECKLIST DOCUMENTI IMMOBILE',
        '',
        `Data generazione: ${today}`,
        '',
        'IMMOBILE',
        propertyHeadline(property),
        propertyLocation(property),
        '',
        'CHECKLIST AI-OS',
        checklistBlock,
        '',
        'DOCUMENTI PROPRIETARIO',
        docsBlock,
        '',
        'CARTELLE DRIVE',
        driveBlock,
        '',
        'ESITO CONTROLLO',
        '☐ Completo',
        '☐ Mancano documenti',
        '☐ Da verificare con proprietario',
        '☐ Da verificare con tecnico',
        '',
        'NOTE',
        '____________________________________________________________',
        '____________________________________________________________',
      ].join('\n'),
    },
    {
      id: 'scheda-interna',
      title: 'Scheda interna agenzia',
      description: 'Riepilogo rapido per segreteria, agente e appuntamenti.',
      content: [
        'SCHEDA INTERNA AGENZIA',
        '',
        `Data generazione: ${today}`,
        '',
        'DATI IMMOBILE',
        propertyBlock,
        '',
        'DESCRIZIONE ATTUALE',
        clean(property.description, 'Descrizione non ancora inserita.'),
        '',
        'PROPRIETARI / REFERENTI',
        ownersBlock,
        '',
        'STATO OPERATIVO',
        checklistBlock,
        '',
        'DRIVE',
        `Cartella immobile: ${clean(data.driveFolder?.drive_folder_url)}`,
        driveBlock,
        '',
        'AZIONI CONSIGLIATE',
        '- Verificare dati proprietario',
        '- Verificare documenti obbligatori',
        '- Controllare foto/video e planimetrie',
        '- Preparare descrizione commerciale',
        '- Valutare pubblicazione portali/social',
      ].join('\n'),
    },
    {
      id: 'email-richiesta-documenti',
      title: 'Email richiesta documenti',
      description: 'Testo pronto per richiedere i documenti mancanti al proprietario.',
      content: [
        `Oggetto: Documenti necessari per ${propertyHeadline(property)}`,
        '',
        'Buongiorno,',
        '',
        `per completare la pratica relativa all’immobile ${propertyHeadline(property)}, avremmo bisogno dei seguenti documenti:`,
        '',
        docsBlock,
        '',
        'Può inviarli rispondendo a questa email oppure caricandoli nella cartella condivisa che le verrà indicata.',
        '',
        'Rimaniamo a disposizione per qualsiasi chiarimento.',
        '',
        'Cordiali saluti,',
        'Area Immobiliare',
      ].join('\n'),
    },
  ]
}

export default function AIOSDocumentiPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [propertyData, setPropertyData] = useState<ToolPropertyData | null>(null)
  const [selectedDocId, setSelectedDocId] = useState('mandato-bozza')
  const [notice, setNotice] = useState('')
  const [generatedAt, setGeneratedAt] = useState(() => new Date())
  const [templateName, setTemplateName] = useState('')
  const [templateContent, setTemplateContent] = useState('')
  const [pdfGenerating, setPdfGenerating] = useState(false)

  const documents = useMemo(() => buildDocuments(propertyData, generatedAt), [generatedAt, propertyData])
  const selectedDocument = documents.find((doc) => doc.id === selectedDocId) ?? documents[0] ?? null
  const templateVariables = useMemo(() => buildTemplateVariables(propertyData, generatedAt), [generatedAt, propertyData])
  const currentDocumentContent = useMemo(() => {
    if (templateContent) {
      return applyTemplateVariables(templateContent, templateVariables)
    }

    return selectedDocument?.content || ''
  }, [selectedDocument, templateContent, templateVariables])
  const currentDocumentTitle = templateContent
    ? `Template importato: ${templateName || 'modello'}`
    : selectedDocument?.title || 'Nessun documento'

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

      setPropertyData({
        property: payload.property,
        owners: Array.isArray(payload.owners) ? payload.owners : [],
        ownerDocuments: Array.isArray(payload.ownerDocuments) ? payload.ownerDocuments : [],
        checklist: Array.isArray(payload.checklist) ? payload.checklist : [],
        driveFolder: payload.driveFolder ?? null,
        driveSubfolders: Array.isArray(payload.driveSubfolders) ? payload.driveSubfolders : [],
      })
      setGeneratedAt(new Date())
      setTemplateName('')
      setTemplateContent('')
      setSelectedDocId('mandato-bozza')
    } catch (error) {
      setPropertyData(null)
      setNotice(error instanceof Error ? error.message : 'Errore caricamento dati immobile')
    } finally {
      setLoadingProperty(false)
    }
  }

  async function copyDocument() {
    if (!currentDocumentContent) return

    try {
      await navigator.clipboard.writeText(currentDocumentContent)
      setNotice(`Testo copiato: ${currentDocumentTitle}`)
    } catch {
      setNotice('Copia non riuscita: seleziona il testo e copialo manualmente.')
    }
  }

  function downloadDocument() {
    if (!currentDocumentContent || !propertyData?.property) return

    const ref = clean(propertyData.property.reference_code, 'immobile')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const blob = new Blob([currentDocumentContent], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const docId = templateContent
      ? (templateName || 'template').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : selectedDocument?.id || 'documento'

    link.download = `${ref}-${docId}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  function updateGeneratedDateToToday() {
    setGeneratedAt(new Date())
    setNotice('Data documento aggiornata ad oggi.')
  }

  function importTemplatePlaceholder() {
    if (!propertyData?.property) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.txt,.html,.htm,.md,text/plain,text/html,text/markdown'

    input.onchange = async () => {
      const file = input.files?.[0]

      if (!file) return

      try {
        const content = await file.text()
        setTemplateName(file.name)
        setTemplateContent(content)
        setNotice(`Template importato: ${file.name}. I placeholder {{titolo}}, {{prezzo}}, {{proprietario_nome}} ecc. sono stati compilati dove presenti.`)
      } catch {
        setNotice('Errore lettura template.')
      }
    }

    input.click()
  }

  async function createPdfPlaceholder() {
    if (!currentDocumentContent) {
      setNotice('Nessun documento da convertire in PDF.')
      return
    }

    setPdfGenerating(true)
    setNotice('Creo PDF...')

    try {
      const ref = clean(propertyData?.property?.reference_code, 'immobile')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const docId = templateContent
        ? (templateName || 'template').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : selectedDocument?.id || 'documento'

      const response = await fetch('/api/admin/ai-os/tools/document-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentDocumentTitle,
          content: currentDocumentContent,
          filename: `${ref}-${docId}`,
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
      link.download = `${ref}-${docId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)

      setNotice(`PDF creato: ${ref}-${docId}.pdf`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore generazione PDF')
    } finally {
      setPdfGenerating(false)
    }
  }

  function printDocument() {
    if (!currentDocumentContent) return

    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return

    win.document.write(`
      <html>
        <head>
          <title>${escapeHtml(currentDocumentTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111; }
            h1 { font-size: 22px; margin-bottom: 20px; }
            pre { white-space: pre-wrap; font-size: 13px; line-height: 1.55; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(currentDocumentTitle)}</h1>
          <pre>${escapeHtml(currentDocumentContent)}</pre>
        </body>
      </html>
    `)

    win.document.close()
    win.focus()
    win.print()
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
            Genera documenti immobile
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Genera bozze operative da dati immobile, proprietari, checklist e Drive.
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
              onClick={() => window.location.href = '/admin/ai-os'}
              className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18"
            >
              Torna ad AI-OS
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

        <section className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Documenti
            </p>

            <div className="mt-4 grid gap-2">
              {documents.length > 0 ? (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    type="button"
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedDocId === doc.id
                        ? 'border-[#A3BE8C]/55 bg-[#A3BE8C]/12'
                        : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    <p className="text-sm font-black text-white">{doc.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/55">{doc.description}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
                  {loadingProperty ? 'Caricamento dati immobile...' : 'Seleziona un immobile per generare i documenti.'}
                </div>
              )}
            </div>
          </aside>

          <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                  Anteprima
                </p>
                <h2 className="mt-1 text-xl font-black text-white">
                  {currentDocumentTitle}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!currentDocumentContent}
                  onClick={updateGeneratedDateToToday}
                  className="rounded-full border border-[#B48EAD]/35 bg-[#B48EAD]/10 px-4 py-2 text-xs font-bold text-[#E5E9F0] transition hover:bg-[#B48EAD]/18 disabled:opacity-40"
                >
                  Aggiorna ad oggi
                </button>

                <button
                  type="button"
                  disabled={!currentDocumentContent}
                  onClick={copyDocument}
                  className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
                >
                  Copia
                </button>

                <button
                  type="button"
                  disabled={!currentDocumentContent}
                  onClick={downloadDocument}
                  className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:opacity-40"
                >
                  Scarica TXT
                </button>

                <button
                  type="button"
                  disabled={!currentDocumentContent}
                  onClick={printDocument}
                  className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-xs font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18 disabled:opacity-40"
                >
                  Stampa
                </button>

                <button
                  type="button"
                  disabled={!currentDocumentContent}
                  onClick={importTemplatePlaceholder}
                  className="rounded-full border border-[#88C0D0]/35 bg-[#88C0D0]/10 px-4 py-2 text-xs font-bold text-[#88C0D0] transition hover:bg-[#88C0D0]/18 disabled:opacity-40"
                >
                  Importa template
                </button>

                <button
                  type="button"
                  disabled={!currentDocumentContent || pdfGenerating}
                  onClick={() => void createPdfPlaceholder()}
                  className="rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 px-4 py-2 text-xs font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/18 disabled:cursor-wait disabled:opacity-40"
                >
                  {pdfGenerating ? 'Creo PDF...' : 'Crea PDF'}
                </button>
              </div>
            </div>

            {templateContent ? (
              <div className="mb-4 rounded-2xl border border-[#88C0D0]/25 bg-[#88C0D0]/10 px-4 py-3 text-xs leading-5 text-[#D8DEE9]/70">
                <span className="font-black text-[#88C0D0]">Template attivo:</span> {templateName}. 
                <span>
                  Placeholder disponibili: {'{{titolo}}, {{riferimento}}, {{prezzo}}, {{contratto}}, {{tipologia}}, {{indirizzo}}, {{comune}}, {{proprietario_nome}}, {{proprietario_email}}, {{documenti_proprietario}}, {{checklist}}, {{cartelle_drive}}'}.
                </span>
              </div>
            ) : null}

            <textarea
              readOnly
              value={currentDocumentContent}
              className="min-h-[680px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] p-5 font-mono text-sm leading-6 text-[#E5E7EB] outline-none"
              placeholder="Seleziona un immobile per vedere la bozza..."
            />
          </section>
        </section>
      </div>
    </main>
  )
}
