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
      <header className="theme-header sticky top-0 z-50 border-b">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              width={190}
              height={60}
              priority
              className="site-header-logo h-[50px] w-auto object-contain md:h-[54px]"
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
                  className={active ? 'theme-header-link-active' : 'theme-header-link'}
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
              className="theme-header-contact text-sm transition"
            >
              info@areaimmobiliare.com
            </a>

            <a
              href="tel:035221206"
              className="theme-header-phone rounded-full border px-4 py-2 text-sm transition"
            >
              035 221206
            </a>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="theme-mobile-toggle flex h-11 w-11 items-center justify-center rounded-full border transition"
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            >
              <div className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-5 transition ${
                    mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                  style={{ background: 'var(--site-text)' }}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[2px] w-5 transition ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                  style={{ background: 'var(--site-text)' }}
                />
                <span
                  className={`absolute left-0 top-[14px] h-[2px] w-5 transition ${
                    mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                  style={{ background: 'var(--site-text)' }}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            aria-label="Chiudi menu mobile"
          />

          <div className="theme-mobile-panel absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Image
                src="/images/brand/areaimmobiliare.png"
                alt="Area Immobiliare"
                width={150}
                height={48}
                className="site-header-logo h-[42px] w-auto object-contain"
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="theme-mobile-toggle flex h-10 w-10 items-center justify-center rounded-full border text-xl"
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
                    className={active ? 'theme-mobile-link-active' : 'theme-mobile-link'}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div
              className="mt-8 h-px w-full"
              style={{ background: 'var(--site-border)' }}
            />

            <div className="mt-8 space-y-3 text-sm">
              <a
                href="mailto:info@areaimmobiliare.com"
                className="theme-mobile-link block"
              >
                info@areaimmobiliare.com
              </a>

              <a
                href="tel:035221206"
                className="theme-mobile-link block"
              >
                035 221206
              </a>

              <Link href="/privacy" className="theme-mobile-link block">
                Privacy Policy
              </Link>

              <Link href="/cookie" className="theme-mobile-link block">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}