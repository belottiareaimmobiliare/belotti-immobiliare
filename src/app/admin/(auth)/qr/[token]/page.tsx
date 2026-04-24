import { headers } from 'next/headers'
import AdminQrApprovePanel from '@/components/admin/AdminQrApprovePanel'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getAdminProfileByAuthIdentity } from '@/lib/admin-auth'

type LoginRequestRow = {
  public_token: string
  status: 'pending' | 'approved' | 'consumed' | 'expired' | 'rejected'
  expires_at: string
}

function isMobileUserAgent(ua: string) {
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(ua)
}

function isGoogleUser(user: {
  app_metadata?: { provider?: string; providers?: string[] }
}) {
  return (
    user?.app_metadata?.provider === 'google' ||
    user?.app_metadata?.providers?.includes('google') === true
  )
}

export const dynamic = 'force-dynamic'

export default async function AdminQrTokenPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params
  const service = createServiceClient()

  const { data } = await service
    .from('admin_login_requests')
    .select('public_token, status, expires_at')
    .eq('public_token', token)
    .maybeSingle()

  const requestRow = data as LoginRequestRow | null

  const headersList = await headers()
  const ua = headersList.get('user-agent') || ''
  const isMobile = isMobileUserAgent(ua)

  const supabase = await createServerClient()
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

  const hasGoogleAuthorizedSession =
    Boolean(profile?.is_active) && Boolean(user && isGoogleUser(user))

  let requestStatus: 'pending' | 'approved' | 'consumed' | 'expired' = 'expired'

  if (requestRow) {
    const expired = new Date(requestRow.expires_at).getTime() < Date.now()

    if (expired && requestRow.status === 'pending') {
      await service
        .from('admin_login_requests')
        .update({ status: 'expired' })
        .eq('public_token', token)

      requestStatus = 'expired'
    } else {
      requestStatus =
        requestRow.status === 'rejected' ? 'expired' : requestRow.status
    }
  }

  return (
    <main className="min-h-screen bg-[var(--site-bg)] px-4 py-8 text-[var(--site-text)]">
      <div className="mx-auto max-w-md">
        <AdminQrApprovePanel
          token={token}
          isMobile={isMobile}
          requestStatus={requestStatus}
          hasGoogleAuthorizedSession={hasGoogleAuthorizedSession}
          currentUserLabel={profile ? `${profile.full_name} (@${profile.username})` : null}
        />
      </div>
    </main>
  )
}