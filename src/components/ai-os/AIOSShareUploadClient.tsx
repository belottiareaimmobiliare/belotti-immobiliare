'use client'

import { useEffect, useMemo, useState } from 'react'

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
}

export default function AIOSShareUploadClient({ token }: { token: string }) {
  const [data, setData] = useState<ShareInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [notice, setNotice] = useState('')
  const [uploadedCount, setUploadedCount] = useState(0)

  const propertyTitle = data?.property?.title || 'Immobile'
  const propertyRef = data?.property?.reference_code
  const location = [data?.property?.comune, data?.property?.province].filter(Boolean).join(' · ')
  const maxMb = useMemo(() => Math.round((data?.link.maxUploadBytes || 4194304) / 1024 / 1024), [data])
  const uploadTitle = data?.folderConfig?.title || 'Carica file'
  const uploadDescription = data?.folderConfig?.description || 'Carica i file richiesti nella cartella corretta.'
  const uploadAccept = data?.folderConfig?.accept || 'image/*,video/*,application/pdf'
  const primaryAction = data?.folderConfig?.primaryAction || '📁 Carica file'
  const secondaryAction = data?.folderConfig?.secondaryAction || '📷 Fotocamera'
  const allowCamera = data?.folderConfig?.allowCamera !== false
  const allowVideo = Boolean(data?.folderConfig?.allowVideo)

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
        folderConfig: payload.folderConfig,
        property: payload.property,
      })
      setNotice('')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento link.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInfo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function uploadFiles(fileList: FileList | null) {
    const files = Array.from(fileList ?? [])

    if (files.length === 0) return

    const maxBytes = data?.link.maxUploadBytes || 4194304
    const tooLarge = files.find((file) => file.size > maxBytes)

    if (tooLarge) {
      setNotice(`File troppo grande: ${tooLarge.name}. Limite attuale ${maxMb} MB.`)
      return
    }

    const formData = new FormData()

    for (const file of files) {
      formData.append('files', file)
    }

    setUploading(true)
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
      setNotice(`Upload completato: ${files.length} file caricati in "${data?.link.targetFolderName}".`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore upload.')
    } finally {
      setUploading(false)
    }
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
          <p className="mt-2 text-sm leading-6 text-[#E5E7EB]/70">{notice || 'Il link non è valido o non è più attivo.'}</p>
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
            {uploadTitle}
          </h1>

          <div className="mt-4 rounded-3xl border border-[#374151] bg-[#111827]/68 p-4">
            <p className="text-sm font-bold text-white">{propertyTitle}</p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              {propertyRef ? `Rif. ${propertyRef}` : 'Riferimento non indicato'}
              {location ? ` · ${location}` : ''}
            </p>
            <p className="mt-3 rounded-2xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 px-3 py-2 text-xs font-bold text-[#A3BE8C]">
              Destinazione: {data.link.targetFolderName}
            </p>
          </div>
        </header>

        <section className="mt-5 flex-1 rounded-[30px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-2xl shadow-black/25">
          <p className="text-sm leading-6 text-[#D1D5DB]/72">
            {uploadDescription} AI-OS caricherà tutto nella cartella Drive corretta senza mostrare Drive grezzo.
          </p>

          <div className="mt-5 grid gap-3">
            {allowCamera ? (
              <label className="flex min-h-20 cursor-pointer items-center justify-center rounded-3xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-5 py-4 text-base font-black text-[#101820] shadow-[0_0_28px_rgba(163,190,140,0.20)] transition active:scale-[0.99]">
                {secondaryAction}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void uploadFiles(event.currentTarget.files)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            ) : null}

            {allowVideo ? (
              <label className="flex min-h-20 cursor-pointer items-center justify-center rounded-3xl border border-[#88C0D0]/45 bg-[#88C0D0]/14 px-5 py-4 text-base font-black text-[#AECBFA] transition active:scale-[0.99]">
                🎥 Video
                <input
                  type="file"
                  accept="video/*"
                  capture="environment"
                  className="hidden"
                  disabled={uploading}
                  onChange={(event) => {
                    void uploadFiles(event.currentTarget.files)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            ) : null}

            <label className="flex min-h-20 cursor-pointer items-center justify-center rounded-3xl border border-[#8FBCBB]/35 bg-[#8FBCBB]/10 px-5 py-4 text-base font-black text-[#8FBCBB] transition active:scale-[0.99]">
              {primaryAction}
              <input
                type="file"
                multiple
                accept={uploadAccept}
                className="hidden"
                disabled={uploading}
                onChange={(event) => {
                  void uploadFiles(event.currentTarget.files)
                  event.currentTarget.value = ''
                }}
              />
            </label>
          </div>

          <div className="mt-5 rounded-3xl border border-[#374151] bg-[#111827]/70 p-4">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8FBCBB]/70">
              Stato
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#E5E7EB]">
              {uploading ? 'Upload in corso...' : notice || 'Pronto per caricare.'}
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
