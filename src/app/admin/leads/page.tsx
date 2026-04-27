import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import DeleteLeadButton from './DeleteLeadButton'
import LeadsFilters from './LeadsFilters'

type LeadStatus = 'new' | 'contacted' | 'closed' | 'archived'

type Lead = {
  id: string
  property_id: string | null
  property_slug: string | null
  property_title: string | null
  full_name: string
  email: string
  phone: string | null
  message: string | null
  status: LeadStatus
  internal_note: string | null
  contacted_at: string | null
  closed_at: string | null
  created_at: string
  privacy_accepted: boolean | null
  privacy_accepted_at: string | null
  privacy_policy_version: string | null
  privacy_ip: string | null
  privacy_user_agent: string | null
}

type AdminLeadsPageProps = {
  searchParams?: Promise<{
    status?: string
    q?: string
  }>
}

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'Nuovo' },
  { value: 'contacted', label: 'Contattato' },
  { value: 'closed', label: 'Chiuso' },
  { value: 'archived', label: 'Archiviato' },
]

const statusStyle: Record<LeadStatus, string> = {
  new: 'border-amber-400/40 bg-amber-400/10 text-[var(--site-text)]',
  contacted: 'border-sky-400/40 bg-sky-400/10 text-[var(--site-text)]',
  closed: 'border-emerald-400/40 bg-emerald-400/10 text-[var(--site-text)]',
  archived: 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)]',
}

const statusLabel: Record<LeadStatus, string> = {
  new: 'Nuovo',
  contacted: 'Contattato',
  closed: 'Chiuso',
  archived: 'Archiviato',
}

function isLeadStatus(value: string): value is LeadStatus {
  return statusOptions.some((item) => item.value === value)
}

function formatDate(value: string | null) {
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

function normalizeText(value: string | null | undefined) {
  return String(value ?? '').trim().toLowerCase()
}

function leadMatchesSearch(lead: Lead, query: string) {
  const cleanQuery = normalizeText(query)

  if (!cleanQuery) return true

  const searchableText = [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.message,
    lead.property_title,
    lead.property_slug,
  ]
    .map(normalizeText)
    .join(' ')

  return searchableText.includes(cleanQuery)
}

async function updateLeadStatus(formData: FormData) {
  'use server'

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as LeadStatus

  if (!id || !statusOptions.some((item) => item.value === status)) {
    return
  }

  const supabase = await createClient()

  const payload: Record<string, string | null> = {
    status,
  }

  if (status === 'contacted') {
    payload.contacted_at = new Date().toISOString()
  }

  if (status === 'closed' || status === 'archived') {
    payload.closed_at = new Date().toISOString()
  }

  await supabase.from('leads').update(payload).eq('id', id)

  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

async function updateLeadNote(formData: FormData) {
  'use server'

  const id = String(formData.get('id') ?? '')
  const internalNote = String(formData.get('internal_note') ?? '').trim()

  if (!id) {
    return
  }

  const supabase = await createClient()

  await supabase
    .from('leads')
    .update({
      internal_note: internalNote || null,
    })
    .eq('id', id)

  revalidatePath('/admin/leads')
}

async function deleteLead(formData: FormData) {
  'use server'

  const id = String(formData.get('id') ?? '')

  if (!id) {
    return
  }

  const supabase = await createClient()

  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) {
    console.error('Errore eliminazione lead:', error)
    return
  }

  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

export default async function AdminLeadsPage({
  searchParams,
}: AdminLeadsPageProps) {
  const params = searchParams ? await searchParams : {}

  const rawStatus = String(params.status ?? '')
  const selectedStatus: 'all' | LeadStatus = isLeadStatus(rawStatus)
    ? rawStatus
    : 'all'

  const searchQuery = String(params.q ?? '').trim()

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leads')
    .select(
      `
      id,
      property_id,
      property_slug,
      property_title,
      full_name,
      email,
      phone,
      message,
      status,
      internal_note,
      contacted_at,
      closed_at,
      created_at,
      privacy_accepted,
      privacy_accepted_at,
      privacy_policy_version,
      privacy_ip,
      privacy_user_agent
    `,
    )
    .order('created_at', { ascending: false })

  const leads = (data ?? []) as Lead[]

  const totalLeads = leads.length
  const newLeads = leads.filter((lead) => lead.status === 'new').length
  const contactedLeads = leads.filter((lead) => lead.status === 'contacted').length
  const closedLeads = leads.filter((lead) => lead.status === 'closed').length
  const archivedLeads = leads.filter((lead) => lead.status === 'archived').length

  const filteredLeads = leads.filter((lead) => {
    const statusMatch =
      selectedStatus === 'all' ? true : lead.status === selectedStatus

    return statusMatch && leadMatchesSearch(lead, searchQuery)
  })

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-2xl shadow-black/20 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              Area riservata
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--site-text)] md:text-4xl">
              Lead ricevuti
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--site-text-muted)]">
              Gestione delle richieste inviate dagli utenti tramite le schede immobile.
              Puoi segnare un lead come contattato, chiuso o archiviato e aggiungere note interne.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
          >
            Torna alla dashboard
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Totale lead</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{totalLeads}</p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Nuovi</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{newLeads}</p>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Contattati</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{contactedLeads}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Chiusi</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{closedLeads}</p>
          </div>

          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Archiviati</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text-soft)]">{archivedLeads}</p>
          </div>
        </section>

        <LeadsFilters
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          filteredCount={filteredLeads.length}
          totalCount={totalLeads}
        />

        {error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-900">
            Errore durante il caricamento dei lead: {error.message}
          </div>
        ) : null}

        {!error && leads.length === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">Nessun lead ricevuto</h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Quando un utente invierà una richiesta da una scheda immobile, comparirà qui.
            </p>
          </div>
        ) : null}

        {!error && leads.length > 0 && filteredLeads.length === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">Nessun risultato</h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Nessun lead corrisponde ai filtri applicati.
            </p>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-xl shadow-black/10">
          <div className="hidden grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] gap-4 border-b border-[var(--site-border)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)] xl:grid">
            <span>Stato</span>
            <span>Contatto</span>
            <span>Immobile</span>
            <span>Recapiti</span>
            <span>Ricevuto</span>
          </div>

          <div className="divide-y divide-white/10">
            {filteredLeads.map((lead) => {
              const publicPropertyHref = lead.property_slug
                ? `/immobili/${lead.property_slug}`
                : null

              const adminPropertyHref = lead.property_id
                ? `/admin/immobili/${lead.property_id}`
                : null

              return (
                <details
                  key={lead.id}
                  className="group bg-transparent open:bg-white/[0.02]"
                >
                  <summary className="grid cursor-pointer list-none gap-3 px-5 py-5 transition hover:bg-[var(--site-surface-strong)] xl:grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] xl:items-center [&::-webkit-details-marker]:hidden">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[lead.status] ?? statusStyle.new}`}
                      >
                        {statusLabel[lead.status] ?? 'Nuovo'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[var(--site-text)]">
                        {lead.full_name}
                      </p>
                      <p className="mt-1 text-xs text-[var(--site-text-faint)] xl:hidden">
                        Ricevuto il {formatDate(lead.created_at)}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--site-text-soft)]">
                        {lead.property_title || lead.property_slug || 'Immobile non specificato'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--site-text-muted)]">
                        {lead.email}
                      </p>
                      {lead.phone ? (
                        <p className="mt-1 truncate text-xs text-[var(--site-text-faint)]">
                          {lead.phone}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="hidden text-sm text-[var(--site-text-faint)] xl:inline">
                        {formatDate(lead.created_at)}
                      </span>
                      <span className="rounded-full border border-[var(--site-border)] px-3 py-1 text-xs text-[var(--site-text-muted)] transition group-open:bg-white group-open:text-black">
                        <span className="group-open:hidden">Apri</span>
                        <span className="hidden group-open:inline">Chiudi</span>
                      </span>
                    </div>
                  </summary>

                  <div className="border-t border-[var(--site-border)] px-5 pb-6 pt-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="min-w-0">
                        <div className="grid gap-2 text-sm text-[var(--site-text-muted)] md:grid-cols-2">
                          <p>
                            <span className="text-[var(--site-text-faint)]">Email:</span>{' '}
                            <a
                              href={`mailto:${lead.email}`}
                              className="text-[var(--site-text)] underline decoration-[var(--site-border-strong)] underline-offset-4 hover:decoration-[var(--site-text)]"
                            >
                              {lead.email}
                            </a>
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Telefono:</span>{' '}
                            {lead.phone ? (
                              <a
                                href={`tel:${lead.phone}`}
                                className="text-[var(--site-text)] underline decoration-[var(--site-border-strong)] underline-offset-4 hover:decoration-[var(--site-text)]"
                              >
                                {lead.phone}
                              </a>
                            ) : (
                              '-'
                            )}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Contattato:</span>{' '}
                            {formatDate(lead.contacted_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Chiuso/archiviato:</span>{' '}
                            {formatDate(lead.closed_at)}
                          </p>
                        </div>

                        <div className="mt-5 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                            Immobile collegato
                          </p>

                          <p className="mt-2 font-medium text-[var(--site-text)]">
                            {lead.property_title || lead.property_slug || 'Nessun immobile collegato'}
                          </p>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            {publicPropertyHref ? (
                              <Link
                                href={publicPropertyHref}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
                              >
                                Apri scheda pubblica
                              </Link>
                            ) : null}

                            {adminPropertyHref ? (
                              <Link
                                href={adminPropertyHref}
                                className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
                              >
                                Apri modifica immobile
                              </Link>
                            ) : null}

                            {!publicPropertyHref && !adminPropertyHref ? (
                              <p className="text-sm text-[var(--site-text-faint)]">
                                Link immobile non disponibile per questo lead.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        {lead.message ? (
                          <div className="mt-5 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
                            <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                              Messaggio utente
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--site-text-soft)]">
                              {lead.message}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                            Privacy e consenso
                          </p>

                          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Accettata:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {lead.privacy_accepted ? 'Sì' : 'No / dato non presente'}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Data consenso:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {formatDate(lead.privacy_accepted_at)}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Versione:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {lead.privacy_policy_version || '-'}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Prova tecnica:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {lead.privacy_ip || lead.privacy_user_agent ? 'IP/User-Agent registrati' : '-'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="w-full shrink-0">
                        <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
                          <p className="text-sm font-semibold text-[var(--site-text)]">
                            Cambia stato
                          </p>

                          <div className="mt-4 grid grid-cols-2 gap-2">
                            {statusOptions.map((option) => (
                              <form key={option.value} action={updateLeadStatus}>
                                <input type="hidden" name="id" value={lead.id} />
                                <input type="hidden" name="status" value={option.value} />

                                <button
                                  type="submit"
                                  className={`w-full rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                    lead.status === option.value
                                      ? 'border-[var(--site-border-strong)] bg-[var(--site-surface-2)] text-[var(--site-text)]'
                                      : 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              </form>
                            ))}
                          </div>
                        </div>

                        <form
                          action={updateLeadNote}
                          className="mt-4 rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
                        >
                          <input type="hidden" name="id" value={lead.id} />

                          <label
                            htmlFor={`internal_note_${lead.id}`}
                            className="text-sm font-semibold text-[var(--site-text)]"
                          >
                            Nota interna
                          </label>

                          <textarea
                            id={`internal_note_${lead.id}`}
                            name="internal_note"
                            defaultValue={lead.internal_note ?? ''}
                            rows={4}
                            placeholder="Es. Richiamare domani mattina, interessato alla visita..."
                            className="mt-3 w-full resize-none rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                          />

                          <button
                            type="submit"
                            className="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
                          >
                            Salva nota
                          </button>
                        </form>

                        <DeleteLeadButton leadId={lead.id} deleteAction={deleteLead} />
                      </div>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
