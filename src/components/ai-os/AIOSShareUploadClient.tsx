'use client'

import { useEffect, useMemo, useState } from 'react'

type DriveFolder = {
  id: string
  name: string
  url?: string
}

type DriveFile = {
  id: string
  name: string
  url?: string
  mimeType?: string
  size?: number
  updatedAt?: string
}

type ShareFolderConfig = {
  role: string
  label: string
  targetFolderName: string
  title: string
  description: string
  accept: string
  primaryAction: string
  secondaryAction: string
  allowCamera: boolean
  allowVideo: boolean
}

type ShareInfo = {
  link: {
    token: string
    targetFolderName: string
    recipientName?: string | null
    recipientRole: string
    canUpload: boolean
    expiresAt?: string | null
    maxUploadBytes: number
  }
  folderConfig: ShareFolderConfig
  property: {
    id: string
    title?: string | null
    reference_code?: string | null
    comune?: string | null
    province?: string | null
    address?: string | null
  } | null
  rootFolder: DriveFolder
  currentFolder: DriveFolder
  folders: DriveFolder[]
  files: DriveFile[]
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Proprietario'
  if (role === 'collaborator') return 'Collaboratore'
  if (role === 'client') return 'Cliente'
  return 'Fotografo'
}

function folderPurpose(role: string) {
  if (role === 'owner') {
    return 'Puoi gestire solo la cartella documenti proprietario di questo immobile.'
  }

  if (role === 'collaborator') {
    return 'Puoi gestire solo la cartella tecnica assegnata a questo immobile.'
  }

  if (role === 'client') {
    return 'Puoi gestire solo la cartella documenti cliente assegnata a questa pratica.'
  }

  return 'Puoi gestire solo la cartella bozze foto/video di questo immobile.'
}

function formatSize(size?: number) {
  if (!size) return '—'

  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)} KB`
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export default function AIOSShareUploadClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [newFolderName, setNewFolderName] = useState('')
  const [history, setHistory] = useState<string[]>([])

  const propertyTitle = data?.property?.title || 'Immobile'
  const propertyRef = data?.property?.reference_code
  const location = [data?.property?.comune, data?.property?.province].filter(Boolean).join(' · ')
  const maxMb = useMemo(() => Math.round((data?.link.maxUploadBytes || 4194304) / 1024 / 1024), [data])

  const recipientRole = data?.link.recipientRole || data?.folderConfig?.role || 'photographer'
  const folderName = data?.link.targetFolderName || data?.folderConfig?.targetFolderName || 'Cartella condivisa'
  const uploadAccept = data?.folderConfig?.accept || 'image/*,video/*,application/pdf'
  const allowVideo = Boolean(data?.folderConfig?.allowVideo)
  const allowCamera = data?.folderConfig?.allowCamera !== false
  const isRootFolder = Boolean(data?.rootFolder?.id && data?.currentFolder?.id === data.rootFolder.id)

  async function loadFolder(folderId?: string | null, silent = false) {
    if (!silent) setLoading(true)

    try {
      const params = new URLSearchParams()

      if (folderId) {
        params.set('folderId', folderId)
      }

      const response = await fetch(`/api/ai-os/share/${token}${params.toString() ? `?${params.toString()}` : ''}`, {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Link non valido.')
      }

      setData({
        link: payload.link,
        folderConfig: payload.folderConfig,
        property: payload.property,
        rootFolder: payload.rootFolder,
        currentFolder: payload.currentFolder,
        folders: Array.isArray(payload.folders) ? payload.folders : [],
        files: Array.isArray(payload.files) ? payload.files : [],
      })

      if (!silent) setNotice('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento cartella.')
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    void loadFolder(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function uploadFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])

    if (files.length === 0 || !data?.currentFolder?.id) return

    const maxBytes = data.link.maxUploadBytes || 4194304
    const tooLarge = files.find((file) => file.size > maxBytes)

    if (tooLarge) {
      setNotice(`File troppo grande: ${tooLarge.name}. Limite attuale ${maxMb} MB.`)
      return
    }

    const formData = new FormData()
    formData.append('folderId', data.currentFolder.id)

    for (const file of files) {
      formData.append('files', file)
    }

    setBusy(true)
    setNotice(`Upload in corso: ${files.length} file...`)

    try {
      const response = await fetch(`/api/ai-os/share/${token}`, {
        method: 'POST',
        body: formData,
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Upload non riuscito.')
      }

      setUploadedCount((current) => current + files.length)
      setNotice(`Upload completato: ${files.length} file caricati in "${data.currentFolder.name || folderName}".`)
      await loadFolder(data.currentFolder.id, true)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore upload.')
    } finally {
      setBusy(false)
    }
  }

  async function runAction(body: Record<string, unknown>, successMessage: string) {
    if (!data?.currentFolder?.id) return

    setBusy(true)
    setNotice('Operazione in corso...')

    try {
      const response = await fetch(`/api/ai-os/share/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          folderId: data.currentFolder.id,
          ...body,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Operazione non riuscita.')
      }

      setNotice(successMessage)
      await loadFolder(data.currentFolder.id, true)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore operazione.')
    } finally {
      setBusy(false)
    }
  }

  async function createSubfolder() {
    const folderNameDraft = newFolderName.trim()

    if (!folderNameDraft) {
      setNotice('Inserisci il nome della sottocartella.')
      return
    }

    await runAction(
      {
        action: 'createSubfolder',
        folderName: folderNameDraft,
      },
      `Sottocartella creata: ${folderNameDraft}`,
    )

    setNewFolderName('')
  }

  async function renameItem(item: DriveFolder | DriveFile) {
    const nextName = window.prompt('Nuovo nome', item.name)?.trim()

    if (!nextName || nextName === item.name) return

    await runAction(
      {
        action: 'renameItem',
        sourceItemId: item.id,
        newName: nextName,
      },
      `Rinominato: ${nextName}`,
    )
  }

  async function deleteItem(item: DriveFolder | DriveFile) {
    const confirmed = window.confirm(`Eliminare "${item.name}"?`)

    if (!confirmed) return

    await runAction(
      {
        action: 'deleteItem',
        sourceItemId: item.id,
      },
      `Eliminato: ${item.name}`,
    )
  }

  async function moveFile(file: DriveFile, targetFolderId: string) {
    if (!targetFolderId) return

    await runAction(
      {
        action: 'moveItem',
        sourceItemId: file.id,
        targetFolderId,
      },
      `File spostato: ${file.name}`,
    )
  }

  function openFolder(folder: DriveFolder) {
    if (data?.currentFolder?.id) {
      setHistory((current) => [...current, data.currentFolder.id])
    }

    void loadFolder(folder.id)
  }

  function goBack() {
    const previous = history[history.length - 1]

    if (!previous) {
      if (data?.rootFolder?.id) void loadFolder(data.rootFolder.id)
      return
    }

    setHistory((current) => current.slice(0, -1))
    void loadFolder(previous)
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#111827] px-5 text-white">
        <div className="rounded-3xl border border-[#8FBCBB]/20 bg-[#1F2937]/80 p-6 text-sm font-semibold">
          Caricamento AI-OS Mobile...
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#111827] px-5 text-white">
        <div className="max-w-md rounded-3xl border border-[#BF616A]/30 bg-[#BF616A]/10 p-6">
          <p className="text-lg font-bold text-[#FFCCD2]">Link non disponibile</p>
          <p className="mt-2 text-sm leading-6 text-[#E5E7EB]/70">
            {notice || 'Il link non è valido o non è più attivo.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_20%_10%,rgba(143,188,187,0.22),transparent_30%),linear-gradient(135deg,#0B1220,#111827_55%,#1F2937)] px-4 py-5 text-[#E5E7EB]">
      <div className="mx-auto flex min-h-[calc(100dvh-40px)] max-w-xl flex-col">
        <header className="rounded-[30px] border border-[#8FBCBB]/20 bg-[#1F2937]/86 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#8FBCBB]/75">
            AI-OS Mobile
          </p>

          <h1 className="mt-3 text-2xl font-black text-white">
            {roleLabel(recipientRole)}
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#D1D5DB]/68">
            Accesso limitato alla cartella assegnata.
          </p>

          <div className="mt-4 rounded-3xl border border-[#374151] bg-[#111827]/68 p-4">
            <p className="text-sm font-bold text-white">{propertyTitle}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {propertyRef ? `Rif. ${propertyRef}` : 'Riferimento non indicato'}
              {location ? ` · ${location}` : ''}
            </p>

            <div className="mt-4 rounded-3xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 p-4">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📁</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A3BE8C]/80">
                    Cartella Drive assegnata
                  </p>
                  <p className="mt-1 truncate text-base font-black text-white">
                    {folderName}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-[#D1D5DB]/65">
                    {folderPurpose(recipientRole)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <section className="mt-5 rounded-[30px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-2xl shadow-black/25">
          <p className="text-sm leading-6 text-[#D1D5DB]/72">
            Azioni rapide nella cartella corrente.
          </p>

          <div className="mt-5 grid gap-3">
            {allowCamera ? (
              <label className="flex min-h-16 cursor-pointer items-center justify-center rounded-3xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-5 py-4 text-base font-black text-[#101820] shadow-[0_0_28px_rgba(163,190,140,0.20)] transition active:scale-[0.99]">
                📷 Scatta foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={busy}
                  onChange={(event) => {
                    void uploadFiles(event.currentTarget.files)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            ) : null}

            {allowVideo ? (
              <label className="flex min-h-16 cursor-pointer items-center justify-center rounded-3xl border border-[#88C0D0]/45 bg-[#88C0D0]/14 px-5 py-4 text-base font-black text-[#AECBFA] transition active:scale-[0.99]">
                🎥 Registra video
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  disabled={busy}
                  onChange={(event) => {
                    void uploadFiles(event.currentTarget.files)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            ) : null}

            <label className="flex min-h-16 cursor-pointer items-center justify-center rounded-3xl border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-5 py-4 text-base font-black text-[#8FBCBB] transition active:scale-[0.99]">
              📁 Carica da galleria / file
              <input
                type="file"
                multiple
                accept={uploadAccept}
                className="hidden"
                disabled={busy}
                onChange={(event) => {
                  void uploadFiles(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>
        </section>

        <section className="mt-5 flex-1 rounded-[30px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-2xl shadow-black/25">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#8FBCBB]/70">
                Esplora cartella
              </p>
              <h2 className="mt-1 truncate text-lg font-black text-white">
                {data.currentFolder?.name || folderName}
              </h2>
              <p className="mt-1 text-xs text-[#9CA3AF]">
                {isRootFolder ? 'Root assegnata' : 'Sottocartella'}
              </p>
            </div>

            <button
              type="button"
              disabled={busy || (isRootFolder && history.length === 0)}
              onClick={goBack}
              className="rounded-full border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-3 py-2 text-xs font-bold text-[#8FBCBB] transition hover:bg-[#8FBCBB]/18 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Indietro
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              className="min-w-0 flex-1 rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
              placeholder="Nuova sottocartella..."
            />
            <button
              type="button"
              disabled={busy}
              onClick={createSubfolder}
              className="rounded-2xl border border-[#A3BE8C]/45 bg-[#A3BE8C]/12 px-4 py-3 text-xs font-black text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20 disabled:cursor-wait disabled:opacity-50"
            >
              Crea
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {data.folders.map((folder) => (
              <div key={folder.id} className="rounded-3xl border border-[#8FBCBB]/18 bg-[#111827]/62 p-4">
                <button
                  type="button"
                  onClick={() => openFolder(folder)}
                  className="flex w-full items-center gap-3 text-left"
                >
                  <span className="text-3xl">📁</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-white">{folder.name}</span>
                    <span className="mt-1 block text-xs text-[#9CA3AF]">Tocca per aprire</span>
                  </span>
                </button>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void renameItem(folder)}
                    className="rounded-2xl border border-[#8FBCBB]/25 bg-[#8FBCBB]/10 px-3 py-2 text-xs font-bold text-[#8FBCBB]"
                  >
                    Rinomina
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteItem(folder)}
                    className="rounded-2xl border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-2 text-xs font-bold text-[#FFCCD2]"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            ))}

            {data.files.map((file) => (
              <div key={file.id} className="rounded-3xl border border-[#374151] bg-[#111827]/72 p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📄</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-white">{file.name}</p>
                    <p className="mt-1 text-xs text-[#9CA3AF]">
                      {file.mimeType || 'File'} · {formatSize(file.size)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void renameItem(file)}
                    className="rounded-2xl border border-[#8FBCBB]/25 bg-[#8FBCBB]/10 px-3 py-2 text-xs font-bold text-[#8FBCBB]"
                  >
                    Rinomina
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void deleteItem(file)}
                    className="rounded-2xl border border-[#BF616A]/25 bg-[#BF616A]/10 px-3 py-2 text-xs font-bold text-[#FFCCD2]"
                  >
                    Elimina
                  </button>
                </div>

                {data.folders.length > 0 ? (
                  <select
                    defaultValue=""
                    disabled={busy}
                    onChange={(event) => {
                      const targetFolderId = event.target.value
                      event.currentTarget.value = ''

                      if (targetFolderId) {
                        void moveFile(file, targetFolderId)
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-[#374151] bg-[#0B1220] px-3 py-2 text-xs font-bold text-[#D1D5DB] outline-none"
                  >
                    <option value="">Sposta in sottocartella...</option>
                    {data.folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                ) : null}
              </div>
            ))}

            {data.folders.length === 0 && data.files.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#8FBCBB]/20 bg-[#111827]/45 p-6 text-center">
                <p className="text-4xl">📂</p>
                <p className="mt-3 text-sm font-bold text-white">Cartella vuota</p>
                <p className="mt-1 text-xs leading-5 text-[#9CA3AF]">
                  Carica foto, video, documenti o crea una sottocartella.
                </p>
              </div>
            ) : null}
          </div>

          <div className="mt-5 rounded-3xl border border-[#374151] bg-[#111827]/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8FBCBB]/70">
              Stato
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#E5E7EB]">
              {busy ? 'Operazione in corso...' : notice || 'Pronto.'}
            </p>

            <p className="mt-3 text-xs leading-5 text-[#9CA3AF]">
              File caricati in questa sessione: {uploadedCount}. Limite iniziale per file: {maxMb} MB.
            </p>
          </div>
        </section>

        <footer className="mt-4 pb-2 text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8FBCBB]/50">
          AI-OS · Area Immobiliare
        </footer>
      </div>
    </main>
  )
}
