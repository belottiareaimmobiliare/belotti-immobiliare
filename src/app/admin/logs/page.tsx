import Link from 'next/link'
import { JetBrains_Mono } from 'next/font/google'
import { requireOwner } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

type ActivityLogRow = {
  id: string
  created_at: string
  actor_user_id: string | null
  actor_username: string | null
  actor_full_name: string | null
  entity_type: string | null
  entity_id: string | null
  action: string | null
  summary: string | null
  before_data: Record<string, unknown> | null
  after_data: Record<string, unknown> | null
}

function formatDate(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('it-IT', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value))
}

function prettyAction(action: string | null) {
  if (!action) return 'azione'
  return action.replaceAll('_', ' ')
}

function prettyEntity(entityType: string | null) {
  if (!entityType) return 'entità'
  return entityType.replaceAll('_', ' ')
}

function JsonBox({
  title,
  data,
}: {
  title: string
  data: Record<string, unknown> | null
}) {
  if (!data) return null

  return (
    <details className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[var(--site-text)]">
        {title}
      </summary>
      <div className="border-t border-[var(--site-border)] px-4 py-4">
        <pre
          className={`${jetbrainsMono.className} overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-[var(--site-text-muted)]`}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </details>
  )
}

export default async function AdminLogsPage() {
  await requireOwner()

  const service = createServiceClient()

  const { data } = await service
    .from('activity_log')
    .select(
      'id, created_at, actor_user_id, actor_username, actor_full_name, entity_type, entity_id, action, summary, before_data, after_data'
    )
    .order('created_at', { ascending: false })
    .limit(100)

  const logs = (data ?? []) as ActivityLogRow[]

  const userLogs = logs.filter((log) => log.entity_type === 'user').length
  const propertyLogs = logs.filter((log) => log.entity_type === 'property').length
  const contentLogs = logs.filter(
    (log) => log.entity_type === 'content' || log.entity_type === 'site_content'
  ).length
  const otherLogs = logs.length - userLogs - propertyLogs - contentLogs

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
            Solo Admin Proprietario
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[34px] border p-6 md:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
          Audit
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--site-text)] md:text-4xl">
          Logs attività
        </h1>
        <p className="mt-4 max-w-4xl text-sm leading-8 text-[var(--site-text-muted)] md:text-base">
          Qui vedi lo storico delle operazioni effettuate dagli utenti del gestionale:
          creazione e modifica utenti, attività sui contenuti e, in seguito, anche
          operazioni sugli immobili e sugli accessi.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Totale record
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {logs.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Log utenti
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {userLogs}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Log contenuti
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {contentLogs}
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
              Altri log
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
              {propertyLogs + otherLogs}
            </p>
          </div>
        </div>
      </section>

      <section className="theme-panel rounded-[30px] border p-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[var(--site-text)]">
              Ultimi 100 eventi
            </h2>
            <p className="mt-2 text-sm text-[var(--site-text-muted)]">
              Vista audit con dettaglio tecnico leggibile.
            </p>
          </div>

          <div
            className={`${jetbrainsMono.className} rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2 text-xs text-[var(--site-text-muted)]`}
          >
            Font: JetBrains Mono
          </div>
        </div>

        {logs.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
            <p className="text-sm text-[var(--site-text-muted)]">
              Nessun log disponibile al momento.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {logs.map((log) => (
              <article
                key={log.id}
                className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`${jetbrainsMono.className} inline-flex rounded-full border border-[var(--site-border)] px-3 py-1 text-xs font-semibold text-[var(--site-text)]`}
                      >
                        {prettyAction(log.action)}
                      </span>

                      <span
                        className={`${jetbrainsMono.className} inline-flex rounded-full border border-[var(--site-border)] px-3 py-1 text-xs text-[var(--site-text-muted)]`}
                      >
                        {prettyEntity(log.entity_type)}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-[var(--site-text)]">
                      {log.summary || 'Evento registrato'}
                    </h3>

                    <div
                      className={`${jetbrainsMono.className} grid gap-2 text-xs text-[var(--site-text-muted)] md:grid-cols-2`}
                    >
                      <p>
                        <span className="font-semibold text-[var(--site-text)]">Quando:</span>{' '}
                        {formatDate(log.created_at)}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--site-text)]">Utente:</span>{' '}
                        {log.actor_full_name || '-'}{' '}
                        {log.actor_username ? `(@${log.actor_username})` : ''}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--site-text)]">Entity ID:</span>{' '}
                        {log.entity_id || '-'}
                      </p>
                      <p>
                        <span className="font-semibold text-[var(--site-text)]">Log ID:</span>{' '}
                        {log.id}
                      </p>
                    </div>
                  </div>
                </div>

                {(log.before_data || log.after_data) && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <JsonBox title="Before data" data={log.before_data} />
                    <JsonBox title="After data" data={log.after_data} />
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}