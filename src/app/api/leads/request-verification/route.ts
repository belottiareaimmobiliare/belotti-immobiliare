import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendVerificationEmail } from '@/lib/mailer'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
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

    if (!propertyId || !fullName || !email) {
      return NextResponse.json(
        { error: 'Dati mancanti' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const code = generateCode()
    const codeHash = hashCode(code)
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
        phone: phone || null,
        message: message || null,
        code_hash: codeHash,
        expires_at: expiresAt,
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