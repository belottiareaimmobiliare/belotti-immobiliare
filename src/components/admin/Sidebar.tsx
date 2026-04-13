'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/immobili', label: 'Tutti gli immobili' },
  { href: '/admin/immobili?contractType=vendita', label: 'Immobili in vendita' },
  { href: '/admin/immobili?contractType=affitto', label: 'Immobili in affitto' },
]

export default function Sidebar() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    if (href.startsWith('/admin/immobili')) return pathname.startsWith('/admin/immobili')
    return pathname === href
  }

  return (
    <aside className="hidden w-72 shrink-0 border-r border-[var(--site-border)] bg-[var(--site-bg-soft)] lg:block">
      <div className="flex h-full flex-col px-6 py-8">
        <div className="mb-10">
          <div className="relative h-[56px] w-[160px]">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              fill
              className="object-contain dark:brightness-0 dark:invert"
              priority
            />
          </div>
        </div>

        <nav className="space-y-2">
          {links.map((link) => {
            const active = isActive(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-[var(--site-surface-3)] text-[var(--site-text)] shadow-[var(--site-button-shadow)]'
                    : 'text-[var(--site-text-soft)] hover:bg-[var(--site-surface-2)] hover:text-[var(--site-text)]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        <div className="theme-admin-card mt-auto rounded-2xl p-4">
          <p className="text-sm text-[var(--site-text)]">Gestionale premium in costruzione</p>
          <p className="mt-1 text-xs text-[var(--site-text-muted)]">
            Base admin pronta per immobili e pubblicazione.
          </p>
        </div>
      </div>
    </aside>
  )
}