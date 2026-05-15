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

type ShareLink = {
  id: string
  token: string
  property_id: string
  target_folder_name: string
  recipient_name?: string | null
  recipient_email?: string | null
  recipient_role: string
  is_active: boolean
  expires_at?: string | null
  use_count: number
  created_at: string
  property?: {
    title?: string | null
    reference_code?: string | null
    comune?: string | null
    province?: string | null
  } | null
}

export const dynamic = 'force-dynamic'

const roleFolderConfigs = {
  photographer: {
    label: 'Fotografo',
    targetFolderName: 'Bozze Immagini e Video',
    helper: 'Solo foto e video nella cartella bozze dell’immobile.',
  },
  owner: {
    label: 'Proprietario immobile',
    targetFolderName: 'Documenti Proprietario',
    helper: 'Solo documenti del proprietario: PDF, foto documenti, file richiesti.',
  },
  collaborator: {
    label: 'Collaboratore / tecnico',
    targetFolderName: 'Documenti e Planimetrie',
    helper: 'Materiale tecnico: planimetrie, PDF, immagini e documenti.',
  },
  client: {
    label: 'Cliente',
    targetFolderName: 'Documenti Cliente',
    helper: 'Documenti cliente collegati alla pratica.',
  },
}

function getRoleFolderConfig(role: string) {
  return roleFolderConfigs[role as keyof typeof roleFolderConfigs] ?? roleFolderConfigs.photographer
}


export default function AIOSCondivisioniPage() {
  const [folders, setFolders] = useState<WorkspaceFolder[]>([])
  const [links, setLinks] = useState<ShareLink[]>([])
  const [propertyId, setPropertyId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientRole, setRecipientRole] = useState('photographer')
  const [targetFolderName, setTargetFolderName] = useState('Bozze Immagini e Video')
  const [expiresInDays, setExpiresInDays] = useState('14')
  const [generatedUrl, setGeneratedUrl] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const readyFolders = useMemo(() => {
    return folders.filter((folder) => {
      const id = folder.driveFolder?.drive_folder_id || ''
      return id && !id.startsWith('aios-property-')
    })
  }, [folders])

  const selectedRoleConfig = useMemo(() => getRoleFolderConfig(recipientRole), [recipientRole])

  async function loadAll() {
    setLoading(true)
    setNotice('')

    try {
      const [foldersResponse, linksResponse] = await Promise.all([
        fetch('/api/admin/ai-os/workspace/immobili', { cache: 'no-store' }),
        fetch('/api/admin/ai-os/share-links', { cache: 'no-store' }),
      ])

      const foldersPayload = await foldersResponse.json().catch(() => null)
      const linksPayload = await linksResponse.json().catch(() => null)

      if (!foldersResponse.ok) {
        throw new Error(foldersPayload?.error || 'Errore caricamento immobili')
      }

      if (!linksResponse.ok) {
        throw new Error(linksPayload?.error || 'Errore caricamento link')
      }

      setFolders(Array.isArray(foldersPayload?.folders) ? foldersPayload.folders : [])
      setLinks(Array.isArray(linksPayload?.links) ? linksPayload.links : [])
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento condivisioni')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadAll()
  }, [])

  async function createLink() {
    setCreating(true)
    setGeneratedUrl('')
    setNotice('Creo link AI-OS...')

    try {
      const response = await fetch('/api/admin/ai-os/share-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          recipientName,
          recipientEmail,
          recipientRole,
          targetFolderName,
          expiresInDays,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok || !payload?.ok) {
        throw new Error(payload?.error || 'Errore creazione link')
      }

      setGeneratedUrl(payload.shareUrl)
      setNotice('Link AI-OS creato.')
      await loadAll()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore creazione link')
    } finally {
      setCreating(false)
    }
  }

  async function copyUrl() {
    if (!generatedUrl) return

    try {
      await navigator.clipboard.writeText(generatedUrl)
      setNotice('Link copiato.')
    } catch {
      setNotice(generatedUrl)
    }
  }

  return (
    <main className="min-h-screen bg-[#111827] px-4 py-6 text-[#E5E7EB] md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 rounded-[28px] border border-[#8FBCBB]/20 bg-[#1F2937]/86 p-5 shadow-2xl shadow-black/30">
          <p className="text-xs font-bold uppercase tracking-[0.35em] text-[#8FBCBB]/75">
            AI-OS / Condivisioni
          </p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">
            Link upload fotografi e collaboratori
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#D1D5DB]/68">
            Genera un link AI-OS Mobile: chi lo apre carica foto/video nella cartella Drive corretta senza vedere Drive grezzo.
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
              onClick={() => void loadAll()}
              className="rounded-full border border-[#A3BE8C]/40 bg-[#A3BE8C]/12 px-4 py-2 text-sm font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
            >
              Aggiorna
            </button>
          </div>
        </header>

        {notice ? (
          <div className="mb-5 rounded-2xl border border-[#8FBCBB]/20 bg-[#0B1220]/90 px-4 py-3 text-sm font-semibold text-[#D8DEE9]">
            {notice}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-[28px] border border-[#8FBCBB]/15 bg-[#1F2937]/70 p-8 text-sm font-semibold text-[#D1D5DB]/70">
            Caricamento condivisioni...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)]">
            <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Nuovo link
              </p>
              <h2 className="mt-1 text-xl font-black text-white">Cartella AI-OS Mobile</h2>

              <div className="mt-5 space-y-3">
                <select
                  value={propertyId}
                  onChange={(event) => setPropertyId(event.target.value)}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                >
                  <option value="">Seleziona immobile...</option>
                  {readyFolders.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.propertyRef ? `${folder.propertyRef} - ` : ''}{folder.name}
                    </option>
                  ))}
                </select>

                <input
                  value={targetFolderName}
                  onChange={(event) => setTargetFolderName(event.target.value)}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                  placeholder={selectedRoleConfig.targetFolderName}
                />

                <input
                  value={recipientName}
                  onChange={(event) => setRecipientName(event.target.value)}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                  placeholder="Nome destinatario"
                />

                <input
                  value={recipientEmail}
                  onChange={(event) => setRecipientEmail(event.target.value)}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                  placeholder="Email destinatario opzionale"
                />

                <select
                  value={recipientRole}
                  onChange={(event) => {
                    const nextRole = event.target.value
                    const nextConfig = getRoleFolderConfig(nextRole)

                    setRecipientRole(nextRole)
                    setTargetFolderName(nextConfig.targetFolderName)
                  }}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition focus:border-[#8FBCBB]/60"
                >
                  <option value="photographer">Fotografo → Bozze Immagini e Video</option>
                  <option value="owner">Proprietario → Documenti Proprietario</option>
                  <option value="collaborator">Collaboratore / tecnico → Documenti e Planimetrie</option>
                  <option value="client">Cliente → Documenti Cliente</option>
                </select>

                <div className="rounded-2xl border border-[#8FBCBB]/20 bg-[#8FBCBB]/10 px-4 py-3 text-xs font-semibold leading-5 text-[#BFE8E5]">
                  {selectedRoleConfig.helper}
                </div>

                <input
                  value={expiresInDays}
                  onChange={(event) => setExpiresInDays(event.target.value)}
                  className="w-full rounded-2xl border border-[#374151] bg-[#111827] px-4 py-3 text-sm font-semibold text-white outline-none transition placeholder:text-[#6B7280] focus:border-[#8FBCBB]/60"
                  placeholder="Scadenza in giorni, es. 14"
                />

                <button
                  type="button"
                  disabled={creating}
                  onClick={createLink}
                  className="w-full rounded-2xl border border-[#A3BE8C]/55 bg-[#A3BE8C] px-4 py-3 text-sm font-black text-[#101820] transition hover:bg-[#111827] hover:text-[#A3BE8C] disabled:cursor-wait disabled:opacity-60"
                >
                  {creating ? 'Creo link...' : 'Genera link AI-OS'}
                </button>
              </div>

              {generatedUrl ? (
                <div className="mt-5 rounded-3xl border border-[#A3BE8C]/25 bg-[#A3BE8C]/10 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#A3BE8C]">
                    Link generato
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-white">
                    {generatedUrl}
                  </p>
                  <button
                    type="button"
                    onClick={copyUrl}
                    className="mt-3 rounded-full border border-[#A3BE8C]/45 bg-[#A3BE8C]/12 px-4 py-2 text-xs font-bold text-[#A3BE8C] transition hover:bg-[#A3BE8C]/20"
                  >
                    Copia link
                  </button>
                </div>
              ) : null}

              {readyFolders.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-[#EBCB8B]/25 bg-[#EBCB8B]/10 p-4 text-sm leading-6 text-[#EBCB8B]">
                  Nessun immobile con cartella Drive reale pronta. Prima crea/sincronizza le cartelle Drive.
                </div>
              ) : null}
            </section>

            <section className="rounded-[28px] border border-[#8FBCBB]/18 bg-[#1F2937]/82 p-5 shadow-xl shadow-black/20">
              <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#8FBCBB]/65">
                Link recenti
              </p>
              <h2 className="mt-1 text-xl font-black text-white">Condivisioni attive</h2>

              <div className="mt-5 space-y-3">
                {links.length > 0 ? (
                  links.map((link) => {
                    const title = link.property?.title || 'Immobile'
                    const ref = link.property?.reference_code
                    const location = [link.property?.comune, link.property?.province].filter(Boolean).join(' · ')

                    return (
                      <div key={link.id} className="rounded-3xl border border-[#374151] bg-[#111827]/72 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-base font-bold text-white">
                              {title}
                            </p>
                            <p className="mt-1 text-xs text-[#9CA3AF]">
                              {ref ? `Rif. ${ref} · ` : ''}{location || 'Località non indicata'}
                            </p>
                            <p className="mt-2 text-xs font-semibold text-[#8FBCBB]">
                              Cartella: {link.target_folder_name}
                            </p>
                            <p className="mt-1 text-xs text-[#9CA3AF]">
                              Destinatario: {link.recipient_name || link.recipient_email || link.recipient_role}
                            </p>
                          </div>

                          <div className="shrink-0 text-left md:text-right">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                              link.is_active
                                ? 'bg-[#A3BE8C]/13 text-[#A3BE8C]'
                                : 'bg-[#BF616A]/13 text-[#FFCCD2]'
                            }`}>
                              {link.is_active ? 'Attivo' : 'Disattivo'}
                            </span>
                            <p className="mt-2 text-xs text-[#9CA3AF]">
                              Utilizzi: {link.use_count || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="rounded-3xl border border-[#374151] bg-[#111827]/64 p-6 text-sm text-[#D1D5DB]/65">
                    Nessun link creato.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  )
}
