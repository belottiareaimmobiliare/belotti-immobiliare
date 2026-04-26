import Link from 'next/link'
import { requireAdminProfile } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { updateLeadStatus } from './actions'

export const dynamic = 'force-dynamic'

type LeadStatus = 'new' | 'read' | 'contacted' | 'closed'

type Lead = {
  id: string
  property_id: string | null
  property_slug: string | null
  property_title: string | null
  full_name: string
  email: string
  phone: string | null
  message: string | null
  status: LeadStatus | null
  notes: string | null
  created_at: string
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat('it-IT', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getStatusLabel(status: LeadStatus | null) {
  if (status === 'read') return 'Letto'
  if (status === 'contacted') return 'Ricontattato'
  if (status === 'closed') return 'Chiuso'
  return 'Nuovo'
}

function getStatusClass(status: LeadStatus | null) {
  if (status === 'read') return 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300'
  if (status === 'contacted') return 'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  if (status === 'closed') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  return 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300'
}

export default async function AdminLeadsPage() {
  const profile = await requireAdminProfile()

  if (profile.role !== 'owner' && !profile.can_manage_properties) {
    return (
      <section className="theme-panel rounded-[30px] border p-6">
        <h1 className="text-2xl font-semibold">Accesso non autorizzato</h1>
      </section>
    )
  }

  const service = createServiceClient()

  const { data, error } = await service
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  const leads = (data || []) as Lead[]

  const newCount = leads.filter((lead) => !lead.status || lead.status === 'new').length
  const contactedCount = leads.filter((lead) => lead.status === 'contacted').length

  return (
    <section className="mx-auto w-full max-w-7xl text-[var(--site-text)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
            Admin leads
          </p>

          <h1 className="mt-2 text-3xl font-semibold">Richieste ricevute</h1>

          <p className="theme-admin-muted mt-3">
            Contatti verificati arrivati dalle schede immobile.
          </p>
        </div>

        <Link
          href="/admin"
          className="theme-admin-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold"
        >
          Torna alla dashboard
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="theme-admin-card rounded-3xl p-5">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Totale richieste
          </p>
          <p className="mt-3 text-3xl font-semibold">{leads.length}</p>
        </div>

        <div className="theme-admin-card rounded-3xl p-5">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Nuove
          </p>
          <p className="mt-3 text-3xl font-semibold">{newCount}</p>
        </div>

        <div className="theme-admin-card rounded-3xl p-5">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Ricontattate
          </p>
          <p className="mt-3 text-3xl font-semibold">{contactedCount}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-700 dark:text-red-300">
          Errore nel caricamento delle richieste.
        </div>
      ) : null}

      {!error && leads.length === 0 ? (
        <div className="theme-admin-card mt-8 rounded-3xl border-dashed p-10 text-[var(--site-text-muted)]">
          Nessuna richiesta presente.
        </div>
      ) : null}

      <div className="mt-8 space-y-5">
        {leads.map((lead) => (
          <article
            key={lead.id}
            className="theme-admin-card rounded-[30px] p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${getStatusClass(
                      lead.status
                    )}`}
                  >
                    {getStatusLabel(lead.status)}
                  </span>

                  <span className="theme-admin-faint text-xs">
                    {formatDate(lead.created_at)}
                  </span>
                </div>

                <h2 className="mt-4 text-2xl font-semibold">
                  {lead.full_name}
                </h2>

                <p className="theme-admin-muted mt-2 text-sm">
                  {lead.property_title || 'Immobile non associato'}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {lead.property_slug ? (
                  <Link
                    href={`/immobili/${lead.property_slug}`}
                    target="_blank"
                    className="theme-admin-button-secondary inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Apri immobile
                  </Link>
                ) : null}

                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone}`}
                    className="theme-admin-button-primary inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
                  >
                    Chiama
                  </a>
                ) : null}

                <a
                  href={`mailto:${lead.email}`}
                  className="theme-admin-button-secondary inline-flex items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold"
                >
                  Email
                </a>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                  Email
                </p>
                <p className="mt-2 break-all text-sm text-[var(--site-text-soft)]">
                  {lead.email}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                  Cellulare
                </p>
                <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                  {lead.phone || '—'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                  Slug immobile
                </p>
                <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                  {lead.property_slug || '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
                Messaggio
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--site-text-muted)]">
                {lead.message || 'Nessun messaggio inserito.'}
              </p>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <form action={async () => {
                'use server'
                await updateLeadStatus(lead.id, 'read')
              }}>
                <button className="theme-admin-button-secondary rounded-2xl px-4 py-2.5 text-sm font-semibold">
                  Segna letto
                </button>
              </form>

              <form action={async () => {
                'use server'
                await updateLeadStatus(lead.id, 'contacted')
              }}>
                <button className="theme-admin-button-primary rounded-2xl px-4 py-2.5 text-sm font-semibold">
                  Ricontattato
                </button>
              </form>

              <form action={async () => {
                'use server'
                await updateLeadStatus(lead.id, 'closed')
              }}>
                <button className="theme-admin-button-secondary rounded-2xl px-4 py-2.5 text-sm font-semibold">
                  Chiudi
                </button>
              </form>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
