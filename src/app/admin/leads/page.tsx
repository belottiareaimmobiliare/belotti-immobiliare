import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import DeleteLeadButton from './DeleteLeadButton'
import LeadsFilters from './LeadsFilters'
import ManualLeadNoteBox from './ManualLeadNoteBox'

type LeadStatus = 'new' | 'contacted' | 'closed' | 'archived'

type LeadSource = 'website' | 'manual_note' | 'phone' | 'email' | 'manual'

type Lead = {
  id: string
  property_id: string | null
  property_slug: string | null
  property_title: string | null
  full_name: string
  email: string | null
  phone: string | null
  message: string | null
  status: LeadStatus
  lead_source: LeadSource | string | null
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

type PropertyMediaItem = {
  file_url: string
  media_type: string
  is_cover: boolean | null
  sort_order: number | null
}

type PropertySummary = {
  id: string
  title: string
  slug: string
  reference_code: string | null
  price: number | null
  contract_type: string | null
  property_type: string | null
  status: string | null
  province: string | null
  comune: string | null
  frazione: string | null
  address: string | null
  surface: number | null
  rooms: number | null
  bathrooms: number | null
  property_media?: PropertyMediaItem[]
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
  archived:
    'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)]',
}

const statusLabel: Record<LeadStatus, string> = {
  new: 'Nuovo',
  contacted: 'Contattato',
  closed: 'Chiuso',
  archived: 'Archiviato',
}

const sourceLabel: Record<string, string> = {
  website: 'Sito',
  manual_note: 'Nota agente',
  phone: 'Telefono',
  email: 'Email',
  manual: 'Manuale',
}

const sourceStyle: Record<string, string> = {
  website: 'border-cyan-400/30 bg-cyan-400/10 text-[var(--site-text)]',
  manual_note: 'border-violet-400/30 bg-violet-400/10 text-[var(--site-text)]',
  phone: 'border-amber-400/30 bg-amber-400/10 text-[var(--site-text)]',
  email: 'border-sky-400/30 bg-sky-400/10 text-[var(--site-text)]',
  manual: 'border-violet-400/30 bg-violet-400/10 text-[var(--site-text)]',
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

function formatPrice(value: number | null) {
  if (typeof value !== 'number') return 'Prezzo su richiesta'

  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value)
}

function normalizeText(value: string | null | undefined) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getCoverUrl(property: PropertySummary) {
  const media = Array.isArray(property.property_media)
    ? property.property_media
    : []

  const images = media
    .filter((item) => item.media_type === 'image')
    .sort((a, b) => {
      if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
        return a.is_cover ? -1 : 1
      }

      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

  return images[0]?.file_url || null
}

function propertyMatchesSearch(property: PropertySummary, query: string) {
  const cleanQuery = normalizeText(query)

  if (!cleanQuery) return false

  const searchableText = [
    property.reference_code,
    property.title,
    property.slug,
    property.comune,
    property.frazione,
    property.province,
    property.address,
    property.property_type,
    property.contract_type,
  ]
    .map(normalizeText)
    .join(' ')

  return searchableText.includes(cleanQuery)
}

function isExactReferenceMatch(property: PropertySummary, query: string) {
  const cleanQuery = normalizeText(query)
  const referenceCode = normalizeText(property.reference_code)

  return Boolean(cleanQuery && referenceCode && referenceCode === cleanQuery)
}

function leadMatchesSearch(
  lead: Lead,
  query: string,
  propertyById: Map<string, PropertySummary>,
) {
  const cleanQuery = normalizeText(query)

  if (!cleanQuery) return true

  const property = lead.property_id ? propertyById.get(lead.property_id) : null

  const searchableText = [
    lead.full_name,
    lead.email,
    lead.phone,
    lead.message,
    lead.property_title,
    lead.property_slug,
    lead.internal_note,
    lead.lead_source,
    property?.reference_code,
    property?.title,
    property?.comune,
    property?.frazione,
    property?.address,
  ]
    .map(normalizeText)
    .join(' ')

  return searchableText.includes(cleanQuery)
}

function cleanFormText(value: FormDataEntryValue | null) {
  return String(value ?? '').trim()
}

async function updateLeadStatus(formData: FormData) {
  'use server'

  const id = cleanFormText(formData.get('id'))
  const status = cleanFormText(formData.get('status')) as LeadStatus

  if (!id || !statusOptions.some((item) => item.value === status)) {
    return
  }

  const supabase = createServiceClient()

  const payload: Record<string, string | null> = {
    status,
    updated_at: new Date().toISOString(),
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

async function updateLeadQuickDetails(formData: FormData) {
  'use server'

  const id = cleanFormText(formData.get('id'))

  if (!id) {
    return
  }

  const fullName = cleanFormText(formData.get('full_name'))
  const email = cleanFormText(formData.get('email'))
  const phone = cleanFormText(formData.get('phone'))
  const message = cleanFormText(formData.get('message'))
  const internalNote = cleanFormText(formData.get('internal_note'))

  const supabase = createServiceClient()

  await supabase
    .from('leads')
    .update({
      full_name: fullName || 'Contatto senza nome',
      email: email || null,
      phone: phone || null,
      message: message || null,
      internal_note: internalNote || null,
      notes: internalNote || message || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

async function deleteLead(formData: FormData) {
  'use server'

  const id = cleanFormText(formData.get('id'))

  if (!id) {
    return
  }

  const supabase = createServiceClient()

  const { error } = await supabase.from('leads').delete().eq('id', id)

  if (error) {
    console.error('Errore eliminazione lead:', error)
    return
  }

  revalidatePath('/admin/leads')
  revalidatePath('/admin')
}

function LeadRowCard({ lead }: { lead: Lead }) {
  const source = lead.lead_source || 'website'

  const publicPropertyHref = lead.property_slug
    ? `/immobili/${lead.property_slug}`
    : null

  const adminPropertyHref = lead.property_id
    ? `/admin/immobili/${lead.property_id}`
    : null

  return (
    <details className="group bg-transparent open:bg-white/[0.02]">
      <summary className="grid cursor-pointer list-none gap-3 px-5 py-5 transition hover:bg-[var(--site-surface-strong)] xl:grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] xl:items-center [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              statusStyle[lead.status] ?? statusStyle.new
            }`}
          >
            {statusLabel[lead.status] ?? 'Nuovo'}
          </span>

          <span
            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
              sourceStyle[source] ?? sourceStyle.website
            }`}
          >
            {sourceLabel[source] ?? source}
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
            {lead.email || '-'}
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
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="grid gap-2 text-sm text-[var(--site-text-muted)] md:grid-cols-2">
              <p>
                <span className="text-[var(--site-text-faint)]">Email:</span>{' '}
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-[var(--site-text)] underline decoration-[var(--site-border-strong)] underline-offset-4 hover:decoration-[var(--site-text)]"
                  >
                    {lead.email}
                  </a>
                ) : (
                  '-'
                )}
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
                <span className="text-[var(--site-text-faint)]">
                  Chiuso/archiviato:
                </span>{' '}
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
                  Messaggio / nota
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[var(--site-text-soft)]">
                  {lead.message}
                </p>
              </div>
            ) : null}

            <div className="mt-5 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="admin-privacy-consent-title text-xs font-semibold uppercase tracking-[0.22em]">
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
                    {lead.privacy_ip || lead.privacy_user_agent
                      ? 'IP/User-Agent registrati'
                      : '-'}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 space-y-5">
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
                      className={`lead-status-btn w-full rounded-full border px-3 py-2.5 text-xs font-semibold transition ${
                        option.value === lead.status
                          ? 'border-white bg-white text-black'
                          : 'border-[var(--site-border)] text-[var(--site-text-soft)] hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]'
                      }`}
                    >
                      {option.label}
                    </button>
                  </form>
                ))}
              </div>
            </div>

            <form
              action={updateLeadQuickDetails}
              className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
            >
              <input type="hidden" name="id" value={lead.id} />

              <p className="text-sm font-semibold text-[var(--site-text)]">
                Modifica rapida
              </p>

              <div className="mt-4 space-y-3">
                <input
                  name="full_name"
                  defaultValue={lead.full_name}
                  placeholder="Nome e cognome"
                  className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                />

                <input
                  name="email"
                  defaultValue={lead.email || ''}
                  placeholder="Email"
                  className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                />

                <input
                  name="phone"
                  defaultValue={lead.phone || ''}
                  placeholder="Telefono"
                  className="w-full rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                />

                <textarea
                  name="message"
                  defaultValue={lead.message || ''}
                  rows={4}
                  placeholder="Messaggio / nota principale"
                  className="w-full resize-y rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                />

                <textarea
                  name="internal_note"
                  defaultValue={lead.internal_note || ''}
                  rows={4}
                  placeholder="Nota interna"
                  className="w-full resize-y rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm leading-6 text-[var(--site-text)] outline-none placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                />

                <button
                  type="submit"
                  className="w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
                >
                  Salva modifiche
                </button>
              </div>
            </form>

            <DeleteLeadButton leadId={lead.id} deleteAction={deleteLead} />
          </div>
        </div>
      </div>
    </details>
  )
}

function PropertyLeadGroup({
  property,
  leads,
}: {
  property: PropertySummary
  leads: Lead[]
}) {
  const coverUrl = getCoverUrl(property)
  const websiteLeads = leads.filter((lead) => (lead.lead_source || 'website') === 'website')
  const manualLeads = leads.filter((lead) => (lead.lead_source || 'website') !== 'website')

  return (
    <section className="overflow-hidden rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-xl shadow-black/10">
      <div className="grid gap-5 border-b border-[var(--site-border)] p-5 lg:grid-cols-[220px_minmax(0,1fr)_280px]">
        <div className="self-start overflow-hidden rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] shadow-lg shadow-black/10">
          <div className="relative aspect-[4/3] w-full">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={property.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-[var(--site-surface-strong)] px-4 text-center text-sm text-[var(--site-text-faint)]">
                Nessuna immagine
              </div>
            )}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {property.reference_code ? (
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-[var(--site-text)]">
                Rif. {property.reference_code}
              </span>
            ) : null}

            <span className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-3 py-1 text-xs font-semibold text-[var(--site-text-soft)]">
              {property.status || 'stato non indicato'}
            </span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--site-text)]">
            {property.title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-[var(--site-text-muted)]">
            {[property.comune, property.frazione, property.province]
              .filter(Boolean)
              .join(' · ') || 'Località non indicata'}
          </p>

          <div className="mt-4 grid gap-3 text-sm text-[var(--site-text-muted)] sm:grid-cols-2 xl:grid-cols-4">
            <p>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                Prezzo
              </span>
              <span className="mt-1 block font-semibold text-[var(--site-text)]">
                {formatPrice(property.price)}
              </span>
            </p>

            <p>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                Tipologia
              </span>
              <span className="mt-1 block font-semibold text-[var(--site-text)]">
                {property.property_type || '-'}
              </span>
            </p>

            <p>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                Contratto
              </span>
              <span className="mt-1 block font-semibold text-[var(--site-text)]">
                {property.contract_type || '-'}
              </span>
            </p>

            <p>
              <span className="block text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                Dati
              </span>
              <span className="mt-1 block font-semibold text-[var(--site-text)]">
                {property.surface ? `${property.surface} mq` : '-'}
                {property.rooms ? ` · ${property.rooms} locali` : ''}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3">
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
            <p className="text-sm text-[var(--site-text-muted)]">Interessati</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
              {leads.length}
            </p>
            <p className="mt-2 text-xs leading-5 text-[var(--site-text-faint)]">
              {websiteLeads.length} dal sito · {manualLeads.length} da nota/agente
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/admin/immobili/${property.id}`}
              className="admin-gold-spin-hover inline-flex items-center justify-center rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
            >
              Modifica
            </Link>

            <Link
              href={`/immobili/${property.slug}`}
              target="_blank"
              rel="noreferrer"
              className="admin-gold-spin-hover inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-4 py-3 text-sm font-semibold text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
            >
              Apri pagina pubblica
            </Link>

            <Link
              href={`/admin/immobili/${property.id}/apri-nota`}
              className="admin-gold-spin-hover inline-flex items-center justify-center rounded-full border border-amber-400/35 bg-amber-400/10 px-4 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:border-amber-300/70 hover:bg-amber-400/20"
            >
              Apri + nota
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-b border-[var(--site-border)] bg-[var(--site-surface-strong)] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--site-text)]">
            {leads.length} interessati per questo immobile
          </p>
          <p className="mt-1 text-xs text-[var(--site-text-faint)]">
            Lista unica: richieste dal sito e note inserite dagli agenti.
          </p>
        </div>

        <details className="group">
          <summary
            aria-label="Nuova nota"
            className="group/note relative inline-flex min-w-[190px] cursor-pointer list-none items-center justify-center overflow-hidden rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition duration-300 hover:bg-[#eef2f7] [&::-webkit-details-marker]:hidden"
          >
            <span
              aria-hidden="true"
              className="absolute left-6 top-1/2 -translate-y-1/2 text-base font-semibold transition-all duration-300 ease-out group-hover/note:left-1/2 group-hover/note:-translate-x-1/2 group-hover/note:scale-125 group-hover/note:font-black"
            >
              +
            </span>

            <span
              aria-hidden="true"
              className="pl-4 transition-all duration-200 ease-out group-hover/note:translate-x-3 group-hover/note:opacity-0"
            >
              Nuova nota
            </span>
          </summary>

          <ManualLeadNoteBox
            propertyId={property.id}
            propertyTitle={property.title}
            previewHref={`/admin/immobili/${property.id}/apri-nota`}
          />
        </details>
      </div>

      {leads.length > 0 ? (
        <div>
          <div className="hidden grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] gap-4 border-b border-[var(--site-border)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)] xl:grid">
            <span>Stato</span>
            <span>Contatto</span>
            <span>Immobile</span>
            <span>Recapiti</span>
            <span>Ricevuto</span>
          </div>

          <div className="divide-y divide-white/10">
            {leads.map((lead) => (
              <LeadRowCard key={lead.id} lead={lead} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-10 text-center">
          <h3 className="text-lg font-semibold text-[var(--site-text)]">
            Nessun interessato ancora collegato
          </h3>
          <p className="mt-3 text-sm text-[var(--site-text-muted)]">
            Usa “Nuova nota” per registrare una telefonata o un contatto raccolto dall’agenzia.
          </p>
        </div>
      )}
    </section>
  )
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

  const supabase = createServiceClient()

  const [{ data, error }, { data: propertiesData }] = await Promise.all([
    supabase
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
        lead_source,
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
      .order('created_at', { ascending: false }),

    supabase
      .from('properties')
      .select(
        `
        id,
        title,
        slug,
        reference_code,
        price,
        contract_type,
        property_type,
        status,
        province,
        comune,
        frazione,
        address,
        surface,
        rooms,
        bathrooms,
        property_media (
          file_url,
          media_type,
          is_cover,
          sort_order
        )
      `,
      )
      .order('updated_at', { ascending: false }),
  ])

  const leads = (data ?? []) as Lead[]
  const properties = (propertiesData ?? []) as PropertySummary[]

  const propertyById = new Map(properties.map((property) => [property.id, property]))

  const totalLeads = leads.length
  const newLeads = leads.filter((lead) => lead.status === 'new').length
  const contactedLeads = leads.filter((lead) => lead.status === 'contacted').length
  const closedLeads = leads.filter((lead) => lead.status === 'closed').length
  const archivedLeads = leads.filter((lead) => lead.status === 'archived').length

  const matchingProperties = searchQuery
    ? properties.filter((property) => propertyMatchesSearch(property, searchQuery))
    : []

  const exactReferenceMatches = matchingProperties.filter((property) =>
    isExactReferenceMatch(property, searchQuery),
  )

  const highlightedProperties = [
    ...exactReferenceMatches,
    ...matchingProperties.filter(
      (property) => !exactReferenceMatches.some((item) => item.id === property.id),
    ),
  ].slice(0, 3)

  const hasHighlightedProperty = highlightedProperties.length > 0

  const statusFilteredLeads = leads.filter((lead) =>
    selectedStatus === 'all' ? true : lead.status === selectedStatus,
  )

  const filteredLeads = statusFilteredLeads.filter((lead) =>
    leadMatchesSearch(lead, searchQuery, propertyById),
  )

  const displayedCount = hasHighlightedProperty
    ? highlightedProperties.reduce((total, property) => {
        return (
          total +
          statusFilteredLeads.filter((lead) => lead.property_id === property.id).length
        )
      }, 0)
    : filteredLeads.length

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
              Gestione delle richieste arrivate dal sito e degli interessati inseriti manualmente dagli agenti. Puoi cercare anche per codice immobile.
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
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
              {totalLeads}
            </p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Nuovi</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
              {newLeads}
            </p>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Contattati</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
              {contactedLeads}
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Chiusi</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">
              {closedLeads}
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Archiviati</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text-soft)]">
              {archivedLeads}
            </p>
          </div>
        </section>

        <LeadsFilters
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          filteredCount={displayedCount}
          totalCount={totalLeads}
        />

        {error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-900">
            Errore durante il caricamento dei lead: {error.message}
          </div>
        ) : null}

        {!error && leads.length === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">
              Nessun lead ricevuto
            </h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Quando un utente invierà una richiesta da una scheda immobile, comparirà qui.
            </p>
          </div>
        ) : null}

        {!error && hasHighlightedProperty ? (
          <>
            {highlightedProperties.map((property) => {
              const propertyLeads = statusFilteredLeads.filter(
                (lead) => lead.property_id === property.id,
              )

              return (
                <PropertyLeadGroup
                  key={property.id}
                  property={property}
                  leads={propertyLeads}
                />
              )
            })}
          </>
        ) : null}

        {!error && !hasHighlightedProperty && leads.length > 0 && filteredLeads.length === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">
              Nessun risultato
            </h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Nessun lead o immobile corrisponde ai filtri applicati.
            </p>
          </div>
        ) : null}

        {!error && !hasHighlightedProperty && filteredLeads.length > 0 ? (
          <section className="overflow-hidden rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-xl shadow-black/10">
            <div className="hidden grid-cols-[160px_minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] gap-4 border-b border-[var(--site-border)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)] xl:grid">
              <span>Stato</span>
              <span>Contatto</span>
              <span>Immobile</span>
              <span>Recapiti</span>
              <span>Ricevuto</span>
            </div>

            <div className="divide-y divide-white/10">
              {filteredLeads.map((lead) => (
                <LeadRowCard key={lead.id} lead={lead} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  )
}