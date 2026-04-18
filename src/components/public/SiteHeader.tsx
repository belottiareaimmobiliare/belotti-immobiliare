'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import ThemeToggle from '@/components/shared/ThemeToggle'

const links = [
  { href: '/', label: 'Home' },
  { href: '/immobili', label: 'Immobili' },
  { href: '/news', label: 'News' },
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

            <a
              href="https://www.facebook.com/profile.php?id=61569251094453"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook Area Immobiliare | Consigli Immobiliari e dintorni"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface)]"
              title="Area Immobiliare | Consigli Immobiliari e dintorni"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5 fill-current"
              >
                <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
              </svg>
            </a>

            <a
              href="https://www.tiktok.com/@consigli.immobili"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok Consigli Immobiliari AI"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:border-[var(--site-border-strong)] hover:bg-[var(--site-surface)]"
              title="Consigli Immobiliari AI"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5 fill-current"
              >
                <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
              </svg>
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
                      active ? 'theme-button-primary' : 'theme-button-secondary'
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

              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/profile.php?id=61569251094453"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook Area Immobiliare | Consigli Immobiliari e dintorni"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:opacity-95"
                  title="Area Immobiliare | Consigli Immobiliari e dintorni"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
                  </svg>
                </a>

                <a
                  href="https://www.tiktok.com/@consigli.immobili"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="TikTok Consigli Immobiliari AI"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:opacity-95"
                  title="Consigli Immobiliari AI"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 fill-current"
                  >
                    <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
                  </svg>
                </a>
              </div>

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