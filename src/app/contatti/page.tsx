'use client'

import { useEffect, useState } from 'react'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import { readCookiePreferences } from '@/lib/cookie-consent'

const googleMapsQuery = encodeURIComponent('Via A. Locatelli 62, 24121 Bergamo')
const googleMapsHref = `https://www.google.com/maps/search/?api=1&query=${googleMapsQuery}`

export default function ContattiPage() {
  const [canLoadExternalMap, setCanLoadExternalMap] = useState(false)

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

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            Contatti
          </p>
          <h1 className="mt-4 text-4xl font-semibold md:text-5xl text-[var(--site-text)]">
            Siamo a disposizione per informazioni e appuntamenti
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
            Per richieste su immobili, valutazioni o approfondimenti, puoi
            contattare Area Immobiliare direttamente ai recapiti qui sotto.
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
                <a
                  href="tel:035221206"
                  className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 transition hover:bg-[var(--site-surface-2)]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Telefono
                  </p>
                  <p className="mt-2 text-sm text-[var(--site-text-soft)]">035 221206</p>
                </a>

                <a
                  href="mailto:info@areaimmobiliare.com"
                  className="block rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-4 transition hover:bg-[var(--site-surface-2)]"
                >
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                    Email
                  </p>
                  <p className="mt-2 break-all text-sm text-[var(--site-text-soft)]">
                    info@areaimmobiliare.com
                  </p>
                </a>

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
                className="theme-button-primary mt-6 inline-flex w-full items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-95"
              >
                Apri su Google Maps
              </a>
            </div>

            <div className="theme-panel rounded-[30px] border p-7">
              <h2 className="text-xl font-semibold text-[var(--site-text)]">
                Un contatto diretto e professionale
              </h2>
              <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                Ogni richiesta viene valutata con attenzione, compatibilmente con
                le attività in corso e con le priorità operative dell’agenzia.
              </p>
            </div>
          </aside>

          <section className="theme-panel rounded-[30px] border p-4 md:p-5">
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
                    Contenuto esterno
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
                    La mappa è disattivata finché non scegli i cookie facoltativi
                  </h3>
                  <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--site-text-muted)]">
                    Per visualizzare la mappa incorporata di Google è necessario
                    abilitare i cookie facoltativi per questo contenuto. In alternativa
                    puoi aprire direttamente la posizione su Google Maps con il pulsante dedicato.
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={handleOpenCookieBanner}
                      className="theme-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition hover:opacity-95"
                    >
                      Gestisci cookie per visualizzare la mappa
                    </button>

                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noreferrer"
                      className="theme-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm transition"
                    >
                      Apri su Google Maps
                    </a>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}