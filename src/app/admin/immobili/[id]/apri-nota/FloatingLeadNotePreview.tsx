'use client'

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type PointerEvent,
} from 'react'
import { createManualLeadFromNote } from '@/app/admin/leads/actions'

type FloatingLeadNotePreviewProps = {
  propertyId: string
  propertyTitle: string
  propertySlug: string
  initialNote: string
}

type DragState = {
  offsetX: number
  offsetY: number
}

export default function FloatingLeadNotePreview({
  propertyId,
  propertyTitle,
  propertySlug,
  initialNote,
}: FloatingLeadNotePreviewProps) {
  const storageKey = `belotti-lead-note-draft-${propertyId}`
  const [note, setNote] = useState(initialNote)
  const [position, setPosition] = useState({ x: 24, y: 110 })
  const [visible, setVisible] = useState(true)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dragState = useRef<DragState | null>(null)

  useEffect(() => {
    setPosition({
      x: Math.max(16, window.innerWidth - 500),
      y: 110,
    })
  }, [])

  useEffect(() => {
    if (!initialNote.trim()) {
      const savedDraft = window.localStorage.getItem(storageKey)

      if (savedDraft) {
        setNote(savedDraft)
      }
    }
  }, [initialNote, storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, note)
  }, [note, storageKey])

  useEffect(() => {
    function handleMove(event: globalThis.PointerEvent) {
      if (!dragState.current) return

      setPosition({
        x: Math.max(8, Math.min(window.innerWidth - 180, event.clientX - dragState.current.offsetX)),
        y: Math.max(80, Math.min(window.innerHeight - 120, event.clientY - dragState.current.offsetY)),
      })
    }

    function handleUp() {
      dragState.current = null
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)

    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [])

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const panel = event.currentTarget.parentElement

    if (!panel) return

    const target = event.target as HTMLElement

    if (target.closest('button, a, textarea, input')) {
      return
    }

    const rect = panel.getBoundingClientRect()

    dragState.current = {
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    }

    event.preventDefault()
  }

  function saveNote() {
    const cleanNote = note.trim()

    if (!cleanNote) {
      setFeedback('Scrivi prima una nota da salvare.')
      return
    }

    const formData = new FormData()
    formData.set('property_id', propertyId)
    formData.set('raw_note', cleanNote)

    setFeedback(null)

    startTransition(() => {
      void createManualLeadFromNote(formData).then(() => {
        setFeedback('Lead nota salvato. Puoi continuare ad aggiornare gli appunti o tornare ai leads.')
      })
    })
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className="fixed bottom-6 right-6 z-50 rounded-full border border-amber-400/40 bg-slate-950/90 px-5 py-3 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl transition hover:bg-slate-900"
      >
        Riapri nota
      </button>
    )
  }

  return (
    <aside
      style={{
        left: position.x,
        top: position.y,
        width: 430,
        height: 520,
      }}
      className="fixed z-50 min-h-[360px] min-w-[320px] max-w-[92vw] resize overflow-auto rounded-[28px] border border-white/15 bg-slate-950/85 p-4 text-white opacity-90 shadow-2xl shadow-black/50 backdrop-blur-xl transition hover:opacity-100"
    >
      <div
        onPointerDown={startDrag}
        className="cursor-move rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-white/45">
              Nota lead in corso
            </p>

            <h2 className="mt-1 truncate text-base font-semibold text-white">
              {propertyTitle}
            </h2>

            <p className="mt-1 truncate text-xs text-white/45">
              /immobili/{propertySlug}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setVisible(false)}
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white hover:text-black"
          >
            Chiudi
          </button>
        </div>
      </div>

      <div className="mt-4 flex h-[calc(100%-104px)] flex-col">
        <p className="text-xs leading-5 text-white/55">
          Sposta il box trascinando la testata. Puoi anche ridimensionarlo dall’angolo in basso a destra.
        </p>

        <textarea
          value={note}
          onChange={(event) => {
            setNote(event.target.value)
            setFeedback(null)
          }}
          placeholder="Nome, telefono, email e appunti raccolti durante la telefonata..."
          className="mt-3 min-h-[190px] flex-1 resize-none rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/35 focus:border-amber-300/60"
        />

        {feedback ? (
          <p className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-3 text-xs leading-5 text-emerald-50">
            {feedback}
          </p>
        ) : null}

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={saveNote}
            disabled={isPending}
            className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? 'Salvataggio...' : 'Salva lead nota'}
          </button>

          <a
            href={`/admin/leads?q=${encodeURIComponent(propertyTitle)}`}
            className="inline-flex items-center justify-center rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white hover:text-black"
          >
            Vai ai leads
          </a>
        </div>
      </div>
    </aside>
  )
}
