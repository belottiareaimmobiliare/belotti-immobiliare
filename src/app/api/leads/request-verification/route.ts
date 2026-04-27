import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendVerificationEmail } from '@/lib/mailer'

const PRIVACY_POLICY_VERSION = 'privacy-2026-04'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
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

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const propertyId = String(body.propertyId || '').trim()
    const propertySlug = String(body.propertySlug || '').trim()
    const propertyTitle = String(body.propertyTitle || '').trim()
    const fullName = String(body.fullName || '').trim()
    const email = String(body.email || '').trim().toLowerCase()
    const phone = String(body.phone || '').trim()
    const message = String(body.message || '').trim()
    const privacyAccepted = body.privacyAccepted === true

    if (!propertyId || !fullName || !email || !phone) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      )
    }

    if (!privacyAccepted) {
      return NextResponse.json(
        { error: 'È necessario accettare l’informativa privacy.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const code = generateCode()
    const codeHash = hashCode(code)
    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase
      .from('lead_email_verifications')
      .delete()
      .eq('email', email)
      .is('verified_at', null)

    const { error: insertError } = await supabase
      .from('lead_email_verifications')
      .insert({
        property_id: propertyId,
        property_slug: propertySlug || null,
        property_title: propertyTitle || null,
        full_name: fullName,
        email,
        phone,
        message: message || null,
        code_hash: codeHash,
        expires_at: expiresAt,
        privacy_accepted: true,
        privacy_accepted_at: now,
        privacy_policy_version: PRIVACY_POLICY_VERSION,
        privacy_ip: getClientIp(request),
        privacy_user_agent: request.headers.get('user-agent') || null,
      })

    if (insertError) {
      console.error(insertError)
      return NextResponse.json(
        { error: 'Errore salvataggio verifica' },
        { status: 500 }
      )
    }

    await sendVerificationEmail({
      to: email,
      code,
      propertyTitle: propertyTitle || 'Immobile richiesto',
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore invio codice' },
      { status: 500 }
    )
  }
}
