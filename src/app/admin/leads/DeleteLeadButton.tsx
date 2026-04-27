'use client'

type DeleteLeadButtonProps = {
  leadId: string
  deleteAction: (formData: FormData) => void | Promise<void>
}

export default function DeleteLeadButton({
  leadId,
  deleteAction,
}: DeleteLeadButtonProps) {
  return (
    <form
      action={deleteAction}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          'Vuoi eliminare definitivamente questo lead? Operazione consigliata solo per duplicati o test.'
        )

        if (!confirmed) {
          event.preventDefault()
        }
      }}
      className="mt-4 rounded-3xl border border-red-400/20 bg-red-500/10 p-4"
    >
      <input type="hidden" name="id" value={leadId} />

      <p className="text-sm font-semibold text-red-900">
        Zona eliminazione
      </p>

      <p className="mt-2 text-xs leading-5 text-red-900/65">
        Usa questa azione solo per lead duplicati, test o richieste inserite per errore.
      </p>

      <button
        type="submit"
        className="mt-3 w-full rounded-full border border-red-300/30 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-950 transition hover:bg-red-500/30"
      >
        Elimina lead
      </button>
    </form>
  )
}
