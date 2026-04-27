'use client'

type DeleteSavedSearchButtonProps = {
  savedSearchId: string
  deleteAction: (formData: FormData) => void | Promise<void>
}

export default function DeleteSavedSearchButton({
  savedSearchId,
  deleteAction,
}: DeleteSavedSearchButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          'Vuoi eliminare definitivamente questa ricerca salvata? Operazione consigliata solo per duplicati o test.'
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
      className="mt-4 rounded-3xl border border-red-300 bg-red-100 p-4 text-red-950"
    >
      <input type="hidden" name="id" value={savedSearchId} />

      <p className="text-sm font-semibold text-red-950">
        Zona eliminazione
      </p>

      <p className="mt-2 text-xs leading-5 text-red-950/70">
        Usa questa azione solo per ricerche duplicate, test o richieste inserite per errore.
      </p>

      <button
        type="submit"
        className="mt-3 w-full rounded-full border border-red-300 bg-red-200 px-4 py-2.5 text-sm font-semibold text-red-950 transition hover:bg-red-300"
      >
        Elimina ricerca
      </button>
    </form>
  )
}
