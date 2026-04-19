'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

const slides = [
  '/images/bergamo-1.jpg',
  '/images/bergamo-2.jpg',
  '/images/bergamo-3.jpg',
]

export default function HomeHero() {
  const [current, setCurrent] = useState(0)
  const [previous, setPrevious] = useState<number | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const interval = window.setInterval(() => {
      setPrevious(current)
      setCurrent((prev) => (prev + 1) % slides.length)
      setIsAnimating(true)

      window.setTimeout(() => {
        setPrevious(null)
        setIsAnimating(false)
      }, 1100)
    }, 5200)

    return () => window.clearInterval(interval)
  }, [current])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const textStyle = useMemo(() => {
    const progress = Math.min(scrollY / 760, 1)
    const translateY = progress * -82
    const opacity = 1 - progress * 0.92

    return {
      transform: `translate3d(0, ${translateY}px, 0)`,
      opacity: Math.max(opacity, 0),
    }
  }, [scrollY])

  const statsStyle = useMemo(() => {
    const progress = Math.min(scrollY / 1450, 1)
    const translateY = progress * -62
    const fade = Math.max((progress - 0.88) / 0.12, 0)
    const opacity = 1 - fade

    return {
      transform: `translate3d(0, ${translateY}px, 0)`,
      opacity: Math.max(opacity, 0),
    }
  }, [scrollY])

  const visualStyle = useMemo(() => {
    const progress = Math.min(scrollY / 1500, 1)
    const translateY = progress * -68
    const scale = 1 - progress * 0.035
    const fade = Math.max((progress - 0.86) / 0.14, 0)
    const opacity = 1 - fade

    return {
      transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
      opacity: Math.max(opacity, 0),
    }
  }, [scrollY])

  return (
    <section className="relative min-h-[92vh] overflow-hidden border-b border-white/10 bg-[#09101b]">
      <div className="absolute inset-0">
        <div className="absolute inset-0 overflow-hidden">
          {previous !== null && (
            <div
              className={`absolute inset-0 bg-cover bg-center ${
                isAnimating ? 'animate-hero-slide-out-left' : ''
              }`}
              style={{ backgroundImage: `url('${slides[previous]}')` }}
            />
          )}

          <div
            className={`absolute inset-0 bg-cover bg-center ${
              isAnimating
                ? 'animate-hero-slide-in-right'
                : 'translate-x-0 opacity-100'
            }`}
            style={{ backgroundImage: `url('${slides[current]}')` }}
          />
        </div>

        <div className="absolute inset-0 bg-black/18" />
        <div className="absolute inset-0 bg-white/[0.07] backdrop-blur-[3px]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.10)_0%,rgba(255,255,255,0.04)_38%,rgba(255,255,255,0.08)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.10),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.06),transparent_22%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,10,18,0.18)_0%,rgba(4,10,18,0.10)_35%,rgba(4,10,18,0.22)_100%)]" />
      </div>

      <div className="relative grid min-h-[92vh] w-full items-center gap-12 px-6 py-12 xl:grid-cols-[1.15fr_0.85fr] xl:px-10 2xl:px-14">
        <div className="max-w-[920px]">
          <div
            style={textStyle}
            className="transition-[opacity,transform] duration-150"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.34em] text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.72)]">
              Area Immobiliare dal 1980
            </p>

            <h1 className="mt-6 max-w-[900px] text-5xl font-semibold leading-[0.98] text-white md:text-7xl xl:text-[5.5rem]">
              Vendere, comprare o affittare casa e terreni a Bergamo con più chiarezza e meno stress.
            </h1>

            <p className="mt-7 max-w-[760px] text-base leading-8 text-white/88 [text-shadow:0_2px_4px_rgba(0,0,0,0.6)] md:text-lg xl:text-[1.15rem]">
              Ogni scelta immobiliare merita tempo, competenza e informazioni corrette:
              per questo lavoriamo in modo chiaro, concreto e vicino alle persone.
            </p>

            <div className="mt-8 hidden flex-wrap gap-3 md:flex">
              <Link
                href="/immobili"
                className="rounded-2xl bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                Esplora gli immobili
              </Link>

              <Link
                href="/immobili/mappa-area"
                className="rounded-2xl border border-white/20 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/16"
              >
                Disegna la tua area
              </Link>

              <Link
                href="/chi-siamo"
                className="rounded-2xl border border-white/18 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/8 hover:text-white"
              >
                Scopri Area Immobiliare
              </Link>
            </div>
          </div>

          <div
            style={statsStyle}
            className="mt-10 grid gap-4 md:grid-cols-3 transition-[opacity,transform] duration-150"
          >
            <div className="rounded-[24px] border border-white/20 bg-white/[0.13] px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-md">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/86 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
                Storia
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">Dal 1980</p>
            </div>

            <div className="rounded-[24px] border border-white/20 bg-white/[0.13] px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-md">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/86 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
                Territorio
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                Bergamo e provincia
              </p>
            </div>

            <div className="rounded-[24px] border border-white/20 bg-white/[0.13] px-5 py-5 shadow-[0_10px_24px_rgba(0,0,0,0.16)] backdrop-blur-md">
              <p className="text-[12px] font-semibold uppercase tracking-[0.22em] text-white/86 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
                Metodo
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                Analisi e verifica
              </p>
            </div>
          </div>
        </div>

        <div
          style={visualStyle}
          className="hidden xl:flex xl:justify-end xl:self-end transition-[opacity,transform] duration-150"
        >
          <div className="relative w-full max-w-[540px]">
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-white/18 blur-3xl" />
            <div className="absolute -right-6 bottom-4 h-40 w-40 rounded-full bg-white/12 blur-3xl" />

            <div className="relative overflow-hidden rounded-[34px] border border-white/20 bg-white/[0.08] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.26)] backdrop-blur-md">
              <div className="absolute inset-0 bg-white/[0.06]" />

              <div className="relative grid gap-4">
                <div className="overflow-hidden rounded-[26px] border border-white/18">
                  <div
                    className="h-[240px] w-full bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/bergamo-map.jpg')" }}
                  />
                </div>

                <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-[24px] border border-white/18 bg-white/[0.10] p-4 backdrop-blur-sm">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-white/82 [text-shadow:0_1px_2px_rgba(0,0,0,0.65)]">
                      Ricerca su mappa
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Zone precise
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/76">
                      Disegna l’area che ti interessa e concentrati solo sugli
                      immobili coerenti con la tua ricerca.
                    </p>
                  </div>

                  <Link
                    href="/immobili/mappa-area"
                    className="group relative overflow-hidden rounded-[26px] border border-white/18 bg-white/[0.10] shadow-[0_10px_28px_rgba(0,0,0,0.16)] backdrop-blur-sm transition hover:border-white/24"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center opacity-100"
                      style={{ backgroundImage: "url('/images/bergamo-map.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-white/68 backdrop-blur-[4px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.42)_0%,rgba(255,255,255,0.18)_100%)]" />

                    <div className="relative flex h-full min-h-[220px] flex-col justify-between p-5">
                      <div>
                        <p className="text-[12px] font-semibold uppercase tracking-[0.2em] text-black/60">
                          Mappa interattiva
                        </p>
                        <p className="mt-3 text-[2rem] font-semibold leading-tight text-black">
                          Vai alla mappa
                        </p>
                        <p className="mt-3 max-w-[220px] text-sm leading-7 text-black/68">
                          Apri la vista mappa completa e disegna la zona che vuoi analizzare.
                        </p>
                      </div>

                      <div className="mt-6 inline-flex w-fit items-center rounded-full border border-black/10 bg-black px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,0.18)] transition group-hover:translate-x-0.5">
                        Apri
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}