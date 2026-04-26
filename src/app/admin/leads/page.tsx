import Link from 'next/link'
import DeleteLeadButton from './DeleteLeadButton'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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
}

const statusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: 'new', label: 'Nuovo' },
  { value: 'contacted', label: 'Contattato' },
  { value: 'closed', label: 'Chiuso' },
  { value: 'archived', label: 'Archiviato' },
]

const statusStyle: Record<LeadStatus, string> = {
  new: 'border-amber-400/40 bg-amber-400/10 text-amber-200',
  contacted: 'border-sky-400/40 bg-sky-400/10 text-sky-200',
  closed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200',
  archived: 'border-white/15 bg-white/5 text-white/60',
}

const statusLabel: Record<LeadStatus, string> = {
  new: 'Nuovo',
  contacted: 'Contattato',
  closed: 'Chiuso',
  archived: 'Archiviato',
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

export default async function AdminLeadsPage() {
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
      created_at
    `,
    )
    .order('created_at', { ascending: false })

  const leads = (data ?? []) as Lead[]

  const totalLeads = leads.length
  const newLeads = leads.filter((lead) => lead.status === 'new').length
  const contactedLeads = leads.filter((lead) => lead.status === 'contacted').length
  const closedLeads = leads.filter((lead) => lead.status === 'closed').length

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-white/40">
              Area riservata
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
              Lead ricevuti
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
              Gestione delle richieste inviate dagli utenti tramite le schede immobile.
              Puoi segnare un lead come contattato, chiuso o archiviato e aggiungere note interne.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-white/80 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Torna alla dashboard
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-white/50">Totale lead</p>
            <p className="mt-3 text-3xl font-semibold text-white">{totalLeads}</p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-amber-100/70">Nuovi</p>
            <p className="mt-3 text-3xl font-semibold text-amber-100">{newLeads}</p>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <p className="text-sm text-sky-100/70">Contattati</p>
            <p className="mt-3 text-3xl font-semibold text-sky-100">{contactedLeads}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-emerald-100/70">Chiusi</p>
            <p className="mt-3 text-3xl font-semibold text-emerald-100">{closedLeads}</p>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-100">
            Errore durante il caricamento dei lead: {error.message}
          </div>
        ) : null}

        {!error && leads.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
            <h2 className="text-xl font-semibold text-white">Nessun lead ricevuto</h2>
            <p className="mt-3 text-sm text-white/55">
              Quando un utente invierà una richiesta da una scheda immobile, comparirà qui.
            </p>
          </div>
        ) : null}

        <section className="grid gap-5">
          {leads.map((lead) => (
            <article
              key={lead.id}
              className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-xl shadow-black/10"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[lead.status] ?? statusStyle.new}`}
                    >
                      {statusLabel[lead.status] ?? 'Nuovo'}
                    </span>

                    <span className="text-sm text-white/45">
                      Ricevuto il {formatDate(lead.created_at)}
                    </span>
                  </div>

                  <h2 className="mt-4 text-2xl font-semibold text-white">
                    {lead.full_name}
                  </h2>

                  <div className="mt-3 grid gap-2 text-sm text-white/65 md:grid-cols-2">
                    <p>
                      <span className="text-white/40">Email:</span>{' '}
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-white underline decoration-white/20 underline-offset-4 hover:decoration-white"
                      >
                        {lead.email}
                      </a>
                    </p>

                    <p>
                      <span className="text-white/40">Telefono:</span>{' '}
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone}`}
                          className="text-white underline decoration-white/20 underline-offset-4 hover:decoration-white"
                        >
                          {lead.phone}
                        </a>
                      ) : (
                        '-'
                      )}
                    </p>

                    <p>
                      <span className="text-white/40">Contattato:</span>{' '}
                      {formatDate(lead.contacted_at)}
                    </p>

                    <p>
                      <span className="text-white/40">Chiuso/archiviato:</span>{' '}
                      {formatDate(lead.closed_at)}
                    </p>
                  </div>

                  {lead.property_title || lead.property_slug ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                        Immobile collegato
                      </p>

                      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium text-white">
                          {lead.property_title ?? 'Scheda immobile'}
                        </p>

                        {lead.property_slug ? (
                          <Link
                            href={`/immobili/${lead.property_slug}`}
                            target="_blank"
                            className="text-sm font-medium text-white/70 underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-white"
                          >
                            Apri scheda
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  {lead.message ? (
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                        Messaggio utente
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-white/70">
                        {lead.message}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="w-full shrink-0 lg:w-[320px]">
                  <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm font-semibold text-white">
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
                                ? 'border-white/30 bg-white/15 text-white'
                                : 'border-white/10 bg-white/[0.03] text-white/60 hover:border-white/25 hover:bg-white/10 hover:text-white'
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
                    className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4"
                  >
                    <input type="hidden" name="id" value={lead.id} />

                    <label
                      htmlFor={`internal_note_${lead.id}`}
                      className="text-sm font-semibold text-white"
                    >
                      Nota interna
                    </label>

                    <textarea
                      id={`internal_note_${lead.id}`}
                      name="internal_note"
                      defaultValue={lead.internal_note ?? ''}
                      rows={4}
                      placeholder="Es. Richiamare domani mattina, interessato alla visita..."
                      className="mt-3 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
                    />

                    <button
                      type="submit"
                      className="mt-3 w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/85"
                    >
                      Salva nota
                    </button>
                  </form>

                  <DeleteLeadButton leadId={lead.id} deleteAction={deleteLead} />
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}
