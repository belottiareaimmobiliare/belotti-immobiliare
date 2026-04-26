'use client'

import { FormEvent, useState } from 'react'

type Props = {
  propertyId: string
  propertySlug: string | null
  propertyTitle: string | null
  contractType: string | null
  propertyType: string | null
  comune: string | null
  province: string | null
  price: number | null
  surface: number | null
  rooms: number | null
  bathrooms: number | null
  hasGarage: boolean | null
  hasParking: boolean | null
  hasGarden: boolean | null
  hasElevator: boolean | null
}

export default function SimilarPropertyAlertForm(props: Props) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const cleanedName = fullName.trim()
    const cleanedEmail = email.trim()
    const cleanedPhone = phone.trim()

    if (!cleanedName || !cleanedEmail) {
      setErrorMessage('Inserisci almeno nome ed email.')
      return
    }

    setLoading(true)
    setErrorMessage('')

    const response = await fetch('/api/saved-searches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...props,
        fullName: cleanedName,
        email: cleanedEmail,
        phone: cleanedPhone,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Salvataggio non riuscito.')
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="theme-panel rounded-[24px] border p-5">
        <p className="text-sm font-semibold text-[var(--site-text)]">
          Ricerca salvata
        </p>
        <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
          Grazie, ti ricontatteremo se saranno disponibili immobili simili per zona,
          fascia di prezzo e caratteristiche principali.
        </p>
      </div>
    )
  }

  return (
    <div className="theme-panel rounded-[24px] border p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--site-text)]">
            Non è quello giusto?
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--site-text-muted)]">
            Lascia i tuoi dati e ti avviseremo quando pubblicheremo immobili simili
            per zona, fascia di prezzo e caratteristiche principali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="theme-button-secondary liquid-button inline-flex shrink-0 items-center justify-center rounded-full px-4 py-2 text-xs font-semibold transition"
        >
          <span>{open ? 'Chiudi' : 'Avvisami'}</span>
        </button>
      </div>

      {open ? (
        <form onSubmit={handleSubmit} className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nome e cognome"
            required
            className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
          />

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
          />

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Cellulare opzionale"
            className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
          />

          {errorMessage ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 md:col-span-3 dark:text-red-100">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="theme-button-primary liquid-button rounded-2xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
          >
            <span>{loading ? 'Salvataggio...' : 'Salva ricerca'}</span>
          </button>
        </form>
      ) : null}
    </div>
  )
}
