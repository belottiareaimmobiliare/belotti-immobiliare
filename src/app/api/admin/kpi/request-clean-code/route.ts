import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { requireOwner } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'
import { sendKpiCleanupVerificationEmail } from '@/lib/mailer'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

export async function POST() {
  try {
    const profile = await requireOwner()
    const adminEmail = String(
      profile.authorized_google_email || profile.login_email || ''
    )
      .trim()
      .toLowerCase()

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Email amministratore non configurata.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()
    const code = generateCode()
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    await supabase
      .from('kpi_cleanup_email_verifications')
      .delete()
      .eq('admin_profile_id', profile.id)
      .is('verified_at', null)

    const { data, error } = await supabase
      .from('kpi_cleanup_email_verifications')
      .insert({
        admin_profile_id: profile.id,
        admin_email: adminEmail,
        code_hash: codeHash,
        expires_at: expiresAt,
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error(error)
      return NextResponse.json(
        { error: 'Errore salvataggio verifica KPI.' },
        { status: 500 }
      )
    }

    await sendKpiCleanupVerificationEmail({
      to: adminEmail,
      code,
      adminName: profile.full_name,
    })

    return NextResponse.json({
      ok: true,
      verificationId: data.id,
      email: adminEmail,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore invio codice KPI.' },
      { status: 500 }
    )
  }
}
