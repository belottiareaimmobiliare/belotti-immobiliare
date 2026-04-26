'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginForm() {
  const router = useRouter()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.signInWithPassword({
        email: login.trim().toLowerCase(),
        password,
      })

      if (error) {
        setError('Credenziali non valide o account non autorizzato.')
        setLoading(false)
        return
      }

      router.replace('/admin')
      router.refresh()
    } catch {
      setError('Errore durante il login.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--site-text)]">
          Username o email
        </label>
        <input
          type="text"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
          placeholder="Inserisci lo username o la mail d'accesso"
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none"
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--site-text)]">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Inserisci la password"
          className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none"
          autoComplete="current-password"
          required
        />
      </div>

      {error ? <p className="text-sm text-red-500">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="theme-button-primary inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:opacity-50"
      >
        {loading ? 'Accesso in corso...' : 'Accedi'}
      </button>
    </form>
  )
}