'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/immobili', label: 'Immobili' },
  { href: '/chi-siamo', label: 'Chi siamo' },
  { href: '/contatti', label: 'Contatti' },
]

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 1.8v2.4" />
      <path d="M12 19.8v2.4" />
      <path d="M1.8 12h2.4" />
      <path d="M19.8 12h2.4" />
      <path d="M4.2 4.2l1.7 1.7" />
      <path d="M18.1 18.1l1.7 1.7" />
      <path d="M18.1 5.9l1.7-1.7" />
      <path d="M4.2 19.8l1.7-1.7" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 15.2A8.8 8.8 0 1 1 12.8 4a7.1 7.1 0 0 0 7.2 11.2Z" />
    </svg>
  )
}

export default function SiteHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const syncTheme = () => {
      const current = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
      setTheme(current)
    }

    syncTheme()
    window.addEventListener('theme-changed', syncTheme as EventListener)

    return () => {
      window.removeEventListener('theme-changed', syncTheme as EventListener)
    }
  }, [])

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

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = nextTheme
    localStorage.setItem('site-theme', nextTheme)
    setTheme(nextTheme)
    window.dispatchEvent(new Event('theme-changed'))
  }

  const headerClass =
    theme === 'light'
      ? 'sticky top-0 z-50 border-b border-[var(--site-border)] bg-[rgba(245,239,229,0.88)] backdrop-blur-xl text-[var(--site-text)]'
      : 'sticky top-0 z-50 border-b border-white/10 bg-[#050b16]/78 backdrop-blur-xl text-white'

  const mobilePanelClass =
    theme === 'light'
      ? 'absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-[var(--site-border)] bg-[var(--site-bg)] p-6 shadow-2xl'
      : 'absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-white/10 bg-[#07111d] p-6 shadow-2xl'

  return (
    <>
      <header className={headerClass}>
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              width={190}
              height={60}
              priority
              className={`h-[50px] w-auto object-contain md:h-[54px] ${
                theme === 'light' ? '' : 'brightness-0 invert opacity-95'
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
                      : 'text-[var(--site-text-soft)] hover:text-[var(--site-text)]'
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                theme === 'light'
                  ? 'border-[#e2c98c] bg-white text-[#c79a2b] shadow-[0_0_0_1px_rgba(199,154,43,0.08)]'
                  : 'border-white/12 bg-white/5 text-white hover:bg-white/10'
              }`}
              aria-label={theme === 'light' ? 'Attiva tema scuro' : 'Attiva tema chiaro'}
            >
              {theme === 'light' ? <SunIcon /> : <MoonIcon />}
            </button>

            <a
              href="mailto:info@areaimmobiliare.com"
              className="text-sm text-[var(--site-text-soft)] transition hover:text-[var(--site-text)]"
            >
              info@areaimmobiliare.com
            </a>

            <a
              href="tel:035221206"
              className="rounded-full border border-[var(--site-border)] px-4 py-2 text-sm text-[var(--site-text)] transition hover:bg-[var(--site-surface-2)]"
            >
              035 221206
            </a>
          </div>

          <div className="flex items-center gap-3 md:hidden">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition ${
                theme === 'light'
                  ? 'border-[#e2c98c] bg-white text-[#c79a2b]'
                  : 'border-white/12 bg-white/5 text-white'
              }`}
              aria-label={theme === 'light' ? 'Attiva tema scuro' : 'Attiva tema chiaro'}
            >
              {theme === 'light' ? <SunIcon /> : <MoonIcon />}
            </button>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] transition hover:bg-[var(--site-surface-3)]"
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
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            aria-label="Chiudi menu mobile"
          />

          <div className={mobilePanelClass}>
            <div className="flex items-center justify-between">
              <Image
                src="/images/brand/areaimmobiliare.png"
                alt="Area Immobiliare"
                width={150}
                height={48}
                className={`h-[42px] w-auto object-contain ${
                  theme === 'light' ? '' : 'brightness-0 invert opacity-95'
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
                        ? 'bg-[var(--site-text)] text-[var(--site-bg)]'
                        : 'border border-[var(--site-border)] bg-[var(--site-surface-2)] text-[var(--site-text)] hover:bg-[var(--site-surface-3)]'
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
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:bg-[var(--site-surface-3)]"
              >
                info@areaimmobiliare.com
              </a>

              <a
                href="tel:035221206"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:bg-[var(--site-surface-3)]"
              >
                035 221206
              </a>

              <Link
                href="/privacy"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:bg-[var(--site-surface-3)]"
              >
                Privacy Policy
              </Link>

              <Link
                href="/cookie"
                className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-3 transition hover:bg-[var(--site-surface-3)]"
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