'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/shared/ThemeToggle'

const links = [
  { href: '/', label: 'Home' },
  { href: '/immobili', label: 'Immobili' },
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/contatti', label: 'Contatti' },
]

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLight, setIsLight] = useState(false)

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

  useEffect(() => {
    const syncTheme = () => {
      setIsLight(document.documentElement.getAttribute('data-theme') === 'light')
    }

    syncTheme()

    const observer = new MutationObserver(syncTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <header className="site-header-solid sticky top-0 z-[120] border-b border-[var(--site-border)]">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              width={190}
              height={60}
              priority
              className={`h-[50px] w-auto object-contain md:h-[54px] ${
                isLight ? 'opacity-95' : 'brightness-0 invert opacity-95'
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
                    active
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
              className="text-sm text-[var(--site-text-muted)] transition hover:text-[var(--site-text)]"
            >
              info@areaimmobiliare.com
            </a>

            <a
              href="tel:035221206"
              className="rounded-full border border-[var(--site-border)] px-4 py-2 text-sm text-[var(--site-text)] transition hover:border-[var(--site-border-strong)]"
            >
              035 221206
            </a>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:opacity-95"
              aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
            >
              <div className="relative h-4 w-5">
                <span
                  className={`absolute left-0 top-0 h-[2px] w-5 bg-current transition ${
                    mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-[7px] h-[2px] w-5 bg-current transition ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 top-[14px] h-[2px] w-5 bg-current transition ${
                    mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[140] md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Chiudi menu mobile"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-[var(--site-border)] bg-[var(--site-bg-soft)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Image
                src="/images/brand/areaimmobiliare.png"
                alt="Area Immobiliare"
                width={150}
                height={48}
                className={`h-[42px] w-auto object-contain ${
                  isLight ? 'opacity-95' : 'brightness-0 invert opacity-95'
                }`}
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-xl text-[var(--site-text)]"
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
                      active
                        ? 'theme-button-primary'
                        : 'theme-button-secondary'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 h-px w-full bg-[var(--site-border)]" />

            <div className="mt-8 space-y-3 text-sm text-[var(--site-text-soft)]">
              <a
                href="mailto:info@areaimmobiliare.com"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:opacity-95"
              >
                info@areaimmobiliare.com
              </a>

              <a
                href="tel:035221206"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:opacity-95"
              >
                035 221206
              </a>

              <Link
                href="/privacy"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:opacity-95"
              >
                Privacy Policy
              </Link>

              <Link
                href="/cookie"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:opacity-95"
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