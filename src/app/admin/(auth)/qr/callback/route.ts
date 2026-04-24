import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token = requestUrl.searchParams.get('token')

  const fallbackLoginUrl = new URL('/admin/login', request.url)

  if (!token) {
    fallbackLoginUrl.searchParams.set('error', 'google_missing_code')
    return NextResponse.redirect(fallbackLoginUrl)
  }

  const qrUrl = new URL(`/admin/qr/${encodeURIComponent(token)}`, request.url)

  if (!code) {
    qrUrl.searchParams.set('error', 'google_missing_code')
    return NextResponse.redirect(qrUrl)
  }

  const supabase = await createClient()
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    qrUrl.searchParams.set('error', 'google_exchange_failed')
    return NextResponse.redirect(qrUrl)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = await getAdminProfileByAuthIdentity(
    user
      ? {
          id: user.id,
          email: user.email,
        }
      : null
  )

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    qrUrl.searchParams.set('error', 'google_not_authorized')
    return NextResponse.redirect(qrUrl)
  }

  return NextResponse.redirect(qrUrl)
}