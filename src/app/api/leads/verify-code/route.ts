import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendAgencyLeadNotification,
  sendCustomerLeadConfirmation,
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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const propertyId = String(body.propertyId || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const code = String(body.code || '').trim()

    if (!propertyId || !email || !code) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: verification, error } = await supabase
      .from('lead_email_verifications')
      .select('*')
      .eq('property_id', propertyId)
      .eq('email', email)
      .is('verified_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !verification) {
      return NextResponse.json(
        { error: 'Verifica non trovata' },
        { status: 404 }
      )
    }

    if (new Date(verification.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: 'Codice scaduto' },
        { status: 400 }
      )
    }

    const providedHash = hashCode(code)

    if (providedHash !== verification.code_hash) {
      await supabase
        .from('lead_email_verifications')
        .update({ attempts: (verification.attempts || 0) + 1 })
        .eq('id', verification.id)

      return NextResponse.json(
        { error: 'Codice non valido' },
        { status: 400 }
      )
    }

    const { error: leadError } = await supabase
      .from('leads')
      .insert({
        property_id: verification.property_id,
        property_slug: verification.property_slug,
        property_title: verification.property_title,
        full_name: verification.full_name,
        email: verification.email,
        phone: verification.phone,
        message: verification.message,
        privacy_accepted: verification.privacy_accepted === true,
        privacy_accepted_at: verification.privacy_accepted_at || null,
        privacy_policy_version: verification.privacy_policy_version || null,
        privacy_ip: verification.privacy_ip || null,
        privacy_user_agent: verification.privacy_user_agent || null,
      })

    if (leadError) {
      console.error(leadError)
      return NextResponse.json(
        { error: 'Errore creazione lead' },
        { status: 500 }
      )
    }

    await supabase
      .from('lead_email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    const { data: property } = await supabase
      .from('properties')
      .select(`
        title,
        slug,
        price,
        comune,
        province,
        description,
        property_media (
          file_url,
          is_cover,
          sort_order,
          media_type
        )
      `)
      .eq('id', verification.property_id)
      .maybeSingle()

    const media = Array.isArray(property?.property_media)
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

    const cover = images.find((item) => item.is_cover) || images[0] || null

    const baseUrl = getBaseUrl(request)
    const propertySlug = property?.slug || verification.property_slug || null
    const propertyUrl = propertySlug ? `${baseUrl}/immobili/${propertySlug}` : null
    const propertyTitle = property?.title || verification.property_title || 'Immobile'

    await sendAgencyLeadNotification({
      propertyTitle,
      propertySlug,
      propertyUrl,
      propertyPrice: typeof property?.price === 'number' ? property.price : null,
      propertyComune: property?.comune || null,
      propertyProvince: property?.province || null,
      propertyDescription: property?.description || null,
      propertyCoverUrl: cover?.file_url || null,
      fullName: verification.full_name,
      email: verification.email,
      phone: verification.phone || null,
      message: verification.message || null,
    })

    await sendCustomerLeadConfirmation({
      to: verification.email,
      fullName: verification.full_name,
      propertyTitle,
      propertyUrl,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore verifica codice' },
      { status: 500 }
    )
  }
}