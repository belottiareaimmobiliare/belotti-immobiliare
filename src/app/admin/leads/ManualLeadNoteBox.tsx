'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { createManualLeadFromNote } from './actions'

type ManualLeadNoteBoxProps = {
  propertyId: string
  propertyTitle: string
  previewHref: string
}

export default function ManualLeadNoteBox({
  propertyId,
  propertyTitle,
  previewHref,
}: ManualLeadNoteBoxProps) {
  const storageKey = useMemo(
    () => `belotti-lead-note-draft-${propertyId}`,
    [propertyId],
  )

  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(storageKey)

    if (savedDraft) {
      setNote(savedDraft)
    }
  }, [storageKey])

  useEffect(() => {
    window.localStorage.setItem(storageKey, note)
  }, [note, storageKey])

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
        setFeedback('Lead nota salvato. Lo trovi nella lista interessati sotto questo immobile.')
      })
    })
  }

  function openWithNote() {
    const url = new URL(previewHref, window.location.origin)
    const cleanNote = note.trim()

    if (cleanNote) {
      url.searchParams.set('note', cleanNote)
      window.localStorage.setItem(storageKey, cleanNote)
    }

    window.location.href = url.toString()
  }

  return (
    <div className="mt-4 w-full rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4 lg:w-[520px]">
      <p className="text-sm font-semibold text-[var(--site-text)]">
        Inserisci nota interessato
      </p>

      <p className="mt-2 text-xs leading-5 text-[var(--site-text-faint)]">
        Scrivi liberamente nome, telefono, email e nota. Puoi salvarla subito oppure aprire la scheda pubblica con nota fluttuante per continuare a prendere appunti.
      </p>

      <textarea
        value={note}
        onChange={(event) => {
          setNote(event.target.value)
          setFeedback(null)
        }}
        rows={5}
        placeholder={`Mario Rossi 3331234567 mario@email.it\nHa chiamato per ${propertyTitle}, vuole fissare una visita sabato mattina.`}
        className="mt-4 w-full resize-y rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm leading-6 text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
      />

      {feedback ? (
        <p className="mt-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-xs leading-5 text-[var(--site-text)]">
          {feedback}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={saveNote}
          disabled={isPending}
          className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Salvataggio...' : 'Salva lead nota'}
        </button>

        <button
          type="button"
          onClick={openWithNote}
          className="rounded-full border border-amber-400/35 bg-amber-400/10 px-5 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:border-amber-300/70 hover:bg-amber-400/20"
        >
          Apri + nota
        </button>
      </div>
    </div>
  )
}
