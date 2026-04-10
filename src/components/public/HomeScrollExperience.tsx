'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
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

export default function HomeScrollExperience() {
  const sectionRef = useRef<HTMLElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
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
  }, [])

  const searchHold = segment(progress, 0.0, 0.34)
  const searchFade = segment(progress, 0.34, 0.46)

  const panelCompact = segment(progress, 0.42, 0.52)
  const panelRise = segment(progress, 0.46, 0.62)
  const panelReadableHold = segment(progress, 0.62, 0.74)
  const panelFade = segment(progress, 0.74, 0.82)

  const footerShellRise = segment(progress, 0.82, 0.9)

  const partnersIn = segment(progress, 0.88, 0.92)
  const brandIn = segment(progress, 0.91, 0.945)
  const navIn = segment(progress, 0.935, 0.965)
  const servicesIn = segment(progress, 0.955, 0.982)
  const contactsIn = segment(progress, 0.972, 0.995)

  const searchOpacity = 1 - searchFade
  const searchTranslateY = -(searchHold * 4 + searchFade * 72)

  const panelsOpacity = 1 - panelFade
  const panelsTranslateY = -(panelRise * 180 + panelReadableHold * 210)

  const brickGap = 34 - panelCompact * 14

  const footerShellOpacity = footerShellRise
  const footerShellTranslateY = 130 - footerShellRise * 130

  const panelStyles = useMemo(() => {
    return panels.map((panel) => {
      const x = panel.initialX * (1 - panelCompact)
      const y =
        panel.initialY * (1 - panelCompact) -
        panelRise * 120 -
        panelReadableHold * 26 -
        panelFade * 44

      const scale = 0.965 + panelCompact * 0.035

      return {
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
      }
    })
  }, [panelCompact, panelRise, panelReadableHold, panelFade])

  return (
    <section
      ref={sectionRef}
      className="relative h-[430vh] bg-[linear-gradient(180deg,#071120_0%,#071524_26%,#06111d_54%,#03070e_82%,#010409_100%)]"
    >
      <div className="sticky top-[78px] h-[calc(100vh-78px)] overflow-hidden">
        <div className="absolute inset-0 px-6 py-6 xl:px-10 2xl:px-14">
          <div
            style={{
              opacity: searchOpacity,
              transform: `translate3d(0, ${searchTranslateY}px, 0)`,
            }}
            className="transition-[opacity,transform] duration-200"
          >
            <div className="overflow-hidden rounded-[36px] border border-white/10 bg-[rgba(58,70,94,0.72)] shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="hidden md:block">
                <HomeSearchBoxDesktop />
              </div>

              <div className="md:hidden">
                <HomeSearchBoxMobile />
              </div>
            </div>
          </div>

          <div
            style={{
              opacity: panelsOpacity,
              transform: `translate3d(0, ${panelsTranslateY}px, 0)`,
            }}
            className="mt-8 transition-[opacity,transform] duration-200"
          >
            <div
              className="grid grid-cols-1 xl:grid-cols-12"
              style={{ gap: `${brickGap}px` }}
            >
              {panels.map((panel, index) => (
                <article
                  key={panel.title}
                  style={panelStyles[index]}
                  className={`${panel.className} rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,18,35,0.98)_0%,rgba(3,11,24,0.98)_100%)] px-7 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-[transform] duration-200 md:px-8 md:py-9`}
                >
                  <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">
                    {panel.eyebrow}
                  </p>

                  <h3 className="mt-5 max-w-[980px] text-[2rem] font-semibold leading-tight text-white xl:text-[2.45rem]">
                    {panel.title}
                  </h3>

                  <p className="mt-5 max-w-[980px] text-base leading-8 text-white/62">
                    {panel.text}
                  </p>
                </article>
              ))}
            </div>
          </div>

          <div
            style={{
              opacity: footerShellOpacity,
              transform: `translate3d(0, ${footerShellTranslateY}px, 0)`,
            }}
            className="absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-200"
          >
            <section className="w-full bg-[#010409] px-6 py-16 xl:px-10 2xl:px-14">
              <div
                style={{
                  opacity: partnersIn,
                  transform: `translate3d(0, ${34 - partnersIn * 34}px, 0)`,
                }}
                className="transition-[opacity,transform] duration-200"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/30">
                  Partners
                </p>

                <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                  {partnerLogos.map((partner) => (
                    <div
                      key={partner.label}
                      className="flex min-h-[96px] items-center justify-center border-b border-white/10 pb-4 md:border-b-0 md:pb-0"
                    >
                      <img
                        src={partner.src}
                        alt={partner.label}
                        className="max-h-[50px] w-auto max-w-[200px] object-contain opacity-95"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 h-px w-full bg-white/10" />

              <div className="mt-12 grid gap-12 xl:grid-cols-4">
                <div
                  style={{
                    opacity: brandIn,
                    transform: `translate3d(0, ${34 - brandIn * 34}px, 0)`,
                  }}
                  className="transition-[opacity,transform] duration-200"
                >
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                    Brand
                  </p>
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

                <div
                  style={{
                    opacity: navIn,
                    transform: `translate3d(0, ${34 - navIn * 34}px, 0)`,
                  }}
                  className="transition-[opacity,transform] duration-200"
                >
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                    Navigazione
                  </p>
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
                  </div>
                </div>

                <div
                  style={{
                    opacity: servicesIn,
                    transform: `translate3d(0, ${34 - servicesIn * 34}px, 0)`,
                  }}
                  className="transition-[opacity,transform] duration-200"
                >
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                    Servizi
                  </p>
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

                <div
                  style={{
                    opacity: contactsIn,
                    transform: `translate3d(0, ${34 - contactsIn * 34}px, 0)`,
                  }}
                  className="transition-[opacity,transform] duration-200"
                >
                  <p className="text-[11px] uppercase tracking-[0.26em] text-white/30">
                    Contatti
                  </p>
                  <div className="mt-4 space-y-4 text-base leading-8 text-white/72">
                    <p>info@areaimmobiliare.com</p>
                    <p>035 221206</p>
                    <p>Bergamo e provincia</p>
                    <p>Ricevimento su appuntamento</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </section>
  )
}