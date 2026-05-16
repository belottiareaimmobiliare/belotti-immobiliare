'use client'

import { useEffect, useMemo, useState } from 'react'

type WorkspaceFolder = {
  id: string
  name: string
  propertyRef?: string
  address?: string
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

export const dynamic = 'force-dynamic'

export default function AIOSCondivisioniPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [subfolders, setSubfolders] = useState<DriveSubfolder[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [folderKey, setFolderKey] = useState('')
  const [emailAddress, setEmailAddress] = useState('')
  const [permissionRole, setPermissionRole] = useState<'writer' | 'reader'>('writer')
  const [notice, setNotice] = useState('')
  const [sharedUrl, setSharedUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [preparing, setPreparing] = useState(false)
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
      setNotice('Sottocartelle Drive pronte. Ora puoi condividere la cartella precisa.')
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
  }, [])

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
            Condividi cartella precisa
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D1D5DB]/68">
            La segreteria sceglie immobile, sottocartella ed email Gmail. AI-OS condivide solo quella cartella: il destinatario può usare quella e le sottocartelle, ma non può salire alla cartella padre.
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
              <select
                value={propertyId}
                onChange={(event) => {
                  const nextPropertyId = event.target.value
                  setPropertyId(nextPropertyId)
                  setSharedUrl('')
                  void prepareSubfolders(nextPropertyId)
                }}
                className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
              >
                <option value="">Seleziona immobile...</option>
                {readyFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                  </option>
                ))}
              </select>

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
                    {sharing ? 'Condivido...' : 'Condividi cartella Drive precisa'}
                  </button>
                </>
              ) : null}

              {sharedUrl ? (
                <div className="rounded-3xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A3BE8C]">
                    Link Drive cartella condivisa
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-white">
                    {sharedUrl}
                  </p>
                  <a
                    href={sharedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex rounded-full border border-[#A3BE8C]/45 bg-[#A3BE8C]/12 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
                  >
                    Apri cartella
                  </a>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
