import Link from 'next/link'
import { JetBrains_Mono } from 'next/font/google'
import { requirePermission } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import KpiCleanupPanel from './KpiCleanupPanel'

export const dynamic = 'force-dynamic'

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

type Profile = {
  id: string
  full_name: string
  username: string
  role: string
  is_active: boolean
}

type Property = {
  id: string
  title: string | null
  status: string | null
  created_by: string | null
  updated_by: string | null
  assigned_agent_id: string | null
  published_by: string | null
  published_at: string | null
  created_at: string | null
  updated_at: string | null
}

type LogRow = {
  id: number
  created_at: string
  actor_user_id: string | null
  actor_full_name: string | null
  actor_username: string | null
  entity_type: string | null
  action: string | null
  summary: string | null
}

type KpiResetState = {
  reset_at: string
  reset_by_email: string | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function isAfterReset(value: string | null, resetAt: string | null) {
  if (!resetAt) return true
  if (!value) return false

  return new Date(value).getTime() >= new Date(resetAt).getTime()
}

function propertyTouchedAfterReset(property: Property, resetAt: string | null) {
  return (
    isAfterReset(property.created_at, resetAt) ||
    isAfterReset(property.updated_at, resetAt) ||
    isAfterReset(property.published_at, resetAt)
  )
}

export default async function AdminKpiPage() {
  const currentProfile = await requirePermission('can_view_kpis')

  const service = createServiceClient()

  const [
    { data: profilesData },
    { data: propertiesData },
    { data: logsData },
    { data: resetData },
  ] = await Promise.all([
    service
      .from('profiles')
      .select('id, full_name, username, role, is_active')
      .order('full_name', { ascending: true }),

    service
      .from('properties')
      .select(
        'id, title, status, created_by, updated_by, assigned_agent_id, published_by, published_at, created_at, updated_at'
      )
      .order('updated_at', { ascending: false }),

    service
      .from('activity_log')
      .select(
        'id, created_at, actor_user_id, actor_full_name, actor_username, entity_type, action, summary'
      )
      .order('created_at', { ascending: false })
      .limit(500),

    service
      .from('kpi_reset_state')
      .select('reset_at, reset_by_email')
      .eq('id', 'global')
      .maybeSingle(),
  ])

  const profiles = (profilesData ?? []) as Profile[]
  const properties = (propertiesData ?? []) as Property[]
  const allLogs = (logsData ?? []) as LogRow[]
  const resetState = resetData as KpiResetState | null
  const kpiResetAt = resetState?.reset_at ?? null

  const logs = allLogs.filter((log) => isAfterReset(log.created_at, kpiResetAt))
  const kpiUpdatedProperties = properties.filter((property) =>
    propertyTouchedAfterReset(property, kpiResetAt)
  )

  const activeUsers = profiles.filter((p) => p.is_active)
  const agents = activeUsers.filter((p) => p.role === 'agent')
  const owners = activeUsers.filter((p) => p.role === 'owner')
  const editors = activeUsers.filter((p) => p.role === 'editor')

  const published = properties.filter((p) => p.status === 'published')
  const drafts = properties.filter((p) => p.status !== 'published')

  const rows = activeUsers
    .map((user) => {
      const created = properties.filter(
        (p) => p.created_by === user.id && isAfterReset(p.created_at, kpiResetAt)
      )
      const assigned = properties.filter(
        (p) =>
          p.assigned_agent_id === user.id &&
          propertyTouchedAfterReset(p, kpiResetAt)
      )
      const updated = properties.filter(
        (p) => p.updated_by === user.id && isAfterReset(p.updated_at, kpiResetAt)
      )
      const publishedByUser = properties.filter(
        (p) =>
          p.published_by === user.id &&
          isAfterReset(p.published_at, kpiResetAt)
      )
      const userLogs = logs.filter((l) => l.actor_user_id === user.id)

      return {
        user,
        created: created.length,
        assigned: assigned.length,
        updated: updated.length,
        published: publishedByUser.length,
        logs: userLogs.length,
        lastActivity:
          userLogs[0]?.created_at ||
          updated[0]?.updated_at ||
          created[0]?.created_at ||
          null,
      }
    })
    .sort((a, b) => {
      const scoreA = a.created + a.assigned + a.updated + a.published + a.logs
      const scoreB = b.created + b.assigned + b.updated + b.published + b.logs
      return scoreB - scoreA
    })

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

          <div
            className={`${mono.className} rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-xs text-[var(--site-text-muted)]`}
          >
            KPI immobili + attività
          </div>
        </div>
      </section>

      {currentProfile.role === 'owner' ? (
        <KpiCleanupPanel
          adminName={currentProfile.full_name}
          adminEmail={
            currentProfile.authorized_google_email ||
            currentProfile.login_email
          }
          lastResetAt={kpiResetAt}
        />
      ) : null}

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Controllo operativo
        </p>

        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)] md:text-4xl">
          KPI agenti
        </h1>

        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Vista operativa su utenti, immobili creati, immobili assegnati,
          pubblicazioni e ultime attività registrate.
        </p>

        {kpiResetAt ? (
          <div className="mt-5 rounded-2xl border border-amber-300 bg-amber-100 px-4 py-3 text-sm text-amber-950">
            KPI puliti il <strong>{formatDate(kpiResetAt)}</strong>. Le statistiche operative
            mostrano solo attività successive a questa data.
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <KpiCard title="Immobili totali" value={properties.length} />
          <KpiCard title="Pubblicati" value={published.length} />
          <KpiCard title="Bozze" value={drafts.length} />
          <KpiCard title="Agenti attivi" value={agents.length} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <KpiCard title="Owner attivi" value={`${owners.length} / 3`} />
          <KpiCard title="Editor attivi" value={editors.length} />
          <KpiCard title="Log recenti KPI" value={logs.length} />
          <KpiCard title="Immobili aggiornati KPI" value={kpiUpdatedProperties.length} />
        </div>
      </section>

      <section className="theme-panel rounded-[30px] border p-6">
        <h2 className="text-2xl font-semibold text-[var(--site-text)]">
          Classifica operativa utenti
        </h2>

        <p className="mt-2 text-sm text-[var(--site-text-muted)]">
          Dati basati sulle attività successive all’ultima pulizia KPI.
        </p>

        <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--site-border)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--site-surface)] text-[var(--site-text-muted)]">
              <tr>
                <th className="px-4 py-3">Utente</th>
                <th className="px-4 py-3">Ruolo</th>
                <th className="px-4 py-3">Creati</th>
                <th className="px-4 py-3">Assegnati</th>
                <th className="px-4 py-3">Modificati</th>
                <th className="px-4 py-3">Pubblicati</th>
                <th className="px-4 py-3">Ultima attività</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((row) => (
                <tr key={row.user.id} className="border-t border-[var(--site-border)]">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-[var(--site-text)]">
                      {row.user.full_name}
                    </p>
                    <p className={`${mono.className} text-xs text-[var(--site-text-muted)]`}>
                      @{row.user.username}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-[var(--site-text-muted)]">
                    {row.user.role}
                  </td>
                  <td className={`${mono.className} px-4 py-3`}>{row.created}</td>
                  <td className={`${mono.className} px-4 py-3`}>{row.assigned}</td>
                  <td className={`${mono.className} px-4 py-3`}>{row.updated}</td>
                  <td className={`${mono.className} px-4 py-3`}>{row.published}</td>
                  <td className="px-4 py-3 text-[var(--site-text-muted)]">
                    {formatDate(row.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <PropertyList
          title="Ultimi immobili aggiornati KPI"
          properties={kpiUpdatedProperties.slice(0, 10)}
        />

        <LogList logs={logs.slice(0, 10)} />
      </section>
    </div>
  )
}

function KpiCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
        {title}
      </p>
      <p className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        {value}
      </p>
    </div>
  )
}

function PropertyList({
  title,
  properties,
}: {
  title: string
  properties: Property[]
}) {
  return (
    <div className="theme-panel rounded-[30px] border p-6">
      <h2 className="text-2xl font-semibold text-[var(--site-text)]">{title}</h2>

      <div className="mt-6 space-y-3">
        {properties.map((property) => (
          <Link
            key={property.id}
            href={`/admin/immobili/${property.id}`}
            className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4 transition hover:bg-[var(--site-surface-2)]"
          >
            <p className="font-semibold text-[var(--site-text)]">
              {property.title || 'Immobile senza titolo'}
            </p>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Stato: {property.status || '-'} · Aggiornato: {formatDate(property.updated_at)}
            </p>
          </Link>
        ))}

        {properties.length === 0 ? (
          <p className="text-sm text-[var(--site-text-muted)]">
            Nessun immobile aggiornato dopo l’ultima pulizia KPI.
          </p>
        ) : null}
      </div>
    </div>
  )
}

function LogList({ logs }: { logs: LogRow[] }) {
  return (
    <div className="theme-panel rounded-[30px] border p-6">
      <h2 className="text-2xl font-semibold text-[var(--site-text)]">
        Ultime attività KPI
      </h2>

      <div className="mt-6 space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4"
          >
            <p className="font-semibold text-[var(--site-text)]">
              {log.summary || 'Evento registrato'}
            </p>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              {log.actor_full_name || 'Sistema'} · {log.entity_type || '-'} ·{' '}
              {log.action || '-'} · {formatDate(log.created_at)}
            </p>
          </div>
        ))}

        {logs.length === 0 ? (
          <p className="text-sm text-[var(--site-text-muted)]">
            Nessuna attività registrata dopo l’ultima pulizia KPI.
          </p>
        ) : null}
      </div>
    </div>
  )
}
