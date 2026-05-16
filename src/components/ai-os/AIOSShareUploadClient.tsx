'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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
  thumbnailLink?: string
  thumbnailUrl?: string
  iconLink?: string
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

type ActionItem =
  | { type: 'folder'; item: DriveFolder }
  | { type: 'file'; item: DriveFile }

function formatSize(size?: number) {
  if (!size) return ''
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function isImageFile(file: DriveFile) {
  const mimeType = String(file.mimeType || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  return mimeType.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|avif|heic|heif)$/i.test(name)
}

function isVideoFile(file: DriveFile) {
  const mimeType = String(file.mimeType || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()
  return mimeType.startsWith('video/') || /\.(mp4|mov|m4v|webm|avi|mkv)$/i.test(name)
}

function fileIcon(file: DriveFile) {
  if (isImageFile(file)) return '🖼️'
  if (isVideoFile(file)) return '🎬'

  const mimeType = String(file.mimeType || '').toLowerCase()
  const name = String(file.name || '').toLowerCase()

  if (mimeType.includes('pdf') || name.endsWith('.pdf')) return '📕'
  return '📄'
}

function shortName(name: string) {
  if (name.length <= 24) return name
  return `${name.slice(0, 10)}…${name.slice(-10)}`
}

function driveThumbnailUrl(file: DriveFile) {
  if (file.thumbnailUrl) return file.thumbnailUrl
  if (file.thumbnailLink) return file.thumbnailLink
  if (!file.id) return ''

  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(file.id)}&sz=w640`
}

function FilePreview({ file }: { file: DriveFile }) {
  const [failed, setFailed] = useState(false)
  const canPreview = !failed && (isImageFile(file) || isVideoFile(file))
  const thumbnail = driveThumbnailUrl(file)

  return (
    <div className="relative grid aspect-[1.12] place-items-center overflow-hidden bg-[#f8f9fa] text-4xl dark:bg-[#303134]">
      {canPreview && thumbnail ? (
        <img
          src={thumbnail}
          alt={file.name}
          loading="lazy"
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{fileIcon(file)}</span>
      )}

      {isVideoFile(file) ? (
        <span className="absolute bottom-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/55 text-sm text-white">
          ▶
        </span>
      ) : null}
    </div>
  )
}

export default function AIOSShareUploadClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)
  const [history, setHistory] = useState<string[]>([])
  const [actionItem, setActionItem] = useState<ActionItem | null>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const longPressTimerRef = useRef<number | null>(null)
  const longPressTriggeredRef = useRef(false)
  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const uploadAccept = data?.folderConfig?.accept || 'image/*,video/*,application/pdf'
  const allowVideo = Boolean(data?.folderConfig?.allowVideo)
  const allowCamera = data?.folderConfig?.allowCamera !== false
  const maxMb = useMemo(() => Math.round((data?.link.maxUploadBytes || 4194304) / 1024 / 1024), [data])
  const isRootFolder = Boolean(data?.rootFolder?.id && data?.currentFolder?.id === data.rootFolder.id)

  const folderCount = data?.folders.length ?? 0
  const fileCount = data?.files.length ?? 0
  const title = data?.currentFolder?.name || data?.link.targetFolderName || 'Cartella'
  const propertyBar = `${data?.property?.title || 'Immobile'}${data?.property?.reference_code ? ` · Rif. ${data.property.reference_code}` : ''}`

  async function loadFolder(folderId?: string | null, silent = false) {
    if (!silent) setLoading(true)

    try {
      const params = new URLSearchParams()

      if (folderId) params.set('folderId', folderId)

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

  function clearLongPress() {
    if (longPressTimerRef.current) {
      window.clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
  }

  function startLongPress(item: ActionItem) {
    clearLongPress()
    longPressTriggeredRef.current = false

    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true
      setActionItem(item)
      setAddMenuOpen(false)
    }, 520)
  }

  function stopLongPress() {
    clearLongPress()
  }

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

    for (const file of files) formData.append('files', file)

    setBusy(true)
    setAddMenuOpen(false)
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
      setNotice(`Upload completato: ${files.length} file.`)
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
    setActionItem(null)
    setNotice('Operazione in corso...')

    try {
      const response = await fetch(`/api/ai-os/share/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const folderName = window.prompt('Nome nuova cartella')?.trim()
    if (!folderName) return

    await runAction(
      {
        action: 'createSubfolder',
        folderName,
      },
      `Cartella creata: ${folderName}`,
    )
  }

  async function renameItem(item: ActionItem) {
    const nextName = window.prompt('Nuovo nome', item.item.name)?.trim()
    if (!nextName || nextName === item.item.name) return

    await runAction(
      {
        action: 'renameItem',
        sourceItemId: item.item.id,
        newName: nextName,
      },
      `Rinominato: ${nextName}`,
    )
  }

  async function deleteItem(item: ActionItem) {
    const confirmed = window.confirm(`Eliminare "${item.item.name}"?`)
    if (!confirmed) return

    await runAction(
      {
        action: 'deleteItem',
        sourceItemId: item.item.id,
      },
      `Eliminato: ${item.item.name}`,
    )
  }

  async function moveItem(item: ActionItem, targetFolderId: string) {
    if (!targetFolderId) return

    await runAction(
      {
        action: 'moveItem',
        sourceItemId: item.item.id,
        targetFolderId,
      },
      `Spostato: ${item.item.name}`,
    )
  }

  function openFolder(folder: DriveFolder) {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }

    if (data?.currentFolder?.id) {
      setHistory((current) => [...current, data.currentFolder.id])
    }

    void loadFolder(folder.id)
  }

  function openFile(file: DriveFile) {
    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false
      return
    }

    if (file.url) window.open(file.url, '_blank', 'noopener,noreferrer')
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
      <main className="flex min-h-dvh items-center justify-center bg-[#f1f3f4] px-5 text-[#202124] dark:bg-[#202124] dark:text-white">
        <div className="rounded-2xl bg-white px-5 py-4 text-sm font-medium shadow dark:bg-[#2b2c30]">
          Caricamento cartella...
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#f1f3f4] px-5 text-[#202124] dark:bg-[#202124] dark:text-white">
        <div className="max-w-sm rounded-2xl bg-white p-5 shadow dark:bg-[#2b2c30]">
          <p className="text-lg font-semibold">Link non disponibile</p>
          <p className="mt-2 text-sm text-[#5f6368] dark:text-white/65">
            {notice || 'Il link non è valido o non è più attivo.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#f1f3f4] text-[#202124] dark:bg-[#202124] dark:text-[#e8eaed] md:flex md:items-center md:justify-center md:p-6">
      <div className="relative min-h-dvh bg-[#f1f3f4] pb-24 dark:bg-[#202124] md:h-[min(860px,calc(100dvh-48px))] md:min-h-0 md:w-[min(1120px,calc(100vw-48px))] md:overflow-auto md:rounded-2xl md:border md:border-black/10 md:shadow-2xl md:dark:border-white/10">
        <input
          ref={photoInputRef}
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

        <input
          ref={videoInputRef}
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

        <input
          ref={fileInputRef}
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

        <header className="sticky top-0 z-30 border-b border-black/10 bg-[#f1f3f4]/95 backdrop-blur dark:border-white/10 dark:bg-[#202124]/95">
          <div className="flex h-14 items-center gap-3 px-3">
            <button
              type="button"
              disabled={busy || (isRootFolder && history.length === 0)}
              onClick={goBack}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-2xl text-[#5f6368] transition hover:bg-black/5 disabled:opacity-35 dark:text-[#bdc1c6] dark:hover:bg-white/10"
              aria-label="Indietro"
            >
              ‹
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-medium leading-tight">{title}</h1>
              <p className="truncate text-xs text-[#5f6368] dark:text-[#bdc1c6]">
                {folderCount} cartelle · {fileCount} file
              </p>
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void loadFolder(data.currentFolder.id, true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg text-[#5f6368] transition hover:bg-black/5 disabled:opacity-35 dark:text-[#bdc1c6] dark:hover:bg-white/10"
              aria-label="Aggiorna"
            >
              ↻
            </button>

            <button
              type="button"
              onClick={() => setNotice((current) => current ? '' : propertyBar)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-xl text-[#5f6368] transition hover:bg-black/5 dark:text-[#bdc1c6] dark:hover:bg-white/10"
              aria-label="Info"
            >
              ⋮
            </button>
          </div>

          <div className="px-3 pb-3">
            <div className="truncate rounded-lg bg-[#dbeafe] px-3 py-2 text-xs font-medium text-[#174ea6] dark:bg-[#26324a] dark:text-[#aecbfa]">
              {propertyBar}
            </div>
          </div>
        </header>

        {notice ? (
          <div className="mx-4 mt-3 rounded-xl bg-[#e8f0fe] px-4 py-3 text-sm text-[#1967d2] dark:bg-[#283142] dark:text-[#a8c7fa]">
            {notice}
          </div>
        ) : null}

        <section className="px-2 py-3 md:px-4">
          {data.folders.length > 0 ? (
            <>
              <p className="px-2 pb-2 pt-1 text-sm font-medium text-[#5f6368] dark:text-[#bdc1c6]">Cartelle</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
                {data.folders.map((folder) => (
                  <button
                    key={folder.id}
                    type="button"
                    onPointerDown={() => startLongPress({ type: 'folder', item: folder })}
                    onPointerUp={stopLongPress}
                    onPointerCancel={stopLongPress}
                    onPointerLeave={stopLongPress}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setActionItem({ type: 'folder', item: folder })
                    }}
                    onClick={() => openFolder(folder)}
                    className="flex h-14 items-center gap-3 rounded-md bg-white px-3 text-left shadow-sm ring-1 ring-black/5 active:bg-black/5 dark:bg-[#2b2c30] dark:ring-white/10 dark:active:bg-white/10"
                  >
                    <span className="text-xl">📁</span>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{folder.name}</span>
                    <span className="text-[#5f6368] dark:text-[#bdc1c6]">ⓘ</span>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {data.files.length > 0 ? (
            <>
              <p className="px-2 pb-2 pt-5 text-sm font-medium text-[#5f6368] dark:text-[#bdc1c6]">File</p>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
                {data.files.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    onPointerDown={() => startLongPress({ type: 'file', item: file })}
                    onPointerUp={stopLongPress}
                    onPointerCancel={stopLongPress}
                    onPointerLeave={stopLongPress}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setActionItem({ type: 'file', item: file })
                    }}
                    onClick={() => openFile(file)}
                    className="overflow-hidden rounded-sm bg-white text-left shadow-sm ring-1 ring-black/5 active:bg-black/5 dark:bg-[#2b2c30] dark:ring-white/10 dark:active:bg-white/10"
                  >
                    <FilePreview file={file} />

                    <div className="flex items-center gap-2 px-2 py-2">
                      <span className="shrink-0 text-base">{fileIcon(file)}</span>
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">
                        {shortName(file.name)}
                      </span>
                      <span className="shrink-0 text-[#5f6368] dark:text-[#bdc1c6]">ⓘ</span>
                    </div>

                    {formatSize(file.size) ? (
                      <p className="px-2 pb-2 text-[11px] text-[#5f6368] dark:text-[#bdc1c6]">{formatSize(file.size)}</p>
                    ) : null}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          {data.folders.length === 0 && data.files.length === 0 ? (
            <div className="flex min-h-[calc(100dvh-180px)] items-center justify-center px-8 text-center md:min-h-[520px]">
              <div>
                <p className="text-6xl">📂</p>
                <p className="mt-4 text-base font-medium">Cartella vuota</p>
                <p className="mt-1 text-sm text-[#5f6368] dark:text-[#bdc1c6]">
                  Usa il pulsante + per caricare foto, video o file.
                </p>
              </div>
            </div>
          ) : null}
        </section>

        {addMenuOpen ? (
          <button
            type="button"
            aria-label="Chiudi menu caricamento"
            onClick={() => setAddMenuOpen(false)}
            className="fixed inset-0 z-40 cursor-default bg-black/10 md:absolute"
          />
        ) : null}

        <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3 md:absolute">
          {addMenuOpen ? (
            <div className="flex flex-col items-end gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setAddMenuOpen(false)
                  void createSubfolder()
                }}
                className="flex h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-medium text-[#202124] shadow-xl ring-1 ring-black/10 disabled:opacity-50 dark:bg-[#303134] dark:text-[#e8eaed] dark:ring-white/10"
              >
                <span>📁</span>
                <span>Cartella</span>
              </button>

              {allowCamera ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAddMenuOpen(false)
                    photoInputRef.current?.click()
                  }}
                  className="flex h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-medium text-[#202124] shadow-xl ring-1 ring-black/10 disabled:opacity-50 dark:bg-[#303134] dark:text-[#e8eaed] dark:ring-white/10"
                >
                  <span>📷</span>
                  <span>Foto</span>
                </button>
              ) : null}

              {allowVideo ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setAddMenuOpen(false)
                    videoInputRef.current?.click()
                  }}
                  className="flex h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-medium text-[#202124] shadow-xl ring-1 ring-black/10 disabled:opacity-50 dark:bg-[#303134] dark:text-[#e8eaed] dark:ring-white/10"
                >
                  <span>🎥</span>
                  <span>Video</span>
                </button>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setAddMenuOpen(false)
                  fileInputRef.current?.click()
                }}
                className="flex h-12 items-center gap-3 rounded-full bg-white px-5 text-sm font-medium text-[#202124] shadow-xl ring-1 ring-black/10 disabled:opacity-50 dark:bg-[#303134] dark:text-[#e8eaed] dark:ring-white/10"
              >
                <span>⬆️</span>
                <span>Carica</span>
              </button>
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => setAddMenuOpen((value) => !value)}
            className="grid h-14 w-14 place-items-center rounded-full bg-[#1a73e8] text-3xl font-light leading-none text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)] transition active:scale-95 disabled:cursor-wait disabled:opacity-60 dark:bg-[#8ab4f8] dark:text-[#202124]"
            aria-label="Apri menu caricamento"
          >
            {addMenuOpen ? '×' : '+'}
          </button>
        </div>

        {actionItem ? (
          <div className="fixed inset-0 z-[60] flex items-end bg-black/35 px-3 pb-3 md:absolute" onClick={() => setActionItem(null)}>
            <div
              className="w-full overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-[#303134] md:mx-auto md:max-w-md md:rounded-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center gap-3 border-b border-black/10 px-5 py-4 dark:border-white/10">
                <span className="text-2xl">{actionItem.type === 'folder' ? '📁' : fileIcon(actionItem.item as DriveFile)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-medium">{actionItem.item.name}</p>
                  <p className="text-xs text-[#5f6368] dark:text-[#bdc1c6]">
                    {actionItem.type === 'folder' ? 'Cartella' : 'File'}
                  </p>
                </div>
              </div>

              <div className="py-2">
                {actionItem.type === 'folder' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      const folder = actionItem.item as DriveFolder
                      setActionItem(null)
                      openFolder(folder)
                    }}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    <span>📂</span>
                    <span>Apri</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void renameItem(actionItem)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>✏️</span>
                  <span>Rinomina</span>
                </button>

                {data.folders.filter((folder) => folder.id !== actionItem.item.id).length > 0 ? (
                  <div className="px-5 py-2">
                    <select
                      defaultValue=""
                      disabled={busy}
                      onChange={(event) => {
                        const targetFolderId = event.target.value
                        event.currentTarget.value = ''

                        if (targetFolderId) void moveItem(actionItem, targetFolderId)
                      }}
                      className="w-full rounded-xl border border-black/10 bg-[#f8f9fa] px-3 py-3 text-sm font-medium outline-none dark:border-white/10 dark:bg-[#202124]"
                    >
                      <option value="">Sposta in...</option>
                      {data.folders
                        .filter((folder) => folder.id !== actionItem.item.id)
                        .map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                    </select>
                  </div>
                ) : null}

                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void deleteItem(actionItem)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium text-[#d93025] hover:bg-black/5 dark:text-[#f28b82] dark:hover:bg-white/10"
                >
                  <span>🗑️</span>
                  <span>Elimina</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActionItem(null)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <span>×</span>
                  <span>Annulla</span>
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {busy ? (
          <div className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 rounded-full bg-[#202124] px-4 py-2 text-sm font-medium text-white shadow-xl dark:bg-white dark:text-[#202124] md:absolute">
            Operazione in corso...
          </div>
        ) : null}
      </div>
    </main>
  )
}
