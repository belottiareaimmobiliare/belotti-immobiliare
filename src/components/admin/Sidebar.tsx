'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/immobili', label: 'Tutti gli immobili' },
  { href: '/admin/immobili?contractType=vendita', label: 'Immobili in vendita' },
  { href: '/admin/immobili?contractType=affitto', label: 'Immobili in affitto' },
  { href: '/admin/news', label: 'News' },
  { href: '/admin/autori', label: 'Autori' },
]

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

      <div className="theme-admin-card mt-auto rounded-2xl p-4">
        <p className="text-sm text-[var(--site-text)]">
          Gestionale premium in costruzione
        </p>
        <p className="mt-1 text-xs text-[var(--site-text-muted)]">
          Base admin pronta per immobili, news e pubblicazione.
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