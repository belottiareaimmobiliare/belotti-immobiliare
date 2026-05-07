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
          'Vuoi eliminare definitivamente questa ricerca salvata? Operazione consigliata solo per duplicati o test.',
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
      className="rounded-[1.5rem] border border-red-300 bg-red-50 p-5 shadow-sm"
    >
      <input type="hidden" name="id" value={savedSearchId} />

      <p className="text-base font-semibold text-red-950">
        Zona eliminazione
      </p>

      <p className="mt-3 text-sm leading-6 text-red-900/75">
        Usa questa azione solo per ricerche duplicate, test o richieste inserite per errore.
      </p>

      <button
        type="submit"
        className="mt-5 w-full rounded-full border border-red-300 bg-red-100 px-5 py-3 text-sm font-semibold text-red-950 transition hover:bg-red-200"
      >
        Elimina ricerca
      </button>
    </form>
  )
}
