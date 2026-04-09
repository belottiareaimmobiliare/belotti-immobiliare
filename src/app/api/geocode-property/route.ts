import { NextRequest, NextResponse } from 'next/server'
import italyLocations from '@/data/italyLocations.json'

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

type GeocodeResult = {
  latitude: number | null
  longitude: number | null
  locationMode: 'precise' | 'comune_center' | 'not_found'
  formattedAddress: string | null
  geocodeStatus: string
  rawStatus?: string | null
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

function resolveProvinceLabel(input: string) {
  const value = String(input || '').trim()
  if (!value) return ''

  const normalized = value.toLowerCase()

  const byCode = provinces.find(
    (province) => province.code.toLowerCase() === normalized
  )
  if (byCode) return byCode.name

  const byName = provinces.find(
    (province) => province.name.toLowerCase() === normalized
  )
  if (byName) return byName.name

  return value
}

async function geocodeAddress(query: string): Promise<GeocodeResult> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '1')
    url.searchParams.set('countrycodes', 'it')
    url.searchParams.set('addressdetails', '1')

    console.log('[GEOCODE NOMINATIM] Request:', query)

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'it',
        'User-Agent': 'BelottiImmobiliare/1.0 (local project demo)',
      },
    })

    if (!response.ok) {
      console.error('[GEOCODE NOMINATIM] HTTP error:', response.status)
      return {
        latitude: null,
        longitude: null,
        locationMode: 'not_found',
        formattedAddress: null,
        geocodeStatus: `http_${response.status}`,
        rawStatus: null,
      }
    }

    const data = await response.json()

    console.log(
      '[GEOCODE NOMINATIM] results length:',
      Array.isArray(data) ? data.length : 'no-array'
    )

    if (!Array.isArray(data) || data.length === 0) {
      return {
        latitude: null,
        longitude: null,
        locationMode: 'not_found',
        formattedAddress: null,
        geocodeStatus: 'no_results',
        rawStatus: null,
      }
    }

    const first = data[0]
    const lat = Number(first?.lat)
    const lon = Number(first?.lon)

    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return {
        latitude: null,
        longitude: null,
        locationMode: 'not_found',
        formattedAddress: null,
        geocodeStatus: 'invalid_geometry',
        rawStatus: null,
      }
    }

    return {
      latitude: lat,
      longitude: lon,
      locationMode: 'precise',
      formattedAddress: first?.display_name || null,
      geocodeStatus: 'ok',
      rawStatus: null,
    }
  } catch (error) {
    console.error('[GEOCODE NOMINATIM] internal error:', error)

    return {
      latitude: null,
      longitude: null,
      locationMode: 'not_found',
      formattedAddress: null,
      geocodeStatus: 'internal_error',
      rawStatus: null,
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const address = String(body.address || '').trim()
    const comune = String(body.comune || '').trim()
    const provinceRaw = String(body.province || '').trim()
    const province = resolveProvinceLabel(provinceRaw)

    console.log('[GEOCODE NOMINATIM] body:', {
      address,
      comune,
      provinceRaw,
      provinceResolved: province,
    })

    if (!comune && !province && !address) {
      return NextResponse.json({
        ok: true,
        latitude: null,
        longitude: null,
        locationMode: 'not_found',
        formattedAddress: null,
        queryUsed: '',
        geocodeStatus: 'empty_input',
      })
    }

    const preciseQuery = [address, comune, province, 'Italia']
      .filter(Boolean)
      .join(', ')

    const comuneFallbackQuery = [comune, province, 'Italia']
      .filter(Boolean)
      .join(', ')

    console.log('[GEOCODE NOMINATIM] preciseQuery:', preciseQuery)
    console.log('[GEOCODE NOMINATIM] comuneFallbackQuery:', comuneFallbackQuery)

    if (address && comune) {
      const precise = await geocodeAddress(preciseQuery)

      if (precise.latitude && precise.longitude) {
        return NextResponse.json({
          ok: true,
          latitude: precise.latitude,
          longitude: precise.longitude,
          locationMode: 'precise',
          formattedAddress: precise.formattedAddress,
          queryUsed: preciseQuery,
          geocodeStatus: precise.geocodeStatus,
          rawStatus: precise.rawStatus || null,
        })
      }

      console.log('[GEOCODE NOMINATIM] precise failed, fallback starts')
    }

    if (comune) {
      const fallback = await geocodeAddress(comuneFallbackQuery)

      if (fallback.latitude && fallback.longitude) {
        return NextResponse.json({
          ok: true,
          latitude: fallback.latitude,
          longitude: fallback.longitude,
          locationMode: 'comune_center',
          formattedAddress: fallback.formattedAddress,
          queryUsed: comuneFallbackQuery,
          geocodeStatus: fallback.geocodeStatus,
          rawStatus: fallback.rawStatus || null,
        })
      }

      return NextResponse.json({
        ok: true,
        latitude: null,
        longitude: null,
        locationMode: 'not_found',
        formattedAddress: null,
        queryUsed: comuneFallbackQuery,
        geocodeStatus: fallback.geocodeStatus,
        rawStatus: fallback.rawStatus || null,
      })
    }

    return NextResponse.json({
      ok: true,
      latitude: null,
      longitude: null,
      locationMode: 'not_found',
      formattedAddress: null,
      queryUsed: address ? preciseQuery : comuneFallbackQuery,
      geocodeStatus: 'not_found',
      rawStatus: null,
    })
  } catch (error) {
    console.error('Errore route geocode-property:', error)

    return NextResponse.json({
      ok: true,
      latitude: null,
      longitude: null,
      locationMode: 'not_found',
      formattedAddress: null,
      queryUsed: '',
      geocodeStatus: 'internal_error',
      rawStatus: null,
    })
  }
}