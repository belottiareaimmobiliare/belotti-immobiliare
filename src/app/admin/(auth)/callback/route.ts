import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  const loginUrl = new URL('/admin/login', request.url)
  const adminUrl = new URL('/admin', request.url)

  if (!code) {
    loginUrl.searchParams.set('error', 'google_missing_code')
    return NextResponse.redirect(loginUrl)
  }

  const supabase = await createClient()

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    loginUrl.searchParams.set('error', 'google_exchange_failed')
    return NextResponse.redirect(loginUrl)
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
    loginUrl.searchParams.set('error', 'google_not_authorized')
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.redirect(adminUrl)
}