'use client'

import { useState } from 'react'
import AdminGoogleLoginButton from '@/components/admin/AdminGoogleLoginButton'

export default function AdminQrApprovePanel({
  token,
  isMobile,
  requestStatus,
  hasGoogleAuthorizedSession,
  currentUserLabel,
}: {
  token: string
  isMobile: boolean
  requestStatus: 'pending' | 'approved' | 'expired' | 'consumed'
  hasGoogleAuthorizedSession: boolean
  currentUserLabel: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function approve() {
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch('/api/admin/qr-login/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      const data = (await res.json()) as { ok?: boolean; error?: string }

      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Impossibile approvare l’accesso.')
        setLoading(false)
        return
      }

      setMessage('Accesso desktop approvato. Torna al computer.')
    } catch {
      setMessage('Impossibile approvare l’accesso.')
    }

    setLoading(false)
  }

  if (!isMobile) {
    return (
      <div className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
        <h1 className="text-2xl font-semibold text-[var(--site-text)]">
          QR login
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
          Questo link va aperto da smartphone. Scansiona il QR dal computer con il
          telefono per continuare.
        </p>
      </div>
    )
  }

  if (requestStatus === 'expired') {
    return (
      <div className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
        <h1 className="text-2xl font-semibold text-[var(--site-text)]">
          QR scaduto
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
          Questo QR non è più valido. Torna sul computer e generane uno nuovo.
        </p>
      </div>
    )
  }

  if (requestStatus === 'consumed') {
    return (
      <div className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
        <h1 className="text-2xl font-semibold text-[var(--site-text)]">
          Accesso già completato
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
          Questa richiesta è già stata usata. Se serve, genera un nuovo QR dal
          computer.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
        Approvazione desktop
      </p>

      <h1 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
        Accesso da telefono
      </h1>

      {!hasGoogleAuthorizedSession ? (
        <>
          <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
            Per approvare il login desktop devi entrare con Google su questo
            telefono.
          </p>

          <div className="mt-6">
            <AdminGoogleLoginButton
              redirectPath={`/admin/qr/callback?token=${encodeURIComponent(token)}`}
              label="Continua con Google su questo telefono"
            />
          </div>
        </>
      ) : (
        <>
          <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
            Sessione Google riconosciuta come:
            <span className="ml-1 font-semibold text-[var(--site-text)]">
              {currentUserLabel || 'utente autorizzato'}
            </span>
          </p>

          <div className="mt-6">
            <button
              type="button"
              onClick={approve}
              disabled={loading || requestStatus === 'approved'}
              className="theme-button-primary inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
            >
              {loading ? 'Approvazione in corso...' : 'Approva accesso su desktop'}
            </button>
          </div>
        </>
      )}

      {message ? (
        <p className="mt-4 text-sm text-[var(--site-text-muted)]">{message}</p>
      ) : null}
    </div>
  )
}