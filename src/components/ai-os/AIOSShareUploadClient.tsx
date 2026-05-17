'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type DriveFolder = {
  id: string
  name: string
  url?: string
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
}

function buildDriveOpenUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
}

function buildAndroidDriveIntent(folderId: string) {
  const webUrl = buildDriveOpenUrl(folderId)
  return `intent://drive.google.com/drive/folders/${encodeURIComponent(folderId)}#Intent;scheme=https;package=com.google.android.apps.docs;S.browser_fallback_url=${encodeURIComponent(webUrl)};end`
}

function roleLabel(role: string) {
  if (role === 'owner') return 'Proprietario'
  if (role === 'collaborator') return 'Collaboratore'
  if (role === 'client') return 'Cliente'
  return 'Fotografo'
}

export default function AIOSShareUploadClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')

  const photoInputRef = useRef<HTMLInputElement | null>(null)
  const videoInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const folderId = data?.currentFolder?.id || data?.rootFolder?.id || ''
  const folderName = data?.currentFolder?.name || data?.rootFolder?.name || data?.link?.targetFolderName || 'Cartella Drive'
  const driveUrl = folderId ? buildDriveOpenUrl(folderId) : ''
  const androidIntentUrl = folderId ? buildAndroidDriveIntent(folderId) : ''
  const maxUploadBytes = data?.link.maxUploadBytes || 4194304
  const maxMb = Math.round(maxUploadBytes / 1024 / 1024)

  const propertyBar = useMemo(() => {
    if (!data?.property) return ''
    return `${data.property.title || 'Immobile'}${data.property.reference_code ? ` · Rif. ${data.property.reference_code}` : ''}`
  }, [data])

  async function loadInfo() {
    setLoading(true)

    try {
      const response = await fetch(`/api/ai-os/share/${token}`, { cache: 'no-store' })
      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Link non valido.')
      }

      setData({
        link: payload.link,
        property: payload.property,
        rootFolder: payload.rootFolder,
        currentFolder: payload.currentFolder || payload.rootFolder,
      })
      setNotice('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento Drive.')
    } finally {
      setLoading(false)
    }
  }

  async function copyDriveLink() {
    if (!driveUrl) return

    try {
      await navigator.clipboard.writeText(driveUrl)
      setNotice('Link copiato.')
    } catch {
      setNotice(driveUrl)
    }
  }

  async function createSubfolder() {
    if (!folderId) return

    const folderNameDraft = window.prompt('Nome nuova sottocartella')?.trim()

    if (!folderNameDraft) return

    setBusy(true)
    setNotice('Creo sottocartella...')

    try {
      const response = await fetch(`/api/ai-os/share/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createSubfolder',
          folderId,
          folderName: folderNameDraft,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Creazione cartella non riuscita.')
      }

      setNotice(`Sottocartella creata: ${folderNameDraft}`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore creazione sottocartella.')
    } finally {
      setBusy(false)
    }
  }

  async function uploadFiles(fileList: FileList | null) {
    if (!folderId) return

    const files = Array.from(fileList ?? [])

    if (files.length === 0) return

    const tooLarge = files.find((file) => file.size > maxUploadBytes)

    if (tooLarge) {
      setNotice(`File troppo grande: ${tooLarge.name}. Limite attuale ${maxMb} MB.`)
      return
    }

    const formData = new FormData()
    formData.append('folderId', folderId)

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

      setNotice(`Upload completato: ${files.length} file caricati in "${folderName}".`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore upload.')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void loadInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#202124] px-5 text-white">
        <div className="rounded-2xl bg-[#303134] px-5 py-4 text-sm font-medium shadow">
          Preparazione accesso Drive...
        </div>
      </main>
    )
  }

  if (!data || !folderId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#202124] px-5 text-white">
        <div className="max-w-sm rounded-2xl bg-[#303134] p-5 shadow">
          <p className="text-lg font-semibold">Drive non disponibile</p>
          <p className="mt-2 text-sm text-white/65">
            {notice || 'Il link non è valido oppure la cartella non è pronta.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#202124] px-4 py-6 text-[#e8eaed]">
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
        className="hidden"
        disabled={busy}
        onChange={(event) => {
          void uploadFiles(event.currentTarget.files)
          event.currentTarget.value = ''
        }}
      />

      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-xl flex-col justify-center">
        <section className="rounded-[28px] border border-white/10 bg-[#2b2c30] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8ab4f8]">
            AI-OS / Google Drive
          </p>

          <h1 className="mt-3 text-2xl font-black text-white">
            Cartella condivisa
          </h1>

          <div className="mt-5 rounded-2xl border border-white/10 bg-[#202124] p-4">
            <p className="text-sm font-bold text-white">{folderName}</p>

            {propertyBar ? (
              <p className="mt-1 text-xs text-[#bdc1c6]">{propertyBar}</p>
            ) : null}

            <p className="mt-3 inline-flex rounded-full bg-[#26324a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#aecbfa]">
              Accesso {roleLabel(data.link.recipientRole)}
            </p>
          </div>

          <p className="mt-5 text-sm leading-6 text-[#bdc1c6]">
            Se Google Drive mobile non mostra il tasto crea/carica, usa i comandi AI-OS qui sotto:
            caricano comunque nella cartella Drive corretta, senza dare accesso alla cartella padre.
          </p>

          <div className="mt-6 grid gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={createSubfolder}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold text-[#e8eaed] disabled:opacity-50"
            >
              Crea sottocartella
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => photoInputRef.current?.click()}
              className="flex min-h-14 items-center justify-center rounded-2xl bg-[#8ab4f8] px-5 py-4 text-sm font-black text-[#202124] shadow-xl disabled:opacity-50"
            >
              Scatta foto
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => videoInputRef.current?.click()}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-[#8ab4f8]/35 bg-[#8ab4f8]/12 px-5 py-4 text-sm font-bold text-[#aecbfa] disabled:opacity-50"
            >
              Registra video
            </button>

            <button
              type="button"
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold text-[#e8eaed] disabled:opacity-50"
            >
              Carica file da telefono
            </button>
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5">
            <a
              href={androidIntentUrl}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-[#e8eaed]"
            >
              Apri nell’app Google Drive
            </a>

            <a
              href={driveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-[#e8eaed]"
            >
              Apri Drive da browser
            </a>

            <button
              type="button"
              onClick={copyDriveLink}
              className="flex min-h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-xs font-bold text-[#e8eaed]"
            >
              Copia link cartella
            </button>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-[#8ab4f8]/20 bg-[#26324a] px-4 py-3 text-sm leading-6 text-[#aecbfa]">
              {notice}
            </div>
          ) : null}

          <p className="mt-5 text-xs leading-5 text-[#9aa0a6]">
            Limite iniziale upload AI-OS: {maxMb} MB per file. Per video pesanti resta consigliata l’app Google Drive, ma per foto e file leggeri questo upload è il più affidabile.
          </p>
        </section>
      </div>

      {busy ? (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#202124] shadow-xl">
          Operazione in corso...
        </div>
      ) : null}
    </main>
  )
}
