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

    const [{ count: newLeadsCount }, { count: activeSavedSearchesCount }] =
      await Promise.all([
        supabase
          .from('leads')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'new'),

        supabase
          .from('saved_searches')
          .select('id', { count: 'exact', head: true })
          .in('status', ['new', 'contacted']),
      ])

    links = links.map((link) => {
      if (link.href === '/admin/leads') {
        const count = newLeadsCount ?? 0

        return {
          ...link,
          label: count > 0 ? `Leads (${count})` : 'Leads',
        }
      }

      if (link.href === '/admin/ricerche-salvate') {
        const count = activeSavedSearchesCount ?? 0

        return {
          ...link,
          label: count > 0 ? `Ricerche salvate (${count})` : 'Ricerche salvate',
        }
      }

      return link
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
