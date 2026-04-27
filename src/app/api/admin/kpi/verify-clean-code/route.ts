import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { revalidatePath } from 'next/cache'
import { requireOwner } from '@/lib/admin-auth'
import { createServiceClient } from '@/lib/supabase/service'

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex')
}

export async function POST(request: Request) {
  try {
    const profile = await requireOwner()
    const body = await request.json()

    const verificationId = String(body.verificationId || '').trim()
    const code = String(body.code || '').trim()

    if (!verificationId || !code) {
      return NextResponse.json(
        { error: 'Dati mancanti.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    const { data: verification, error } = await supabase
      .from('kpi_cleanup_email_verifications')
      .select('*')
      .eq('id', verificationId)
      .eq('admin_profile_id', profile.id)
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
        .from('kpi_cleanup_email_verifications')
        .update({ attempts: (verification.attempts || 0) + 1 })
        .eq('id', verification.id)

      return NextResponse.json(
        { error: 'Codice non valido.' },
        { status: 400 }
      )
    }

    const { count } = await supabase
      .from('activity_log')
      .select('id', { count: 'exact', head: true })

    const cleanedCount = count ?? 0

    const { error: deleteError } = await supabase
      .from('activity_log')
      .delete()
      .neq('id', -1)

    if (deleteError) {
      console.error(deleteError)
      return NextResponse.json(
        { error: 'Errore durante la pulizia KPI.' },
        { status: 500 }
      )
    }

    await supabase.from('kpi_cleanup_audit').insert({
      admin_profile_id: profile.id,
      admin_email: verification.admin_email,
      cleaned_activity_log_count: cleanedCount,
    })

    await supabase
      .from('kpi_cleanup_email_verifications')
      .update({ verified_at: new Date().toISOString() })
      .eq('id', verification.id)

    revalidatePath('/admin/kpi')

    return NextResponse.json({
      ok: true,
      cleanedCount,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Errore conferma pulizia KPI.' },
      { status: 500 }
    )
  }
}
