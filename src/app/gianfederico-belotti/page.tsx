import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import SiteHeader from '@/components/public/SiteHeader'
import { getGianfedericoBelottiContent } from '@/lib/site-content.server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Gianfederico Belotti | Area Immobiliare Bergamo',
  description:
    'Gianfederico Belotti, fondatore di Area Immobiliare dal 1980 e ideatore della Borsa del mattone a Bergamo.',
}

export default async function GianfedericoBelottiPage() {
  const content = await getGianfedericoBelottiContent()

  const visibleHighlights = content.highlights.filter((item) => item.enabled)
  const visibleBoxes = content.boxes.filter((item) => item.enabled)
  const visibleMethodCards = content.methodCards.filter((item) => item.enabled)

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)]">
        <div className="absolute inset-0 opacity-40">
          <div className="absolute left-[-12%] top-[-20%] h-[420px] w-[420px] rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-[-25%] right-[-10%] h-[520px] w-[520px] rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[360px_minmax(0,1fr)] lg:items-center">
          <div className="mx-auto w-full max-w-[340px] lg:mx-0">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[34px] border border-[var(--site-border-strong)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)]">
              <Image
                src="/images/gianfederico-belotti.jpg"
                alt="Gianfederico Belotti"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
              {content.heroOverline}
            </p>

            <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--site-text)] md:text-6xl">
              {content.heroTitle}
            </h1>

            <div className="mt-6 max-w-3xl space-y-5 text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
              <p>{content.heroIntro1}</p>
              <p>{content.heroIntro2}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/immobili"
                className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>{content.primaryCtaLabel}</span>
              </Link>

              <Link
                href="/contatti"
                className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
              >
                <span>{content.secondaryCtaLabel}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {visibleHighlights.length > 0 ? (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="grid gap-4 md:grid-cols-3">
            {visibleHighlights.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="theme-panel rounded-[28px] border p-6"
              >
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-[var(--site-text-muted)]">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="space-y-8">
            {visibleBoxes.map((box, index) => (
              <div
                key={`${box.title}-${index}`}
                className="theme-panel rounded-[30px] border p-8"
              >
                <h2 className="text-2xl font-semibold text-[var(--site-text)]">
                  {box.title}
                </h2>

                <div className="mt-5 space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                  <p>{box.paragraph1}</p>
                  <p>{box.paragraph2}</p>
                </div>
              </div>
            ))}
          </article>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:h-fit">
            {visibleMethodCards.length > 0 ? (
              <div className="theme-panel rounded-[30px] border p-7">
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                  {content.methodTitle}
                </p>

                <div className="mt-5 space-y-4">
                  {visibleMethodCards.map((card, index) => (
                    <div
                      key={`${card.title}-${index}`}
                      className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4"
                    >
                      <h3 className="text-sm font-semibold text-[var(--site-text)]">
                        {card.title}
                      </h3>
                      <p className="mt-2 text-xs leading-6 text-[var(--site-text-muted)]">
                        {card.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="theme-panel rounded-[30px] border p-7">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                {content.sidebarOverline}
              </p>

              <h2 className="mt-3 text-xl font-semibold text-[var(--site-text)]">
                {content.sidebarTitle}
              </h2>

              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[var(--site-text-muted)]">
                {content.sidebarText}
              </p>

              <div className="mt-5 grid gap-3">
                <a
                  href={`tel:${content.phoneHref}`}
                  className="theme-button-secondary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
                >
                  <span>Chiama {content.phoneLabel}</span>
                </a>

                <Link
                  href="/contatti"
                  className="theme-button-primary liquid-button inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition"
                >
                  <span>{content.consultationCtaLabel}</span>
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}
