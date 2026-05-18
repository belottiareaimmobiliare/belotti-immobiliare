'use client'

import { useEffect, useMemo, useState } from 'react'

type WorkspaceFolder = {
  id: string
  name: string
  propertyRef?: string
  address?: string
  contractType?: string | null
  driveFolder?: {
    drive_folder_id?: string | null
    sync_status?: string | null
  } | null
}

type DriveSubfolder = {
  key: string
  name: string
  description: string
  driveFolderId: string
  driveFolderUrl: string
}

type ShareHistoryItem = {
  id: string
  propertyId: string
  propertyTitle?: string | null
  propertyRef?: string | null
  propertyContractType?: string | null
  propertyComune?: string | null
  folderKey?: string | null
  folderName: string
  folderId: string
  folderUrl: string
  aiOsUrl: string
  recipientEmail: string
  recipientRole: string
  permissionRole: string
  canUpload: boolean
  isActive: boolean
  expiresAt?: string | null
  createdAt?: string | null
  revokedAt?: string | null
}

export const dynamic = 'force-dynamic'

function formatDateTime(value?: string | null) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

export default function AIOSCondivisioniPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [subfolders, setSubfolders] = useState<DriveSubfolder[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [propertySearchQuery, setPropertySearchQuery] = useState('')
  const [contractFilter, setContractFilter] = useState<'all' | 'vendita' | 'affitto'>('all')
  const [folderKey, setFolderKey] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [permissionRole, setPermissionRole] = useState<'writer' | 'reader'>('writer')
  const [notice, setNotice] = useState('')
  const [sharedUrl, setSharedUrl] = useState('')
  const [sharedAiOsUrl, setSharedAiOsUrl] = useState('')
  const [shareHistory, setShareHistory] = useState<ShareHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [revokingShareId, setRevokingShareId] = useState('')
  const [loading, setLoading] = useState(true)
  const [preparing, setPreparing] = useState(false)
  const [preparingAll, setPreparingAll] = useState(false)
  const [sharing, setSharing] = useState(false)

  const readyFolders = useMemo(() => {
    return folders.filter((folder) => {
      const id = folder.driveFolder?.drive_folder_id || ''
      return id && !id.startsWith('aios-property-')
    })
  }, [folders])

  const selectedSubfolder = useMemo(() => {
    return subfolders.find((folder) => folder.key === folderKey) ?? null
  }, [subfolders, folderKey])

  const filteredReadyFolders = useMemo(() => {
    const query = propertySearchQuery.trim().toLowerCase()

    return readyFolders.filter((folder) => {
      const contractType = String(folder.contractType || '').toLowerCase()

      if (contractFilter !== 'all' && contractType !== contractFilter) {
        return false
      }

      if (query.length < 3) {
        return contractFilter !== 'all'
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

      return haystack.includes(query)
    })
  }, [contractFilter, propertySearchQuery, readyFolders])

  const showPropertyDropdown =
    propertySearchQuery.trim().length >= 3 || contractFilter !== 'all'


  async function loadShareHistory(nextPropertyId = propertyId) {
    setHistoryLoading(true)

    try {
      const params = new URLSearchParams()
      params.set('limit', '80')

      if (nextPropertyId) {
        params.set('propertyId', nextPropertyId)
      }

      const response = await fetch(`/api/admin/ai-os/drive-share/history?${params.toString()}`, {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore caricamento storico condivisioni')
      }

      setShareHistory(Array.isArray(payload.shares) ? payload.shares : [])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore storico condivisioni')
      setShareHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  async function revokeShare(share: ShareHistoryItem) {
    if (!share.id || !share.recipientEmail) return

    const confirmed = window.confirm(
      `Revocare l’accesso a ${share.recipientEmail} per la cartella "${share.folderName}"?`,
    )

    if (!confirmed) return

    setRevokingShareId(share.id)
    setNotice('Revoca accesso Drive in corso...')

    try {
      const response = await fetch('/api/admin/ai-os/drive-share/revoke', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shareLinkId: share.id,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore revoca accesso')
      }

      setNotice(`Accesso revocato a ${share.recipientEmail}.`)
      await loadShareHistory(propertyId)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore revoca accesso')
    } finally {
      setRevokingShareId('')
    }
  }

  async function loadFolders() {
    setLoading(true)
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/workspace/immobili', { cache: 'no-store' })
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

  function selectPropertyForShare(nextPropertyId: string) {
    setPropertyId(nextPropertyId)
    setSharedUrl('')
    setSharedAiOsUrl('')
    void prepareSubfolders(nextPropertyId)
    void loadShareHistory(nextPropertyId)
  }

  async function prepareSubfolders(nextPropertyId = propertyId) {
    if (!nextPropertyId) {
      setSubfolders([])
      setFolderKey('')
      return
    }

    setPreparing(true)
    setNotice('Preparo sottocartelle Drive standard...')

    try {
      const params = new URLSearchParams({ propertyId: nextPropertyId })
      const response = await fetch(`/api/admin/ai-os/drive-folder-children?${params.toString()}`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore preparazione sottocartelle')
      }

      const nextSubfolders = Array.isArray(payload.folders) ? payload.folders : []
      setSubfolders(nextSubfolders)
      setFolderKey(nextSubfolders[0]?.key || '')
      setNotice('Sottocartelle Drive pronte. Ora puoi condividere la cartella selezionata.')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore preparazione sottocartelle')
      setSubfolders([])
      setFolderKey('')
    } finally {
      setPreparing(false)
    }
  }

  useEffect(() => {
    void loadFolders()
    void loadShareHistory('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function prepareAllSubfolders() {
    setPreparingAll(true)
    setNotice('Preparo tutte le sottocartelle Drive standard per gli immobili pronti...')

    try {
      const response = await fetch('/api/admin/ai-os/drive-folder-children/prepare-all', {
        method: 'POST',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore preparazione massiva sottocartelle')
      }

      const errors = Array.isArray(payload.errors) ? payload.errors : []
      setNotice(
        errors.length > 0
          ? `Preparazione completata con ${errors.length} avvisi. Immobili gestiti: ${payload.processedProperties}. Cartelle create: ${payload.createdFolders}.`
          : `Sottocartelle pronte per ${payload.processedProperties} immobili. Create: ${payload.createdFolders}, già presenti: ${payload.existingFolders}.`,
      )
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore preparazione massiva sottocartelle')
    } finally {
      setPreparingAll(false)
    }
  }

  async function shareFolder() {
    setSharing(true)
    setSharedUrl('')
    setNotice('Condivisione Drive in corso...')

    try {
      const response = await fetch('/api/admin/ai-os/drive-share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          folderKey,
          emailAddress,
          permissionRole,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore condivisione Drive')
      }

      setSharedUrl(payload.shared?.folderUrl || '')
      setSharedAiOsUrl(payload.shared?.aiOsUrl || payload.aiOsUrl || '')
      setNotice(`Cartella condivisa con ${emailAddress}. L’utente potrà usare solo quella cartella e le sue sottocartelle.`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore condivisione Drive')
    } finally {
      setSharing(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-[28px] border border-[#8FBCBB]/20 bg-[#1F2937]/86 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#8FBCBB]/75">
            AI-OS / Drive
          </p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
            Condividi cartella Drive
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D1D5DB]/68">
            La segreteria sceglie immobile, sottocartella ed email Gmail. AI-OS condivide solo la cartella selezionata: il destinatario può usare quella e le sottocartelle, ma non può salire alla cartella padre.
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

            <button
              type="button"
              disabled={preparingAll}
              onClick={() => void prepareAllSubfolders()}
              className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:cursor-wait disabled:opacity-60"
            >
              {preparingAll ? 'Preparo...' : 'Prepara tutte le cartelle'}
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold leading-6 text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
            Procedura segreteria
          </p>
          <h2 className="mt-1 text-xl font-black text-white">Scegli la cartella da condividere</h2>

          {loading ? (
            <div className="mt-5 rounded-3xl border border-[#374151] bg-[#111827]/64 p-6 text-sm text-[#D1D5DB]/65">
              Caricamento immobili...
            </div>
          ) : (
            <div className="mt-5 grid gap-4">
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setContractFilter('all')
                      setPropertyId('')
                      setSubfolders([])
                      setFolderKey('')
                      setSharedUrl('')
                      setSharedAiOsUrl('')
                    }}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                      contractFilter === 'all'
                        ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                        : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    Tutti
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContractFilter('vendita')
                      setPropertyId('')
                      setSubfolders([])
                      setFolderKey('')
                      setSharedUrl('')
                      setSharedAiOsUrl('')
                    }}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                      contractFilter === 'vendita'
                        ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                        : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    Vendite
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContractFilter('affitto')
                      setPropertyId('')
                      setSubfolders([])
                      setFolderKey('')
                      setSharedUrl('')
                      setSharedAiOsUrl('')
                    }}
                    className={`rounded-2xl border px-3 py-2 text-xs font-black transition ${
                      contractFilter === 'affitto'
                        ? 'border-[#A3BE8C]/60 bg-[#A3BE8C]/18 text-[#A3BE8C]'
                        : 'border-[#374151] bg-[#111827] text-[#D1D5DB]/72 hover:border-[#8FBCBB]/45'
                    }`}
                  >
                    Affitti
                  </button>
                </div>

                <div className="relative">
                  <input
                    value={propertySearchQuery}
                    onChange={(event) => {
                      setPropertySearchQuery(event.target.value)
                      setPropertyId('')
                      setSubfolders([])
                      setFolderKey('')
                      setSharedUrl('')
                      setSharedAiOsUrl('')
                    }}
                    className="w-full rounded-2xl border border-[#8FBCBB]/45 bg-[#111827] px-4 py-3 pr-24 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#A3BE8C]/70"
                    placeholder="Cerca immobile per codice, titolo o indirizzo..."
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#8FBCBB]/65">
                    min 3
                  </span>
                </div>

                {contractFilter === 'all' && propertySearchQuery.trim().length > 0 && propertySearchQuery.trim().length < 3 ? (
                  <div className="rounded-2xl border border-[#EBCB8B]/20 bg-[#EBCB8B]/10 px-4 py-3 text-xs font-semibold text-[#EBCB8B]">
                    Scrivi almeno 3 caratteri per cercare.
                  </div>
                ) : null}

                {showPropertyDropdown ? (
                  <select
                    value={propertyId}
                    onChange={(event) => selectPropertyForShare(event.target.value)}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                  >
                    <option value="">
                      {filteredReadyFolders.length > 0
                        ? contractFilter === 'vendita'
                          ? `Seleziona vendita (${filteredReadyFolders.length} risultati)...`
                          : contractFilter === 'affitto'
                            ? `Seleziona affitto (${filteredReadyFolders.length} risultati)...`
                            : `Seleziona immobile (${filteredReadyFolders.length} risultati)...`
                        : 'Nessun immobile trovato'}
                    </option>

                    {filteredReadyFolders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                        {folder.contractType ? ` · ${folder.contractType}` : ''}
                        {folder.address ? ` · ${folder.address}` : ''}
                      </option>
                    ))}
                  </select>
                ) : null}

                {showPropertyDropdown && filteredReadyFolders.length > 0 ? (
                  <div className="overflow-hidden rounded-2xl border border-[#374151] bg-[#0B1220]/72">
                    <div className="border-b border-[#374151] bg-[#111827]/90 px-4 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8FBCBB]/70">
                        Lista immobili filtrata
                      </p>
                      <p className="mt-1 text-xs text-[#D1D5DB]/55">
                        {contractFilter === 'vendita'
                          ? 'Vendite disponibili'
                          : contractFilter === 'affitto'
                            ? 'Affitti disponibili'
                            : 'Risultati ricerca'}
                      </p>
                    </div>

                    <div className="max-h-[360px] divide-y divide-[#374151]/70 overflow-y-auto">
                      {filteredReadyFolders.map((folder) => (
                        <button
                          key={folder.id}
                          type="button"
                          onClick={() => selectPropertyForShare(folder.id)}
                          className={`grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left transition ${
                            propertyId === folder.id
                              ? 'bg-[#A3BE8C]/16'
                              : 'hover:bg-[#1F2937]/90'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-black text-white">
                              {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                            </p>

                            <p className="mt-1 truncate text-xs text-[#D1D5DB]/55">
                              {folder.address || 'Indirizzo non indicato'}
                            </p>
                          </div>

                          <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                            String(folder.contractType || '').toLowerCase() === 'affitto'
                              ? 'border-[#88C0D0]/35 bg-[#88C0D0]/10 text-[#88C0D0]'
                              : 'border-[#A3BE8C]/35 bg-[#A3BE8C]/10 text-[#A3BE8C]'
                          }`}>
                            {folder.contractType || 'immobile'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              {readyFolders.length === 0 ? (
                <div className="rounded-3xl border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 p-4 text-sm leading-6 text-[#EBCB8B]">
                  Nessun immobile con cartella Drive reale pronta. Prima crea/sincronizza le cartelle Drive.
                </div>
              ) : null}

              {propertyId ? (
                <button
                  type="button"
                  disabled={preparing}
                  onClick={() => void prepareSubfolders()}
                  className="rounded-2xl border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-3 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:cursor-wait disabled:opacity-60"
                >
                  {preparing ? 'Preparo cartelle...' : 'Prepara / verifica sottocartelle Drive'}
                </button>
              ) : null}

              {subfolders.length > 0 ? (
                <>
                  <select
                    value={folderKey}
                    onChange={(event) => {
                      setFolderKey(event.target.value)
                      setSharedUrl('')
                      setSharedAiOsUrl('')
                  setSharedAiOsUrl('')
                    }}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                  >
                    {subfolders.map((folder) => (
                      <option key={folder.key} value={folder.key}>
                        {folder.name}
                      </option>
                    ))}
                  </select>

                  {selectedSubfolder ? (
                    <div className="rounded-3xl border border-[#8FBCBB]/20 bg-[#8FBCBB]/10 p-4">
                      <p className="text-sm font-bold text-white">{selectedSubfolder.name}</p>
                      <p className="mt-2 text-xs leading-5 text-[#BFE8E5]">
                        {selectedSubfolder.description}
                      </p>
                      <p className="mt-2 text-xs leading-5 text-[#D1D5DB]/58">
                        Drive ID: {selectedSubfolder.driveFolderId}
                      </p>
                    </div>
                  ) : null}

                  <input
                    value={emailAddress}
                    onChange={(event) => setEmailAddress(event.target.value)}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                    placeholder="email Gmail destinatario"
                  />

                  <select
                    value={permissionRole}
                    onChange={(event) => setPermissionRole(event.target.value as 'writer' | 'reader')}
                    className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                  >
                    <option value="writer">Può caricare / modificare</option>
                    <option value="reader">Solo visualizzare</option>
                  </select>

                  <button
                    type="button"
                    disabled={sharing}
                    onClick={shareFolder}
                    className="w-full rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 text-sm font-black text-[#101820] transition hover:bg-[#111827] hover:text-[#A3BE8C] disabled:cursor-wait disabled:opacity-60"
                  >
                    {sharing ? 'Condivido...' : 'Condividi cartella Drive'}
                  </button>
                </>
              ) : null}

              {sharedUrl || sharedAiOsUrl ? (
                <div className="rounded-3xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 p-4">
                  {sharedAiOsUrl ? (
                    <>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A3BE8C]">
                        Link AI-OS da inviare al destinatario
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {sharedAiOsUrl}
                      </p>
                      <a
                        href={sharedAiOsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-full border border-[#A3BE8C]/45 bg-[#A3BE8C]/12 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
                      >
                        Apri link AI-OS
                      </a>
                    </>
                  ) : null}

                  {sharedUrl ? (
                    <div className={sharedAiOsUrl ? 'mt-5 border-t border-[#A3BE8C]/20 pt-4' : ''}>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8FBCBB]">
                        Link Drive diretto
                      </p>
                      <p className="mt-2 break-all text-sm font-semibold text-white">
                        {sharedUrl}
                      </p>
                      <a
                        href={sharedUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
                      >
                        Apri cartella Drive
                      </a>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
        <section className="mt-6 rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Storico condivisioni
              </p>
              <h2 className="mt-1 text-xl font-black text-white">Accessi Drive concessi</h2>
              <p className="mt-2 text-sm leading-6 text-[#D1D5DB]/62">
                Qui vedi chi ha accesso alle cartelle Drive condivise. Puoi revocare il permesso quando il lavoro è finito.
              </p>
            </div>

            <button
              type="button"
              disabled={historyLoading}
              onClick={() => void loadShareHistory(propertyId)}
              className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-sm font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:cursor-wait disabled:opacity-60"
            >
              {historyLoading ? 'Aggiorno...' : 'Aggiorna storico'}
            </button>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-[#374151] bg-[#0B1220]/72">
            {historyLoading ? (
              <div className="p-5 text-sm font-semibold text-[#D1D5DB]/62">
                Caricamento storico...
              </div>
            ) : shareHistory.length > 0 ? (
              <div className="divide-y divide-[#374151]/70">
                {shareHistory.map((share) => (
                  <div key={share.id} className="grid gap-3 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${
                          share.isActive
                            ? 'border-[#A3BE8C]/35 bg-[#A3BE8C]/10 text-[#A3BE8C]'
                            : 'border-[#BF616A]/35 bg-[#BF616A]/10 text-[#FFCCD2]'
                        }`}>
                          {share.isActive ? 'Attiva' : 'Revocata'}
                        </span>

                        <span className="rounded-full border border-[#8FBCBB]/25 bg-[#8FBCBB]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#8FBCBB]">
                          {share.permissionRole === 'reader' ? 'lettura' : 'editor'}
                        </span>
                      </div>

                      <p className="mt-3 truncate text-sm font-black text-white">
                        {share.recipientEmail || 'Destinatario non indicato'}
                      </p>

                      <p className="mt-1 truncate text-xs text-[#D1D5DB]/58">
                        {share.folderName} · {share.propertyRef ? `${share.propertyRef} - ` : ''}{share.propertyTitle || 'Immobile'}
                      </p>

                      <p className="mt-1 text-xs text-[#D1D5DB]/42">
                        Creata: {formatDateTime(share.createdAt)}
                        {share.revokedAt ? ` · Revocata: ${formatDateTime(share.revokedAt)}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      {share.aiOsUrl ? (
                        <a
                          href={share.aiOsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#A3BE8C]/35 bg-[#A3BE8C]/10 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/18"
                        >
                          Link AI-OS
                        </a>
                      ) : null}

                      {share.folderUrl ? (
                        <a
                          href={share.folderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-4 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18"
                        >
                          Drive
                        </a>
                      ) : null}

                      {share.isActive ? (
                        <button
                          type="button"
                          disabled={revokingShareId === share.id}
                          onClick={() => void revokeShare(share)}
                          className="rounded-full border border-[#BF616A]/35 bg-[#BF616A]/10 px-4 py-2 text-xs font-bold text-[#FFCCD2] transition hover:bg-[#BF616A]/20 disabled:cursor-wait disabled:opacity-60"
                        >
                          {revokingShareId === share.id ? 'Revoco...' : 'Revoca'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-sm font-semibold text-[#D1D5DB]/62">
                Nessuna condivisione trovata.
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  )
}
