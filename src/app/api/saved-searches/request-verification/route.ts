import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendSavedSearchVerificationEmail } from '@/lib/mailer'
import { getPropertyMacroCategory } from '@/lib/propertyOptions'

const PRIVACY_POLICY_VERSION = 'privacy-2026-04'

type MacroCategory =
  | 'residential_full'
  | 'room_or_portion'
  | 'garage_parking'
  | 'commercial'
  | 'land'
  | 'other'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

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

function getClientIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null

  return (
    request.headers.get('x-real-ip') ||
    request.headers.get('cf-connecting-ip') ||
    null
  )
}

function getMacroCategory(propertyType: string | null): MacroCategory {
  return getPropertyMacroCategory(propertyType) as MacroCategory
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
    const propertyType = cleanText(body.propertyType)
    const propertyTitle = cleanText(body.propertyTitle) || 'Immobile richiesto'
    const privacyAccepted = body.privacyAccepted === true

    if (!fullName || !email) {
      return NextResponse.json(
        { error: 'Nome ed email sono obbligatori.' },
        { status: 400 }
      )
    }

    if (!privacyAccepted) {
      return NextResponse.json(
        { error: 'È necessario accettare l’informativa privacy.' },
        { status: 400 }
      )
    }

    const price = toNumberOrNull(body.price)
    const surface = toNumberOrNull(body.surface)
    const latitude = toNumberOrNull(body.latitude)
    const longitude = toNumberOrNull(body.longitude)
    const rooms = toIntegerOrNull(body.rooms)
    const bathrooms = toIntegerOrNull(body.bathrooms)

    const code = generateCode()
    const codeHash = hashCode(code)
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const supabase = createServiceClient()

    await supabase
      .from('saved_search_email_verifications')
      .delete()
      .eq('email', email)
      .is('verified_at', null)

    const { data, error } = await supabase
      .from('saved_search_email_verifications')
      .insert({
        full_name: fullName,
        email,
        phone: phone || null,

        source_property_id: cleanText(body.propertyId) || null,
        source_property_slug: cleanText(body.propertySlug) || null,
        source_property_title: propertyTitle,
        source_latitude: latitude,
        source_longitude: longitude,
        radius_km: latitude && longitude ? 10 : 0,

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

        code_hash: codeHash,
        expires_at: expiresAt,

        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        privacy_ip: getClientIp(request),
        privacy_user_agent: request.headers.get('user-agent') || null,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error(error)
      return NextResponse.json(
        { error: 'Errore salvataggio verifica.' },
        { status: 500 }
      )
    }

    await sendSavedSearchVerificationEmail({
      to: email,
      code,
      propertyTitle,
    })

    return NextResponse.json({ ok: true, verificationId: data.id })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore invio codice.' },
      { status: 500 }
    )
  }
}
