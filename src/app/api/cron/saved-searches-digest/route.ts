import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendSavedSearchDigestEmail,
  sendSavedSearchNoResultsAdviceEmail,
} from '@/lib/mailer'

export const dynamic = 'force-dynamic'

type MacroCategory =
  | 'residential_full'
  | 'room_or_portion'
  | 'garage_parking'
  | 'commercial'
  | 'land'
  | 'other'

type SavedSearch = {
  id: string
  full_name: string
  email: string
  source_property_id: string | null
  source_property_slug: string | null
  source_property_title: string | null
  source_latitude: number | null
  source_longitude: number | null
  radius_km: number | null
  contract_type: string | null
  source_property_type: string | null
  search_macro_category: MacroCategory | null
  comune: string | null
  province: string | null
  min_price: number | null
  max_price: number | null
  min_surface: number | null
  max_surface: number | null
  rooms_min: number | null
  rooms_max: number | null
  bathrooms_min: number | null
  status: string
  created_at: string
  last_digest_sent_at: string | null
  last_no_results_notice_sent_at: string | null
}

type PropertyMedia = {
  file_url: string
  is_cover: boolean | null
  sort_order: number | null
  media_type: string
}

type Property = {
  id: string
  title: string | null
  slug: string | null
  status: string | null
  contract_type: string | null
  property_type: string | null
  price: number | null
  comune: string | null
  province: string | null
  surface: number | null
  rooms: number | null
  bathrooms: number | null
  latitude: number | null
  longitude: number | null
  created_at: string | null
  property_media?: PropertyMedia[]
}

function getBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function getMacroCategory(propertyType: string | null): MacroCategory {
  const value = String(propertyType ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('_', ' ')

  if (['stanza', 'camera', 'posto letto', 'porzione di casa', 'porzione', 'porzione in affitto'].some((item) => value.includes(item))) {
    return 'room_or_portion'
  }

  if (['box', 'garage', 'posto auto', 'autorimessa'].some((item) => value.includes(item))) {
    return 'garage_parking'
  }

  if (['ufficio', 'negozio', 'locale commerciale', 'capannone', 'magazzino', 'laboratorio'].some((item) => value.includes(item))) {
    return 'commercial'
  }

  if (['terreno', 'terreno edificabile', 'terreno agricolo', 'area edificabile'].some((item) => value.includes(item))) {
    return 'land'
  }

  if (['appartamento', 'attico', 'bilocale', 'trilocale', 'quadrilocale', 'monolocale', 'villa', 'villetta', 'casa indipendente', 'loft', 'mansarda'].some((item) => value.includes(item))) {
    return 'residential_full'
  }

  return 'other'
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) {
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function isWithinSearchArea(search: SavedSearch, property: Property) {
  if (
    typeof search.source_latitude === 'number' &&
    typeof search.source_longitude === 'number' &&
    typeof property.latitude === 'number' &&
    typeof property.longitude === 'number'
  ) {
    const radiusKm = search.radius_km || 10

    return (
      distanceKm(
        search.source_latitude,
        search.source_longitude,
        property.latitude,
        property.longitude
      ) <= radiusKm
    )
  }

  if (!isWithinSearchArea(search, property)) {
    return false
  }

  return true
}

function isPropertySimilar(search: SavedSearch, property: Property) {
  if (property.status !== 'published') return false

  if (search.source_property_id && property.id === search.source_property_id) {
    return false
  }

  if (search.contract_type && property.contract_type !== search.contract_type) {
    return false
  }

  if (
    search.search_macro_category &&
    getMacroCategory(property.property_type) !== search.search_macro_category
  ) {
    return false
  }

  if (!isWithinSearchArea(search, property)) {
    return false
  }

  if (search.min_price && (!property.price || property.price < search.min_price)) {
    return false
  }

  if (search.max_price && (!property.price || property.price > search.max_price)) {
    return false
  }

  if (search.min_surface && (!property.surface || property.surface < search.min_surface)) {
    return false
  }

  if (search.max_surface && (!property.surface || property.surface > search.max_surface)) {
    return false
  }

  if (search.rooms_min && (!property.rooms || property.rooms < search.rooms_min)) {
    return false
  }

  if (search.rooms_max && (!property.rooms || property.rooms > search.rooms_max)) {
    return false
  }

  if (search.bathrooms_min && (!property.bathrooms || property.bathrooms < search.bathrooms_min)) {
    return false
  }

  return Boolean(property.slug)
}

function getCoverUrl(property: Property) {
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

function calculateSubscriptionExpiresAt(contractType: string | null) {
  const date = new Date()
  const normalized = String(contractType || '').trim().toLowerCase()

  if (normalized === 'affitto') {
    date.setMonth(date.getMonth() + 3)
    return date.toISOString()
  }

  date.setMonth(date.getMonth() + 8)
  return date.toISOString()
}

async function purgeExpiredSavedSearches(
  supabase: ReturnType<typeof createServiceClient>
) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('saved_searches')
    .delete()
    .in('status', ['new', 'contacted'])
    .lte('expires_at', now)
    .select('id')

  if (error) {
    console.error('Errore purge ricerche scadute:', error)
    return 0
  }

  return data?.length ?? 0
}

function daysBetween(fromDate: string, toDate = new Date()) {
  const from = new Date(fromDate).getTime()
  const to = toDate.getTime()

  if (!Number.isFinite(from)) return 0

  return Math.floor(Math.max(0, to - from) / (1000 * 60 * 60 * 24))
}

async function getAlreadySentPropertyIds(
  supabase: ReturnType<typeof createServiceClient>,
  savedSearchId: string
) {
  const { data } = await supabase
    .from('saved_search_sent_matches')
    .select('property_id')
    .eq('saved_search_id', savedSearchId)

  return new Set((data ?? []).map((item) => String(item.property_id)))
}

async function findSimilarProperties({
  supabase,
  search,
}: {
  supabase: ReturnType<typeof createServiceClient>
  search: SavedSearch
}) {
  let query = supabase
    .from('properties')
    .select(
      `
      id,
      title,
      slug,
      status,
      contract_type,
      property_type,
      price,
      comune,
      province,
      surface,
      rooms,
      bathrooms,
      latitude,
      longitude,
      created_at,
      property_media (
        file_url,
        is_cover,
        sort_order,
        media_type
      )
    `
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  if (search.contract_type) {
    query = query.eq('contract_type', search.contract_type)
  }

  if (search.comune) {
    query = query.eq('comune', search.comune)
  } else if (search.province) {
    query = query.eq('province', search.province)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore lettura immobili simili:', error)
    return []
  }

  const alreadySent = await getAlreadySentPropertyIds(supabase, search.id)

  return ((data ?? []) as Property[])
    .filter((property) => !alreadySent.has(property.id))
    .filter((property) => isPropertySimilar(search, property))
    .slice(0, 6)
}

async function markMatchesAsSent({
  supabase,
  savedSearchId,
  propertyIds,
}: {
  supabase: ReturnType<typeof createServiceClient>
  savedSearchId: string
  propertyIds: string[]
}) {
  if (propertyIds.length === 0) return

  await supabase
    .from('saved_search_sent_matches')
    .upsert(
      propertyIds.map((propertyId) => ({
        saved_search_id: savedSearchId,
        property_id: propertyId,
      })),
      { onConflict: 'saved_search_id,property_id' }
    )
}

async function processSavedSearch({
  supabase,
  search,
  baseUrl,
}: {
  supabase: ReturnType<typeof createServiceClient>
  search: SavedSearch
  baseUrl: string
}) {
  const now = new Date().toISOString()
  const matches = await findSimilarProperties({ supabase, search })

  await supabase
    .from('saved_searches')
    .update({ last_checked_at: now })
    .eq('id', search.id)

  if (matches.length > 0) {
    await sendSavedSearchDigestEmail({
      to: search.email,
      fullName: search.full_name,
      sourcePropertyTitle: search.source_property_title || 'immobile selezionato',
      matches: matches.map((property) => ({
        title: property.title || 'Immobile',
        url: `${baseUrl}/immobili/${property.slug}`,
        price: property.price,
        comune: property.comune,
        province: property.province,
        surface: property.surface,
        rooms: property.rooms,
        coverUrl: getCoverUrl(property),
      })),
    })

    await markMatchesAsSent({
      supabase,
      savedSearchId: search.id,
      propertyIds: matches.map((property) => property.id),
    })

    await supabase
      .from('saved_searches')
      .update({
        last_digest_sent_at: now,
        last_no_results_notice_sent_at: null,
        expires_at: calculateSubscriptionExpiresAt(search.contract_type),
      })
      .eq('id', search.id)

    return { sentDigest: true, sentNoResultsNotice: false, matches: matches.length }
  }

  const referenceDate = search.last_digest_sent_at || search.created_at
  const noResultsNoticeAlreadySentAfterReference =
    search.last_no_results_notice_sent_at &&
    new Date(search.last_no_results_notice_sent_at).getTime() >=
      new Date(referenceDate).getTime()

  if (
    daysBetween(referenceDate) >= 5 &&
    !noResultsNoticeAlreadySentAfterReference
  ) {
    await sendSavedSearchNoResultsAdviceEmail({
      to: search.email,
      fullName: search.full_name,
      sourcePropertyTitle: search.source_property_title || 'immobile selezionato',
      contactUrl: `${baseUrl}/contatti`,
    })

    await supabase
      .from('saved_searches')
      .update({ last_no_results_notice_sent_at: now })
      .eq('id', search.id)

    return { sentDigest: false, sentNoResultsNotice: true, matches: 0 }
  }

  return { sentDigest: false, sentNoResultsNotice: false, matches: 0 }
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  const authHeader = request.headers.get('authorization')

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const baseUrl = getBaseUrl(request)
  const purgedExpired = await purgeExpiredSavedSearches(supabase)

  const { data, error } = await supabase
    .from('saved_searches')
    .select(
      `
      id,
      full_name,
      email,
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
      status,
      created_at,
      last_digest_sent_at,
      last_no_results_notice_sent_at
    `
    )
    .in('status', ['new', 'contacted'])
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const searches = (data ?? []) as SavedSearch[]
  const results = []

  for (const search of searches) {
    try {
      const result = await processSavedSearch({
        supabase,
        search,
        baseUrl,
      })

      results.push({
        id: search.id,
        email: search.email,
        ...result,
      })
    } catch (error) {
      console.error('Errore processo ricerca salvata:', search.id, error)
      results.push({
        id: search.id,
        email: search.email,
        error: true,
      })
    }
  }

  return NextResponse.json({
    ok: true,
    processed: results.length,
    purgedExpired,
    sentDigests: results.filter((item) => 'sentDigest' in item && item.sentDigest).length,
    sentNoResultsNotices: results.filter(
      (item) => 'sentNoResultsNotice' in item && item.sentNoResultsNotice
    ).length,
    results,
  })
}
