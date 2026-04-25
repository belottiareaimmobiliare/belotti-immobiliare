import { createClient } from '@/lib/supabase/server'
import SiteHeader from '@/components/public/SiteHeader'
import ImmobiliHeroDecoration from '@/components/public/ImmobiliHeroDecoration'
import PropertiesFiltersSidebar from '@/components/public/PropertiesFiltersSidebar'
import PropertiesMapSection from '@/components/public/PropertiesMapSection'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
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
  page?: string
  limit?: string
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
  reference_code: string | null
  condition: string | null
  availability: string | null
  bedrooms: number | null
  floor: string | null
  total_floors: string | null
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


function formatOptionLabel(value: string | null | undefined, fallback = '—') {
  const clean = String(value || '').trim()
  if (!clean) return fallback

  const labels: Record<string, string> = {
    nuovo: 'Nuovo',
    ottimo: 'Ottimo',
    buono: 'Buono',
    abitabile: 'Abitabile',
    da_ristrutturare: 'Da ristrutturare',
    ristrutturato: 'Ristrutturato',
    rustico: 'Rustico / rudere',
    libero: 'Libero',
    libero_subito: 'Libero subito',
    occupato: 'Occupato',
    locato: 'Locato',
    al_rogito: 'Al rogito',
    da_concordare: 'Da concordare',
  }

  return labels[clean] || clean.replaceAll('_', ' ')
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

function buildUrl(
  params: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined>
) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (!value) return

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) search.append(key, item)
      })
      return
    }

    search.set(key, value)
  })

  Object.entries(overrides).forEach(([key, value]) => {
    search.delete(key)
    if (value) search.set(key, value)
  })

  const qs = search.toString()
  return qs ? `/immobili?${qs}` : '/immobili'
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

  const limitOptions = [5, 10, 20]
  const limit = limitOptions.includes(Number(params.limit)) ? Number(params.limit) : 10
  const currentPage = Math.max(Number(params.page || '1') || 1, 1)

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

  const totalResults = polygonFilteredProperties.length
  const totalPages = Math.max(Math.ceil(totalResults / limit), 1)
  const safePage = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * limit
  const endIndex = startIndex + limit
  const visibleResults = polygonFilteredProperties.slice(startIndex, endIndex)

  const baseParams = {
    q: q || undefined,
    maxPrice: maxPrice || undefined,
    minRooms: minRooms || undefined,
    contractType: contractType || undefined,
    propertyType: propertyType || undefined,
    hasGarage: hasGarage ? 'true' : undefined,
    hasParking: hasParking ? 'true' : undefined,
    hasGarden: hasGarden ? 'true' : undefined,
    hasElevator: hasElevator ? 'true' : undefined,
    isAuction: isAuction ? 'true' : undefined,
    minSurface: minSurface || undefined,
    maxSurface: maxSurface || undefined,
    minBathrooms: minBathrooms || undefined,
    province: province || undefined,
    comune: comuni.length > 0 ? comuni : undefined,
    mapMode: params.mapMode || undefined,
    polygon: params.polygon || undefined,
    limit: String(limit),
  }

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden">
        <ImmobiliHeroDecoration />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              Immobili
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-[var(--site-text)]">
              Tutti gli immobili disponibili
            </h1>
            <p className="mt-4 max-w-3xl text-[var(--site-text-muted)]">
              Una ricerca chiara, con strumenti di filtro, vista mappa e selezione
              dell’area per individuare le soluzioni più adatte.
            </p>
          </div>

          {hasActivePolygon && (
            <div className="theme-panel mb-8 flex flex-col gap-4 rounded-[28px] border p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                  Ricerca geografica attiva
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
                  Stai visualizzando gli immobili contenuti nell’area disegnata
                </h2>
                <p className="mt-2 text-sm text-[var(--site-text-muted)]">
                  Puoi continuare ad affinare i risultati con i filtri disponibili, oppure modificare la zona direttamente sulla mappa.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/immobili/mappa-area"
                  className="theme-button-primary rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-95"
                >
                  Modifica area
                </Link>

                <Link
                  href="/immobili"
                  className="theme-button-secondary rounded-2xl px-5 py-3 text-sm transition"
                >
                  Rimuovi area
                </Link>
              </div>
            </div>
          )}

          <div className="grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
            <aside className="xl:sticky xl:top-[96px] xl:self-start">
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

            <div className="space-y-8">
              <section className="theme-panel rounded-[32px] border p-5">
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
                    <p className="text-sm text-[var(--site-text-faint)]">
                      {totalResults} {totalResults === 1 ? 'immobile trovato' : 'immobili trovati'}
                    </p>

                    {hasActivePolygon && (
                      <div className="theme-badge inline-flex rounded-full border px-3 py-1 text-xs">
                        Risultati filtrati per area disegnata
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm text-[var(--site-text-faint)]">Mostra:</span>

                    {[5, 10, 20].map((size) => {
                      const active = limit === size

                      return (
                        <Link
                          key={size}
                          href={buildUrl(baseParams, {
                            limit: String(size),
                            page: '1',
                          })}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            active
                              ? 'theme-pill-active border'
                              : 'theme-pill border'
                          }`}
                        >
                          {size}
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <div className="mb-8 rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">
                    Errore nel caricamento immobili.
                  </div>
                )}

                {!error && totalResults === 0 && (
                  <div className="theme-panel rounded-3xl border border-dashed p-10 text-[var(--site-text-muted)]">
                    {hasActivePolygon
                      ? 'Nessun immobile trovato dentro l’area selezionata con i filtri attuali. Prova a modificare la zona oppure ad alleggerire i filtri.'
                      : 'Nessun immobile trovato con i filtri selezionati.'}
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  {visibleResults.map((property) => {
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

                    const labels = [
                      property.contract_type || null,
                      property.property_type || null,
                      property.is_auction ? 'Asta' : null,
                      property.has_garage ? 'Garage' : null,
                      property.has_parking ? 'Posto auto' : null,
                      property.has_garden ? 'Giardino' : null,
                      property.has_elevator ? 'Ascensore' : null,
                    ].filter(Boolean) as string[]

                    return (
                      <Link
                        key={property.id}
                        href={`/immobili/${property.slug}`}
                        className="theme-card group block overflow-hidden rounded-[30px] border transition"
                      >
                        <div className="flex flex-col md:grid md:min-h-[186px] md:grid-cols-[220px_minmax(0,1fr)_170px]">
                          <div
                            className="h-44 w-full bg-cover bg-center md:h-full md:min-h-[186px] md:w-[220px]"
                            style={
                              cover
                                ? { backgroundImage: `url('${cover.file_url}')` }
                                : undefined
                            }
                          >
                            {!cover && (
                              <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                                Nessuna immagine
                              </div>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-col justify-center px-5 py-4 md:px-6">
                            {labels.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {labels.slice(0, 5).map((label) => (
                                  <span
                                    key={label}
                                    className="theme-badge rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em]"
                                  >
                                    {label}
                                  </span>
                                ))}
                              </div>
                            )}

                            <p className="text-sm text-[var(--site-text-faint)]">
                              {property.reference_code ? `Rif. ${property.reference_code} · ` : ''}
                              {property.comune || '—'} ({property.province || '—'})
                              {property.frazione ? ` • ${property.frazione}` : ''}
                            </p>

                            <h3 className="mt-2 line-clamp-2 text-[1.2rem] font-semibold leading-tight text-[var(--site-text)] md:text-[1.45rem]">
                              {property.title}
                            </h3>

                            <p className="mt-3 text-sm text-[var(--site-text-muted)]">
                              {property.surface || '—'} mq · {property.rooms || '—'} locali ·{' '}
                              {property.bathrooms || '—'} bagni
                              {property.bedrooms ? ` · ${property.bedrooms} camere` : ''}
                            </p>

                            {(property.condition || property.availability) && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {property.condition && (
                                  <span className="theme-badge rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em]">
                                    {formatOptionLabel(property.condition)}
                                  </span>
                                )}
                                {property.availability && (
                                  <span className="theme-badge rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.16em]">
                                    {formatOptionLabel(property.availability)}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="mt-3 line-clamp-1 text-sm leading-6 text-[var(--site-text-muted)]">
                              {property.description || 'Descrizione in aggiornamento.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-end px-5 pb-5 md:px-6 md:pb-0">
                            {property.price ? (
                              <p className="whitespace-nowrap text-3xl font-semibold text-[var(--site-text)] md:text-[2.2rem]">
                                € {property.price.toLocaleString('it-IT')}
                              </p>
                            ) : (
                              <p className="text-xl text-[var(--site-text-muted)]">
                                Trattativa riservata
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {totalResults > 0 && (
                  <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <p className="text-sm text-[var(--site-text-faint)]">
                      Stai vedendo {startIndex + 1}-{Math.min(endIndex, totalResults)} di {totalResults} risultati
                    </p>

                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={buildUrl(baseParams, {
                          page: safePage > 1 ? String(safePage - 1) : '1',
                        })}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${
                          safePage <= 1
                            ? 'pointer-events-none border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text-faint)]'
                            : 'theme-button-secondary'
                        }`}
                      >
                        ← Precedente
                      </Link>

                      <div className="theme-pill rounded-2xl border px-4 py-2 text-sm">
                        Pagina {safePage} / {totalPages}
                      </div>

                      <Link
                        href={buildUrl(baseParams, {
                          page: safePage < totalPages ? String(safePage + 1) : String(totalPages),
                        })}
                        className={`rounded-2xl px-4 py-2 text-sm transition ${
                          safePage >= totalPages
                            ? 'pointer-events-none border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text-faint)]'
                            : 'theme-button-secondary'
                        }`}
                      >
                        Successiva →
                      </Link>
                    </div>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}