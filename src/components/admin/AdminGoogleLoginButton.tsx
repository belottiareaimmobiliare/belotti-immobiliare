'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminGoogleLoginButton({
  redirectPath = '/admin/callback',
  label = 'Accedi con Google',
}: {
  redirectPath?: string
  label?: string
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGoogleLogin() {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        setError('Errore nell’avvio del login Google.')
        setLoading(false)
        return
      }
    } catch {
      setError('Errore nell’avvio del login Google.')
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)] disabled:opacity-50"
      >
        {loading ? 'Reindirizzamento a Google...' : label}
      </button>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  )
}