'use client'

import { useEffect, useState } from 'react'
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

export default function AdminProtectedShell({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profile, setProfile] = useState<ShellProfile | null>(null)
  const [links, setLinks] = useState<SidebarLink[]>([
    { href: '/admin', label: 'Dashboard' },
  ])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    const loadAdminContext = async () => {
      try {
        const res = await fetch('/api/admin/me', {
          method: 'GET',
          cache: 'no-store',
        })

        const data = await res.json()

        if (!mounted) return

        if (res.ok && data?.profile) {
          setProfile(data.profile)
          setLinks(
            Array.isArray(data.links) && data.links.length > 0
              ? data.links
              : [{ href: '/admin', label: 'Dashboard' }]
          )
        }
      } catch {
        // fallback silenzioso
      } finally {
        if (mounted) setLoaded(true)
      }
    }

    loadAdminContext()

    return () => {
      mounted = false
    }
  }, [])

  const roleLabel =
    profile?.role === 'owner'
      ? 'Admin Proprietario'
      : profile?.role === 'editor'
        ? 'Editor'
        : 'Agente'

  if (!loaded) {
    return (
      <div className="theme-admin-page min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-4 text-sm text-[var(--site-text-muted)]">
            Caricamento pannello admin...
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="theme-admin-page min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
        <div className="flex min-h-screen items-center justify-center">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-5 py-4 text-sm text-[var(--site-text-muted)]">
            Profilo admin non disponibile.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="theme-admin-page min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <div className="flex min-h-screen">
        <Sidebar profile={profile} links={links} />

        <Sidebar
          mobile
          mobileOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          profile={profile}
          links={links}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--site-border)] bg-[var(--site-bg)]/95 backdrop-blur lg:hidden">
            <div className="flex items-center justify-between gap-4 px-4 py-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
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

          <main className="min-w-0 flex-1 px-4 py-4 md:px-6 md:py-6 xl:px-8 xl:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}