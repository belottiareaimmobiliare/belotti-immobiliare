'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

type SidebarLink = {
  href: string
  label: string
}

type SidebarProfile = {
  full_name: string
  username: string
  role: 'owner' | 'agent' | 'editor'
  is_active: boolean
}

type SidebarProps = {
  profile: SidebarProfile
  links: SidebarLink[]
  mobile?: boolean
  mobileOpen?: boolean
  onClose?: () => void
}

function isLinkActive(href: string, pathname: string, currentSearch: string) {
  const [basePath, queryString] = href.split('?')

  if (pathname !== basePath) return false
  if (!queryString) return true

  return currentSearch === queryString
}

function SidebarContent({
  profile,
  links,
  mobile = false,
  onClose,
}: {
  profile: SidebarProfile
  links: SidebarLink[]
  mobile?: boolean
  onClose?: () => void
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.toString()

  const roleLabel =
    profile.role === 'owner'
      ? 'Admin Proprietario'
      : profile.role === 'editor'
        ? 'Editor'
        : 'Agente'

  const footerTitle =
    profile.role === 'owner'
      ? 'Pannello proprietario attivo'
      : profile.role === 'editor'
        ? 'Pannello editor attivo'
        : 'Pannello agente attivo'

  const footerText =
    profile.role === 'owner'
      ? 'Gestione completa di contenuti, utenti, logs e controllo generale del sito.'
      : profile.role === 'editor'
        ? 'Accesso abilitato alle sezioni editoriali e ai contenuti consentiti.'
        : 'Accesso abilitato alle sezioni immobiliari assegnate dai permessi.'

  return (
    <div className="flex h-full flex-col px-6 py-8">
      <div className="mb-8 flex items-start justify-between gap-4">
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
        <p className="mt-1 text-xs text-[var(--site-text-muted)]">
          {profile.full_name}
        </p>
        <p className="mt-1 text-xs text-[var(--site-text-faint)]">
          @{profile.username}
        </p>
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
        <p className="mt-1 text-xs leading-6 text-[var(--site-text-muted)]">
          {footerText}
        </p>
      </div>
    </div>
  )
}

export default function Sidebar({
  profile,
  links,
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
          <SidebarContent
            profile={profile}
            links={links}
            mobile
            onClose={onClose}
          />
        </aside>
      </>
    )
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--site-border)] bg-[var(--site-bg-soft)] lg:block">
      <SidebarContent profile={profile} links={links} />
    </aside>
  )
}