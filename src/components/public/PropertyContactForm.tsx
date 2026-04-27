'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type Props = {
  propertyId: string
  propertySlug: string | null
  propertyTitle: string | null
}

function formatCountdown(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export default function PropertyContactForm({
  propertyId,
  propertySlug,
  propertyTitle,
}: Props) {
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [code, setCode] = useState('')

  const [privacyAccepted, setPrivacyAccepted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [expiresIn, setExpiresIn] = useState(0)

  const codeExpired = useMemo(() => {
    return step === 'verify' && expiresIn <= 0
  }, [step, expiresIn])

  useEffect(() => {
    if (step !== 'verify' || expiresIn <= 0) return

    const timer = window.setInterval(() => {
      setExpiresIn((current) => Math.max(0, current - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [step, expiresIn])

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault()

    const cleanedName = fullName.trim()
    const cleanedEmail = email.trim().toLowerCase()
    const cleanedPhone = phone.trim()
    const cleanedMessage = message.trim()

    setErrorMessage('')
    setSuccessMessage('')

    if (!cleanedName || !cleanedEmail || !cleanedPhone) {
      setErrorMessage('Compila nome, email e cellulare per inviare la richiesta.')
      return
    }

    if (!privacyAccepted) {
      setErrorMessage('Per proseguire devi accettare l’informativa privacy.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/leads/request-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          propertySlug,
          propertyTitle,
          fullName: cleanedName,
          email: cleanedEmail,
          phone: cleanedPhone,
          message: cleanedMessage,
          privacyAccepted,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Errore invio codice.')
        return
      }

      setStep('verify')
      setExpiresIn(10 * 60)
      setSuccessMessage('Ti abbiamo inviato un codice di verifica via mail.')
    } catch {
      setErrorMessage('Errore invio codice.')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault()

    const cleanedEmail = email.trim().toLowerCase()
    const cleanCode = code.replace(/\D/g, '').slice(0, 4)

    setErrorMessage('')
    setSuccessMessage('')

    if (cleanCode.length !== 4) {
      setErrorMessage('Inserisci il codice completo a 4 cifre.')
      return
    }

    if (codeExpired) {
      setErrorMessage('Il codice è scaduto. Torna al form e richiedine uno nuovo.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/leads/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          email: cleanedEmail,
          code: cleanCode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrorMessage(data.error || 'Codice non valido.')
        return
      }

      setStep('done')
      setSuccessMessage('Richiesta verificata e inviata correttamente.')
    } catch {
      setErrorMessage('Errore verifica codice.')
    } finally {
      setLoading(false)
    }
  }

  function resetToForm() {
    setStep('form')
    setCode('')
    setExpiresIn(0)
    setErrorMessage('')
    setSuccessMessage('')
  }

  if (step === 'done') {
    return (
      <div className="mt-6">
        <div className="rounded-2xl border border-emerald-500/45 bg-emerald-950/55 px-4 py-4 text-sm leading-7 text-emerald-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {successMessage || 'Richiesta verificata e inviata correttamente.'}
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
        <div className="rounded-2xl border border-sky-400/45 bg-sky-950/60 px-4 py-4 text-sm leading-7 text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          Inserisci il codice di verifica che ti abbiamo inviato via mail.
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <label className="block text-sm text-[var(--site-text-soft)]">
              Codice di verifica <span className="text-red-400">*</span>
            </label>

            <span
              className={`rounded-full border px-3 py-1 text-xs ${
                codeExpired
                  ? 'border-red-400/40 bg-red-500/10 text-red-200'
                  : 'border-[var(--site-border)] bg-[var(--site-surface-strong)] text-[var(--site-text-muted)]'
              }`}
            >
              {codeExpired
                ? 'Codice scaduto'
                : `Scade tra ${formatCountdown(expiresIn)}`}
            </span>
          </div>

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
            className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 text-center text-3xl tracking-[0.45em] text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
          />

          <p className="mt-2 text-xs text-[var(--site-text-faint)]">
            Inserisci le 4 cifre ricevute via email.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-red-500/45 bg-red-950/55 px-4 py-4 text-sm leading-7 text-red-50">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || codeExpired}
          className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Verifica in corso...' : 'Conferma codice'}
        </button>

        <button
          type="button"
          onClick={resetToForm}
          disabled={loading}
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-5 py-3 text-sm font-semibold text-[var(--site-text-soft)] transition hover:bg-[var(--site-surface)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Torna al form
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
      <p className="text-xs italic leading-6 text-[var(--site-text-faint)]">
        I campi contrassegnati con <span className="text-red-400">*</span> sono obbligatori.
      </p>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Nome e cognome <span className="text-red-400">*</span>
        </label>
        <input
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Mario Rossi"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Email <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="nome@email.it"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
        />
        <p className="mt-2 text-xs text-[var(--site-text-faint)]">
          Riceverai qui il codice di verifica a 4 cifre.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Cellulare <span className="text-red-400">*</span>
        </label>
        <input
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="333 1234567"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Messaggio
        </label>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Scrivi qui la tua richiesta"
          rows={5}
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
        />
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-xs leading-6 text-[var(--site-text-muted)]">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(event) => setPrivacyAccepted(event.target.checked)}
          className="mt-1"
        />
        <span>
          Acconsento al trattamento dei dati per essere ricontattato dall’agenzia e dichiaro di aver letto la{' '}
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold text-[var(--site-text)] underline underline-offset-4"
          >
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-500/45 bg-emerald-950/55 px-4 py-4 text-sm leading-7 text-emerald-50">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-500/45 bg-red-950/55 px-4 py-4 text-sm leading-7 text-red-50">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading || !privacyAccepted}
        className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Invio codice...' : 'Invia richiesta'}
      </button>
    </form>
  )
}
