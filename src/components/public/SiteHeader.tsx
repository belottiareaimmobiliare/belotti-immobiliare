'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/public/ThemeToggle'

const links = [
  { href: '/', label: 'Home' },
  { href: '/immobili', label: 'Immobili' },
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/contatti', label: 'Contatti' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isHome = pathname === '/'

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileMenuOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileMenuOpen])

  return (
    <>
      <header
        className={`sticky top-0 z-[1000] border-b backdrop-blur-xl transition-colors duration-300 ${
          isHome
            ? 'border-white/10 bg-[#050b16]/78'
            : 'border-[var(--site-border)] bg-[var(--site-surface-2)]'
        }`}
      >
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              width={190}
              height={60}
              priority
              className={`h-[50px] w-auto object-contain md:h-[54px] ${
                isHome ? 'brightness-0 invert opacity-95' : 'opacity-95'
              }`}
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
                    isHome
                      ? active
                        ? 'text-white'
                        : 'text-white/68 hover:text-white'
                      : active
                        ? 'text-[var(--site-text)]'
                        : 'text-[var(--site-text-muted)] hover:text-[var(--site-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <ThemeToggle />

            <a
              href="mailto:info@areaimmobiliare.com"
              className={`text-sm transition ${
                isHome
                  ? 'text-white/65 hover:text-white'
                  : 'text-[var(--site-text-muted)] hover:text-[var(--site-text)]'
              }`}
            >
              info@areaimmobiliare.com
            </a>

            <a
              href="tel:035221206"
              className={`rounded-full px-4 py-2 text-sm transition ${
                isHome
                  ? 'border border-white/15 text-white hover:border-white/30 hover:bg-white/5'
                  : 'border border-[var(--site-border-strong)] bg-[var(--site-surface-2)] text-[var(--site-text)] shadow-[var(--site-button-shadow)] hover:bg-[var(--site-surface-3)]'
              }`}
            >
              035 221206
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                isHome
                  ? 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  : 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] shadow-[var(--site-button-shadow)] hover:bg-[var(--site-surface-3)]'
              }`}
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            >
              <div className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-5 transition ${
                    isHome ? 'bg-white' : 'bg-[var(--site-text)]'
                  } ${mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[2px] w-5 transition ${
                    isHome ? 'bg-white' : 'bg-[var(--site-text)]'
                  } ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-[2px] w-5 transition ${
                    isHome ? 'bg-white' : 'bg-[var(--site-text)]'
                  } ${mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[1100] md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            aria-label="Chiudi menu mobile"
          />

          <div
            className={`absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l p-6 shadow-2xl transition-colors ${
              isHome
                ? 'border-white/10 bg-[#07111d]'
                : 'border-[var(--site-border)] bg-[var(--site-bg-soft)]'
            }`}
          >
            <div className="flex items-center justify-between">
              <Image
                src="/images/brand/areaimmobiliare.png"
                alt="Area Immobiliare"
                width={150}
                height={48}
                className={`h-[42px] w-auto object-contain ${
                  isHome ? 'brightness-0 invert opacity-95' : 'opacity-95'
                }`}
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-xl ${
                  isHome
                    ? 'border-white/10 bg-white/5 text-white'
                    : 'border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)]'
                }`}
                aria-label="Chiudi menu"
              >
                ×
              </button>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              {links.map((item) => {
                const active =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-2xl px-4 py-3 text-base transition ${
                      isHome
                        ? active
                          ? 'bg-white text-black'
                          : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                        : active
                          ? 'theme-pill-active border'
                          : 'theme-pill border'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div
              className={`mt-8 h-px w-full ${
                isHome ? 'bg-white/10' : 'bg-[var(--site-border)]'
              }`}
            />

            <div
              className={`mt-8 space-y-3 text-sm ${
                isHome ? 'text-white/72' : 'text-[var(--site-text-soft)]'
              }`}
            >
              <a
                href="mailto:info@areaimmobiliare.com"
                className={`block rounded-2xl px-4 py-3 transition ${
                  isHome
                    ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                    : 'theme-pill border'
                }`}
              >
                info@areaimmobiliare.com
              </a>

              <a
                href="tel:035221206"
                className={`block rounded-2xl px-4 py-3 transition ${
                  isHome
                    ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                    : 'theme-pill border'
                }`}
              >
                035 221206
              </a>

              <Link
                href="/privacy"
                className={`block rounded-2xl px-4 py-3 transition ${
                  isHome
                    ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                    : 'theme-pill border'
                }`}
              >
                Privacy Policy
              </Link>

              <Link
                href="/cookie"
                className={`block rounded-2xl px-4 py-3 transition ${
                  isHome
                    ? 'border border-white/10 bg-white/5 hover:bg-white/10'
                    : 'theme-pill border'
                }`}
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}