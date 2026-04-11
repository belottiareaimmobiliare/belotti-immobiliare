'use client'

import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Footer from '@/components/public/Footer'
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function segment(progress: number, start: number, end: number) {
  return clamp((progress - start) / (end - start), 0, 1)
}

function SearchBoxFallback() {
  return <div className="p-6 text-white/55">Caricamento ricerca...</div>
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

  const searchHold = segment(progress, 0.0, 0.58)
  const searchFade = segment(progress, 0.58, 0.78)

  const panelCompact = segment(progress, 0.60, 0.72)
  const panelRise = segment(progress, 0.68, 0.82)
  const panelReadableHold = segment(progress, 0.82, 0.9)
  const panelFade = segment(progress, 0.9, 0.96)

  const footerShellRise = segment(progress, 0.94, 0.985)
  const footerIn = segment(progress, 0.965, 1)

  const searchOpacity = 1 - searchFade
  const searchTranslateY = -(searchFade * 72)

  const panelsOpacity = 1 - panelFade
  const panelsTranslateY = -(panelRise * 160 + panelReadableHold * 130)

  const brickGap = 34 - panelCompact * 14

  const footerShellOpacity = footerShellRise
  const footerShellTranslateY = 100 - footerShellRise * 100

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
      <section className="bg-[linear-gradient(180deg,#f4efe5_0%,#efe8da_45%,#e7dece_72%,#010409_100%)] px-4 py-5">
        <div className="rounded-[30px] border border-white/30 bg-white/[0.20] shadow-[0_28px_90px_rgba(0,0,0,0.14)] backdrop-blur-xl">
          <Suspense fallback={<SearchBoxFallback />}>
            <HomeSearchBoxMobile />
          </Suspense>
        </div>

        <div className="mt-6 space-y-5">
          {panels.map((panel) => (
            <article
              key={panel.title}
              className="rounded-[24px] border border-white/30 bg-white/[0.20] px-5 py-6 shadow-[0_18px_40px_rgba(0,0,0,0.10)] backdrop-blur-xl"
            >
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/55">
                {panel.eyebrow}
              </p>

              <h3 className="mt-4 text-[2rem] font-semibold leading-tight text-[#1f1a16]">
                {panel.title}
              </h3>

              <p className="mt-4 text-sm leading-7 text-black/65">
                {panel.text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 -mx-4 bg-[#010409]">
          <Footer />
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      className="relative h-[430vh] bg-[linear-gradient(180deg,#f4efe5_0%,#efe8da_30%,#e8e0d0_58%,#010409_100%)]"
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
            <div className="overflow-hidden rounded-[36px] border border-white/30 bg-white/[0.16] shadow-[0_28px_90px_rgba(0,0,0,0.18)] backdrop-blur-xl">
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
                  className={`${panel.className} rounded-[28px] border border-white/30 bg-white/[0.20] px-7 py-8 shadow-[0_20px_50px_rgba(0,0,0,0.10)] backdrop-blur-xl transition-[transform] duration-200 md:px-8 md:py-9`}
                >
                  <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-black/55">
                    {panel.eyebrow}
                  </p>

                  <h3 className="mt-5 max-w-[980px] text-[2rem] font-semibold leading-tight text-[#1f1a16] xl:text-[2.45rem]">
                    {panel.title}
                  </h3>

                  <p className="mt-5 max-w-[980px] text-base leading-8 text-black/65">
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
              pointerEvents: footerShellOpacity > 0.08 ? 'auto' : 'none',
            }}
            className="absolute inset-x-0 bottom-0 z-10 transition-[opacity,transform] duration-200"
          >
            <div
              style={{
                opacity: footerIn,
                transform: `translate3d(0, ${28 - footerIn * 28}px, 0)`,
              }}
              className="transition-[opacity,transform] duration-200"
            >
              <Footer />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}