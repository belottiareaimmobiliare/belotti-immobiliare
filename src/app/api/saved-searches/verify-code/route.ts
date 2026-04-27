import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendAgencySavedSearchNotification,
  sendCustomerSavedSearchConfirmation,
} from '@/lib/mailer'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function getBaseUrl(request: Request) {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (envUrl) return envUrl.replace(/\/$/, '')

  const url = new URL(request.url)
  return `${url.protocol}//${url.host}`
}

function formatMoney(value: number | null) {
  if (typeof value !== 'number') return '-'
  return `€ ${value.toLocaleString('it-IT')}`
}

function formatRange(min: number | null, max: number | null, suffix = '') {
  if (min && max) return `${min.toLocaleString('it-IT')}${suffix} - ${max.toLocaleString('it-IT')}${suffix}`
  if (min) return `da ${min.toLocaleString('it-IT')}${suffix}`
  if (max) return `fino a ${max.toLocaleString('it-IT')}${suffix}`
  return '-'
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

function formatOptionLabel(value: string | null | undefined) {
  const clean = String(value || '').trim()
  if (!clean) return '-'

  const labels: Record<string, string> = {
    vendita: 'Vendita',
    affitto: 'Affitto',
    residential_full: 'Residenziale intero',
    room_or_portion: 'Stanze / porzioni',
    garage_parking: 'Box / posto auto',
    commercial: 'Commerciale',
    land: 'Terreni',
    other: 'Altro',
  }

  return labels[clean] || clean.replaceAll('_', ' ')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const verificationId = String(body.verificationId || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const code = String(body.code || '').trim()

    if (!verificationId || !email || !code) {
      return NextResponse.json(
        { error: 'Dati mancanti.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: verification, error } = await supabase
      .from('saved_search_email_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('email', email)
      .is('verified_at', null)
      .maybeSingle()

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Verifica non trovata.' },
        { status: 404 }
      )
    }

    if ((verification.attempts || 0) >= 5) {
      return NextResponse.json(
        { error: 'Troppi tentativi. Richiedi un nuovo codice.' },
        { status: 400 }
      )
    }

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Codice scaduto.' },
        { status: 400 }
      )
    }

    if (hashCode(code) !== verification.code_hash) {
      await supabase
        .from('saved_search_email_verifications')
        .update({ attempts: (verification.attempts || 0) + 1 })
        .eq('id', verification.id)

      return NextResponse.json(
        { error: 'Codice non valido.' },
        { status: 400 }
      )
    }

    const { error: insertError } = await supabase.from('saved_searches').insert({
      full_name: verification.full_name,
      email: verification.email,
      phone: verification.phone,

      source_property_id: verification.source_property_id,
      source_property_slug: verification.source_property_slug,
      source_property_title: verification.source_property_title,
      source_latitude: verification.source_latitude,
      source_longitude: verification.source_longitude,
      radius_km: verification.radius_km || 10,

      contract_type: verification.contract_type,
      source_property_type: verification.source_property_type,
      search_macro_category: verification.search_macro_category,

      comune: verification.comune,
      province: verification.province,

      min_price: verification.min_price,
      max_price: verification.max_price,
      min_surface: verification.min_surface,
      max_surface: verification.max_surface,
      rooms_min: verification.rooms_min,
      rooms_max: verification.rooms_max,
      bathrooms_min: verification.bathrooms_min,

      features_preferred: verification.features_preferred || {},
      expires_at: calculateSubscriptionExpiresAt(verification.contract_type),
    })

    if (insertError) {
      console.error(insertError)
      return NextResponse.json(
        { error: 'Errore creazione ricerca salvata.' },
        { status: 500 }
      )
    }

    await supabase
      .from('saved_search_email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    const baseUrl = getBaseUrl(request)
    const propertyUrl = verification.source_property_slug
      ? `${baseUrl}/immobili/${verification.source_property_slug}`
      : null

    await sendAgencySavedSearchNotification({
      fullName: verification.full_name,
      email: verification.email,
      phone: verification.phone || null,
      sourcePropertyTitle: verification.source_property_title || 'Immobile',
      propertyUrl,
      contractType: formatOptionLabel(verification.contract_type),
      macroCategory: formatOptionLabel(verification.search_macro_category),
      location: [verification.comune, verification.province ? `(${verification.province})` : null]
        .filter(Boolean)
        .join(' ') || '-',
      priceRange:
        verification.min_price || verification.max_price
          ? `${formatMoney(verification.min_price)} - ${formatMoney(verification.max_price)}`
          : '-',
      surfaceRange: formatRange(verification.min_surface, verification.max_surface, ' mq'),
      roomsRange: formatRange(verification.rooms_min, verification.rooms_max),
    })

    await sendCustomerSavedSearchConfirmation({
      to: verification.email,
      fullName: verification.full_name,
      sourcePropertyTitle: verification.source_property_title || 'Immobile',
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore verifica codice.' },
      { status: 500 }
    )
  }
}
