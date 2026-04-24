import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ADMIN_QR_SESSION_COOKIE,
  createAdminQrSessionToken,
  getAdminQrSessionCookieOptions,
} from '@/lib/admin-qr-session'
import { getAdminProfileById } from '@/lib/admin-auth'

type LoginRequestRow = {
  public_token: string
  desktop_secret: string
  status: 'pending' | 'approved' | 'consumed' | 'expired' | 'rejected'
  expires_at: string
  approved_profile_id: string | null
}

export async function POST(request: Request) {
  const body = (await request.json()) as { token?: string; secret?: string }
  const token = String(body.token ?? '')
  const secret = String(body.secret ?? '')

  if (!token || !secret) {
    return NextResponse.json({ error: 'Dati QR mancanti.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data } = await service
    .from('admin_login_requests')
    .select('public_token, desktop_secret, status, expires_at, approved_profile_id')
    .eq('public_token', token)
    .eq('desktop_secret', secret)
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

  if (row.status !== 'approved' || !row.approved_profile_id) {
    return NextResponse.json(
      { error: 'Accesso non ancora approvato dal telefono.' },
      { status: 400 }
    )
  }

  const profile = await getAdminProfileById(row.approved_profile_id)

  if (!profile || !profile.is_active) {
    return NextResponse.json(
      { error: 'Profilo approvato non valido o disattivo.' },
      { status: 403 }
    )
  }

  const sessionToken = createAdminQrSessionToken(profile.id)

  await service
    .from('admin_login_requests')
    .update({
      status: 'consumed',
      consumed_at: new Date().toISOString(),
    })
    .eq('public_token', token)

  const response = NextResponse.json({ ok: true })

  response.cookies.set(
    ADMIN_QR_SESSION_COOKIE,
    sessionToken,
    getAdminQrSessionCookieOptions()
  )

  return response
}