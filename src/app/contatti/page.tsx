'use client'

import { useEffect, useState } from 'react'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import ContattiHeroDecoration from '@/components/public/ContattiHeroDecoration'
import { readCookiePreferences } from '@/lib/cookie-consent'
import {
  CONTACTS_CONTENT_KEY,
  defaultContactsContent,
  type ContactsContent,
} from '@/lib/site-content'

const googleMapsQuery = encodeURIComponent('Via A. Locatelli 62, 24121 Bergamo')
const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="10" height="10" rx="2" />
      <path d="M5 15V7a2 2 0 0 1 2-2h8" />
    </svg>
  )
}

export default function ContattiPage() {
  const [content, setContent] = useState<ContactsContent>(defaultContactsContent)
  const [canLoadExternalMap, setCanLoadExternalMap] = useState(false)
  const [copiedField, setCopiedField] = useState<'phone' | 'email' | null>(null)

  useEffect(() => {
    let active = true

    async function loadContent() {
      try {
        const response = await fetch(`/api/site-content?key=${CONTACTS_CONTENT_KEY}`, {
          cache: 'no-store',
        })

        if (!response.ok) return

        const data = (await response.json()) as ContactsContent

        if (active) {
          setContent({
            ...defaultContactsContent,
            ...data,
          })
        }
      } catch {
        if (active) {
          setContent(defaultContactsContent)
        }
      }
    }

    loadContent()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const syncPreferences = () => {
      const preferences = readCookiePreferences()

      if (!preferences) {
        setCanLoadExternalMap(false)
        return
      }

      setCanLoadExternalMap(
        preferences.analytics === true || preferences.marketing === true
      )
    }

    syncPreferences()

    window.addEventListener('cookie-preferences-updated', syncPreferences)

    return () => {
      window.removeEventListener('cookie-preferences-updated', syncPreferences)
    }
  }, [])

  const handleOpenCookieBanner = () => {
    window.dispatchEvent(new Event('open-cookie-banner'))
  }

  const handleCopy = async (value: string, field: 'phone' | 'email') => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      window.setTimeout(() => setCopiedField(null), 1800)
    } catch {
      setCopiedField(null)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <ContattiHeroDecoration />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            {content.heroOverline}
          </p>

          <h1 className="mt-4 text-4xl font-semibold text-[var(--site-text)] md:text-5xl">
            {content.heroTitle}
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
            {content.heroSubtitle}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <div className="theme-panel rounded-[30px] border p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                Recapiti
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href={`tel:${content.phoneHref}`}
                      className="min-w-0 flex-1 transition hover:opacity-90"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                        Telefono
                      </p>
                      <p className="mt-2 text-sm text-[var(--site-text-soft)]">
                        {content.phoneLabel}
                      </p>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy(content.phoneLabel, 'phone')}
                      className="theme-button-secondary liquid-button inline-flex h-10 w-10 items-center justify-center rounded-xl transition"
                      aria-label="Copia numero di telefono"
                      title="Copia numero"
                    >
                      <CopyIcon />
                    </button>
                  </div>

                  {copiedField === 'phone' && (
                    <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">
                      Numero copiato
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <a
                      href="mailto:info@areaimmobiliare.com"
                      className="min-w-0 flex-1 transition hover:opacity-90"
                    >
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                        Email
                      </p>
                      <p className="mt-2 break-all text-sm text-[var(--site-text-soft)]">
                        info@areaimmobiliare.com
                      </p>
                    </a>

                    <button
                      type="button"
                      onClick={() => handleCopy('info@areaimmobiliare.com', 'email')}
                      className="theme-button-secondary liquid-button inline-flex h-10 w-10 items-center justify-center rounded-xl transition"
                      aria-label="Copia email"
                      title="Copia email"
                    >
                      <CopyIcon />
                    </button>
                  </div>

                  {copiedField === 'email' && (
                    <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-300">
                      Email copiata
                    </p>
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Indirizzo
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--site-text-soft)]">
                    Via A. Locatelli 62
                    <br />
                    24121 Bergamo
                  </p>
                </div>
              </div>

              <a
                href={googleMapsHref}
                target="_blank"
                rel="noreferrer"
                className="theme-button-primary liquid-button mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>{content.mapOpenLabel}</span>
              </a>
            </div>

            <div className="rounded-[30px] border border-[#c8a24a] bg-[#dff3ff] p-7 text-black shadow-[0_18px_50px_rgba(15,59,102,0.10)]">
              <p className="text-xs uppercase tracking-[0.24em] text-black/55">
                {content.ownerCtaOverline}
              </p>

              <h2 className="mt-3 text-xl font-semibold text-black">
                {content.ownerCtaTitle}
              </h2>

              <p className="mt-4 text-sm leading-7 text-black/70">
                {content.ownerCtaText}
              </p>

              <a
                href={`tel:${content.phoneHref}`}
                className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-[#c8a24a] bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1f2937]"
              >
                <span>{content.ownerCtaButtonLabel}</span>
              </a>
            </div>

          </aside>

          <div className="space-y-5">
            <section className="theme-panel self-start rounded-[30px] border p-4 md:p-5">
              <div className="overflow-hidden rounded-[24px] border border-[var(--site-border)]">
              {canLoadExternalMap ? (
                <iframe
                  title="Mappa Area Immobiliare"
                  src={`https://www.google.com/maps?q=${googleMapsQuery}&z=16&output=embed`}
                  className="h-[620px] w-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              ) : (
                <div className="flex h-[620px] flex-col items-center justify-center px-6 text-center">
                  <p className="text-sm uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                    {content.mapBlockedOverline}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
                    {content.mapBlockedTitle}
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--site-text-muted)]">
                    {content.mapBlockedText}
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenCookieBanner}
                      className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
                    >
                      <span>{content.mapManageCookiesLabel}</span>
                    </button>

                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm transition"
                    >
                      <span>{content.mapOpenLabel}</span>
                    </a>
                  </div>
                </div>
              )}
              </div>
            </section>

            <div className="theme-panel rounded-[30px] border p-7">
              <h2 className="text-xl font-semibold text-[var(--site-text)]">
                {content.directBoxTitle}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                {content.directBoxText}
              </p>
            </div>
          </div>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}
