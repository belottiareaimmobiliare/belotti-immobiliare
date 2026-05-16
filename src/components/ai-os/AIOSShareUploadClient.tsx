'use client'

import { useEffect, useMemo, useState } from 'react'

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

function buildDriveEmbedUrl(folderId: string) {
  return `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(folderId)}#grid`
}

function buildDriveOpenUrl(folderId: string) {
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`
}

export default function AIOSShareUploadClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [notice, setNotice] = useState('')

  const folderId = data?.currentFolder?.id || data?.rootFolder?.id || ''
  const folderName = data?.currentFolder?.name || data?.rootFolder?.name || data?.link?.targetFolderName || 'Cartella Drive'

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

  useEffect(() => {
    void loadInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#202124] px-5 text-white">
        <div className="rounded-2xl bg-[#303134] px-5 py-4 text-sm font-medium shadow">
          Apertura Drive...
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
    <main className="min-h-dvh bg-[#202124] text-[#e8eaed] md:flex md:items-center md:justify-center md:p-6">
      <div className="flex min-h-dvh w-full flex-col bg-[#202124] md:h-[min(880px,calc(100dvh-48px))] md:min-h-0 md:max-w-6xl md:overflow-hidden md:rounded-2xl md:border md:border-white/10 md:shadow-2xl">
        <header className="shrink-0 border-b border-white/10 bg-[#202124]">
          <div className="flex h-14 items-center gap-3 px-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="grid h-10 w-10 place-items-center rounded-full text-2xl text-[#bdc1c6] hover:bg-white/10"
              aria-label="Indietro"
            >
              ‹
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-medium leading-tight">{folderName}</h1>
              <p className="truncate text-xs text-[#bdc1c6]">
                {propertyBar || 'Google Drive'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadInfo()}
              className="grid h-10 w-10 place-items-center rounded-full text-lg text-[#bdc1c6] hover:bg-white/10"
              aria-label="Aggiorna"
            >
              ↻
            </button>

            <a
              href={buildDriveOpenUrl(folderId)}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-[#8ab4f8] px-3 py-2 text-xs font-bold text-[#202124]"
            >
              Apri in Drive
            </a>
          </div>

          {propertyBar ? (
            <div className="px-3 pb-3">
              <div className="truncate rounded-lg bg-[#26324a] px-3 py-2 text-xs font-medium text-[#aecbfa]">
                {propertyBar}
              </div>
            </div>
          ) : null}
        </header>

        <iframe
          src={buildDriveEmbedUrl(folderId)}
          title={folderName}
          className="min-h-0 flex-1 border-0 bg-white"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </main>
  )
}
