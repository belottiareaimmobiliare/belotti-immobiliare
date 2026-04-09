import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/public/SiteHeader'
import PropertiesFiltersSidebar from '@/components/public/PropertiesFiltersSidebar'
import PropertiesMapSection from '@/components/public/PropertiesMapSection'
import Link from 'next/link'

type SearchParams = Promise<{
  q?: string
  maxPrice?: string
  minRooms?: string
  contractType?: string
  propertyType?: string
  hasGarage?: string
  hasParking?: string
  hasGarden?: string
  hasElevator?: string
  isAuction?: string
  minSurface?: string
  maxSurface?: string
  minBathrooms?: string
  province?: string
  comune?: string | string[]
  mapMode?: string
  polygon?: string
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

type PropertyWithMedia = {
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
  description: string | null
  contract_type: string | null
  property_type: string | null
  status: string | null
  has_garage: boolean | null
  has_parking: boolean | null
  has_garden: boolean | null
  has_elevator: boolean | null
  is_auction: boolean | null
  energy_class: string | null
  condo_fees: string | null
  heating_type: string | null
  furnished_status: string | null
  deposit_amount: string | null
  advance_amount: string | null
  advance_deposit_amount: string | null
  property_media?: PropertyMediaItem[]
}

type PolygonValue = {
  points: [number, number][]
}

function parsePolygon(polygonRaw: string | undefined): PolygonValue | null {
  if (!polygonRaw) return null

  const points = polygonRaw
    .split(';')
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [lat, lng] = pair.split(':').map((value) => Number(value))
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null
      return [lat, lng] as [number, number]
    })
    .filter(Boolean) as [number, number][]

  if (points.length < 3) return null

  return { points }
}

function isPointInPolygon(
  latitude: number,
  longitude: number,
  polygon: [number, number][]
) {
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][1]
    const yi = polygon[i][0]
    const xj = polygon[j][1]
    const yj = polygon[j][0]

    const intersect =
      yi > latitude !== yj > latitude &&
      longitude <
        ((xj - xi) * (latitude - yi)) / (yj - yi + Number.EPSILON) + xi

    if (intersect) inside = !inside
  }

  return inside
}

function getCoverImage(property: PropertyWithMedia): string | null {
  const images = (property.property_media || [])
    .filter((item) => item.media_type === 'image')
    .sort((a, b) => {
      if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
        return a.is_cover ? -1 : 1
      }

      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
    })

  return images.find((item) => item.is_cover)?.file_url || images[0]?.file_url || null
}

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const q = params.q?.trim() || ''
  const maxPrice = params.maxPrice?.trim() || ''
  const minRooms = params.minRooms?.trim() || ''
  const contractType = params.contractType?.trim() || ''
  const propertyType = params.propertyType?.trim() || ''
  const minSurface = params.minSurface?.trim() || ''
  const maxSurface = params.maxSurface?.trim() || ''
  const minBathrooms = params.minBathrooms?.trim() || ''
  const province = params.province?.trim() || ''
  const polygon = parsePolygon(params.polygon)

  const hasGarage = params.hasGarage === 'true'
  const hasParking = params.hasParking === 'true'
  const hasGarden = params.hasGarden === 'true'
  const hasElevator = params.hasElevator === 'true'
  const isAuction = params.isAuction === 'true'

  const comuni =
    typeof params.comune === 'string'
      ? [params.comune]
      : Array.isArray(params.comune)
        ? params.comune
        : []

  const maxPriceNumber = maxPrice ? Number(maxPrice) : null
  const minRoomsNumber = minRooms ? Number(minRooms) : null
  const minSurfaceNumber = minSurface ? Number(minSurface) : null
  const maxSurfaceNumber = maxSurface ? Number(maxSurface) : null
  const minBathroomsNumber = minBathrooms ? Number(minBathrooms) : null

  const supabase = await createClient()

  let query = supabase
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (maxPriceNumber && !Number.isNaN(maxPriceNumber)) {
    query = query.lte('price', maxPriceNumber)
  }

  if (minRoomsNumber && !Number.isNaN(minRoomsNumber)) {
    query = query.gte('rooms', minRoomsNumber)
  }

  if (contractType) {
    query = query.eq('contract_type', contractType)
  }

  if (propertyType) {
    query = query.eq('property_type', propertyType)
  }

  if (minSurfaceNumber && !Number.isNaN(minSurfaceNumber)) {
    query = query.gte('surface', minSurfaceNumber)
  }

  if (maxSurfaceNumber && !Number.isNaN(maxSurfaceNumber)) {
    query = query.lte('surface', maxSurfaceNumber)
  }

  if (minBathroomsNumber && !Number.isNaN(minBathroomsNumber)) {
    query = query.gte('bathrooms', minBathroomsNumber)
  }

  if (province) {
    query = query.eq('province', province)
  }

  if (comuni.length > 0) {
    query = query.in('comune', comuni)
  }

  if (hasGarage) {
    query = query.eq('has_garage', true)
  }

  if (hasParking) {
    query = query.eq('has_parking', true)
  }

  if (hasGarden) {
    query = query.eq('has_garden', true)
  }

  if (hasElevator) {
    query = query.eq('has_elevator', true)
  }

  if (isAuction) {
    query = query.eq('is_auction', true)
  }

  const { data, error } = await query
  const properties = (data || []) as PropertyWithMedia[]

  const textFilteredProperties =
    q.length > 0
      ? properties.filter((property) => {
          const haystack = [
            property.title || '',
            property.comune || '',
            property.frazione || '',
            property.province || '',
            property.property_type || '',
            property.contract_type || '',
            property.address || '',
          ]
            .join(' ')
            .toLowerCase()

          return haystack.includes(q.toLowerCase())
        })
      : properties

  const polygonFilteredProperties = textFilteredProperties.filter((property) => {
    if (!polygon) return true

    if (
      typeof property.latitude !== 'number' ||
      Number.isNaN(property.latitude) ||
      typeof property.longitude !== 'number' ||
      Number.isNaN(property.longitude)
    ) {
      return false
    }

    return isPointInPolygon(property.latitude, property.longitude, polygon.points)
  })

  const mapPropertiesSource =
    polygon && polygonFilteredProperties.length === 0
      ? textFilteredProperties
      : polygonFilteredProperties

  const propertiesWithCoordinatesForMap = mapPropertiesSource.filter(
    (property) =>
      typeof property.latitude === 'number' &&
      !Number.isNaN(property.latitude) &&
      typeof property.longitude === 'number' &&
      !Number.isNaN(property.longitude)
  )

  const emptyInsidePolygon =
    Boolean(polygon) && polygonFilteredProperties.length === 0

  const hasActivePolygon = Boolean(polygon)

  return (
    <main className="min-h-screen bg-[#0a0f1a] text-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.3em] text-white/45">
            Immobili
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            Tutti gli immobili disponibili
          </h1>
          <p className="mt-4 max-w-3xl text-white/60">
            Una ricerca chiara, con strumenti di filtro, vista mappa e selezione
            dell’area per individuare le soluzioni più adatte.
          </p>
        </div>

        {hasActivePolygon && (
          <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-sky-400/20 bg-sky-500/10 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-sky-100/70">
                Ricerca geografica attiva
              </p>
              <h2 className="mt-2 text-xl font-semibold text-white">
                Stai visualizzando gli immobili contenuti nell’area disegnata
              </h2>
              <p className="mt-2 text-sm text-sky-100/90">
                Puoi continuare ad affinare i risultati con i filtri disponibili, oppure modificare la zona direttamente sulla mappa.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/immobili/mappa-area"
                className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Modifica area
              </Link>

              <Link
                href="/immobili"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
              >
                Rimuovi area
              </Link>
            </div>
          </div>
        )}

        <div className="independent-scroll-layout grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="independent-scroll-column pr-2">
            <PropertiesFiltersSidebar
              initialQ={q}
              initialMaxPrice={maxPrice}
              initialMinRooms={minRooms}
              initialContractType={contractType}
              initialPropertyType={propertyType}
              initialProvince={province}
              initialComuni={comuni}
              initialMinSurface={minSurface}
              initialMaxSurface={maxSurface}
              initialMinBathrooms={minBathrooms}
              initialHasGarage={hasGarage}
              initialHasParking={hasParking}
              initialHasGarden={hasGarden}
              initialHasElevator={hasElevator}
              initialIsAuction={isAuction}
              hideLocationFilters={Boolean(polygon)}
            />
          </aside>

          <div className="independent-scroll-column space-y-8 pr-2">
            <section className="rounded-[32px] border border-white/10 bg-white/[0.03] p-5">
              <PropertiesMapSection
                properties={propertiesWithCoordinatesForMap.map((property) => ({
                  id: property.id,
                  slug: property.slug,
                  title: property.title,
                  comune: property.comune,
                  province: property.province,
                  price: property.price,
                  latitude: property.latitude,
                  longitude: property.longitude,
                  location_mode: property.location_mode,
                  coverImage: getCoverImage(property),
                }))}
                initialProvince={province}
                initialComuni={comuni}
                initialPolygon={polygon}
                emptyInsidePolygon={emptyInsidePolygon}
              />
            </section>

            <section>
              <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-white/45">
                    {polygonFilteredProperties.length}{' '}
                    {polygonFilteredProperties.length === 1
                      ? 'immobile trovato'
                      : 'immobili trovati'}
                  </p>

                  {hasActivePolygon && (
                    <div className="inline-flex rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-xs text-sky-100">
                      Risultati filtrati per area disegnata
                    </div>
                  )}
                </div>

                {hasActivePolygon && (
                  <div className="flex gap-3">
                    <Link
                      href="/immobili/mappa-area"
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
                    >
                      Modifica area
                    </Link>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                  Errore nel caricamento immobili.
                </div>
              )}

              {!error && polygonFilteredProperties.length === 0 && (
                <div className="rounded-3xl border border-dashed border-white/15 bg-white/5 p-10 text-white/60">
                  {hasActivePolygon
                    ? 'Nessun immobile trovato dentro l’area selezionata con i filtri attuali. Prova a modificare la zona oppure ad alleggerire i filtri.'
                    : 'Nessun immobile trovato con i filtri selezionati.'}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {polygonFilteredProperties.map((property) => {
                  const images = (property.property_media || [])
                    .filter((item) => item.media_type === 'image')
                    .sort((a, b) => {
                      if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
                        return a.is_cover ? -1 : 1
                      }

                      return (a.sort_order ?? 0) - (b.sort_order ?? 0)
                    })

                  const cover =
                    images.find((item) => item.is_cover) || images[0] || null

                  const features = [
                    property.has_garage ? 'Garage' : null,
                    property.has_parking ? 'Posto auto' : null,
                    property.has_garden ? 'Giardino' : null,
                    property.has_elevator ? 'Ascensore' : null,
                    property.is_auction ? 'Asta' : null,
                  ].filter(Boolean) as string[]

                  return (
                    <Link
                      key={property.id}
                      href={`/immobili/${property.slug}`}
                      className="group flex flex-col overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.03] transition hover:border-white/20 hover:bg-white/[0.05] md:grid md:grid-cols-[180px_minmax(0,1fr)]"
                    >
                      <div
                        className="h-40 w-full bg-cover bg-center md:h-[180px] md:w-[180px]"
                        style={
                          cover
                            ? { backgroundImage: `url('${cover.file_url}')` }
                            : undefined
                        }
                      >
                        {!cover && (
                          <div className="flex h-full items-center justify-center text-sm text-white/40">
                            Nessuna immagine
                          </div>
                        )}
                      </div>

                      <div className="flex min-h-[180px] flex-col justify-between p-4">
                        <div className="space-y-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                              {property.contract_type || 'contratto'}
                            </span>

                            <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                              {property.property_type || 'tipologia'}
                            </span>

                            {property.is_auction && (
                              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-white/65">
                                Asta
                              </span>
                            )}

                            {features.slice(0, 2).map((feature) => (
                              <span
                                key={feature}
                                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/72"
                              >
                                {feature}
                              </span>
                            ))}
                          </div>

                          <p className="text-sm text-white/45">
                            {property.comune || '—'} ({property.province || '—'})
                            {property.frazione ? ` • ${property.frazione}` : ''}
                          </p>

                          <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-[1.05rem] font-semibold md:text-[1.15rem]">
                                {property.title}
                              </h3>
                              <p className="mt-1 text-sm text-white/60">
                                {property.surface || '—'} mq · {property.rooms || '—'} locali ·{' '}
                                {property.bathrooms || '—'} bagni
                              </p>
                            </div>

                            <div className="shrink-0 md:pl-4">
                              {property.price ? (
                                <p className="text-2xl font-semibold text-white">
                                  € {property.price.toLocaleString()}
                                </p>
                              ) : (
                                <p className="text-lg text-white/70">
                                  Trattativa riservata
                                </p>
                              )}
                            </div>
                          </div>

                          <p className="line-clamp-2 text-sm leading-6 text-white/55">
                            {property.description || 'Descrizione in aggiornamento.'}
                          </p>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-white/40 group-hover:text-white">
                            Scopri di più →
                          </span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  )
}