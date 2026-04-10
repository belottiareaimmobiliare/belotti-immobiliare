'use client'

import Image from 'next/image'
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b16]/78 backdrop-blur-xl">
      <div className="flex w-full items-center justify-between px-6 py-4 xl:px-10 2xl:px-14">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/brand/areaimmobiliare.png"
            alt="Area Immobiliare"
            width={190}
            height={60}
            priority
            className="h-[54px] w-auto object-contain brightness-0 invert opacity-95"
          />
        </Link>

        <nav className="hidden items-center gap-8 text-sm md:flex lg:gap-10">
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
                  active ? 'text-white' : 'text-white/68 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <a
            href="mailto:info@areaimmobiliare.com"
            className="text-sm text-white/65 transition hover:text-white"
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