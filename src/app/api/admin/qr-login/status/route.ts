import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

type LoginRequestRow = {
  status: 'pending' | 'approved' | 'consumed' | 'expired' | 'rejected'
  expires_at: string
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const secret = requestUrl.searchParams.get('secret')

  if (!token || !secret) {
    return NextResponse.json({ error: 'Token QR non valido.' }, { status: 400 })
  }

  const service = createServiceClient()

  const { data } = await service
    .from('admin_login_requests')
    .select('status, expires_at')
    .eq('public_token', token)
    .eq('desktop_secret', secret)
    .maybeSingle()

  const row = data as LoginRequestRow | null

  if (!row) {
    return NextResponse.json({ error: 'Richiesta QR non trovata.' }, { status: 404 })
  }

  const expired = new Date(row.expires_at).getTime() < Date.now()

  if (expired && row.status === 'pending') {
    await service
      .from('admin_login_requests')
      .update({ status: 'expired' })
      .eq('public_token', token)

    return NextResponse.json({ status: 'expired' })
  }

  return NextResponse.json({
    status: row.status === 'rejected' ? 'expired' : row.status,
  })
}