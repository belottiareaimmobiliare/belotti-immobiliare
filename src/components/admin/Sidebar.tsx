import Link from 'next/link'

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/immobili', label: 'Tutti gli immobili' },
  { href: '/admin/immobili?contractType=vendita', label: 'Immobili in vendita' },
  { href: '/admin/immobili?contractType=affitto', label: 'Immobili in affitto' },
]

export default function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-black/20 lg:block">
      <div className="flex h-full flex-col px-6 py-8">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">
            BELOTTI
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Area Immobiliare
          </h2>
        </div>

        <nav className="space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-2xl px-4 py-3 text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/80">Gestionale premium in costruzione</p>
          <p className="mt-1 text-xs text-white/45">
            Base admin pronta per immobili e pubblicazione.
          </p>
        </div>
      </div>
    </aside>
  )
}