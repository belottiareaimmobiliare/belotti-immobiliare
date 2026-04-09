import { createClient } from '@/lib/supabase/server'
import FullscreenAreaMapPage from '@/components/public/FullscreenAreaMapPage'

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
  property_media?: PropertyMediaItem[]
}

export default async function AreaMapPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('properties')
    .select(`
      *,
      property_media (*)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const properties = ((data || []) as PropertyWithMedia[]).filter(
    (property) =>
      typeof property.latitude === 'number' &&
      !Number.isNaN(property.latitude) &&
      typeof property.longitude === 'number' &&
      !Number.isNaN(property.longitude)
  )

  return (
    <FullscreenAreaMapPage
      properties={properties.map((property) => ({
        id: property.id,
        slug: property.slug,
        title: property.title,
        comune: property.comune,
        province: property.province,
        price: property.price,
        latitude: property.latitude,
        longitude: property.longitude,
        location_mode: property.location_mode,
      }))}
      hasError={Boolean(error)}
    />
  )
}