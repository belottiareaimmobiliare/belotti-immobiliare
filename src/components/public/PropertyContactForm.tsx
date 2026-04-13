'use client'

import { FormEvent, useState } from 'react'

type Props = {
  propertyId: string
  propertySlug: string | null
  propertyTitle: string | null
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

  const [verificationCode, setVerificationCode] = useState('')

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    const cleanedName = fullName.trim()
    const cleanedEmail = email.trim()
    const cleanedPhone = phone.trim()
    const cleanedMessage = message.trim()

    if (!cleanedName || !cleanedEmail || !cleanedPhone) {
      setLoading(false)
      setErrorMessage('Compila tutti i campi obbligatori: nome, email e cellulare.')
      return
    }

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
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Invio codice non riuscito.')
      return
    }

    setStep('verify')
    setSuccessMessage('Ti abbiamo inviato un codice di verifica via mail.')
  }

  const handleVerifyCode = async (e: FormEvent) => {
    e.preventDefault()

    setLoading(true)
    setSuccessMessage('')
    setErrorMessage('')

    const cleanCode = verificationCode.replace(/\D/g, '').slice(0, 4)

    if (cleanCode.length !== 4) {
      setLoading(false)
      setErrorMessage('Inserisci il codice completo a 4 cifre.')
      return
    }

    const response = await fetch('/api/leads/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId,
        email,
        code: cleanCode,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Verifica non riuscita.')
      return
    }

    setStep('done')
    setSuccessMessage('Richiesta verificata ed inviata correttamente.')
  }

  if (step === 'done') {
    return (
      <div className="mt-6 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-700 dark:text-emerald-100">
        {successMessage || 'Richiesta inviata correttamente.'}
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <form onSubmit={handleVerifyCode} className="mt-6 space-y-4">
        <div className="rounded-2xl border border-sky-400/25 bg-sky-500/10 px-4 py-4 text-sm text-sky-700 dark:text-sky-100">
          Inserisci il codice di verifica che ti abbiamo inviato via mail.
        </div>

        <div>
          <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
            Codice di verifica <span className="text-red-500">*</span>
          </label>

          <input
            value={verificationCode}
            onChange={(e) =>
              setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 4))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="0000"
            required
            className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 text-center text-3xl tracking-[0.5em] text-[var(--site-text)] placeholder:text-[var(--site-text-faint)]"
          />

          <p className="mt-2 text-xs text-[var(--site-text-faint)]">
            Inserisci le 4 cifre ricevute via email.
          </p>
        </div>

        {successMessage ? (
          <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="theme-button-primary liquid-button w-full rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span>{loading ? 'Verifica in corso...' : 'Conferma codice'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStep('form')
            setVerificationCode('')
            setErrorMessage('')
            setSuccessMessage('')
          }}
          className="theme-button-secondary liquid-button w-full rounded-2xl px-5 py-3 text-sm transition"
        >
          <span>Torna al form</span>
        </button>
      </form>
    )
  }

  return (
    <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
      <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-xs text-[var(--site-text-muted)]">
        I campi contrassegnati con <span className="text-red-500">*</span> sono obbligatori.
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Nome e cognome <span className="text-red-500">*</span>
        </label>
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Mario Rossi"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] placeholder:text-[var(--site-text-faint)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nome@email.it"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] placeholder:text-[var(--site-text-faint)]"
        />
        <p className="mt-2 text-xs text-[var(--site-text-faint)]">
          Riceverai qui il codice di verifica a 4 cifre.
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Cellulare <span className="text-red-500">*</span>
        </label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="333 1234567"
          required
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] placeholder:text-[var(--site-text-faint)]"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm text-[var(--site-text-soft)]">
          Messaggio
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Scrivi qui la tua richiesta"
          rows={5}
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] placeholder:text-[var(--site-text-faint)]"
        />
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-100">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-100">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="theme-button-primary liquid-button w-full rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span>{loading ? 'Invio codice...' : 'Invia richiesta'}</span>
      </button>
    </form>
  )
}