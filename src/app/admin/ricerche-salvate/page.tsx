import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { requirePermission } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import DeleteSavedSearchButton from './DeleteSavedSearchButton'

type SavedSearchStatus = 'new' | 'contacted' | 'closed' | 'archived'

type SavedSearch = {
  id: string
  full_name: string
  email: string
  phone: string | null

  source_property_id: string | null
  source_property_slug: string | null
  source_property_title: string | null
  source_latitude: number | null
  source_longitude: number | null
  radius_km: number | null

  contract_type: string | null
  source_property_type: string | null
  search_macro_category: string | null

  comune: string | null
  province: string | null

  min_price: number | null
  max_price: number | null
  min_surface: number | null
  max_surface: number | null
  rooms_min: number | null
  rooms_max: number | null
  bathrooms_min: number | null

  features_preferred: Record<string, boolean> | null

  status: SavedSearchStatus
  internal_note: string | null
  contacted_at: string | null
  closed_at: string | null
  created_at: string
  expires_at: string | null
  last_digest_sent_at: string | null
  last_checked_at: string | null
  privacy_accepted: boolean | null
  privacy_accepted_at: string | null
  privacy_policy_version: string | null
  privacy_ip: string | null
  privacy_user_agent: string | null
}

const statusOptions: Array<{ value: SavedSearchStatus; label: string }> = [
  { value: 'new', label: 'Nuova' },
  { value: 'contacted', label: 'Contattata' },
  { value: 'closed', label: 'Chiusa' },
  { value: 'archived', label: 'Archiviata' },
]

const statusLabel: Record<SavedSearchStatus, string> = {
  new: 'Nuova',
  contacted: 'Contattata',
  closed: 'Chiusa',
  archived: 'Archiviata',
}

const statusStyle: Record<SavedSearchStatus, string> = {
  new: 'border-amber-400/40 bg-amber-400/10 text-[var(--site-text)]',
  contacted: 'border-sky-400/40 bg-sky-400/10 text-[var(--site-text)]',
  closed: 'border-emerald-400/40 bg-emerald-400/10 text-[var(--site-text)]',
  archived: 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)]',
}

const macroCategoryLabel: Record<string, string> = {
  residential_full: 'Residenziale intero',
  room_or_portion: 'Stanze / porzioni',
  garage_parking: 'Box / posto auto',
  commercial: 'Commerciale',
  land: 'Terreni',
  other: 'Altro',
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

function formatMoney(value: number | null) {
  if (typeof value !== 'number') return '-'
  return `€ ${value.toLocaleString('it-IT')}`
}

function formatRange(min: number | null, max: number | null, suffix = '') {
  if (min && max) return `${min.toLocaleString('it-IT')}${suffix} - ${max.toLocaleString('it-IT')}${suffix}`
  if (min) return `da ${min.toLocaleString('it-IT')}${suffix}`
  if (max) return `fino a ${max.toLocaleString('it-IT')}${suffix}`
  return '-'
}

function formatOptionLabel(value: string | null | undefined) {
  const clean = String(value || '').trim()
  if (!clean) return '-'

  const labels: Record<string, string> = {
    vendita: 'Vendita',
    affitto: 'Affitto',
    appartamento: 'Appartamento',
    attico: 'Attico',
    bilocale: 'Bilocale',
    trilocale: 'Trilocale',
    quadrilocale: 'Quadrilocale',
    monolocale: 'Monolocale',
    villa: 'Villa',
    villetta: 'Villetta',
    casa_indipendente: 'Casa indipendente',
    casa_indipendente_villa: 'Casa indipendente / villa',
    box: 'Box',
    garage: 'Garage',
    ufficio: 'Ufficio',
    negozio: 'Negozio',
    terreno: 'Terreno',
  }

  return labels[clean] || clean.replaceAll('_', ' ')
}

function getPreferredFeatures(features: Record<string, boolean> | null) {
  if (!features) return []

  return [
    features.hasGarage ? 'Garage' : null,
    features.hasParking ? 'Posto auto' : null,
    features.hasGarden ? 'Giardino' : null,
    features.hasElevator ? 'Ascensore' : null,
  ].filter(Boolean) as string[]
}

async function updateSavedSearchStatus(formData: FormData) {
  'use server'

  await requirePermission('can_manage_properties')

  const id = String(formData.get('id') ?? '')
  const status = String(formData.get('status') ?? '') as SavedSearchStatus

  if (!id || !statusOptions.some((item) => item.value === status)) {
    return
  }

  const supabase = createServiceClient()

  const payload: Record<string, string | null> = {
    status,
  }

  if (status === 'contacted') {
    payload.contacted_at = new Date().toISOString()
  }

  if (status === 'closed' || status === 'archived') {
    payload.closed_at = new Date().toISOString()
  }

  await supabase.from('saved_searches').update(payload).eq('id', id)

  revalidatePath('/admin/ricerche-salvate')
  revalidatePath('/admin')
}

async function updateSavedSearchNote(formData: FormData) {
  'use server'

  await requirePermission('can_manage_properties')

  const id = String(formData.get('id') ?? '')
  const internalNote = String(formData.get('internal_note') ?? '').trim()

  if (!id) {
    return
  }

  const supabase = createServiceClient()

  await supabase
    .from('saved_searches')
    .update({
      internal_note: internalNote || null,
    })
    .eq('id', id)

  revalidatePath('/admin/ricerche-salvate')
}

async function deleteSavedSearch(formData: FormData) {
  'use server'

  await requirePermission('can_manage_properties')

  const id = String(formData.get('id') ?? '')

  if (!id) {
    return
  }

  const supabase = createServiceClient()

  await supabase.from('saved_searches').delete().eq('id', id)

  revalidatePath('/admin/ricerche-salvate')
  revalidatePath('/admin')
}

export default async function AdminSavedSearchesPage() {
  await requirePermission('can_manage_properties')

  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('saved_searches')
    .select(
      `
      id,
      full_name,
      email,
      phone,
      source_property_id,
      source_property_slug,
      source_property_title,
      source_latitude,
      source_longitude,
      radius_km,
      contract_type,
      source_property_type,
      search_macro_category,
      comune,
      province,
      min_price,
      max_price,
      min_surface,
      max_surface,
      rooms_min,
      rooms_max,
      bathrooms_min,
      features_preferred,
      status,
      internal_note,
      contacted_at,
      closed_at,
      created_at,
      expires_at,
      last_digest_sent_at,
      last_checked_at,
      privacy_accepted,
      privacy_accepted_at,
      privacy_policy_version,
      privacy_ip,
      privacy_user_agent
    `,
    )
    .order('created_at', { ascending: false })

  const searches = (data ?? []) as SavedSearch[]

  const total = searches.length
  const activeSearches = searches.filter((item) =>
    ['new', 'contacted'].includes(item.status)
  )
  const activeSubscriberCount = new Set(
    activeSearches.map((item) => item.email.trim().toLowerCase())
  ).size
  const newCount = searches.filter((item) => item.status === 'new').length
  const contactedCount = searches.filter((item) => item.status === 'contacted').length
  const closedCount = searches.filter((item) => item.status === 'closed').length
  const archivedCount = searches.filter((item) => item.status === 'archived').length

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)] sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <header className="flex flex-col gap-4 rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-6 shadow-2xl shadow-black/10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              Area riservata
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--site-text)] md:text-4xl">
              Ricerche salvate
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--site-text-muted)]">
              Richieste lasciate dagli utenti quando vogliono essere avvisati per immobili simili
              per zona, fascia di prezzo e caratteristiche principali.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-[var(--site-border)] px-5 py-3 text-sm font-medium text-[var(--site-text-soft)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
          >
            Torna alla dashboard
          </Link>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Totale</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{total}</p>
          </div>

          <div className="rounded-3xl border border-blue-400/20 bg-blue-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Utenti iscritti mail</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{activeSubscriberCount}</p>
          </div>

          <div className="rounded-3xl border border-amber-400/20 bg-amber-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Nuove</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{newCount}</p>
          </div>

          <div className="rounded-3xl border border-sky-400/20 bg-sky-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Contattate</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{contactedCount}</p>
          </div>

          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Chiuse</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{closedCount}</p>
          </div>

          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-5">
            <p className="text-sm text-[var(--site-text-muted)]">Archiviate</p>
            <p className="mt-3 text-3xl font-semibold text-[var(--site-text)]">{archivedCount}</p>
          </div>
        </section>

        {error ? (
          <div className="rounded-3xl border border-red-400/30 bg-red-500/10 p-6 text-sm text-red-700 dark:text-red-900">
            Errore durante il caricamento delle ricerche salvate: {error.message}
          </div>
        ) : null}

        {!error && searches.length === 0 ? (
          <div className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface)] p-10 text-center">
            <h2 className="text-xl font-semibold text-[var(--site-text)]">
              Nessuna ricerca salvata
            </h2>
            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
              Quando un utente userà “Avvisami per immobili simili”, comparirà qui.
            </p>
          </div>
        ) : null}

        <section className="overflow-hidden rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] shadow-xl shadow-black/10">
          <div className="hidden grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] gap-4 border-b border-[var(--site-border)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)] xl:grid">
            <span>Stato</span>
            <span>Contatto</span>
            <span>Ricerca</span>
            <span>Riferimento</span>
            <span>Iscritta dal</span>
          </div>

          <div className="divide-y divide-[var(--site-border)]">
            {searches.map((savedSearch) => {
              const features = getPreferredFeatures(savedSearch.features_preferred)
              const publicPropertyHref = savedSearch.source_property_slug
                ? `/immobili/${savedSearch.source_property_slug}`
                : null

              const adminPropertyHref = savedSearch.source_property_id
                ? `/admin/immobili/${savedSearch.source_property_id}`
                : null

              return (
                <details
                  key={savedSearch.id}
                  className="group bg-transparent open:bg-[var(--site-surface-strong)]"
                >
                  <summary className="grid cursor-pointer list-none gap-3 px-5 py-5 transition hover:bg-[var(--site-surface-2)] xl:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_150px] xl:items-center [&::-webkit-details-marker]:hidden">
                    <div>
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[savedSearch.status] ?? statusStyle.new}`}
                      >
                        {statusLabel[savedSearch.status] ?? 'Nuova'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-[var(--site-text)]">
                        {savedSearch.full_name}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--site-text-muted)]">
                        {savedSearch.email}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--site-text-soft)]">
                        {macroCategoryLabel[savedSearch.search_macro_category || ''] || 'Categoria non definita'}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--site-text-muted)]">
                        {formatOptionLabel(savedSearch.contract_type)} · {savedSearch.comune || savedSearch.province || 'Zona non specificata'}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--site-text-soft)]">
                        {savedSearch.source_property_title || 'Immobile non specificato'}
                      </p>
                      <p className="mt-1 truncate text-xs text-[var(--site-text-muted)]">
                        Origine richiesta
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="hidden text-sm text-[var(--site-text-muted)] xl:inline">
                        {formatDate(savedSearch.created_at)}
                      </span>
                      <span className="rounded-full border border-[var(--site-border)] px-3 py-1 text-xs text-[var(--site-text-muted)] transition group-open:bg-[var(--site-text)] group-open:text-[var(--site-bg)]">
                        <span className="group-open:hidden">Apri</span>
                        <span className="hidden group-open:inline">Chiudi</span>
                      </span>
                    </div>
                  </summary>

                  <div className="border-t border-[var(--site-border)] px-5 pb-6 pt-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="min-w-0 space-y-5">
                        <div className="grid gap-2 text-sm text-[var(--site-text-muted)] md:grid-cols-2">
                          <p>
                            <span className="text-[var(--site-text-faint)]">Email:</span>{' '}
                            <a
                              href={`mailto:${savedSearch.email}`}
                              className="text-[var(--site-text)] underline decoration-[var(--site-border-strong)] underline-offset-4 hover:decoration-[var(--site-text)]"
                            >
                              {savedSearch.email}
                            </a>
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Telefono:</span>{' '}
                            {savedSearch.phone ? (
                              <a
                                href={`tel:${savedSearch.phone}`}
                                className="text-[var(--site-text)] underline decoration-[var(--site-border-strong)] underline-offset-4 hover:decoration-[var(--site-text)]"
                              >
                                {savedSearch.phone}
                              </a>
                            ) : (
                              '-'
                            )}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Contattata:</span>{' '}
                            {formatDate(savedSearch.contacted_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Chiusa/archiviata:</span>{' '}
                            {formatDate(savedSearch.closed_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Iscritta dal:</span>{' '}
                            {formatDate(savedSearch.created_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Scadenza automatica:</span>{' '}
                            {formatDate(savedSearch.expires_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Ultimo controllo:</span>{' '}
                            {formatDate(savedSearch.last_checked_at)}
                          </p>

                          <p>
                            <span className="text-[var(--site-text-faint)]">Ultima mail con immobili:</span>{' '}
                            {formatDate(savedSearch.last_digest_sent_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                            Criteri ricerca simile
                          </p>

                          <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Contratto</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {formatOptionLabel(savedSearch.contract_type)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Macro categoria</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {macroCategoryLabel[savedSearch.search_macro_category || ''] || '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Tipologia origine</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {formatOptionLabel(savedSearch.source_property_type)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Zona</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {savedSearch.comune || '-'} {savedSearch.province ? `(${savedSearch.province})` : ''}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Raggio zona</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {savedSearch.source_latitude && savedSearch.source_longitude
                                  ? `${savedSearch.radius_km || 10} km dal punto dell’immobile`
                                  : 'Comune / provincia'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Prezzo indicativo</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {savedSearch.min_price || savedSearch.max_price
                                  ? `${formatMoney(savedSearch.min_price)} - ${formatMoney(savedSearch.max_price)}`
                                  : '-'}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Superficie indicativa</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {formatRange(savedSearch.min_surface, savedSearch.max_surface, ' mq')}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Locali</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {formatRange(savedSearch.rooms_min, savedSearch.rooms_max)}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs text-[var(--site-text-faint)]">Bagni minimi</p>
                              <p className="mt-1 text-sm text-[var(--site-text)]">
                                {savedSearch.bathrooms_min ?? '-'}
                              </p>
                            </div>
                          </div>

                          {features.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {features.map((feature) => (
                                <span
                                  key={feature}
                                  className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-1 text-xs text-[var(--site-text-muted)]"
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                            Immobile di partenza
                          </p>

                          <p className="mt-2 font-medium text-[var(--site-text)]">
                            {savedSearch.source_property_title || 'Nessun immobile collegato'}
                          </p>

                          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                            {publicPropertyHref ? (
                              <Link
                                href={publicPropertyHref}
                                target="_blank"
                                rel="noreferrer"
                                className="theme-button-primary inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition"
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
                              <p className="text-sm text-[var(--site-text-muted)]">
                                Link immobile non disponibile.
                              </p>
                            ) : null}
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                          <p className="text-xs uppercase tracking-[0.22em] text-emerald-200">
                            Privacy e consenso
                          </p>

                          <div className="mt-3 grid gap-2 text-sm md:grid-cols-2">
                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Accettata:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {savedSearch.privacy_accepted ? 'Sì' : 'No / dato non presente'}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Data consenso:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {formatDate(savedSearch.privacy_accepted_at)}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Versione:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {savedSearch.privacy_policy_version || '-'}
                              </span>
                            </p>

                            <p className="text-[var(--site-text-muted)]">
                              <span className="text-[var(--site-text-faint)]">Prova tecnica:</span>{' '}
                              <span className="font-semibold text-[var(--site-text)]">
                                {savedSearch.privacy_ip || savedSearch.privacy_user_agent ? 'IP/User-Agent registrati' : '-'}
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
                              <form key={option.value} action={updateSavedSearchStatus}>
                                <input type="hidden" name="id" value={savedSearch.id} />
                                <input type="hidden" name="status" value={option.value} />

                                <button
                                  type="submit"
                                  className={`w-full rounded-full border px-3 py-2 text-xs font-semibold transition ${
                                    savedSearch.status === option.value
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
                          action={updateSavedSearchNote}
                          className="mt-4 rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
                        >
                          <input type="hidden" name="id" value={savedSearch.id} />

                          <label
                            htmlFor={`internal_note_${savedSearch.id}`}
                            className="text-sm font-semibold text-[var(--site-text)]"
                          >
                            Nota interna
                          </label>

                          <textarea
                            id={`internal_note_${savedSearch.id}`}
                            name="internal_note"
                            defaultValue={savedSearch.internal_note ?? ''}
                            rows={4}
                            placeholder="Es. Cercare alternative simili, ricontattare se esce un trilocale..."
                            className="mt-3 w-full resize-none rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm text-[var(--site-text)] outline-none transition placeholder:text-[var(--site-text-faint)] focus:border-[var(--site-border-strong)]"
                          />

                          <button
                            type="submit"
                            className="theme-button-primary mt-3 w-full rounded-full px-4 py-2.5 text-sm font-semibold transition hover:opacity-90"
                          >
                            Salva nota
                          </button>
                        </form>

                        <DeleteSavedSearchButton
                          savedSearchId={savedSearch.id}
                          deleteAction={deleteSavedSearch}
                        />
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
