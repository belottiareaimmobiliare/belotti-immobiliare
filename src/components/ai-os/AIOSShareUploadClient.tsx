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
  const [notice, setNotice] = useState('')

  const folderId = data?.currentFolder?.id || data?.rootFolder?.id || ''
  const folderName = data?.currentFolder?.name || data?.rootFolder?.name || data?.link?.targetFolderName || 'Cartella Drive'
  const driveUrl = folderId ? buildDriveOpenUrl(folderId) : ''
  const androidIntentUrl = folderId ? buildAndroidDriveIntent(folderId) : ''

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
      setNotice('Link copiato. Aprilo con l’app Google Drive usando lo stesso account Gmail autorizzato.')
    } catch {
      setNotice(driveUrl)
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
      <div className="mx-auto flex min-h-[calc(100dvh-48px)] max-w-xl flex-col justify-center">
        <section className="rounded-[28px] border border-white/10 bg-[#2b2c30] p-6 shadow-2xl">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8ab4f8]">
            AI-OS / Google Drive
          </p>

          <h1 className="mt-3 text-2xl font-black text-white">
            Apri cartella Drive
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
            Apri la cartella con l’app Google Drive usando la Gmail autorizzata. Da browser mobile Google Drive può non mostrare i comandi di caricamento anche se hai permessi editor.
          </p>

          <div className="mt-6 grid gap-3">
            <a
              href={androidIntentUrl}
              className="flex min-h-14 items-center justify-center rounded-2xl bg-[#8ab4f8] px-5 py-4 text-sm font-black text-[#202124] shadow-xl"
            >
              Apri nell’app Google Drive
            </a>

            <a
              href={driveUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold text-[#e8eaed]"
            >
              Apri Drive da browser
            </a>

            <button
              type="button"
              onClick={copyDriveLink}
              className="flex min-h-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-4 text-sm font-bold text-[#e8eaed]"
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
            Se nell’app Drive non compare il pulsante +, l’account Google usato non è quello autorizzato oppure la condivisione editor non è stata applicata correttamente.
          </p>
        </section>
      </div>
    </main>
  )
}
