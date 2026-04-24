import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

type LoginRequestRow = {
  status: 'pending' | 'approved' | 'consumed' | 'expired' | 'rejected'
  expires_at: string
}

function isGoogleUser(user: {
  app_metadata?: { provider?: string; providers?: string[] }
}) {
  return (
    user?.app_metadata?.provider === 'google' ||
    user?.app_metadata?.providers?.includes('google') === true
  )
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string }
  const token = String(body.token ?? '')

  if (!token) {
    return NextResponse.json({ error: 'Token QR mancante.' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !isGoogleUser(user)) {
    return NextResponse.json(
      { error: 'Per approvare da telefono devi entrare con Google.' },
      { status: 401 }
    )
  }

  const profile = await getAdminProfileByAuthIdentity({
    id: user.id,
    email: user.email,
  })

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { error: 'Questa Gmail non è autorizzata per l’accesso admin.' },
      { status: 403 }
    )
  }

  const service = createServiceClient()

  const { data } = await service
    .from('admin_login_requests')
    .select('status, expires_at')
    .eq('public_token', token)
    .maybeSingle()

  const row = data as LoginRequestRow | null

  if (!row) {
    return NextResponse.json({ error: 'Richiesta QR non trovata.' }, { status: 404 })
  }

  const expired = new Date(row.expires_at).getTime() < Date.now()

  if (expired) {
    await service
      .from('admin_login_requests')
      .update({ status: 'expired' })
      .eq('public_token', token)

    return NextResponse.json({ error: 'QR scaduto.' }, { status: 400 })
  }

  if (row.status === 'consumed') {
    return NextResponse.json({ error: 'QR già utilizzato.' }, { status: 400 })
  }

  await service
    .from('admin_login_requests')
    .update({
      status: 'approved',
      approved_profile_id: profile.id,
      approved_email: user.email?.trim().toLowerCase() ?? null,
      approved_at: new Date().toISOString(),
      mobile_user_agent: request.headers.get('user-agent'),
    })
    .eq('public_token', token)

  return NextResponse.json({ ok: true })
}