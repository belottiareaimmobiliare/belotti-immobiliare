'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/immobili', label: 'Immobili' },
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/contatti', label: 'Contatti' },
]

export default function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1a]/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="block">
          <p className="text-lg font-semibold uppercase tracking-[0.2em] text-white">
            Belotti
          </p>
          <p className="text-xs text-white/50">Area Immobiliare</p>
        </Link>

        <nav className="hidden gap-8 text-sm md:flex">
          {links.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  active ? 'text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <a
            href="mailto:info@areaimmobiliare.com"
            className="text-sm text-white/70 transition hover:text-white"
          >
            info@areaimmobiliare.com
          </a>

          <a
            href="tel:035221206"
            className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-white/30 hover:bg-white/5"
          >
            035 221206
          </a>
        </div>
      </div>
    </header>
  )
}