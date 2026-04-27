import crypto from 'crypto'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

type PrivacyPageProps = {
  searchParams?: Promise<{
    q?: string
    done?: string
  }>
}

type LeadRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  property_title: string | null
  status: string | null
  created_at: string
  privacy_accepted: boolean | null
  privacy_accepted_at: string | null
  privacy_policy_version: string | null
}

type SavedSearchRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  source_property_title: string | null
  status: string | null
  created_at: string
  expires_at: string | null
  privacy_accepted: boolean | null
  privacy_accepted_at: string | null
  privacy_policy_version: string | null
}

type VerificationRow = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  created_at: string
  expires_at: string | null
  verified_at: string | null
}

type PrivacyRequestRow = {
  id: string
  email: string
  request_type: string
  status: string
  action_taken: string | null
  leads_anonymized: number
  lead_verifications_deleted: number
  saved_searches_anonymized: number
  saved_search_verifications_deleted: number
  created_at: string
  closed_at: string | null
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'

  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function normalizeIdentifier(value: unknown) {
  return String(value ?? '').trim()
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase()
}

function hashIdentifier(value: string) {
  return crypto
    .createHash('sha256')
    .update(normalizeEmail(value))
    .digest('hex')
}

function safeSearchTerm(value: string) {
  return value
    .trim()
    .replace(/[%,()]/g, '')
    .slice(0, 120)
}

function buildOrFilter(identifier: string) {
  const term = safeSearchTerm(identifier)

  if (!term) return ''

  return [
    `email.ilike.%${term}%`,
    `phone.ilike.%${term}%`,
    `full_name.ilike.%${term}%`,
  ].join(',')
}

async function anonymizeUserData(formData: FormData) {
  'use server'

  const profile = await requireOwner()
  const identifier = normalizeIdentifier(formData.get('identifier'))
  const requestType = String(formData.get('request_type') || 'deletion')
  const message = String(formData.get('message') || '').trim()

  if (!identifier) {
    return
  }

  const filter = buildOrFilter(identifier)

  if (!filter) {
    return
  }

  const supabase = createServiceClient()
  const identifierHash = hashIdentifier(identifier)
  const anonymizedEmail = `deleted+${identifierHash.slice(0, 18)}@privacy.local`
  const now = new Date().toISOString()

  const [
    { count: leadsCount },
    { count: leadVerificationsCount },
    { count: savedSearchesCount },
    { count: savedSearchVerificationsCount },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }).or(filter),
    supabase
      .from('lead_email_verifications')
      .select('id', { count: 'exact', head: true })
      .or(filter),
    supabase
      .from('saved_searches')
      .select('id', { count: 'exact', head: true })
      .or(filter),
    supabase
      .from('saved_search_email_verifications')
      .select('id', { count: 'exact', head: true })
      .or(filter),
  ])

  await supabase
    .from('leads')
    .update({
      full_name: 'Utente anonimizzato',
      email: anonymizedEmail,
      phone: null,
      message: null,
      internal_note: 'Dati personali anonimizzati per richiesta privacy.',
      status: 'archived',
      closed_at: now,
      privacy_accepted: false,
      privacy_accepted_at: null,
      privacy_policy_version: null,
      privacy_ip: null,
      privacy_user_agent: null,
    })
    .or(filter)

  await supabase
    .from('saved_searches')
    .update({
      full_name: 'Utente anonimizzato',
      email: anonymizedEmail,
      phone: null,
      internal_note: 'Dati personali anonimizzati per richiesta privacy.',
      status: 'archived',
      closed_at: now,
      unsubscribe_token: null,
      privacy_accepted: false,
      privacy_accepted_at: null,
      privacy_policy_version: null,
      privacy_ip: null,
      privacy_user_agent: null,
    })
    .or(filter)

  await supabase.from('lead_email_verifications').delete().or(filter)
  await supabase.from('saved_search_email_verifications').delete().or(filter)

  await supabase.from('privacy_requests').insert({
    full_name: null,
    email: anonymizedEmail,
    request_type: requestType,
    message: message || null,
    status: 'closed',
    internal_note:
      'Richiesta privacy gestita da admin. Dati operativi anonimizzati; verifiche temporanee eliminate.',
    identifier_hash: identifierHash,
    handled_by_profile_id: profile.id,
    handled_by_email:
      profile.authorized_google_email || profile.login_email || profile.username,
    action_taken: 'anonymized_operational_data_and_deleted_temporary_verifications',
    leads_anonymized: leadsCount ?? 0,
    lead_verifications_deleted: leadVerificationsCount ?? 0,
    saved_searches_anonymized: savedSearchesCount ?? 0,
    saved_search_verifications_deleted: savedSearchVerificationsCount ?? 0,
    closed_at: now,
  })

  revalidatePath('/admin/privacy')
  revalidatePath('/admin/leads')
  revalidatePath('/admin/ricerche-salvate')
  revalidatePath('/admin')

  redirect(`/admin/privacy?q=${encodeURIComponent(identifier)}&done=1`)
}

async function deactivateSavedSearchEmails(formData: FormData) {
  'use server'

  const profile = await requireOwner()
  const identifier = normalizeIdentifier(formData.get('identifier'))

  if (!identifier) return

  const filter = buildOrFilter(identifier)

  if (!filter) return

  const supabase = createServiceClient()
  const identifierHash = hashIdentifier(identifier)
  const anonymizedEmail = `privacy-request+${identifierHash.slice(0, 18)}@privacy.local`
  const now = new Date().toISOString()

  const { count } = await supabase
    .from('saved_searches')
    .select('id', { count: 'exact', head: true })
    .or(filter)

  await supabase
    .from('saved_searches')
    .update({
      status: 'archived',
      closed_at: now,
      unsubscribe_token: null,
      internal_note:
        'Email immobili simili disattivate per richiesta privacy/utente.',
    })
    .or(filter)

  await supabase.from('privacy_requests').insert({
    email: anonymizedEmail,
    request_type: 'unsubscribe_saved_searches',
    status: 'closed',
    internal_note: 'Disattivate le email per ricerche salvate associate all’identificativo indicato.',
    identifier_hash: identifierHash,
    handled_by_profile_id: profile.id,
    handled_by_email:
      profile.authorized_google_email || profile.login_email || profile.username,
    action_taken: 'disabled_saved_search_emails',
    saved_searches_anonymized: count ?? 0,
    closed_at: now,
  })

  revalidatePath('/admin/privacy')
  revalidatePath('/admin/ricerche-salvate')
  revalidatePath('/admin')

  redirect(`/admin/privacy?q=${encodeURIComponent(identifier)}&done=1`)
}

export default async function AdminPrivacyPage({
  searchParams,
}: PrivacyPageProps) {
  await requireOwner()

  const params = searchParams ? await searchParams : {}
  const query = normalizeIdentifier(params.q)
  const done = params.done === '1'

  const supabase = createServiceClient()

  let leads: LeadRow[] = []
  let savedSearches: SavedSearchRow[] = []
  let leadVerifications: VerificationRow[] = []
  let savedSearchVerifications: VerificationRow[] = []
  let privacyRequests: PrivacyRequestRow[] = []

  const filter = buildOrFilter(query)

  if (query && filter) {
    const [
      { data: leadsData },
      { data: savedSearchesData },
      { data: leadVerificationsData },
      { data: savedSearchVerificationsData },
      { data: privacyRequestsData },
    ] = await Promise.all([
      supabase
        .from('leads')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          property_title,
          status,
          created_at,
          privacy_accepted,
          privacy_accepted_at,
          privacy_policy_version
        `,
        )
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('saved_searches')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          source_property_title,
          status,
          created_at,
          expires_at,
          privacy_accepted,
          privacy_accepted_at,
          privacy_policy_version
        `,
        )
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('lead_email_verifications')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          created_at,
          expires_at,
          verified_at
        `,
        )
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('saved_search_email_verifications')
        .select(
          `
          id,
          full_name,
          email,
          phone,
          created_at,
          expires_at,
          verified_at
        `,
        )
        .or(filter)
        .order('created_at', { ascending: false })
        .limit(100),

      supabase
        .from('privacy_requests')
        .select(
          `
          id,
          email,
          request_type,
          status,
          action_taken,
          leads_anonymized,
          lead_verifications_deleted,
          saved_searches_anonymized,
          saved_search_verifications_deleted,
          created_at,
          closed_at
        `,
        )
        .or(`email.ilike.%${safeSearchTerm(query)}%,identifier_hash.eq.${hashIdentifier(query)}`)
        .order('created_at', { ascending: false })
        .limit(50),
    ])

    leads = (leadsData ?? []) as LeadRow[]
    savedSearches = (savedSearchesData ?? []) as SavedSearchRow[]
    leadVerifications = (leadVerificationsData ?? []) as VerificationRow[]
    savedSearchVerifications =
      (savedSearchVerificationsData ?? []) as VerificationRow[]
    privacyRequests = (privacyRequestsData ?? []) as PrivacyRequestRow[]
  }

  const totalFound =
    leads.length +
    savedSearches.length +
    leadVerifications.length +
    savedSearchVerifications.length

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-2xl shadow-black/10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              GDPR / Privacy
            </p>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--site-text)] md:text-4xl">
              Privacy Center
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--site-text-muted)]">
              Cerca i dati collegati a un utente e gestisci richieste di cancellazione,
              disattivazione email o anonimizzazione dati. Le azioni lasciano un audit
              minimo senza conservare i dati personali in chiaro.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
          >
            Torna alla dashboard
          </Link>
        </header>

        {done ? (
          <div className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm leading-7 text-[var(--site-text)]">
            Operazione privacy completata. I dati operativi sono stati aggiornati e
            l’audit è stato registrato.
          </div>
        ) : null}

        <section className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
          <h2 className="text-xl font-semibold text-[var(--site-text)]">
            Cerca dati utente
          </h2>

          <p className="mt-2 text-sm leading-7 text-[var(--site-text-muted)]">
            Inserisci email, telefono o nome. Per le richieste privacy reali è preferibile
            usare l’email esatta indicata dall’utente.
          </p>

          <form className="mt-5 flex flex-col gap-3 md:flex-row" action="/admin/privacy">
            <input
              name="q"
              defaultValue={query}
              placeholder="email@dominio.it / telefono / nome"
              className="min-w-0 flex-1 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
            />

            <button
              type="submit"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
            >
              Cerca
            </button>
          </form>
        </section>

        {query ? (
          <section className="grid gap-4 md:grid-cols-5">
            <KpiCard title="Lead" value={leads.length} />
            <KpiCard title="Ricerche salvate" value={savedSearches.length} />
            <KpiCard title="Verifiche lead" value={leadVerifications.length} />
            <KpiCard title="Verifiche ricerche" value={savedSearchVerifications.length} />
            <KpiCard title="Audit privacy" value={privacyRequests.length} />
          </section>
        ) : null}

        {query && totalFound === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-8 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">
              Nessun dato operativo trovato
            </h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Non risultano lead, ricerche salvate o verifiche temporanee associate
              all’identificativo cercato.
            </p>
          </div>
        ) : null}

        {query && totalFound > 0 ? (
          <section className="rounded-[30px] border border-red-400/35 bg-red-950/35 p-6 text-red-50">
            <p className="text-xs uppercase tracking-[0.24em] text-red-100/70">
              Zona protetta
            </p>

            <h2 className="mt-2 text-2xl font-semibold text-red-50">
              Azioni privacy sull’utente cercato
            </h2>

            <p className="mt-3 max-w-4xl text-sm leading-7 text-red-50/75">
              Usa queste azioni solo dopo richiesta esplicita dell’interessato o
              dopo verifica interna. L’anonimizzazione rimuove nome, email, telefono,
              messaggi, IP/User-Agent e consensi dai record operativi, archivia le
              ricerche salvate ed elimina le verifiche temporanee. Rimane solo un
              audit minimo con hash.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              <form action={deactivateSavedSearchEmails}>
                <input type="hidden" name="identifier" value={query} />

                <button
                  type="submit"
                  className="w-full rounded-2xl border border-amber-300/40 bg-amber-400/15 px-5 py-3 text-sm font-semibold text-amber-50 transition hover:bg-amber-400/25"
                >
                  Disattiva solo email immobili simili
                </button>
              </form>

              <form action={anonymizeUserData}>
                <input type="hidden" name="identifier" value={query} />
                <input type="hidden" name="request_type" value="deletion" />
                <input
                  type="hidden"
                  name="message"
                  value="Richiesta gestita da Privacy Center admin."
                />

                <button
                  type="submit"
                  className="w-full rounded-2xl border border-red-300/45 bg-red-700/45 px-5 py-3 text-sm font-semibold text-red-50 transition hover:bg-red-700/60"
                >
                  Anonimizza dati utente e chiudi richieste
                </button>
              </form>
            </div>
          </section>
        ) : null}

        {query ? (
          <>
            <DataSection title="Lead trovati">
              {leads.length > 0 ? (
                leads.map((lead) => (
                  <DataCard key={lead.id}>
                    <div>
                      <p className="font-semibold text-[var(--site-text)]">
                        {lead.full_name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                        {lead.email} · {lead.phone || '-'}
                      </p>
                      <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                        {lead.property_title || 'Immobile non specificato'}
                      </p>
                    </div>

                    <div className="text-sm text-[var(--site-text-muted)]">
                      <p>Stato: {lead.status || '-'}</p>
                      <p>Creato: {formatDate(lead.created_at)}</p>
                      <p>
                        Privacy:{' '}
                        {lead.privacy_accepted
                          ? `sì · ${formatDate(lead.privacy_accepted_at)}`
                          : 'no / dato non presente'}
                      </p>
                      <p>Versione: {lead.privacy_policy_version || '-'}</p>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyText>Nessun lead trovato.</EmptyText>
              )}
            </DataSection>

            <DataSection title="Ricerche salvate trovate">
              {savedSearches.length > 0 ? (
                savedSearches.map((item) => (
                  <DataCard key={item.id}>
                    <div>
                      <p className="font-semibold text-[var(--site-text)]">
                        {item.full_name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                        {item.email} · {item.phone || '-'}
                      </p>
                      <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                        {item.source_property_title || 'Immobile origine non specificato'}
                      </p>
                    </div>

                    <div className="text-sm text-[var(--site-text-muted)]">
                      <p>Stato: {item.status || '-'}</p>
                      <p>Creata: {formatDate(item.created_at)}</p>
                      <p>Scadenza: {formatDate(item.expires_at)}</p>
                      <p>
                        Privacy:{' '}
                        {item.privacy_accepted
                          ? `sì · ${formatDate(item.privacy_accepted_at)}`
                          : 'no / dato non presente'}
                      </p>
                      <p>Versione: {item.privacy_policy_version || '-'}</p>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyText>Nessuna ricerca salvata trovata.</EmptyText>
              )}
            </DataSection>

            <DataSection title="Verifiche temporanee lead">
              {leadVerifications.length > 0 ? (
                leadVerifications.map((item) => (
                  <VerificationCard key={item.id} item={item} />
                ))
              ) : (
                <EmptyText>Nessuna verifica temporanea lead trovata.</EmptyText>
              )}
            </DataSection>

            <DataSection title="Verifiche temporanee ricerche salvate">
              {savedSearchVerifications.length > 0 ? (
                savedSearchVerifications.map((item) => (
                  <VerificationCard key={item.id} item={item} />
                ))
              ) : (
                <EmptyText>Nessuna verifica temporanea ricerca salvata trovata.</EmptyText>
              )}
            </DataSection>

            <DataSection title="Audit richieste privacy">
              {privacyRequests.length > 0 ? (
                privacyRequests.map((item) => (
                  <DataCard key={item.id}>
                    <div>
                      <p className="font-semibold text-[var(--site-text)]">
                        {item.request_type}
                      </p>
                      <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                        Stato: {item.status}
                      </p>
                      <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                        Azione: {item.action_taken || '-'}
                      </p>
                    </div>

                    <div className="text-sm text-[var(--site-text-muted)]">
                      <p>Lead anonimizzati: {item.leads_anonymized}</p>
                      <p>Verifiche lead eliminate: {item.lead_verifications_deleted}</p>
                      <p>Ricerche anonimizzate: {item.saved_searches_anonymized}</p>
                      <p>
                        Verifiche ricerche eliminate:{' '}
                        {item.saved_search_verifications_deleted}
                      </p>
                      <p>Creato: {formatDate(item.created_at)}</p>
                      <p>Chiuso: {formatDate(item.closed_at)}</p>
                    </div>
                  </DataCard>
                ))
              ) : (
                <EmptyText>Nessuna richiesta privacy già registrata.</EmptyText>
              )}
            </DataSection>
          </>
        ) : null}
      </div>
    </main>
  )
}

function KpiCard({ title, value }: { title: string; value: number | string }) {
  return (
    <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
      <p className="text-sm text-[var(--site-text-muted)]">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
        {value}
      </p>
    </div>
  )
}

function DataSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6">
      <h2 className="text-xl font-semibold text-[var(--site-text)]">{title}</h2>
      <div className="mt-5 space-y-3">{children}</div>
    </section>
  )
}

function DataCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid gap-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4 md:grid-cols-[minmax(0,1fr)_360px]">
      {children}
    </div>
  )
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4 text-sm text-[var(--site-text-muted)]">
      {children}
    </p>
  )
}

function VerificationCard({ item }: { item: VerificationRow }) {
  return (
    <DataCard>
      <div>
        <p className="font-semibold text-[var(--site-text)]">
          {item.full_name || 'Nome non presente'}
        </p>
        <p className="mt-1 text-sm text-[var(--site-text-muted)]">
          {item.email} · {item.phone || '-'}
        </p>
      </div>

      <div className="text-sm text-[var(--site-text-muted)]">
        <p>Creata: {formatDate(item.created_at)}</p>
        <p>Scadenza: {formatDate(item.expires_at)}</p>
        <p>Verificata: {formatDate(item.verified_at)}</p>
      </div>
    </DataCard>
  )
}
