import Link from 'next/link'
import { requirePermission } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export default async function AdminKpiPage() {
  await requirePermission('can_view_kpis')

  const service = createServiceClient()

  const { data: profiles } = await service
    .from('profiles')
    .select(
      'id, full_name, role, is_active, can_manage_properties, can_manage_news, can_publish_properties'
    )

  const users = profiles ?? []
  const owners = users.filter((u) => u.role === 'owner' && u.is_active).length
  const agents = users.filter((u) => u.role === 'agent' && u.is_active).length
  const editors = users.filter((u) => u.role === 'editor' && u.is_active).length
  const publishers = users.filter((u) => u.can_publish_properties && u.is_active).length

  return (
    <div className="space-y-6">
      <section className="theme-panel rounded-[26px] border p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            ← Torna alla dashboard
          </Link>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm text-[var(--site-text-muted)]">
            KPI utenti e permessi
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          KPI
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)] md:text-4xl">
          KPI agenti
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Qui iniziamo a raccogliere i primi indicatori utili di gestione utenti.
          Nel passo successivo li collegheremo anche a immobili, pubblicazioni,
          stato bozze e attività operative reali.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Proprietari attivi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {owners}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Agenti attivi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {agents}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Editor attivi
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {editors}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Utenti con publish
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {publishers}
            </p>
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[30px] border p-6">
        <h2 className="text-2xl font-semibold text-[var(--site-text)]">
          Prossimo step KPI reale
        </h2>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)]">
          Nel blocco successivo colleghiamo ownership degli immobili, pubblicazioni,
          modifiche e dati da `activity_log` per avere KPI veri per singolo agente.
        </p>
      </section>
    </div>
  )
}