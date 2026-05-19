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

type SocialOutput = {
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

  if (!Number.isFinite(amount) || amount <= 0) return 'prezzo su richiesta'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatContract(value: unknown) {
  const contract = normalize(value)
  if (contract === 'vendita') return 'in vendita'
  if (contract === 'affitto') return 'in affitto'
  return clean(value, 'disponibile')
}

function propertyLocation(property: Record<string, any>) {
  return [
    property.address,
    property.frazione,
    property.comune || property.city,
    property.province,
  ].filter(Boolean).join(', ') || clean(property.comune || property.city, 'zona riservata')
}

function propertyShortLocation(property: Record<string, any>) {
  return [
    property.comune || property.city,
    property.province,
  ].filter(Boolean).join(' · ') || 'zona riservata'
}

function propertyFeatures(property: Record<string, any>) {
  const parts = [
    property.surface ? `${property.surface} mq` : '',
    property.rooms ? `${property.rooms} locali` : '',
    property.bathrooms ? `${property.bathrooms} bagni` : '',
    property.floor ? `piano ${property.floor}` : '',
    property.energy_class ? `classe ${property.energy_class}` : '',
  ].filter(Boolean)

  const plus = [
    property.has_garage ? 'garage' : '',
    property.has_parking ? 'posto auto' : '',
    property.has_garden ? 'giardino' : '',
    property.has_elevator ? 'ascensore' : '',
  ].filter(Boolean)

  return [...parts, ...plus].join(' · ') || 'caratteristiche da verificare'
}

function buildSocialOutputs(data: ToolPropertyData | null): SocialOutput[] {
  if (!data?.property) return []

  const property = data.property
  const title = clean(property.title, 'Immobile selezionato')
  const ref = clean(property.reference_code, 'Rif. non indicato')
  const price = formatCurrency(property.price)
  const contract = formatContract(property.contract_type)
  const type = clean(property.property_type, 'immobile')
  const location = propertyLocation(property)
  const shortLocation = propertyShortLocation(property)
  const features = propertyFeatures(property)
  const description = clean(property.description, '')
  const url = property.slug ? `https://www.areaimmobiliare.com/immobili/${property.slug}` : ''
  const hashtagsBase = [
    '#AreaImmobiliare',
    '#Immobili',
    property.contract_type === 'vendita' ? '#CasaInVendita' : '#CasaInAffitto',
    property.comune ? `#${String(property.comune).replace(/\s+/g, '')}` : '',
    property.property_type ? `#${String(property.property_type).replace(/\s+/g, '')}` : '',
  ].filter(Boolean).join(' ')

  return [
    {
      id: 'facebook',
      title: 'Post Facebook',
      description: 'Testo completo, chiaro e commerciale per pagina Facebook.',
      content: [
        `🏠 ${title}`,
        '',
        `${type} ${contract} a ${shortLocation}.`,
        '',
        `📍 Zona: ${location}`,
        `📐 Caratteristiche: ${features}`,
        `💰 Prezzo: ${price}`,
        `🔎 Riferimento: ${ref}`,
        '',
        description
          ? description.slice(0, 620)
          : 'Soluzione interessante per chi cerca un immobile ben posizionato e pronto da valutare con attenzione.',
        '',
        'Vuoi ricevere maggiori informazioni o fissare una visita?',
        'Contattaci e ti accompagniamo nella valutazione.',
        '',
        url ? `Scheda immobile: ${url}` : '',
        '',
        hashtagsBase,
      ].filter(Boolean).join('\n'),
    },
    {
      id: 'instagram',
      title: 'Caption Instagram',
      description: 'Caption più compatta, adatta a carosello o reel.',
      content: [
        `✨ ${title}`,
        '',
        `${type} ${contract} a ${shortLocation}`,
        `${features}`,
        '',
        `Prezzo: ${price}`,
        `Rif. ${ref}`,
        '',
        'Scrivici per info o per organizzare una visita.',
        '',
        hashtagsBase,
      ].join('\n'),
    },
    {
      id: 'tiktok',
      title: 'Testo TikTok / Reel',
      description: 'Caption e idea breve per video verticale.',
      content: [
        `Hai visto questo ${type} ${contract} a ${shortLocation}?`,
        '',
        `📍 ${location}`,
        `📐 ${features}`,
        `💰 ${price}`,
        '',
        'Guarda le immagini, salva il video e contattaci se vuoi maggiori informazioni.',
        '',
        `Rif. ${ref}`,
        '',
        hashtagsBase,
      ].join('\n'),
    },
    {
      id: 'voice-script',
      title: 'Script voce breve',
      description: 'Testo breve per ElevenLabs, voiceover o video social.',
      content: [
        `Oggi ti presentiamo ${title}.`,
        `${type} ${contract} a ${shortLocation}, con ${features}.`,
        `Il prezzo è ${price}.`,
        'Una soluzione da valutare se cerchi una casa in questa zona.',
        'Per informazioni o visite, contatta Area Immobiliare.',
        `Riferimento annuncio: ${ref}.`,
      ].join(' '),
    },
    {
      id: 'whatsapp',
      title: 'Messaggio WhatsApp',
      description: 'Messaggio rapido da inviare a cliente interessato.',
      content: [
        `Buongiorno, le invio il riepilogo dell’immobile ${ref}.`,
        '',
        `${title}`,
        `${type} ${contract} a ${shortLocation}`,
        `${features}`,
        `Prezzo: ${price}`,
        '',
        url ? `Scheda: ${url}` : '',
        '',
        'Se vuole, possiamo fissare una visita o approfondire i dettagli.',
      ].filter(Boolean).join('\n'),
    },
    {
      id: 'portals',
      title: 'Descrizione portali',
      description: 'Base descrittiva più pulita per portali immobiliari.',
      content: [
        `${title}`,
        '',
        `Proponiamo ${type} ${contract} a ${shortLocation}.`,
        '',
        `L’immobile si trova in ${location} e presenta le seguenti caratteristiche: ${features}.`,
        '',
        description
          ? description
          : 'La soluzione è adatta a chi cerca un immobile funzionale, ben collocato e con caratteristiche interessanti per il mercato di riferimento.',
        '',
        `Prezzo: ${price}.`,
        `Riferimento: ${ref}.`,
        '',
        'Per maggiori informazioni o per fissare una visita, contattare Area Immobiliare.',
      ].join('\n'),
    },
  ]
}

export default function AIOSSocialPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loadingFolders, setLoadingFolders] = useState(true)
  const [loadingProperty, setLoadingProperty] = useState(false)
  const [propertyData, setPropertyData] = useState<ToolPropertyData | null>(null)
  const [selectedOutputId, setSelectedOutputId] = useState('facebook')
  const [notice, setNotice] = useState('')

  const outputs = useMemo(() => buildSocialOutputs(propertyData), [propertyData])
  const selectedOutput = outputs.find((item) => item.id === selectedOutputId) ?? outputs[0] ?? null

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
      setSelectedOutputId('facebook')
    } catch (error) {
      setPropertyData(null)
      setNotice(error instanceof Error ? error.message : 'Errore caricamento dati immobile')
    } finally {
      setLoadingProperty(false)
    }
  }

  async function copyOutput() {
    if (!selectedOutput?.content) return

    try {
      await navigator.clipboard.writeText(selectedOutput.content)
      setNotice(`Testo copiato: ${selectedOutput.title}`)
    } catch {
      setNotice('Copia non riuscita: seleziona il testo e copialo manualmente.')
    }
  }

  function downloadTxt() {
    if (!selectedOutput?.content || !propertyData?.property) return

    const ref = clean(propertyData.property.reference_code, 'immobile')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const blob = new Blob([selectedOutput.content], {
      type: 'text/plain;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${ref}-${selectedOutput.id}.txt`
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
            Social / Vetrina immobile
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Genera testi per Facebook, Instagram, TikTok, WhatsApp, portali e voce breve partendo dai dati immobile.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/ai-os/strumenti'}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
            >
              Torna a Strumenti
            </button>

            {propertyData?.property?.id ? (
              <button
                type="button"
                onClick={() => window.location.href = `/admin/immobili/${propertyData.property.id}/scheda-social`}
                className="rounded-full border border-[#EBCB8B]/35 bg-[#EBCB8B]/10 px-4 py-2 text-sm font-bold text-[#EBCB8B] transition hover:bg-[#EBCB8B]/18"
              >
                Apri scheda grafica
              </button>
            ) : null}
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
              Output
            </p>

            <div className="mt-4 grid gap-2">
              {outputs.length > 0 ? (
                outputs.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedOutputId(item.id)}
                    className={`rounded-2xl border p-4 text-left transition ${
                      selectedOutputId === item.id
                        ? 'border-[#A3BE8C]/55 bg-[#A3BE8C]/12'
                        : 'border-[#374151] bg-[#111827]/70 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    <p className="text-sm font-black text-white">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-[#D1D5DB]/55">{item.description}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 p-4 text-sm text-[#D1D5DB]/62">
                  {loadingProperty ? 'Caricamento dati immobile...' : 'Seleziona un immobile per generare i testi.'}
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
                  {selectedOutput?.title || 'Nessun testo'}
                </h2>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!selectedOutput}
                  onClick={copyOutput}
                  className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18 disabled:opacity-40"
                >
                  Copia
                </button>

                <button
                  type="button"
                  disabled={!selectedOutput}
                  onClick={downloadTxt}
                  className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:opacity-40"
                >
                  Scarica TXT
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={selectedOutput?.content || ''}
              className="min-h-[680px] w-full resize-y rounded-2xl border border-[#374151] bg-[#0B1220] p-5 font-mono text-sm leading-6 text-[#E5E7EB] outline-none"
              placeholder="Seleziona un immobile per generare i testi social..."
            />
          </section>
        </section>
      </div>
    </main>
  )
}
