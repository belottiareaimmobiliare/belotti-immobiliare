import type { ReactNode } from 'react'
import AdminShell from '@/components/admin/AdminShell'
import { getSidebarLinks, getCurrentAdminProfile } from '@/lib/admin-auth'
import { createClient } from '@/lib/supabase/server'

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode
}) {
  const profile = await getCurrentAdminProfile()

  if (!profile || !profile.is_active) {
    return <>{children}</>
  }

  let links = getSidebarLinks(profile)

  if (profile.can_manage_properties) {
    const supabase = await createClient()

    const { count } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')

    const newLeadsCount = count ?? 0

    links = links.map((link) => {
      if (link.href !== '/admin/leads') return link

      return {
        ...link,
        label: newLeadsCount > 0 ? `Leads (${newLeadsCount})` : 'Leads',
      }
    })
  }

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
