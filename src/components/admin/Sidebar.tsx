import Link from 'next/link'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/immobili', label: 'Tutti gli immobili' },
  { href: '/admin/immobili?contractType=vendita', label: 'Immobili in vendita' },
  { href: '/admin/immobili?contractType=affitto', label: 'Immobili in affitto' },
  { href: '/admin/mercato-del-mattone', label: 'Mercato del mattone' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--site-border)] bg-[var(--site-bg-soft)] lg:block">
      <div className="flex h-full flex-col px-6 py-8">
        <div className="mb-10">
          <img
            src="/images/brand/areaimmobiliare.png"
            alt="Area Immobiliare"
            className="admin-brand-logo h-auto max-w-[170px] object-contain"
          />
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl px-4 py-3 text-sm text-[var(--site-text-soft)] transition hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="theme-admin-card mt-auto rounded-2xl p-4">
          <p className="text-sm text-[var(--site-text)]">
            Gestionale premium in costruzione
          </p>
          <p className="mt-1 text-xs text-[var(--site-text-muted)]">
            Base admin pronta per immobili, mercato e pubblicazione.
          </p>
        </div>
      </div>
    </aside>
  )
}