'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import QRCode from 'qrcode'

type QrCreateResponse = {
  token: string
  secret: string
  qrUrl: string
  expiresAt: string
}

export default function AdminQrLoginPanel() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [secret, setSecret] = useState('')
  const [qrUrl, setQrUrl] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'pending' | 'approved' | 'expired' | 'consumed'>('idle')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const expiresLabel = useMemo(() => {
    if (!expiresAt) return ''
    return new Intl.DateTimeFormat('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(expiresAt))
  }, [expiresAt])

  async function startQrSession() {
    setLoading(true)
    setError('')
    setStatus('idle')
    setQrDataUrl('')

    try {
      const res = await fetch('/api/admin/qr-login/create', {
        method: 'POST',
      })

      const data = (await res.json()) as QrCreateResponse & { error?: string }

      if (!res.ok) {
        setError(data.error || 'Errore generazione QR.')
        setLoading(false)
        return
      }

      setToken(data.token)
      setSecret(data.secret)
      setQrUrl(data.qrUrl)
      setExpiresAt(data.expiresAt)
      setStatus('pending')
    } catch {
      setError('Errore generazione QR.')
    }

    setLoading(false)
  }

  async function consumeQrSession(currentToken: string, currentSecret: string) {
    const res = await fetch('/api/admin/qr-login/consume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: currentToken,
        secret: currentSecret,
      }),
    })

    const data = (await res.json()) as { ok?: boolean; error?: string }

    if (!res.ok || !data.ok) {
      setError(data.error || 'Errore attivazione sessione desktop.')
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  async function checkStatus(currentToken: string, currentSecret: string) {
    const qs = new URLSearchParams({
      token: currentToken,
      secret: currentSecret,
    })

    const res = await fetch(`/api/admin/qr-login/status?${qs.toString()}`, {
      method: 'GET',
      cache: 'no-store',
    })

    const data = (await res.json()) as {
      status?: 'pending' | 'approved' | 'expired' | 'consumed'
      error?: string
    }

    if (!res.ok) {
      setError(data.error || 'Errore verifica stato QR.')
      return
    }

    if (data.status === 'approved') {
      setStatus('approved')
      await consumeQrSession(currentToken, currentSecret)
      return
    }

    if (data.status === 'expired') {
      setStatus('expired')
      return
    }

    if (data.status === 'consumed') {
      setStatus('consumed')
      return
    }

    setStatus('pending')
  }

  useEffect(() => {
    startQrSession()
  }, [])

  useEffect(() => {
    if (!qrUrl) return

    QRCode.toDataURL(qrUrl, {
      width: 240,
      margin: 1,
    })
      .then(setQrDataUrl)
      .catch(() => setError('Errore generazione immagine QR.'))
  }, [qrUrl])

  useEffect(() => {
    if (!token || !secret || status !== 'pending') return

    const interval = window.setInterval(() => {
      checkStatus(token, secret)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [token, secret, status])

  return (
    <section className="hidden rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 lg:block">
      <p className="text-sm uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
        Accesso con telefono
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
        Accedi con QR
      </h2>

      <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
        Scansiona il QR dal telefono, entra con Google e approva l’accesso.
        Il QR non viene mostrato su smartphone o tablet.
      </p>

      <div className="mt-6 flex min-h-[280px] items-center justify-center rounded-[28px] border border-dashed border-[var(--site-border)] bg-[var(--site-bg)] p-4">
        {qrDataUrl && status === 'pending' ? (
          <img
            src={qrDataUrl}
            alt="QR login admin"
            className="h-[240px] w-[240px] rounded-2xl bg-white p-3"
          />
        ) : (
          <div className="text-center">
            <p className="text-sm text-[var(--site-text-muted)]">
              {loading
                ? 'Generazione QR in corso...'
                : status === 'approved'
                  ? 'Accesso approvato, stiamo entrando...'
                  : status === 'expired'
                    ? 'QR scaduto.'
                    : error || 'QR non disponibile.'}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 space-y-2 text-sm text-[var(--site-text-muted)]">
        <p>
          Stato:{' '}
          <span className="font-semibold text-[var(--site-text)]">
            {status === 'pending'
              ? 'In attesa'
              : status === 'approved'
                ? 'Approvato'
                : status === 'expired'
                  ? 'Scaduto'
                  : status === 'consumed'
                    ? 'Consumata'
                    : 'Inizializzazione'}
          </span>
        </p>

        {expiresLabel ? (
          <p>
            Scadenza QR:{' '}
            <span className="font-semibold text-[var(--site-text)]">
              {expiresLabel}
            </span>
          </p>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={startQrSession}
          className="rounded-2xl border border-[var(--site-border)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)]"
        >
          Rigenera QR
        </button>
      </div>
    </section>
  )
}