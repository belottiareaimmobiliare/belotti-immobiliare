'use client'

import { useEffect, useMemo, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'

type SidebarLink = {
  href: string
  label: string
}

type ShellProfile = {
  full_name: string
  username: string
  role: 'owner' | 'agent' | 'editor'
  is_active: boolean
}


export default function AdminShell({
  profile,
  links,
  children,
}: {
  profile: ShellProfile
  links: SidebarLink[]
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    const storedSidebar = localStorage.getItem('admin-sidebar-collapsed')
    setSidebarCollapsed(storedSidebar === 'true')

  }, [])

  function toggleSidebar() {
    setSidebarCollapsed((prev) => {
      const next = !prev
      localStorage.setItem('admin-sidebar-collapsed', String(next))
      return next
    })
  }



  const roleLabel = useMemo(() => {
    if (profile.role === 'owner') return 'Admin Proprietario'
    if (profile.role === 'editor') return 'Editor'
    return 'Agente'
  }, [profile.role])

  return (
    <div className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <Sidebar
        mobile
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        profile={profile}
        links={links}
      />

      <div className="flex min-h-screen">
        <Sidebar
          profile={profile}
          links={links}
          collapsed={sidebarCollapsed}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-3 px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label="Apri menu admin"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)]"
              >
                ☰
              </button>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--site-text)]">
                  {profile.full_name}
                </p>
                <p className="truncate text-xs text-[var(--site-text-muted)]">
                  {roleLabel}
                </p>
              </div>


              <form action="/logout" method="post">
                <button
                  type="submit"
                  className="inline-flex rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-3 py-2 text-sm font-semibold text-[var(--site-text)]"
                >
                  Logout
                </button>
              </form>
            </div>
          </header>

          <div className="hidden border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 px-6 py-4 backdrop-blur lg:flex lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--site-text)]">
                {profile.full_name}
              </p>
              <p className="text-xs text-[var(--site-text-muted)]">
                {roleLabel}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSidebar}
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
              >
                {sidebarCollapsed ? 'Mostra menu' : 'Nascondi menu'}
              </button>

            </div>
          </div>

          <main className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}