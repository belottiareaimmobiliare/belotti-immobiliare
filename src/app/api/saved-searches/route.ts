import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type MacroCategory =
  | 'residential_full'
  | 'room_or_portion'
  | 'garage_parking'
  | 'commercial'
  | 'land'
  | 'other'

function cleanText(value: unknown) {
  return String(value ?? '').trim()
}

function cleanEmail(value: unknown) {
  return cleanText(value).toLowerCase()
}

function toNumberOrNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function toIntegerOrNull(value: unknown) {
  const numberValue = Number(value)
  return Number.isInteger(numberValue) ? numberValue : null
}

function getMacroCategory(propertyType: string | null): MacroCategory {
  const value = String(propertyType ?? '')
    .trim()
    .toLowerCase()
    .replaceAll('_', ' ')

  const roomOrPortion = [
    'stanza',
    'camera',
    'posto letto',
    'porzione di casa',
    'porzione',
    'porzione in affitto',
  ]

  if (roomOrPortion.some((item) => value.includes(item))) {
    return 'room_or_portion'
  }

  const garageParking = [
    'box',
    'garage',
    'posto auto',
    'autorimessa',
  ]

  if (garageParking.some((item) => value.includes(item))) {
    return 'garage_parking'
  }

  const commercial = [
    'ufficio',
    'negozio',
    'locale commerciale',
    'capannone',
    'magazzino',
    'laboratorio',
  ]

  if (commercial.some((item) => value.includes(item))) {
    return 'commercial'
  }

  const land = [
    'terreno',
    'terreno edificabile',
    'terreno agricolo',
    'area edificabile',
  ]

  if (land.some((item) => value.includes(item))) {
    return 'land'
  }

  const residentialFull = [
    'appartamento',
    'attico',
    'bilocale',
    'trilocale',
    'quadrilocale',
    'monolocale',
    'villa',
    'villetta',
    'casa indipendente',
    'loft',
    'mansarda',
  ]

  if (residentialFull.some((item) => value.includes(item))) {
    return 'residential_full'
  }

  return 'other'
}

function calculateMinPrice(price: number | null) {
  if (!price || price <= 0) return null
  return Math.max(0, Math.round(price * 0.8))
}

function calculateMaxPrice(price: number | null) {
  if (!price || price <= 0) return null
  return Math.round(price * 1.2)
}

function calculateMinSurface(surface: number | null) {
  if (!surface || surface <= 0) return null
  return Math.max(0, Math.round(surface * 0.75))
}

function calculateMaxSurface(surface: number | null) {
  if (!surface || surface <= 0) return null
  return Math.round(surface * 1.25)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const fullName = cleanText(body.fullName)
    const email = cleanEmail(body.email)
    const phone = cleanText(body.phone)

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Nome ed email sono obbligatori.' },
        { status: 400 }
      )
    }

    const propertyType = cleanText(body.propertyType)
    const price = toNumberOrNull(body.price)
    const surface = toNumberOrNull(body.surface)
    const rooms = toIntegerOrNull(body.rooms)
    const bathrooms = toIntegerOrNull(body.bathrooms)

    const supabase = await createClient()

    const { error } = await supabase.from('saved_searches').insert({
      full_name: fullName,
      email,
      phone: phone || null,

      source_property_id: cleanText(body.propertyId) || null,
      source_property_slug: cleanText(body.propertySlug) || null,
      source_property_title: cleanText(body.propertyTitle) || null,

      contract_type: cleanText(body.contractType) || null,
      source_property_type: propertyType || null,
      search_macro_category: getMacroCategory(propertyType),

      comune: cleanText(body.comune) || null,
      province: cleanText(body.province) || null,

      min_price: calculateMinPrice(price),
      max_price: calculateMaxPrice(price),
      min_surface: calculateMinSurface(surface),
      max_surface: calculateMaxSurface(surface),
      rooms_min: rooms ? Math.max(1, rooms - 1) : null,
      rooms_max: rooms ? rooms + 1 : null,
      bathrooms_min: bathrooms ? Math.max(1, bathrooms) : null,

      features_preferred: {
        hasGarage: Boolean(body.hasGarage),
        hasParking: Boolean(body.hasParking),
        hasGarden: Boolean(body.hasGarden),
        hasElevator: Boolean(body.hasElevator),
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Errore durante il salvataggio della ricerca.' },
      { status: 500 }
    )
  }
}
