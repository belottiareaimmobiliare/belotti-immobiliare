'use client'

import { FormEvent, useState } from 'react'

type Props = {
  adminName: string
  adminEmail: string
}

export default function KpiCleanupPanel({ adminName, adminEmail }: Props) {
  const [step, setStep] = useState<'idle' | 'verify' | 'done'>('idle')
  const [verificationId, setVerificationId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function requestCode() {
    const confirmed = window.confirm(
      'Vuoi richiedere il codice per pulire lo storico KPI? L’operazione andrà poi confermata con codice email.'
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const response = await fetch('/api/admin/kpi/request-clean-code', {
      method: 'POST',
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Invio codice non riuscito.')
      return
    }

    setVerificationId(data.verificationId || '')
    setStep('verify')
    setMessage(`Codice inviato a ${data.email || adminEmail}.`)
  }

  async function verifyAndClean(event: FormEvent) {
    event.preventDefault()

    const cleanCode = code.replace(/\D/g, '').slice(0, 4)

    if (cleanCode.length !== 4) {
      setErrorMessage('Inserisci il codice completo a 4 cifre.')
      return
    }

    const confirmed = window.confirm(
      'Confermi la pulizia dello storico KPI? Dopo la conferma lo storico attività verrà azzerato.'
    )

    if (!confirmed) return

    setLoading(true)
    setMessage('')
    setErrorMessage('')

    const response = await fetch('/api/admin/kpi/verify-clean-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verificationId, code: cleanCode }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Pulizia KPI non riuscita.')
      return
    }

    setStep('done')
    setMessage(`Pulizia KPI completata. Record attività rimossi: ${data.cleanedCount ?? 0}.`)
  }

  return (
    <section className="rounded-[30px] border border-red-300 bg-red-100 p-6 text-red-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-red-900/70">
            Zona protetta
          </p>

          <h2 className="mt-2 text-2xl font-semibold text-red-950">
            Pulisci KPI
          </h2>

          <p className="mt-3 max-w-3xl text-sm leading-7 text-red-950/75">
            Questa azione pulisce lo storico attività usato nei KPI. Non elimina immobili,
            utenti, lead o ricerche salvate. Per confermare serve un codice a 4 cifre
            inviato via email all’amministratore che sta eseguendo l’operazione.
          </p>

          <p className="mt-3 text-xs text-red-950/65">
            Utente: <strong>{adminName}</strong> · Email conferma: <strong>{adminEmail || '-'}</strong>
          </p>
        </div>

        {step === 'idle' ? (
          <button
            type="button"
            onClick={requestCode}
            disabled={loading}
            className="rounded-full border border-red-300 bg-red-200 px-5 py-3 text-sm font-semibold text-red-950 transition hover:bg-red-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Invio codice...' : 'Richiedi codice pulizia'}
          </button>
        ) : null}
      </div>

      {step === 'verify' ? (
        <form onSubmit={verifyAndClean} className="mt-5 grid gap-3 md:grid-cols-[220px_1fr]">
          <input
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="0000"
            required
            className="rounded-2xl border border-red-300 bg-white px-4 py-4 text-center text-3xl tracking-[0.45em] text-red-950 outline-none placeholder:text-red-950/30 focus:border-red-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl border border-red-950 bg-red-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Pulizia in corso...' : 'Conferma codice e pulisci KPI'}
          </button>
        </form>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-sm text-emerald-950">
          {message}
        </p>
      ) : null}

      {errorMessage ? (
        <p className="mt-4 rounded-2xl border border-red-400 bg-red-200 px-4 py-3 text-sm text-red-950">
          {errorMessage}
        </p>
      ) : null}
    </section>
  )
}
