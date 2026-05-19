'use client'

import { useEffect, useMemo, useState } from 'react'

type WorkspaceFolder = {
  id: string
  name: string
  propertyRef?: string | null
  address?: string | null
  contractType?: string | null
  driveFolder?: {
    drive_folder_id?: string | null
    sync_status?: string | null
  } | null
}

type ToolCard = {
  id: string
  title: string
  badge: string
  description: string
  icon: string
  status: 'ready' | 'next'
  actionLabel: string
  href?: string
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function badgeClass(status: ToolCard['status']) {
  if (status === 'ready') return 'border-[#A3BE8C]/35 bg-[#A3BE8C]/10 text-[#A3BE8C]'
  return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/10 text-[#EBCB8B]'
}

export default function AIOSStrumentiPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const selectedProperty = useMemo(() => {
    return folders.find((folder) => folder.id === selectedPropertyId) ?? null
  }, [folders, selectedPropertyId])

  const filteredFolders = useMemo(() => {
    const q = normalize(query)

    return folders.filter((folder) => {
      const contractType = normalize(folder.contractType)

      if (contractFilter !== 'all' && contractType !== contractFilter) {
        return false
      }

      if (q.length < 3 && contractFilter === 'all') {
        return false
      }

      if (q.length < 3) {
        return true
      }

      const haystack = [
        folder.name,
        folder.propertyRef,
        folder.address,
        folder.contractType,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(q)
    })
  }, [contractFilter, folders, query])

  const tools = useMemo<ToolCard[]>(() => {
    const propertyId = selectedProperty?.id || ''

    return [
      {
        id: 'property-edit',
        title: 'Scheda immobile',
        badge: 'Operativo',
        description: 'Apri modifica immobile, dati principali, prezzo, descrizione, stato e pubblicazione.',
        icon: '🏠',
        status: propertyId ? 'ready' : 'next',
        actionLabel: propertyId ? 'Apri scheda' : 'Seleziona immobile',
        href: propertyId ? `/admin/immobili/${propertyId}` : undefined,
      },
      {
        id: 'drive-share',
        title: 'Condivisioni Drive',
        badge: 'Operativo',
        description: 'Condividi Bozze Immagini e Video, Documenti Proprietario o altre cartelle precise.',
        icon: '☁️',
        status: 'ready',
        actionLabel: 'Apri condivisioni',
        href: '/admin/ai-os/condivisioni',
      },
      {
        id: 'lead-note',
        title: 'Nota rapida immobile',
        badge: 'Operativo',
        description: 'Apri la nota collegata all’immobile e il contesto utile per telefonate, clienti e follow-up.',
        icon: '📝',
        status: propertyId ? 'ready' : 'next',
        actionLabel: propertyId ? 'Apri nota' : 'Seleziona immobile',
        href: propertyId ? `/admin/immobili/${propertyId}/apri-nota` : undefined,
      },
      {
        id: 'social-card',
        title: 'Social / vetrina',
        badge: 'Operativo',
        description: 'Genera materiale social e scheda grafica dell’immobile già collegata ai dati e alle immagini.',
        icon: '📣',
        status: propertyId ? 'ready' : 'next',
        actionLabel: propertyId ? 'Apri social' : 'Seleziona immobile',
        href: propertyId ? `/admin/immobili/${propertyId}/scheda-social` : undefined,
      },
      {
        id: 'documents',
        title: 'Genera documenti',
        badge: 'Operativo',
        description: 'Mandato, incarico, scheda raccolta dati proprietario, checklist documentale e testi pronti.',
        icon: '📄',
        status: propertyId ? 'ready' : 'next',
        actionLabel: propertyId ? 'Apri documenti' : 'Seleziona immobile',
        href: propertyId ? `/admin/ai-os/strumenti/documenti?propertyId=${propertyId}` : undefined,
      },
      {
        id: 'visure',
        title: 'Visure e richieste',
        badge: 'Prossimo step',
        description: 'Workflow guidato per richieste catastali, documenti proprietario e controllo materiale ricevuto.',
        icon: '🔎',
        status: 'next',
        actionLabel: 'In sviluppo',
      },
    ]
  }, [selectedProperty])

  async function loadFolders() {
    setLoading(true)
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/workspace/immobili', {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento immobili')
      }

      setFolders(Array.isArray(payload?.folders) ? payload.folders : [])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento immobili')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFolders()
  }, [])

  function openTool(tool: ToolCard) {
    if (!tool.href) {
      setNotice('Seleziona prima un immobile oppure completa il prossimo step di sviluppo.')
      return
    }

    window.location.href = tool.href
  }

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Strumenti Agenzia
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            App operative collegate agli immobili: Drive, social, note, documenti, visure e workflow agenzia.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.href = '/admin/ai-os'}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
            >
              Torna ad AI-OS
            </button>

            <button
              type="button"
              onClick={() => void loadFolders()}
              className="rounded-full border border-[#A3BE8C]/40 bg-[#A3BE8C]/12 px-4 py-2 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
            >
              Aggiorna immobili
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold leading-6 text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        <section className="mb-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
          <div className="grid gap-4 lg:grid-cols-[420px_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Immobile di lavoro
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Seleziona immobile
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#D1D5DB]/62">
                Le app usano l’immobile selezionato per aprire schede, note, social e documenti.
              </p>
            </div>

            <div className="grid gap-3">
              <div className="grid grid-cols-3 gap-2">
                {(['all', 'vendita', 'affitto'] as const).map((filter) => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => {
                      setContractFilter(filter)
                      setSelectedPropertyId('')
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
                }}
                className="w-full rounded-2xl border border-[#8FBCBB]/45 bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#A3BE8C]/70"
                placeholder="Cerca da 3 caratteri per codice, titolo o indirizzo..."
              />

              {(query.trim().length >= 3 || contractFilter !== 'all') ? (
                <select
                  value={selectedPropertyId}
                  onChange={(event) => setSelectedPropertyId(event.target.value)}
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

              {selectedProperty ? (
                <div className="rounded-2xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 p-4">
                  <p className="text-sm font-black text-white">
                    {selectedProperty.propertyRef ? `${selectedProperty.propertyRef} - ` : ''}{selectedProperty.name}
                  </p>
                  <p className="mt-1 text-xs text-[#D1D5DB]/58">
                    {selectedProperty.address || 'Indirizzo non indicato'}
                  </p>
                </div>
              ) : null}

              {loading ? (
                <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 px-4 py-3 text-sm text-[#D1D5DB]/62">
                  Caricamento immobili...
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => openTool(tool)}
              className="group rounded-[28px] border border-[#374151] bg-[#1F2937]/84 p-5 text-left shadow-xl shadow-black/18 transition hover:-translate-y-0.5 hover:border-[#8FBCBB]/45 hover:bg-[#243244]"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#8FBCBB]/18 bg-[#111827] text-2xl shadow-inner">
                  {tool.icon}
                </span>

                <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${badgeClass(tool.status)}`}>
                  {tool.badge}
                </span>
              </div>

              <h3 className="mt-5 text-lg font-black text-white">
                {tool.title}
              </h3>

              <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#D1D5DB]/62">
                {tool.description}
              </p>

              <span className="mt-5 inline-flex rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-black text-[#8FBCBB] transition group-hover:bg-[#8FBCBB]/18">
                {tool.actionLabel}
              </span>
            </button>
          ))}
        </section>
      </div>
    </main>
  )
}
