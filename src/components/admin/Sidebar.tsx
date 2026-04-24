'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

type SidebarLink = {
  href: string
  label: string
}

type AdminProfile = {
  full_name: string
  username: string
  role: 'owner' | 'agent' | 'editor'
  is_active: boolean
  can_manage_properties: boolean
  can_manage_news: boolean
  can_manage_site_content: boolean
  can_manage_users: boolean
  can_view_logs: boolean
  can_view_kpis: boolean
  can_publish_properties: boolean
} | null

const defaultLinks: SidebarLink[] = [{ href: '/admin', label: 'Dashboard' }]

function isLinkActive(href: string, pathname: string, currentSearch: string) {
  const [basePath, queryString] = href.split('?')

  if (pathname !== basePath) return false
  if (!queryString) return true

  return currentSearch === queryString
}

type SidebarProps = {
  mobile?: boolean
  mobileOpen?: boolean
  onClose?: () => void
}

function SidebarContent({
  mobile = false,
  onClose,
}: {
  mobile?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.toString()

  const [links, setLinks] = useState<SidebarLink[]>(defaultLinks)
  const [profile, setProfile] = useState<AdminProfile>(null)

  useEffect(() => {
    let mounted = true

    const loadSidebar = async () => {
      try {
        const res = await fetch('/api/admin/me', {
          method: 'GET',
          cache: 'no-store',
        })

        if (!res.ok) return

        const data = (await res.json()) as {
          profile: AdminProfile
          links: SidebarLink[]
        }

        if (!mounted) return

        setProfile(data.profile ?? null)
        setLinks(data.links?.length ? data.links : defaultLinks)
      } catch {
        // fallback silenzioso
      }
    }

    loadSidebar()

    return () => {
      mounted = false
    }
  }, [])

  const roleLabel =
    profile?.role === 'owner'
      ? 'Admin Proprietario'
      : profile?.role === 'editor'
        ? 'Editor'
        : profile?.role === 'agent'
          ? 'Agente'
          : 'Accesso base'

  const footerTitle =
    profile?.role === 'owner'
      ? 'Pannello proprietario attivo'
      : profile?.role === 'editor'
        ? 'Pannello editor attivo'
        : profile?.role === 'agent'
          ? 'Pannello agente attivo'
          : 'Gestionale in inizializzazione'

  const footerText =
    profile?.role === 'owner'
      ? 'Gestione completa sito, utenti, logs e contenuti.'
      : profile?.role === 'editor'
        ? 'Accesso abilitato a immobili e news.'
        : profile?.role === 'agent'
          ? 'Accesso abilitato alla gestione immobili.'
          : 'Profilo o permessi non ancora caricati.'

  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="mb-10 flex items-start justify-between gap-4">
        <img
          src="/images/brand/areaimmobiliare.png"
          alt="Area Immobiliare"
          className="admin-brand-logo h-auto max-w-[170px] object-contain"
        />

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi menu admin"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--site-border)] bg-[var(--site-surface)] text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)] lg:hidden"
          >
            ✕
          </button>
        ) : null}
      </div>

      <div className="mb-5 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
          Profilo
        </p>
        <p className="mt-2 text-sm font-semibold text-[var(--site-text)]">
          {roleLabel}
        </p>
        {profile?.full_name ? (
          <p className="mt-1 text-xs text-[var(--site-text-muted)]">
            {profile.full_name}
          </p>
        ) : null}
        {profile?.username ? (
          <p className="mt-1 text-xs text-[var(--site-text-faint)]">
            @{profile.username}
          </p>
        ) : null}
      </div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = isLinkActive(link.href, pathname, currentSearch)

          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => {
                if (mobile && onClose) onClose()
              }}
              className={[
                'block rounded-2xl px-4 py-3 text-sm transition',
                active
                  ? 'bg-[var(--site-surface-2)] text-[var(--site-text)]'
                  : 'text-[var(--site-text-soft)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]',
              ].join(' ')}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-5">
        <form action="/logout" method="post">
          <button
            type="submit"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] px-4 py-3 text-sm font-semibold text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
          >
            Logout
          </button>
        </form>
      </div>

      <div className="theme-admin-card mt-5 rounded-2xl p-4">
        <p className="text-sm text-[var(--site-text)]">{footerTitle}</p>
        <p className="mt-1 text-xs text-[var(--site-text-muted)]">
          {footerText}
        </p>
      </div>
    </div>
  )
}

export default function Sidebar({
  mobile = false,
  mobileOpen = false,
  onClose,
}: SidebarProps) {
  if (mobile) {
    return (
      <>
        <div
          className={[
            'fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 lg:hidden',
            mobileOpen
              ? 'pointer-events-auto opacity-100'
              : 'pointer-events-none opacity-0',
          ].join(' ')}
          onClick={onClose}
        />

        <aside
          className={[
            'fixed inset-y-0 left-0 z-50 w-[88vw] max-w-[320px] border-r border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          ].join(' ')}
        >
          <SidebarContent mobile onClose={onClose} />
        </aside>
      </>
    )
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--site-border)] bg-[var(--site-bg-soft)] lg:block">
      <SidebarContent />
    </aside>
  )
}