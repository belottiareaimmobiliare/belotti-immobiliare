import crypto from 'crypto'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const service = createServiceClient()

  await service
    .from('admin_login_requests')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const publicToken = crypto.randomBytes(24).toString('base64url')
  const desktopSecret = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const origin = new URL(request.url).origin

  const { error } = await service.from('admin_login_requests').insert({
    public_token: publicToken,
    desktop_secret: desktopSecret,
    expires_at: expiresAt,
    desktop_user_agent: request.headers.get('user-agent'),
  })

  if (error) {
    return NextResponse.json(
      { error: 'Errore creazione richiesta QR.' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    token: publicToken,
    secret: desktopSecret,
    qrUrl: `${origin}/admin/qr/${encodeURIComponent(publicToken)}`,
    expiresAt,
  })
}