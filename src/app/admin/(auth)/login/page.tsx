import { redirect } from 'next/navigation'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { getCurrentAdminProfile } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminLoginPage() {
  const profile = await getCurrentAdminProfile()

  if (profile?.is_active) {
    redirect('/admin')
  }

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
              Inserisci le credenziali del tuo account amministrativo per entrare
              nell’area riservata.
            </p>
          </div>

          <AdminLoginForm />
        </div>
      </div>
    </main>
  )
}