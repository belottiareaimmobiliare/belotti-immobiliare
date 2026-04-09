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
  return `€ ${price.toLocaleString()}`
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
      className: 'border-red-500/20 bg-red-500/10 text-red-200',
    }
  }

  if (property.location_mode === 'precise') {
    return {
      label: 'Posizione precisa',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
    }
  }

  if (property.location_mode === 'comune_center') {
    return {
      label: 'Posizione comune',
      className: 'border-sky-500/20 bg-sky-500/10 text-sky-200',
    }
  }

  return {
    label: 'Posizione disponibile',
    className: 'border-white/15 bg-white/5 text-white/75',
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
    <section className="mx-auto w-full max-w-7xl px-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">
            Admin immobili
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Gestione immobili
          </h1>
          <p className="mt-3 text-white/60">
            Ricerca, controlla e modifica rapidamente gli immobili caricati.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Vai alla dashboard
          </Link>

          <Link
            href="/admin/immobili/nuovo"
            className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
          >
            Nuovo immobile
          </Link>
        </div>
      </div>

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-5 md:p-6">
        <div className="mb-5 grid max-w-md grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
          <Link
            href={`/admin/immobili${status ? `?status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === ''
                ? 'bg-white text-black'
                : 'text-white/75 hover:bg-white/10'
            }`}
          >
            Tutti
          </Link>

          <Link
            href={`/admin/immobili?contractType=vendita${status ? `&status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === 'vendita'
                ? 'bg-white text-black'
                : 'text-white/75 hover:bg-white/10'
            }`}
          >
            Vendita
          </Link>

          <Link
            href={`/admin/immobili?contractType=affitto${status ? `&status=${status}` : ''}`}
            className={`rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
              contractType === 'affitto'
                ? 'bg-white text-black'
                : 'text-white/75 hover:bg-white/10'
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
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />

            <select
              name="status"
              defaultValue={status}
              className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
            >
              <option value="">Tutti gli stati</option>
              <option value="draft">Solo bozze</option>
              <option value="published">Solo pubblicati</option>
            </select>

            <div className="flex gap-3">
              <button
                type="submit"
                className="flex-1 rounded-2xl bg-white px-5 py-3 font-medium text-black transition hover:opacity-90"
              >
                Filtra
              </button>

              <Link
                href="/admin/immobili"
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center font-medium text-white transition hover:bg-white/10"
              >
                Reset
              </Link>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
          Errore nel caricamento degli immobili.
        </div>
      )}

      {!error && properties.length === 0 && (
        <div className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-white/60">
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
              className="overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03]"
            >
              <div
                className="h-56 bg-cover bg-center"
                style={
                  cover ? { backgroundImage: `url('${cover.file_url}')` } : undefined
                }
              >
                {!cover && (
                  <div className="flex h-full items-center justify-center text-sm text-white/40">
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

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/65">
                    {property.contract_type || 'contratto da definire'}
                  </span>

                  <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/65">
                    {property.property_type || 'tipologia da definire'}
                  </span>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.18em] ${locationBadge.className}`}
                  >
                    {locationBadge.label}
                  </span>
                </div>

                <p className="mt-4 text-sm text-white/45">
                  {property.comune || '—'} ({property.province || '—'})
                  {property.frazione ? ` • ${property.frazione}` : ''}
                </p>

                {property.address && (
                  <p className="mt-1 text-sm text-white/50">{property.address}</p>
                )}

                <h2 className="mt-2 text-2xl font-semibold text-white">
                  {property.title || 'Immobile senza titolo'}
                </h2>

                <p className="mt-4 text-2xl font-semibold text-white">
                  {formatPrice(property.price)}
                </p>

                <p className="mt-2 text-sm text-white/60">
                  {property.surface || '—'} mq · {property.rooms || '—'} locali ·{' '}
                  {property.bathrooms || '—'} bagni
                </p>

                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-white/55">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <span>
                      Lat: <span className="text-white/75">{formatCoordinate(property.latitude)}</span>
                    </span>
                    <span>
                      Lng: <span className="text-white/75">{formatCoordinate(property.longitude)}</span>
                    </span>
                    <span>
                      Mode:{' '}
                      <span className="text-white/75">
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
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/75"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/admin/immobili/${property.id}`}
                    className="inline-flex flex-1 items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-90"
                  >
                    Modifica
                  </Link>

                  {property.slug && property.status === 'published' ? (
                    <Link
                      href={`/immobili/${property.slug}`}
                      target="_blank"
                      className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                    >
                      Apri scheda
                    </Link>
                  ) : (
                    <div className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm text-white/40">
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