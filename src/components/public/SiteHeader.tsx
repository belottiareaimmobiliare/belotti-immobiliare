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
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050b16]/78 backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-4 py-4 md:px-6 xl:px-10 2xl:px-14">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/brand/areaimmobiliare.png"
              alt="Area Immobiliare"
              width={190}
              height={60}
              priority
              className="h-[50px] w-auto object-contain brightness-0 invert opacity-95 md:h-[54px]"
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

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10 md:hidden"
            aria-label={mobileMenuOpen ? 'Chiudi menu' : 'Apri menu'}
          >
            <div className="relative h-4 w-5">
              <span
                className={`absolute left-0 top-0 h-[2px] w-5 bg-white transition ${
                  mobileMenuOpen ? 'translate-y-[7px] rotate-45' : ''
                }`}
              />
              <span
                className={`absolute left-0 top-[7px] h-[2px] w-5 bg-white transition ${
                  mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <span
                className={`absolute left-0 top-[14px] h-[2px] w-5 bg-white transition ${
                  mobileMenuOpen ? '-translate-y-[7px] -rotate-45' : ''
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            aria-label="Chiudi menu mobile"
          />

          <div className="absolute right-0 top-0 h-full w-[86%] max-w-[360px] border-l border-white/10 bg-[#07111d] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <Image
                src="/images/brand/areaimmobiliare.png"
                alt="Area Immobiliare"
                width={150}
                height={48}
                className="h-[42px] w-auto object-contain brightness-0 invert opacity-95"
              />

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white"
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
                        ? 'bg-white text-black'
                        : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="mt-8 h-px w-full bg-white/10" />

            <div className="mt-8 space-y-3 text-sm text-white/72">
              <a
                href="mailto:info@areaimmobiliare.com"
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                info@areaimmobiliare.com
              </a>

              <a
                href="tel:035221206"
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                035 221206
              </a>

              <Link
                href="/privacy"
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
              >
                Privacy Policy
              </Link>

              <Link
                href="/cookie"
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/10"
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