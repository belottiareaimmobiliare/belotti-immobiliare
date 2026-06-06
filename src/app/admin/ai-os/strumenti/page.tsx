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

type OperationalCheck = {
  section_key: string
  is_ok: boolean
  checked_by?: string | null
  checked_at?: string | null
  notes?: string | null
  updated_at?: string | null
}

type ToolCard = {
  id: string
  title: string
  badge: string
  description: string
  icon: string
  status: 'ready' | 'waiting' | 'warning' | 'next'
  actionLabel: string
  href?: string
  autoChecks: string[]
}

function normalize(value: unknown) {
  return String(value ?? '').trim().toLowerCase()
}

function badgeClass(status: ToolCard['status']) {
  if (status === 'ready') return 'border-[#A3BE8C]/35 bg-[#A3BE8C]/10 text-[#A3BE8C]'
  if (status === 'warning') return 'border-[#D08770]/40 bg-[#D08770]/12 text-[#EBCB8B]'
  if (status === 'next') return 'border-[#EBCB8B]/35 bg-[#EBCB8B]/10 text-[#EBCB8B]'
  return 'border-[#64748B]/45 bg-[#64748B]/12 text-[#CBD5E1]'
}

function formatDateTime(value?: string | null) {
  if (!value) return ''

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function AIOSStrumentiPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [selectedPropertyId, setSelectedPropertyId] = useState('')
  const [query, setQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [loading, setLoading] = useState(true)
  const [checksLoading, setChecksLoading] = useState(false)
  const [savingCheckKey, setSavingCheckKey] = useState('')
  const [checks, setChecks] = useState<OperationalCheck[]>([])
  const [notice, setNotice] = useState('')

  const selectedProperty = useMemo(() => {
    return folders.find((folder) => folder.id === selectedPropertyId) ?? null
  }, [folders, selectedPropertyId])

  const checksBySection = useMemo(() => {
    return new Map(checks.map((check) => [check.section_key, check]))
  }, [checks])

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
    if (!selectedProperty) return []

    const propertyId = selectedProperty.id
    const driveFolderId = selectedProperty.driveFolder?.drive_folder_id || ''
    const driveSyncStatus = normalize(selectedProperty.driveFolder?.sync_status)
    const hasDriveFolder = Boolean(driveFolderId)
    const driveLooksReady = hasDriveFolder && ['linked', 'ready', 'synced', 'created'].includes(driveSyncStatus)

    return [
      {
        id: 'property-edit',
        title: 'Scheda immobile',
        badge: 'Pronto',
        description: 'Controlla prezzo, descrizione, stato pubblicazione e dati principali della scheda.',
        icon: '🏠',
        status: 'ready',
        actionLabel: 'Apri scheda',
        href: `/admin/immobili/${propertyId}`,
        autoChecks: [
          'Immobile selezionato correttamente.',
          selectedProperty.propertyRef ? `Codice: ${selectedProperty.propertyRef}` : 'Codice immobile non indicato.',
          selectedProperty.contractType ? `Contratto: ${selectedProperty.contractType}` : 'Tipo contratto non indicato.',
        ],
      },
      {
        id: 'drive-share',
        title: 'Cartella Drive e condivisioni',
        badge: driveLooksReady ? 'Drive collegato' : 'Da verificare',
        description: 'Verifica cartella operativa, sottocartelle e accessi condivisi con fotografo, tecnico o proprietario.',
        icon: '☁️',
        status: driveLooksReady ? 'ready' : 'warning',
        actionLabel: driveLooksReady ? 'Apri condivisioni' : 'Verifica Drive',
        href: `/admin/ai-os/condivisioni?propertyId=${propertyId}`,
        autoChecks: [
          hasDriveFolder ? 'Cartella Drive collegata all’immobile.' : 'Cartella Drive non ancora collegata.',
          driveSyncStatus ? `Stato Drive: ${driveSyncStatus}` : 'Stato Drive non disponibile.',
          'Controlla che Bozze immagini/video, Documenti proprietario e materiali tecnici siano presenti.',
        ],
      },
      {
        id: 'lead-note',
        title: 'Nota rapida immobile',
        badge: 'Pronto',
        description: 'Apri la nota collegata all’immobile per telefonate, appuntamenti, clienti e follow-up.',
        icon: '📝',
        status: 'ready',
        actionLabel: 'Apri nota',
        href: `/admin/immobili/${propertyId}/apri-nota`,
        autoChecks: [
          'Nota collegata alla scheda immobile.',
          'Utile per telefonate, appuntamenti e aggiornamenti interni.',
        ],
      },
      {
        id: 'social-card',
        title: 'Social / vetrina',
        badge: 'Da preparare',
        description: 'Prepara testi e materiale per Facebook, Instagram, TikTok, WhatsApp e vetrina immobile.',
        icon: '📣',
        status: 'warning',
        actionLabel: 'Apri social',
        href: `/admin/ai-os/strumenti/social?propertyId=${propertyId}`,
        autoChecks: [
          'Immobile selezionato per generare contenuti coerenti.',
          hasDriveFolder ? 'Drive disponibile per recuperare immagini e video.' : 'Drive non collegato: controllare immagini e video prima della pubblicazione.',
        ],
      },
      {
        id: 'documents',
        title: 'Documenti agenzia',
        badge: 'Da controllare',
        description: 'Mandato, incarico, raccolta dati proprietario, checklist documentale e bozze operative.',
        icon: '📄',
        status: 'warning',
        actionLabel: 'Apri documenti',
        href: `/admin/ai-os/strumenti/documenti?propertyId=${propertyId}`,
        autoChecks: [
          'Pratica collegata all’immobile selezionato.',
          hasDriveFolder ? 'Controlla in Drive i documenti proprietario.' : 'Prima prepara o collega la cartella Drive.',
        ],
      },
      {
        id: 'fillable-modules',
        title: 'Moduli compilabili',
        badge: 'Da compilare',
        description: 'Compila dati immobile/proprietario, rivedi le informazioni e prepara i moduli finali.',
        icon: '🧾',
        status: 'warning',
        actionLabel: 'Apri moduli',
        href: `/admin/ai-os/strumenti/moduli?propertyId=${propertyId}`,
        autoChecks: [
          'Modulo collegato alla pratica selezionata.',
          'Chi gestisce può segnare OK controllato dopo revisione dati e proprietario.',
        ],
      },
      {
        id: 'agency-practices',
        title: 'Pratiche / visure',
        badge: 'Da controllare',
        description: 'Centro operativo per visure, planimetrie, APE, conformità e richieste a tecnico.',
        icon: '🏛️',
        status: 'warning',
        actionLabel: 'Apri pratiche',
        href: `/admin/ai-os/strumenti/pratiche?propertyId=${propertyId}`,
        autoChecks: [
          'Pratica pronta per controllo documentale.',
          'Verifica presenza di visura, planimetria, APE e documentazione proprietario.',
        ],
      },
      {
        id: 'visure',
        title: 'Richieste automatiche',
        badge: 'Prossimo step',
        description: 'Workflow guidato per richieste catastali, documenti proprietario e controllo materiale ricevuto.',
        icon: '🔎',
        status: 'next',
        actionLabel: 'In sviluppo',
        autoChecks: [
          'Modulo previsto come prossimo step.',
          'Per ora usa la sezione Pratiche / visure.',
        ],
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

  async function loadOperationalChecks(propertyId: string) {
    setChecksLoading(true)
    setNotice('')

    try {
      const response = await fetch(`/api/admin/ai-os/operational-checks?propertyId=${encodeURIComponent(propertyId)}`, {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento check operativi')
      }

      setChecks(Array.isArray(payload?.checks) ? payload.checks : [])
    } catch (error) {
      setChecks([])
      setNotice(error instanceof Error ? error.message : 'Errore caricamento check operativi')
    } finally {
      setChecksLoading(false)
    }
  }

  async function saveOperationalCheck(tool: ToolCard, isOk: boolean) {
    if (!selectedProperty) {
      setNotice('Seleziona prima un immobile.')
      return
    }

    setSavingCheckKey(tool.id)
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/operational-checks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: selectedProperty.id,
          sectionKey: tool.id,
          isOk,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio OK operativo')
      }

      const nextCheck = payload?.check as OperationalCheck

      setChecks((currentChecks) => {
        const others = currentChecks.filter((check) => check.section_key !== tool.id)
        return [...others, nextCheck]
      })

      setNotice(isOk ? `${tool.title}: segnato come OK controllato.` : `${tool.title}: OK controllato rimosso.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore salvataggio OK operativo')
    } finally {
      setSavingCheckKey('')
    }
  }

  useEffect(() => {
    void loadFolders()
  }, [])

  useEffect(() => {
    if (!selectedPropertyId) {
      setChecks([])
      return
    }

    void loadOperationalChecks(selectedPropertyId)
  }, [selectedPropertyId])

  function openTool(tool: ToolCard) {
    if (!tool.href) {
      setNotice('Strumento non ancora attivo: è segnato come prossimo step di sviluppo.')
      return
    }

    window.location.href = tool.href
  }

  const completedChecks = tools.filter((tool) => checksBySection.get(tool.id)?.is_ok).length
  const totalChecks = tools.length

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/88 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.36em] text-[#8FBCBB]/75">
            AI-OS
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Wizard operativo agenzia
          </h1>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#D1D5DB]/68">
            Prima selezioni l’immobile. Poi AI-OS mostra solo le sezioni operative di quella pratica, con controllo rapido e OK controllato.
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
                Step 1
              </p>
              <h2 className="mt-1 text-xl font-black text-white">
                Seleziona immobile
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#D1D5DB]/62">
                Cerca o filtra per vendita/affitto. Le caselle operative compaiono solo dopo la selezione.
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
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-black text-white">
                        {selectedProperty.propertyRef ? `${selectedProperty.propertyRef} - ` : ''}{selectedProperty.name}
                      </p>
                      <p className="mt-1 text-xs text-[#D1D5DB]/58">
                        {selectedProperty.address || 'Indirizzo non indicato'}
                      </p>
                    </div>

                    <span className={`w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                      selectedProperty.driveFolder?.drive_folder_id
                        ? 'border-[#A3BE8C]/35 bg-[#A3BE8C]/10 text-[#A3BE8C]'
                        : 'border-[#D08770]/40 bg-[#D08770]/12 text-[#EBCB8B]'
                    }`}>
                      {selectedProperty.driveFolder?.drive_folder_id ? 'Drive collegato' : 'Drive da preparare'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[#64748B]/25 bg-[#111827]/70 px-4 py-3 text-sm leading-6 text-[#CBD5E1]/72">
                  Nessun immobile selezionato. Le caselle operative non vengono mostrate finché non scegli una pratica.
                </div>
              )}

              {loading ? (
                <div className="rounded-2xl border border-[#374151] bg-[#111827]/70 px-4 py-3 text-sm text-[#D1D5DB]/62">
                  Caricamento immobili...
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {!selectedProperty ? (
          <section className="rounded-[28px] border border-dashed border-[#64748B]/40 bg-[#111827]/60 p-8 text-center shadow-xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Step 2 bloccato
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Seleziona un immobile per caricare gli strumenti operativi
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#D1D5DB]/62">
              Così chi gestisce lavora sempre sulla pratica giusta e può segnare OK solo sulle sezioni realmente controllate.
            </p>
          </section>
        ) : checksLoading ? (
          <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-8 text-center shadow-xl shadow-black/20">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-[#8FBCBB]/65">
              Controllo rapido
            </p>
            <h2 className="mt-3 text-2xl font-black text-white">
              Sto caricando lo stato operativo della pratica...
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#D1D5DB]/62">
              Verifico Drive, sezioni operative e OK controllati già salvati.
            </p>
          </section>
        ) : (
          <>
            <section className="mb-5 grid gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-[#8FBCBB]/18 bg-[#1F2937]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FBCBB]/70">Step 2</p>
                <p className="mt-2 text-sm text-[#D1D5DB]/68">Caselle operative caricate.</p>
              </div>
              <div className="rounded-2xl border border-[#8FBCBB]/18 bg-[#1F2937]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FBCBB]/70">Controlli OK</p>
                <p className="mt-2 text-sm text-[#D1D5DB]/68">{completedChecks}/{totalChecks} sezioni approvate.</p>
              </div>
              <div className="rounded-2xl border border-[#8FBCBB]/18 bg-[#1F2937]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FBCBB]/70">Drive</p>
                <p className="mt-2 text-sm text-[#D1D5DB]/68">
                  {selectedProperty.driveFolder?.drive_folder_id ? 'Cartella collegata.' : 'Da preparare.'}
                </p>
              </div>
              <div className="rounded-2xl border border-[#8FBCBB]/18 bg-[#1F2937]/70 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#8FBCBB]/70">Step 3</p>
                <p className="mt-2 text-sm text-[#D1D5DB]/68">Apri lo strumento e completa la pratica.</p>
              </div>
            </section>

            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {tools.map((tool) => {
                const check = checksBySection.get(tool.id)
                const isOk = check?.is_ok === true
                const disabled = !tool.href
                const saving = savingCheckKey === tool.id

                return (
                  <article
                    key={tool.id}
                    className={`rounded-[28px] border p-5 shadow-xl shadow-black/18 transition ${
                      isOk
                        ? 'border-[#A3BE8C]/45 bg-[#1F2937]/90'
                        : disabled
                          ? 'border-[#374151] bg-[#1F2937]/58 opacity-80'
                          : 'border-[#374151] bg-[#1F2937]/84 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl border border-[#8FBCBB]/18 bg-[#111827] text-2xl shadow-inner">
                        {tool.icon}
                      </span>

                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${isOk ? badgeClass('ready') : badgeClass(tool.status)}`}>
                        {isOk ? 'OK controllato' : tool.badge}
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-white">
                      {tool.title}
                    </h3>

                    <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#D1D5DB]/62">
                      {tool.description}
                    </p>

                    <div className="mt-4 rounded-2xl border border-[#374151]/80 bg-[#111827]/70 p-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8FBCBB]/70">
                        Check rapido
                      </p>
                      <ul className="mt-3 space-y-2 text-xs leading-5 text-[#CBD5E1]/72">
                        {tool.autoChecks.map((item) => (
                          <li key={item} className="flex gap-2">
                            <span className="mt-0.5 text-[#8FBCBB]">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#8FBCBB]/18 bg-[#0B1220]/70 p-4 transition hover:border-[#A3BE8C]/35">
                      <input
                        type="checkbox"
                        checked={isOk}
                        disabled={saving}
                        onChange={(event) => void saveOperationalCheck(tool, event.target.checked)}
                        className="mt-1 h-5 w-5 accent-[#A3BE8C]"
                      />
                      <span>
                        <span className="block text-sm font-black text-white">
                          OK controllato
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[#D1D5DB]/58">
                          {isOk
                            ? `Confermato${check?.checked_by ? ` da ${check.checked_by}` : ''}${check?.checked_at ? ` il ${formatDateTime(check.checked_at)}` : ''}.`
                            : 'Spunta solo quando questa sezione è stata controllata e può considerarsi a posto.'}
                        </span>
                      </span>
                    </label>

                    <button
                      type="button"
                      onClick={() => openTool(tool)}
                      disabled={disabled}
                      className={`mt-5 inline-flex rounded-full border px-4 py-2 text-xs font-black transition ${
                        disabled
                          ? 'cursor-not-allowed border-[#64748B]/30 bg-[#64748B]/10 text-[#CBD5E1]/55'
                          : 'border-[#8FBCBB]/30 bg-[#8FBCBB]/10 text-[#8FBCBB] hover:bg-[#8FBCBB]/18'
                      }`}
                    >
                      {tool.actionLabel}
                    </button>
                  </article>
                )
              })}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
