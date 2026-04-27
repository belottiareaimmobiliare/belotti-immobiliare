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
  latitude: number | null
  longitude: number | null
  hasGarage: boolean | null
  hasParking: boolean | null
  hasGarden: boolean | null
  hasElevator: boolean | null
}

export default function SimilarPropertyAlertForm(props: Props) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'form' | 'verify' | 'done'>('form')

  const [verificationId, setVerificationId] = useState('')
  const [verificationCode, setVerificationCode] = useState('')

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [privacyAccepted, setPrivacyAccepted] = useState(false)

  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault()

    const cleanedName = fullName.trim()
    const cleanedEmail = email.trim()
    const cleanedPhone = phone.trim()

    if (!cleanedName || !cleanedEmail) {
      setErrorMessage('Inserisci almeno nome ed email.')
      return
    }

    if (!privacyAccepted) {
      setErrorMessage('Per proseguire devi accettare l’informativa privacy.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const response = await fetch('/api/saved-searches/request-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...props,
        fullName: cleanedName,
        email: cleanedEmail,
        phone: cleanedPhone,
        privacyAccepted,
      }),
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setErrorMessage(data.error || 'Invio codice non riuscito.')
      return
    }

    setVerificationId(data.verificationId || '')
    setStep('verify')
    setSuccessMessage('Ti abbiamo inviato un codice di verifica via mail.')
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault()

    const cleanCode = verificationCode.replace(/\D/g, '').slice(0, 4)

    if (cleanCode.length !== 4) {
      setErrorMessage('Inserisci il codice completo a 4 cifre.')
      return
    }

    setLoading(true)
    setErrorMessage('')
    setSuccessMessage('')

    const response = await fetch('/api/saved-searches/verify-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationId,
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
    setSuccessMessage('Ricerca verificata e salvata correttamente.')
  }

  if (step === 'done') {
    return (
      <div className="rounded-[24px] border border-[#c8a24a] bg-[#dff3ff] p-5 text-black shadow-[0_18px_50px_rgba(15,59,102,0.12)]">
        <p className="text-sm font-semibold text-black">
          Ricerca salvata
        </p>
        <p className="mt-2 text-sm leading-7 text-black/70">
          {successMessage || 'Grazie, la tua ricerca è stata attivata correttamente.'}
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[24px] border border-[#c8a24a] bg-[#dff3ff] p-5 text-black shadow-[0_18px_50px_rgba(15,59,102,0.12)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-black">
            Non è quello giusto?
          </p>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-black/70">
            Lascia i tuoi dati e ti avviseremo quando pubblicheremo immobili simili
            per zona, fascia di prezzo e caratteristiche principali.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-[#c8a24a] bg-black px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#1f2937]"
        >
          <span>{open ? 'Chiudi' : 'Avvisami'}</span>
        </button>
      </div>

      {open && step === 'form' ? (
        <form onSubmit={handleRequestCode} className="mt-5 grid gap-3 md:grid-cols-3">
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            placeholder="Nome e cognome"
            required
            className="rounded-2xl border border-[#c8a24a]/55 bg-white/80 px-4 py-3 text-sm text-black outline-none placeholder:text-black/45 focus:border-[#c8a24a]"
          />

          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            className="rounded-2xl border border-[#c8a24a]/55 bg-white/80 px-4 py-3 text-sm text-black outline-none placeholder:text-black/45 focus:border-[#c8a24a]"
          />

          <input
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Cellulare opzionale"
            className="rounded-2xl border border-[#c8a24a]/55 bg-white/80 px-4 py-3 text-sm text-black outline-none placeholder:text-black/45 focus:border-[#c8a24a]"
          />

          <label className="flex items-start gap-3 rounded-2xl border border-[#c8a24a]/55 bg-white/70 px-4 py-3 text-xs leading-5 text-black/70 md:col-span-3">
            <input
              type="checkbox"
              checked={privacyAccepted}
              onChange={(event) => setPrivacyAccepted(event.target.checked)}
              className="mt-1"
            />
            <span>
              Acconsento al trattamento dei dati per ricevere aggiornamenti su immobili simili e dichiaro di aver letto l’informativa privacy.
              {' '}
              <a href="/privacy" target="_blank" className="font-semibold text-black underline">
                Privacy Policy
              </a>
            </span>
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-700 md:col-span-3">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading || !privacyAccepted}
            className="rounded-2xl border border-[#c8a24a] bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-3"
          >
            <span>{loading ? 'Invio codice...' : 'Ricevi codice di verifica'}</span>
          </button>
        </form>
      ) : null}

      {open && step === 'verify' ? (
        <form onSubmit={handleVerifyCode} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-[#c8a24a]/55 bg-white/70 px-4 py-4 text-sm text-black/70">
            Inserisci il codice di verifica che ti abbiamo inviato via mail.
          </div>

          <input
            value={verificationCode}
            onChange={(event) =>
              setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 4))
            }
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="0000"
            required
            className="w-full rounded-2xl border border-[#c8a24a]/55 bg-white/80 px-4 py-4 text-center text-3xl tracking-[0.5em] text-black outline-none placeholder:text-black/35 focus:border-[#c8a24a]"
          />

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl border border-[#c8a24a] bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f2937] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span>{loading ? 'Verifica in corso...' : 'Conferma codice e salva ricerca'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('form')
              setVerificationCode('')
              setErrorMessage('')
              setSuccessMessage('')
            }}
            className="w-full rounded-2xl border border-[#c8a24a]/55 bg-white/70 px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
          >
            Torna al form
          </button>
        </form>
      ) : null}
    </div>
  )
}
