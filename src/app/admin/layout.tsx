import type { ReactNode } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { getSidebarLinks, requireAdminProfile } from '@/lib/admin-auth'

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await requireAdminProfile()
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