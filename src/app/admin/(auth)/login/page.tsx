import { redirect } from 'next/navigation'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import AdminGoogleLoginButton from '@/components/admin/AdminGoogleLoginButton'
import { getCurrentAdminProfile } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

function getErrorMessage(code?: string) {
  if (code === 'google_not_authorized') {
    return 'Questa Gmail non è autorizzata per l’accesso admin.'
  }

  if (code === 'google_exchange_failed') {
    return 'Errore durante il completamento del login Google.'
  }

  if (code === 'google_missing_code') {
    return 'Callback Google non valido.'
  }

  return ''
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const [profile, params] = await Promise.all([
    getCurrentAdminProfile(),
    searchParams,
  ])

  if (profile?.is_active) {
    redirect('/admin')
  }

  const errorMessage = getErrorMessage(params.error)

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-10 text-[var(--site-text)]">
      <div className="mx-auto max-w-md">
        <div className="theme-panel rounded-[34px] border p-6 md:p-8">
          <div className="mb-8 text-center">
            <img
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              className="mx-auto h-auto w-full max-w-[180px] object-contain"
            />

            <p className="mt-6 text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              Admin Login
            </p>

            <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
              Accesso gestionale
            </h1>

            <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
              Usa email e password oppure prova l’accesso con Google se la tua
              Gmail è stata autorizzata nel sistema.
            </p>
          </div>

          {errorMessage ? (
            <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {errorMessage}
            </div>
          ) : null}

          <div className="space-y-5">
            <AdminGoogleLoginButton />

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--site-border)]" />
              <span className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                oppure
              </span>
              <div className="h-px flex-1 bg-[var(--site-border)]" />
            </div>

            <AdminLoginForm />
          </div>
        </div>
      </div>
    </main>
  )
}