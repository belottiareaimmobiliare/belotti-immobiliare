import { createClient } from '@/lib/supabase/server'
import FullscreenAreaMapPage from '@/components/public/FullscreenAreaMapPage'

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
  hasBalcony?: string
  hasTerrace?: string
  isAuction?: string
  condition?: string
  availability?: string
  furnishedStatus?: string
  heatingType?: string
  heatingSource?: string
  minSurface?: string
  maxSurface?: string
  minBathrooms?: string
  province?: string
  comune?: string | string[]
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
  condition: string | null
  availability: string | null
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
  balconies: number | null
  terraces: number | null
  description: string | null
  contract_type: string | null
  property_type: string | null
  status: string | null
  has_garage: boolean | null
  has_parking: boolean | null
  has_garden: boolean | null
  has_elevator: boolean | null
  is_auction: boolean | null
  furnished_status: string | null
  property_media?: PropertyMediaItem[]
}

export default async function AreaMapPage({
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
  const conditionFilter = params.condition?.trim() || ''
  const availabilityFilter = params.availability?.trim() || ''
  const furnishedStatus = params.furnishedStatus?.trim() || ''
  const heatingType = params.heatingType?.trim() || ''
  const heatingSource = params.heatingSource?.trim() || ''

  const hasGarage = params.hasGarage === 'true'
  const hasParking = params.hasParking === 'true'
  const hasGarden = params.hasGarden === 'true'
  const hasElevator = params.hasElevator === 'true'
  const hasBalcony = params.hasBalcony === 'true'
  const hasTerrace = params.hasTerrace === 'true'
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

  if (conditionFilter) {
    query = query.eq('condition', conditionFilter)
  }

  if (availabilityFilter) {
    query = query.eq('availability', availabilityFilter)
  }

  if (furnishedStatus) {
    query = query.eq('furnished_status', furnishedStatus)
  }

  if (heatingType) {
    query = query.eq('heating_type', heatingType)
  }

  if (heatingSource) {
    query = query.eq('heating_source', heatingSource)
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

  if (hasBalcony) {
    query = query.gt('balconies', 0)
  }

  if (hasTerrace) {
    query = query.gt('terraces', 0)
  }

  if (isAuction) {
    query = query.eq('is_auction', true)
  }

  const { data, error } = await query
  const rawProperties = (data || []) as PropertyWithMedia[]

  const textFilteredProperties =
    q.length > 0
      ? rawProperties.filter((property) => {
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
      : rawProperties

  const properties = textFilteredProperties.filter(
    (property) =>
      typeof property.latitude === 'number' &&
      !Number.isNaN(property.latitude) &&
      typeof property.longitude === 'number' &&
      !Number.isNaN(property.longitude)
  )

  return (
    <FullscreenAreaMapPage
      properties={properties.map((property) => {
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

        return {
          id: property.id,
          slug: property.slug,
          title: property.title,
          comune: property.comune,
          province: property.province,
          price: property.price,
          latitude: property.latitude,
          longitude: property.longitude,
          location_mode: property.location_mode,
          coverImage: cover?.file_url || null,
        }
      })}
      hasError={Boolean(error)}
    />
  )
}