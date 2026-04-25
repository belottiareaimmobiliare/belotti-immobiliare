import Link from 'next/link'
import { JetBrains_Mono } from 'next/font/google'
import { requirePermission } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

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
  can_manage_properties: boolean
  can_manage_news: boolean
  can_publish_properties: boolean
}

type LogRow = {
  id: number
  created_at: string
  actor_user_id: string | null
  actor_username: string | null
  actor_full_name: string | null
  entity_type: string | null
  action: string | null
  summary: string | null
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value))
}

function countBy<T extends string>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1
    return acc
  }, {})
}

export default async function AdminKpiPage() {
  await requirePermission('can_view_kpis')

  const service = createServiceClient()

  const { data: profilesData } = await service
    .from('profiles')
    .select('id, full_name, username, role, is_active, can_manage_properties, can_manage_news, can_publish_properties')
    .order('full_name', { ascending: true })

  const { data: logsData } = await service
    .from('activity_log')
    .select('id, created_at, actor_user_id, actor_username, actor_full_name, entity_type, action, summary')
    .order('created_at', { ascending: false })
    .limit(200)

  const profiles = (profilesData ?? []) as Profile[]
  const logs = (logsData ?? []) as LogRow[]

  const activeUsers = profiles.filter((u) => u.is_active)
  const owners = activeUsers.filter((u) => u.role === 'owner')
  const agents = activeUsers.filter((u) => u.role === 'agent')
  const editors = activeUsers.filter((u) => u.role === 'editor')

  const now = Date.now()
  const logs7 = logs.filter((l) => now - new Date(l.created_at).getTime() <= 7 * 24 * 60 * 60 * 1000)
  const logs30 = logs.filter((l) => now - new Date(l.created_at).getTime() <= 30 * 24 * 60 * 60 * 1000)

  const actionCounts = countBy(logs30.map((l) => l.action || 'unknown'))
  const entityCounts = countBy(logs30.map((l) => l.entity_type || 'unknown'))

  const activityByUser = profiles.map((profile) => {
    const userLogs = logs30.filter((log) => log.actor_user_id === profile.id)
    return {
      ...profile,
      totalLogs: userLogs.length,
      lastActivity: userLogs[0]?.created_at ?? null,
    }
  }).sort((a, b) => b.totalLogs - a.totalLogs)

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

          <div className={`${mono.className} rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-xs text-[var(--site-text-muted)]`}>
            KPI ultimi 30 giorni
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Controllo operativo
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)] md:text-4xl">
          KPI agenti
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Prima vista KPI basata su utenti, permessi e attività registrate nei log.
          Il prossimo aggancio sarà sugli immobili: creati, modificati, pubblicati e assegnati per agente.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <KpiCard title="Utenti attivi" value={activeUsers.length} />
          <KpiCard title="Agenti attivi" value={agents.length} />
          <KpiCard title="Editor attivi" value={editors.length} />
          <KpiCard title="Owner attivi" value={`${owners.length} / 3`} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <KpiCard title="Log 7 giorni" value={logs7.length} />
          <KpiCard title="Log 30 giorni" value={logs30.length} />
          <KpiCard title="Utenti con publish" value={activeUsers.filter((u) => u.can_publish_properties).length} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="theme-panel rounded-[30px] border p-6">
          <h2 className="text-2xl font-semibold text-[var(--site-text)]">
            Classifica attività utenti
          </h2>
          <p className="mt-2 text-sm text-[var(--site-text-muted)]">
            Ordinata per numero di eventi registrati negli ultimi 30 giorni.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl border border-[var(--site-border)]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--site-surface)] text-[var(--site-text-muted)]">
                <tr>
                  <th className="px-4 py-3">Utente</th>
                  <th className="px-4 py-3">Ruolo</th>
                  <th className="px-4 py-3">Eventi</th>
                  <th className="px-4 py-3">Ultima attività</th>
                </tr>
              </thead>
              <tbody>
                {activityByUser.map((user) => (
                  <tr key={user.id} className="border-t border-[var(--site-border)]">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[var(--site-text)]">{user.full_name}</p>
                      <p className={`${mono.className} text-xs text-[var(--site-text-muted)]`}>@{user.username}</p>
                    </td>
                    <td className="px-4 py-3 text-[var(--site-text-muted)]">{user.role}</td>
                    <td className={`${mono.className} px-4 py-3 text-[var(--site-text)]`}>{user.totalLogs}</td>
                    <td className="px-4 py-3 text-[var(--site-text-muted)]">
                      {user.lastActivity ? formatDate(user.lastActivity) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="space-y-6">
          <MiniStats title="Azioni" items={actionCounts} />
          <MiniStats title="Entità" items={entityCounts} />
        </aside>
      </section>

      <section className="theme-panel rounded-[30px] border p-6">
        <h2 className="text-2xl font-semibold text-[var(--site-text)]">
          Ultime attività
        </h2>

        <div className="mt-6 space-y-3">
          {logs.slice(0, 20).map((log) => (
            <div key={log.id} className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="font-semibold text-[var(--site-text)]">
                  {log.summary || 'Evento registrato'}
                </p>
                <p className={`${mono.className} text-xs text-[var(--site-text-muted)]`}>
                  {formatDate(log.created_at)}
                </p>
              </div>
              <p className="mt-2 text-sm text-[var(--site-text-muted)]">
                {log.actor_full_name || 'Sistema'} · {log.entity_type || '-'} · {log.action || '-'}
              </p>
            </div>
          ))}

          {logs.length === 0 ? (
            <p className="text-sm text-[var(--site-text-muted)]">
              Nessuna attività ancora registrata.
            </p>
          ) : null}
        </div>
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

function MiniStats({
  title,
  items,
}: {
  title: string
  items: Record<string, number>
}) {
  const entries = Object.entries(items).sort((a, b) => b[1] - a[1])

  return (
    <div className="theme-panel rounded-[30px] border p-6">
      <h3 className="text-xl font-semibold text-[var(--site-text)]">{title}</h3>

      <div className="mt-5 space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--site-text-muted)]">Nessun dato.</p>
        ) : (
          entries.map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3">
              <span className="text-sm text-[var(--site-text-muted)]">{key}</span>
              <span className="font-semibold text-[var(--site-text)]">{value}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}