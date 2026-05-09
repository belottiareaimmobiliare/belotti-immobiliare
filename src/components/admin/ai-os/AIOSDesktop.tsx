'use client'

import { ChangeEvent, DragEvent, useMemo, useState } from 'react'

type AIOSFileKind = 'image' | 'video' | 'pdf' | 'txt' | 'plan' | 'generic'

type AIOSFile = {
  id: string
  name: string
  kind: AIOSFileKind
  size?: string
  content?: string
  status?: 'saved' | 'local'
}

type AIOSFolder = {
  id: string
  name: string
  propertyRef: string
  address: string
  owner: string
  files: AIOSFile[]
}

const initialFolders: AIOSFolder[] = [
  {
    id: 'immobile-001',
    name: 'Trilocale Bergamo Centro',
    propertyRef: 'AI-001',
    address: 'Bergamo - Via Locatelli',
    owner: 'Admin',
    files: [
      {
        id: 'txt-001',
        name: 'note-fotografo.txt',
        kind: 'txt',
        size: '2 KB',
        status: 'saved',
        content:
          'Note sopralluogo:\n- fotografare soggiorno con luce naturale\n- fare video ingresso > zona giorno > terrazzo\n- controllare che le planimetrie siano leggibili',
      },
      {
        id: 'img-001',
        name: 'copertina-demo.jpg',
        kind: 'image',
        size: '1.8 MB',
        status: 'saved',
      },
      {
        id: 'plan-001',
        name: 'planimetria-demo.pdf',
        kind: 'plan',
        size: '860 KB',
        status: 'saved',
      },
    ],
  },
  {
    id: 'immobile-002',
    name: 'Villa con giardino',
    propertyRef: 'AI-002',
    address: 'Bergamo provincia',
    owner: 'Agente',
    files: [
      {
        id: 'txt-002',
        name: 'istruzioni-video.txt',
        kind: 'txt',
        size: '1 KB',
        status: 'saved',
        content:
          'Video richiesti:\n- esterno cancello e giardino\n- zona giorno\n- camere\n- box\n- vista dal balcone',
      },
    ],
  },
  {
    id: 'immobile-003',
    name: 'Attico panoramico',
    propertyRef: 'AI-003',
    address: 'Bergamo alta',
    owner: 'Agente',
    files: [],
  },
]

function getFileKind(file: File): AIOSFileKind {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  if (file.type === 'application/pdf') return 'pdf'
  if (file.name.toLowerCase().endsWith('.txt')) return 'txt'
  return 'generic'
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function iconForFile(kind: AIOSFileKind) {
  switch (kind) {
    case 'image':
      return '🖼️'
    case 'video':
      return '🎥'
    case 'pdf':
      return '📄'
    case 'plan':
      return '📐'
    case 'txt':
      return '📝'
    default:
      return '📦'
  }
}

export default function AIOSDesktop() {
  const [folders, setFolders] = useState<AIOSFolder[]>(initialFolders)
  const [activeFolderId, setActiveFolderId] = useState<string>(initialFolders[0]?.id ?? '')
  const [selectedTxtId, setSelectedTxtId] = useState<string | null>(null)
  const [txtDraft, setTxtDraft] = useState('')
  const [notice, setNotice] = useState('AI-OS inizializzato. Modalità demo locale attiva.')

  const activeFolder = useMemo(
    () => folders.find((folder) => folder.id === activeFolderId) ?? null,
    [folders, activeFolderId],
  )

  const selectedTxt = useMemo(() => {
    if (!activeFolder || !selectedTxtId) return null
    return activeFolder.files.find((file) => file.id === selectedTxtId && file.kind === 'txt') ?? null
  }, [activeFolder, selectedTxtId])

  const addFilesToActiveFolder = (files: File[]) => {
    if (!activeFolderId || files.length === 0) return

    const newFiles: AIOSFile[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      kind: getFileKind(file),
      size: formatFileSize(file.size),
      status: 'local',
      content: file.name.toLowerCase().endsWith('.txt') ? '' : undefined,
    }))

    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === activeFolderId
          ? {
              ...folder,
              files: [...newFiles, ...folder.files],
            }
          : folder,
      ),
    )

    setNotice(
      `${newFiles.length} file aggiunto/i alla cartella "${activeFolder?.name ?? 'immobile'}". Upload reale da collegare a Supabase.`,
    )
  }

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    addFilesToActiveFolder(Array.from(event.dataTransfer.files))
  }

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    addFilesToActiveFolder(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  const openTxtEditor = (file: AIOSFile) => {
    setSelectedTxtId(file.id)
    setTxtDraft(file.content ?? '')
    setNotice(`Editor aperto: ${file.name}`)
  }

  const saveTxtDraft = () => {
    if (!activeFolder || !selectedTxt) return

    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === activeFolder.id
          ? {
              ...folder,
              files: folder.files.map((file) =>
                file.id === selectedTxt.id
                  ? {
                      ...file,
                      content: txtDraft,
                      status: 'saved',
                      size: `${Math.max(1, Math.ceil(txtDraft.length / 1024))} KB`,
                    }
                  : file,
              ),
            }
          : folder,
      ),
    )

    setNotice(`File "${selectedTxt.name}" salvato nella cartella demo.`)
  }

  const createTxtFile = () => {
    if (!activeFolderId) return

    const fileName = `nuova-nota-${new Date().toISOString().slice(0, 10)}.txt`
    const newFile: AIOSFile = {
      id: `txt-${Date.now()}`,
      name: fileName,
      kind: 'txt',
      size: '1 KB',
      status: 'local',
      content: '',
    }

    setFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === activeFolderId
          ? {
              ...folder,
              files: [newFile, ...folder.files],
            }
          : folder,
      ),
    )

    setSelectedTxtId(newFile.id)
    setTxtDraft('')
    setNotice(`Creato nuovo file TXT: ${fileName}`)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#020617] text-emerald-100">
      <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.28),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_34%)]">
        <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:36px_36px]" />

        <header className="relative z-10 flex items-center justify-between border-b border-emerald-300/15 bg-black/35 px-4 py-3 backdrop-blur-xl md:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.45em] text-emerald-300/80">
              Area Immobiliare
            </p>
            <h1 className="text-xl font-semibold text-white md:text-2xl">
              AI-OS Media Desktop
            </h1>
          </div>

          <div className="hidden rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs text-emerald-100 md:block">
            Admin / Proprietà / Agenti / Fotografi
          </div>
        </header>

        <section className="relative z-10 grid min-h-[calc(100vh-66px)] grid-cols-1 gap-4 p-3 pb-20 md:grid-cols-[260px_1fr] md:p-6 md:pb-20">
          <aside className="rounded-3xl border border-emerald-300/15 bg-black/35 p-4 shadow-2xl shadow-black/35 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/70">
                  Cartelle
                </p>
                <h2 className="text-lg font-semibold text-white">Immobili</h2>
              </div>
              <span className="rounded-full bg-emerald-300/15 px-3 py-1 text-xs text-emerald-200">
                {folders.length}
              </span>
            </div>

            <div className="space-y-2">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => {
                    setActiveFolderId(folder.id)
                    setSelectedTxtId(null)
                    setTxtDraft('')
                    setNotice(`Cartella aperta: ${folder.name}`)
                  }}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                    activeFolderId === folder.id
                      ? 'border-amber-300/60 bg-amber-300/15 text-white shadow-lg shadow-amber-900/20'
                      : 'border-emerald-300/10 bg-white/[0.03] text-emerald-100 hover:border-emerald-300/35 hover:bg-emerald-300/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">📁</span>
                    <div>
                      <p className="font-medium leading-tight">{folder.name}</p>
                      <p className="mt-1 text-xs text-emerald-200/65">
                        Rif. {folder.propertyRef} · {folder.files.length} file
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className="relative rounded-3xl border border-emerald-300/15 bg-black/25 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-6">
            <div className="mb-4 rounded-2xl border border-emerald-300/10 bg-black/30 px-4 py-3 text-sm text-emerald-100/85">
              <span className="text-emerald-300">system:</span> {notice}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl border border-emerald-300/15 bg-black/35 p-4 md:col-span-2">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
                      Finestra aperta
                    </p>
                    <h2 className="text-2xl font-semibold text-white">
                      {activeFolder?.name ?? 'Nessuna cartella'}
                    </h2>
                    {activeFolder ? (
                      <p className="mt-1 text-sm text-emerald-100/65">
                        {activeFolder.address} · Proprietario: {activeFolder.owner}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={createTxtFile}
                    className="rounded-full border border-amber-300/40 bg-amber-300/15 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-300/25"
                  >
                    + Nuovo TXT
                  </button>
                </div>

                <div
                  onDrop={handleDrop}
                  onDragOver={(event) => event.preventDefault()}
                  className="min-h-[55vh] rounded-3xl border border-dashed border-emerald-300/30 bg-emerald-950/20 p-4 md:min-h-[65vh]"
                >
                  <div className="mb-4 rounded-2xl border border-emerald-300/10 bg-black/35 p-4">
                    <p className="text-sm font-medium text-white">
                      Trascina qui foto, video, planimetrie o documenti
                    </p>
                    <p className="mt-1 text-xs text-emerald-100/60">
                      In questa fase i file vengono solo simulati nella UI. Nel prossimo step li colleghiamo a Supabase Storage.
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-full bg-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-200">
                        Carica file
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileInput}
                        />
                      </label>

                      <label className="cursor-pointer rounded-full border border-emerald-300/30 bg-black/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/10">
                        Fotocamera
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                      </label>

                      <label className="cursor-pointer rounded-full border border-emerald-300/30 bg-black/30 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/10">
                        Video
                        <input
                          type="file"
                          accept="video/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleFileInput}
                        />
                      </label>
                    </div>
                  </div>

                  {activeFolder && activeFolder.files.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeFolder.files.map((file) => (
                        <button
                          key={file.id}
                          type="button"
                          onClick={() => {
                            if (file.kind === 'txt') openTxtEditor(file)
                            else setNotice(`Selezionato file: ${file.name}`)
                          }}
                          className={`group rounded-2xl border p-4 text-left transition ${
                            selectedTxtId === file.id
                              ? 'border-amber-300/70 bg-amber-300/15'
                              : 'border-emerald-300/10 bg-black/30 hover:border-emerald-300/35 hover:bg-emerald-300/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-3xl">{iconForFile(file.kind)}</span>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">{file.name}</p>
                              <p className="mt-1 text-xs text-emerald-100/55">
                                {file.size ?? '—'} · {file.status === 'local' ? 'locale' : 'salvato'}
                              </p>
                              {file.kind === 'txt' ? (
                                <p className="mt-2 text-xs text-amber-100/80">
                                  clicca per modificare
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-emerald-300/10 bg-black/20 text-center">
                      <div>
                        <p className="text-4xl">📂</p>
                        <p className="mt-3 font-medium text-white">Cartella vuota</p>
                        <p className="mt-1 text-sm text-emerald-100/55">
                          Carica o trascina qui i primi file.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-3xl border border-emerald-300/15 bg-black/35 p-4">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/70">
                    Editor TXT
                  </p>
                  <h3 className="text-lg font-semibold text-white">
                    {selectedTxt?.name ?? 'Nessun file aperto'}
                  </h3>
                </div>

                {selectedTxt ? (
                  <div className="space-y-3">
                    <textarea
                      value={txtDraft}
                      onChange={(event) => setTxtDraft(event.target.value)}
                      className="min-h-[340px] w-full resize-none rounded-2xl border border-emerald-300/15 bg-slate-950/80 p-4 font-mono text-sm text-emerald-100 outline-none ring-0 transition placeholder:text-emerald-100/30 focus:border-amber-300/60"
                      placeholder="Scrivi le note del fotografo..."
                    />

                    <button
                      type="button"
                      onClick={saveTxtDraft}
                      className="w-full rounded-2xl bg-amber-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-amber-200"
                    >
                      Salva TXT
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-300/10 bg-black/25 p-4 text-sm text-emerald-100/60">
                    Apri un file `.txt` dalla cartella per modificarlo.
                  </div>
                )}

                <div className="mt-4 rounded-2xl border border-emerald-300/10 bg-emerald-300/5 p-4 text-xs leading-relaxed text-emerald-100/65">
                  Prossimi collegamenti reali:
                  <br />
                  Supabase Storage, permessi per ruolo, cartelle per immobile, upload automatico da mobile, accesso fotografo con email/password.
                </div>
              </div>
            </div>
          </section>
        </section>

        <footer className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between border-t border-emerald-300/15 bg-black/70 px-4 py-3 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => {
              window.location.href = '/admin'
            }}
            className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-300/20"
          >
            Start &gt; Logout
          </button>

          <div className="hidden text-xs text-emerald-100/55 md:block">
            AI-OS demo · cartelle immobili · media desktop · webapp mobile
          </div>
        </footer>
      </div>
    </main>
  )
}
