import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatusToggleButton from './StatusToggleButton'

type SearchParams = Promise<{
  q?: string
  status?: string
  contractType?: string
}>

type PropertyMediaItem = {
  id: string
  property_id: string
  media_type: 'image' | 'plan'
  file_url: string
  label: string | null
  sort_order: number | null
  is_cover: boolean | null
}

type Property = {
  id: string
  slug: string | null
  title: string | null
  price: number | null
  province: string | null
  comune: string | null
  frazione: string | null
  address: string | null
  latitude: number | null
  longitude: number | null
  location_mode: string | null
  rooms: number | null
  bathrooms: number | null
  surface: number | null
  contract_type: string | null
  property_type: string | null
  status: string | null
  has_garage: boolean | null
  has_parking: boolean | null
  has_garden: boolean | null
  has_elevator: boolean | null
  is_auction: boolean | null
  updated_at?: string | null
  created_at?: string | null
  property_media?: PropertyMediaItem[]
}

function formatPrice(price: number | null) {
  if (!price) return 'Trattativa riservata'
  return `€ ${price.toLocaleString('it-IT')}`
}

function formatCoordinate(value: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return value.toFixed(6)
}

function getLocationBadge(property: Property) {
  const hasCoordinates =
    typeof property.latitude === 'number' &&
    !Number.isNaN(property.latitude) &&
    typeof property.longitude === 'number' &&
    !Number.isNaN(property.longitude)

  if (!hasCoordinates) {
    return {
      label: 'Nessuna posizione',
      className: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
    }
  }

  if (property.location_mode === 'precise') {
    return {
      label: 'Posizione precisa',
      className:
        'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    }
  }

  if (property.location_mode === 'comune_center') {
    return {
      label: 'Posizione comune',
      className: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    }
  }

  return {
    label: 'Posizione disponibile',
    className: 'theme-admin-chip',
  }
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const q = params.q?.trim().toLowerCase() || ''
  const status = params.status?.trim() || ''
  const contractType = params.contractType?.trim() || ''

  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .order('updated_at', { ascending: false })

  if (status) {
    query = query.eq('status', status)
  }

  if (contractType) {
    query = query.eq('contract_type', contractType)
  }

  const { data, error } = await query
  const properties = ((data || []) as Property[]).filter((property) => {
    if (!q) return true

    const haystack = [
      property.title || '',
      property.comune || '',
      property.province || '',
      property.frazione || '',
      property.address || '',
      property.contract_type || '',
      property.property_type || '',
    ]
      .join(' ')
      .toLowerCase()

    return haystack.includes(q)
  })

  return (
    <section className="mx-auto w-full max-w-7xl px-4 text-[var(--site-text)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
            Admin immobili
          </p>
          <h1 className="mt-2 text-3xl font-semibold">Gestione immobili</h1>
          <p className="theme-admin-muted mt-3">
            Ricerca, controlla e modifica rapidamente gli immobili caricati.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin"
            className="theme-admin-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
          >
            Vai alla dashboard
          </Link>

          <Link
            href="/admin/immobili/nuovo"
            className="theme-admin-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
          >
            Nuovo immobile
          </Link>
        </div>
      </div>

      <div className="theme-admin-card mt-8 rounded-3xl p-5 md:p-6">
        <div className="mb-5 grid max-w-md grid-cols-3 gap-2 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-1">
          <Link
            href={`/admin/immobili${status ? `?status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === '' ? 'theme-admin-chip-active' : 'theme-admin-chip'
            }`}
          >
            Tutti
          </Link>

          <Link
            href={`/admin/immobili?contractType=vendita${status ? `&status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === 'vendita' ? 'theme-admin-chip-active' : 'theme-admin-chip'
            }`}
          >
            Vendita
          </Link>

          <Link
            href={`/admin/immobili?contractType=affitto${status ? `&status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === 'affitto' ? 'theme-admin-chip-active' : 'theme-admin-chip'
            }`}
          >
            Affitto
          </Link>
        </div>

        <form method="GET">
          <input type="hidden" name="contractType" value={contractType} />

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
            <input
              type="text"
              name="q"
              defaultValue={params.q || ''}
              placeholder="Cerca per titolo, comune, provincia..."
              className="theme-admin-input rounded-2xl px-4 py-3"
            />

            <select
              name="status"
              defaultValue={status}
              className="theme-admin-select rounded-2xl px-4 py-3"
            >
              <option value="">Tutti gli stati</option>
              <option value="draft">Solo bozze</option>
              <option value="published">Solo pubblicati</option>
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="theme-admin-button-primary flex-1 rounded-2xl px-5 py-3 font-medium transition hover:opacity-95"
              >
                Filtra
              </button>

              <Link
                href="/admin/immobili"
                className="theme-admin-button-secondary flex-1 rounded-2xl px-5 py-3 text-center font-medium transition hover:opacity-95"
              >
                Reset
              </Link>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-700 dark:text-red-300">
          Errore nel caricamento degli immobili.
        </div>
      )}

      {!error && properties.length === 0 && (
        <div className="theme-admin-card mt-8 rounded-3xl border-dashed p-10 text-[var(--site-text-muted)]">
          Nessun immobile trovato.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {properties.map((property) => {
          const images = (property.property_media || [])
            .filter((item) => item.media_type === 'image')
            .sort((a, b) => {
              if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
                return a.is_cover ? -1 : 1
              }
              return (a.sort_order ?? 0) - (b.sort_order ?? 0)
            })

          const cover = images.find((item) => item.is_cover) || images[0] || null

          const features = [
            property.has_garage ? 'Garage' : null,
            property.has_parking ? 'Posto auto' : null,
            property.has_garden ? 'Giardino' : null,
            property.has_elevator ? 'Ascensore' : null,
            property.is_auction ? 'Asta' : null,
          ].filter(Boolean) as string[]

          const locationBadge = getLocationBadge(property)

          return (
            <article
              key={property.id}
              className="theme-admin-card overflow-hidden rounded-[30px]"
            >
              <div
                className="h-56 bg-cover bg-center"
                style={cover ? { backgroundImage: `url('${cover.file_url}')` } : undefined}
              >
                {!cover && (
                  <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                    Nessuna immagine
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex flex-wrap gap-2">
                  <StatusToggleButton
                    propertyId={property.id}
                    currentStatus={property.status || 'draft'}
                  />

                  <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {property.contract_type || 'contratto da definire'}
                  </span>

                  <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                    {property.property_type || 'tipologia da definire'}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${locationBadge.className}`}
                  >
                    {locationBadge.label}
                  </span>
                </div>

                <p className="theme-admin-faint mt-4 text-sm">
                  {property.comune || '—'} ({property.province || '—'})
                  {property.frazione ? ` • ${property.frazione}` : ''}
                </p>

                {property.address && (
                  <p className="theme-admin-muted mt-1 text-sm">{property.address}</p>
                )}

                <h2 className="mt-2 text-2xl font-semibold">
                  {property.title || 'Immobile senza titolo'}
                </h2>

                <p className="mt-4 text-2xl font-semibold">{formatPrice(property.price)}</p>

                <p className="theme-admin-muted mt-2 text-sm">
                  {property.surface || '—'} mq · {property.rooms || '—'} locali ·{' '}
                  {property.bathrooms || '—'} bagni
                </p>

                <div className="mt-4 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-xs text-[var(--site-text-muted)]">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span>
                      Lat:{' '}
                      <span className="text-[var(--site-text-soft)]">
                        {formatCoordinate(property.latitude)}
                      </span>
                    </span>
                    <span>
                      Lng:{' '}
                      <span className="text-[var(--site-text-soft)]">
                        {formatCoordinate(property.longitude)}
                      </span>
                    </span>
                    <span>
                      Mode:{' '}
                      <span className="text-[var(--site-text-soft)]">
                        {property.location_mode || '—'}
                      </span>
                    </span>
                  </div>
                </div>

                {features.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {features.map((feature) => (
                      <span
                        key={feature}
                        className="theme-admin-chip rounded-full px-3 py-1 text-xs"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/admin/immobili/${property.id}`}
                    className="theme-admin-button-primary inline-flex flex-1 items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
                  >
                    Modifica
                  </Link>

                  {property.slug && property.status === 'published' ? (
  <a
    href={`/immobili/${property.slug}`}
    target="_blank"
    rel="noreferrer"
    className="theme-admin-button-secondary inline-flex flex-1 items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
  >
    Apri scheda
  </a>
) : (
  <div className="theme-admin-chip inline-flex flex-1 items-center justify-center rounded-2xl px-5 py-3 text-sm">
    Scheda pubblica non disponibile
  </div>
)}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}