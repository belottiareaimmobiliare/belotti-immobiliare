import type { ReactNode } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { getSidebarLinks, getCurrentAdminProfile } from '@/lib/admin-auth'

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    return <>{children}</>
  }

  const links = getSidebarLinks(profile)

  return (
    <AdminShell
      profile={{
        full_name: profile.full_name,
        username: profile.username,
        role: profile.role,
        is_active: profile.is_active,
      }}
      links={links}
    >
      {children}
    </AdminShell>
  )
}
