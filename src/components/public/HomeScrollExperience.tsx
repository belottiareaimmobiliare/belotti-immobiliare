'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import HomeSearchBoxDesktop from '@/components/public/HomeSearchBoxDesktop'
import HomeSearchBoxMobile from '@/components/public/HomeSearchBoxMobile'

const panels = [
  {
    eyebrow: 'Valutazione',
    title: 'Il valore di un immobile non si indovina. Si legge bene.',
    text:
      'Prezzo richiesto, qualità reale, posizione, contesto e margine di trattativa devono stare in equilibrio. Una buona operazione nasce prima dalla lettura giusta del mercato, poi dalla visita.',
    className: 'xl:col-span-7',
    initialY: 62,
    initialX: -34,
  },
  {
    eyebrow: 'Verifica',
    title: 'Documenti, conformità e contesto vanno controllati davvero.',
    text:
      'Ogni immobile va osservato con attenzione, senza fretta e senza scorciatoie. Il dettaglio giusto evita problemi, perdite di tempo e decisioni sbagliate.',
    className: 'xl:col-span-5',
    initialY: 26,
    initialX: 30,
  },
  {
    eyebrow: 'Territorio',
    title: 'Bergamo letta con esperienza, non per slogan.',
    text:
      'Città, hinterland, zone più richieste e aree con maggior potenziale vengono interpretate con sensibilità concreta e conoscenza del territorio. Una lettura locale fatta bene cambia davvero la qualità della ricerca.',
    className: 'xl:col-span-12',
    initialY: 78,
    initialX: 0,
  },
]

const partnerLogos = [
  {
    label: 'Immobiliare.it',
    src: '/images/partners/transparent-logo-immobiliareit.png',
  },
  {
    label: 'Casa.it',
    src: '/images/partners/transparent-logo-casait.png',
  },
  {
    label: 'Idealista',
    src: '/images/partners/transparent-logo-idealista.png',
  },
  {
    label: 'BergamoNews',
    src: '/images/partners/transparent-logo-bergamonews.png',
  },
]

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function segment(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start), 0, 1)
}

function revealStyle(progress: number, start: number, end: number, y = 28) {
  const t = segment(progress, start, end)

  return {
    opacity: t,
    transform: `translate3d(0, ${y - t * y}px, 0)`,
  }
}

function SearchBoxFallback() {
  return <div className="p-6 text-[var(--site-text-muted)]">Caricamento ricerca...</div>
}

export default function HomeScrollExperience() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateDevice = () => {
      setIsMobile(window.innerWidth < 768)
    }

    updateDevice()
    window.addEventListener('resize', updateDevice)

    return () => {
      window.removeEventListener('resize', updateDevice)
    }
  }, [])

  useEffect(() => {
    if (isMobile) return

    const updateProgress = () => {
      if (!sectionRef.current) return

      const rect = sectionRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const totalScrollable = rect.height - viewportHeight

      if (totalScrollable <= 0) {
        setProgress(0)
        return
      }

      const scrolled = clamp(-rect.top, 0, totalScrollable)
      setProgress(scrolled / totalScrollable)
    }

    updateProgress()
    window.addEventListener('scroll', updateProgress, { passive: true })
    window.addEventListener('resize', updateProgress)

    return () => {
      window.removeEventListener('scroll', updateProgress)
      window.removeEventListener('resize', updateProgress)
    }
  }, [isMobile])

  const searchFade = segment(progress, 0.54, 0.76)

  const panelCompact = segment(progress, 0.53, 0.69)
  const panelRise = segment(progress, 0.6, 0.81)
  const panelReadableHold = segment(progress, 0.81, 0.9)
  const panelFade = segment(progress, 0.9, 0.965)

  const footerShellRise = segment(progress, 0.94, 0.972)
  const footerShellIn = segment(progress, 0.972, 1)

  const searchOpacity = 1 - searchFade
  const searchTranslateY = -(searchFade * 72)

  const panelsOpacity = 1 - panelFade
  const panelsTranslateY = -(panelRise * 160 + panelReadableHold * 130)

  const brickGap = 34 - panelCompact * 14

  const panelStyles = useMemo(() => {
    return panels.map((panel) => {
      const x = panel.initialX * (1 - panelCompact)
      const y =
        panel.initialY * (1 - panelCompact) -
        panelRise * 100 -
        panelReadableHold * 16 -
        panelFade * 24

      const scale = 0.97 + panelCompact * 0.03

      return {
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      }
    })
  }, [panelCompact, panelRise, panelReadableHold, panelFade])

  if (isMobile) {
    return (
      <section
        className="px-4 py-5 transition-colors duration-300"
        style={{
          background:
            'linear-gradient(180deg,var(--site-bg-soft) 0%, var(--site-bg) 38%, var(--site-bg) 72%, #010409 100%)',
        }}
      >
        <div className="theme-panel rounded-[30px] border shadow-[var(--site-card-shadow)] backdrop-blur-2xl">
          <Suspense fallback={<SearchBoxFallback />}>
            <HomeSearchBoxMobile />
          </Suspense>
        </div>

        <div className="mt-6 space-y-5">
          {panels.map((panel) => (
            <article
              key={panel.title}
              className="theme-panel rounded-[24px] border px-5 py-6 shadow-[var(--site-card-shadow)]"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                {panel.eyebrow}
              </p>

              <h3 className="mt-4 text-[2rem] font-semibold leading-tight text-[var(--site-text)]">
                {panel.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                {panel.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 -mx-4 bg-[#010409] px-6 py-14 xl:px-10 2xl:px-14">
          <p className="text-xs uppercase tracking-[0.3em] text-white/30">Partners</p>
        </div>
      </section>
    )
  }

  const footerBgOpacity = footerShellRise

  const r1 = revealStyle(footerShellIn, 0.0, 0.06)
  const r2 = revealStyle(footerShellIn, 0.06, 0.13)
  const r3 = revealStyle(footerShellIn, 0.13, 0.19)
  const r4 = revealStyle(footerShellIn, 0.19, 0.25)
  const r5 = revealStyle(footerShellIn, 0.25, 0.31)

  const r6 = revealStyle(footerShellIn, 0.34, 0.4)
  const r7 = revealStyle(footerShellIn, 0.4, 0.46)

  const r8 = revealStyle(footerShellIn, 0.49, 0.55)
  const r9 = revealStyle(footerShellIn, 0.55, 0.61)

  const r10 = revealStyle(footerShellIn, 0.64, 0.7)
  const r11 = revealStyle(footerShellIn, 0.7, 0.76)

  const r12 = revealStyle(footerShellIn, 0.79, 0.85)
  const r13 = revealStyle(footerShellIn, 0.85, 0.91)

  const r14 = revealStyle(footerShellIn, 0.93, 1)

  return (
    <section
      ref={sectionRef}
      className="relative h-[470vh] transition-colors duration-300"
      style={{
        background:
          'linear-gradient(180deg,var(--site-bg-soft) 0%, var(--site-bg) 26%, var(--site-bg) 58%, color-mix(in srgb, var(--site-bg) 78%, #010409 22%) 82%, #010409 100%)',
      }}
    >
      <div className="sticky top-[78px] h-[calc(100vh-78px)] overflow-hidden">
        <div className="absolute inset-0 px-6 py-6 xl:px-10 2xl:px-14">
          <div
            style={{
              opacity: searchOpacity,
              transform: `translate3d(0, ${searchTranslateY}px, 0)`,
              pointerEvents: searchOpacity > 0.08 ? 'auto' : 'none',
            }}
            className="relative z-30 transition-[opacity,transform] duration-200"
          >
            <div className="theme-panel overflow-hidden rounded-[36px] border shadow-[var(--site-card-shadow)] backdrop-blur-xl">
              <Suspense fallback={<SearchBoxFallback />}>
                <div className="hidden md:block">
                  <HomeSearchBoxDesktop />
                </div>
              </Suspense>
            </div>
          </div>

          <div
            style={{
              opacity: panelsOpacity,
              transform: `translate3d(0, ${panelsTranslateY}px, 0)`,
              pointerEvents: panelsOpacity > 0.08 ? 'auto' : 'none',
            }}
            className="relative z-20 mt-8 transition-[opacity,transform] duration-200"
          >
            <div
              className="grid grid-cols-1 xl:grid-cols-12"
              style={{ gap: `${brickGap}px` }}
            >
              {panels.map((panel, index) => (
                <article
                  key={panel.title}
                  style={panelStyles[index]}
                  className={`${panel.className} theme-panel rounded-[28px] border px-7 py-8 shadow-[var(--site-card-shadow)] transition-[transform] duration-200 md:px-8 md:py-9`}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                    {panel.eyebrow}
                  </p>

                  <h3 className="mt-5 max-w-[980px] text-[2rem] font-semibold leading-tight text-[var(--site-text)] xl:text-[2.45rem]">
                    {panel.title}
                  </h3>

                  <p className="mt-5 max-w-[980px] text-base leading-8 text-[var(--site-text-muted)]">
                    {panel.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div
            className="absolute inset-x-0 bottom-0 z-10 h-full pointer-events-none"
            style={{
              opacity: footerBgOpacity,
              background:
                'linear-gradient(180deg, rgba(1,4,9,0) 0%, rgba(1,4,9,0.42) 18%, rgba(1,4,9,0.78) 34%, rgba(1,4,9,0.96) 52%, #010409 68%, #010409 100%)',
            }}
          />

          <div className="absolute inset-x-0 bottom-0 z-20">
            <div className="bg-[#010409] px-6 py-14 text-white xl:px-10 2xl:px-14">
              <div style={r1} className="transition-[opacity,transform] duration-75">
                <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                  Partners
                </p>
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                {partnerLogos.map((partner, index) => {
                  const style = [r2, r3, r4, r5][index]

                  return (
                    <div
                      key={partner.label}
                      style={style}
                      className="flex min-h-[96px] items-center justify-center border-b border-white/10 pb-4 transition-[opacity,transform] duration-75 md:border-b-0 md:pb-0"
                    >
                      <img
                        src={partner.src}
                        alt={partner.label}
                        className="max-h-[70px] w-auto max-w-[200px] object-contain opacity-95"
                      />
                    </div>
                  )
                })}
              </div>

              <div className="mt-12 h-px w-full bg-white/10" />

              <div className="mt-12 grid gap-12 xl:grid-cols-4">
                <div>
                  <div style={r6} className="transition-[opacity,transform] duration-75">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                      Brand
                    </p>
                  </div>

                  <div style={r7} className="transition-[opacity,transform] duration-75">
                    <div className="mt-4">
                      <img
                        src="/images/brand/areaimmobiliare.png"
                        alt="Area Immobiliare"
                        className="max-h-[120px] w-auto object-contain brightness-0 invert opacity-95"
                      />
                    </div>
                    <p className="mt-5 max-w-[420px] text-base leading-8 text-white/58">
                      Un modo più chiaro, solido e leggibile di cercare, valutare e
                      scegliere casa a Bergamo e provincia.
                    </p>
                  </div>
                </div>

                <div>
                  <div style={r8} className="transition-[opacity,transform] duration-75">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                      Navigazione
                    </p>
                  </div>

                  <div style={r9} className="transition-[opacity,transform] duration-75">
                    <div className="mt-4 flex flex-col gap-4 text-base text-white/72">
                      <Link href="/" className="transition hover:text-white">
                        Home
                      </Link>
                      <Link href="/immobili" className="transition hover:text-white">
                        Immobili
                      </Link>
                      <Link href="/chi-siamo" className="transition hover:text-white">
                        Chi siamo
                      </Link>
                      <Link href="/contatti" className="transition hover:text-white">
                        Contatti
                      </Link>
                      <Link href="/privacy" className="transition hover:text-white">
                        Privacy Policy
                      </Link>
                      <Link href="/cookie" className="transition hover:text-white">
                        Cookie Policy
                      </Link>
                      <Link href="/preferenze-cookie" className="transition hover:text-white">
                        Preferenze cookie
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={r10} className="transition-[opacity,transform] duration-75">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                      Servizi
                    </p>
                  </div>

                  <div style={r11} className="transition-[opacity,transform] duration-75">
                    <div className="mt-4 flex flex-col gap-4 text-base text-white/72">
                      <Link
                        href="/immobili?contractType=vendita"
                        className="transition hover:text-white"
                      >
                        Vendita
                      </Link>
                      <Link
                        href="/immobili?contractType=affitto"
                        className="transition hover:text-white"
                      >
                        Affitto
                      </Link>
                      <Link
                        href="/immobili/mappa-area"
                        className="transition hover:text-white"
                      >
                        Ricerca su mappa
                      </Link>
                      <Link href="/immobili" className="transition hover:text-white">
                        Ricerca avanzata
                      </Link>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={r12} className="transition-[opacity,transform] duration-75">
                    <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                      Contatti
                    </p>
                  </div>

                  <div style={r13} className="transition-[opacity,transform] duration-75">
                    <div className="mt-4 space-y-4 text-base leading-8 text-white/72">
                      <p>AREA IMMOBILIARE SAS di Belotti Gianfederico &amp; C.</p>
                      <p>Via Antonio Locatelli 62, 24121 Bergamo</p>
                      <p>C.F. e P.IVA: 02610660165</p>
                      <p>PEC: areaimmobiliaresas@legalmail.it</p>
                      <p>REA: BG-308620</p>
                      <p>info@areaimmobiliare.com</p>
                      <p>035 221206</p>
                    </div>
                  </div>
                </div>
              </div>

              <div
                style={r14}
                className="transition-[opacity,transform] duration-75"
              >
                <div className="mt-14 h-px w-full bg-white/10" />
                <div className="mt-6 flex flex-col gap-4 text-sm text-white/42 md:flex-row md:items-center md:justify-between">
                  <p>Area Immobiliare · Tutti i diritti riservati</p>
                  <p>Bergamo · Lombardia · Italia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}