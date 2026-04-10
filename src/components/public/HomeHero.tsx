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
    const progress = Math.min(scrollY / 500, 1)
    const translateY = progress * -90
    const opacity = 1 - progress * 1.05

    return {
      transform: `translate3d(0, ${translateY}px, 0)`,
      opacity: Math.max(opacity, 0),
    }
  }, [scrollY])

  const visualStyle = useMemo(() => {
    const progress = Math.min(scrollY / 700, 1)
    const translateY = progress * 60
    const scale = 1 - progress * 0.08

    return {
      transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
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

        <div className="absolute inset-0 bg-[#06101d]/55" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.16),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(56,189,248,0.16),transparent_24%),linear-gradient(90deg,rgba(5,10,22,0.86)_0%,rgba(5,10,22,0.52)_38%,rgba(5,10,22,0.76)_100%)]" />
      </div>

      <div className="relative grid min-h-[92vh] w-full items-center gap-12 px-6 py-12 xl:grid-cols-[1.15fr_0.85fr] xl:px-10 2xl:px-14">
        <div
          style={textStyle}
          className="max-w-[920px] transition-[opacity,transform] duration-150"
        >
          <p className="text-sm font-medium uppercase tracking-[0.34em] text-white/55">
            Area Immobiliare dal 1980
          </p>

          <h1 className="mt-6 max-w-[900px] text-5xl font-semibold leading-[0.98] text-white md:text-7xl xl:text-[5.5rem]">
            Bergamo, case e scelte immobiliari lette con esperienza vera.
          </h1>

          <p className="mt-7 max-w-[760px] text-base leading-8 text-white/72 md:text-lg xl:text-[1.15rem]">
            Un approccio più chiaro, più solido e più umano alla compravendita e
            alla locazione. Analisi, verifica e conoscenza del territorio per
            trovare la soluzione giusta senza rumore inutile.
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
              className="rounded-2xl border border-white/12 bg-white/6 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-white/10"
            >
              Disegna la tua area
            </Link>

            <Link
              href="/chi-siamo"
              className="rounded-2xl border border-white/12 bg-transparent px-6 py-3.5 text-sm font-semibold text-white/86 transition hover:bg-white/6 hover:text-white"
            >
              Scopri Area Immobiliare
            </Link>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Storia
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">Dal 1980</p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
                Territorio
              </p>
              <p className="mt-2 text-2xl font-semibold text-white">
                Bergamo e provincia
              </p>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-5 py-5 backdrop-blur-md">
              <p className="text-[11px] uppercase tracking-[0.24em] text-white/45">
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
          className="hidden xl:flex xl:justify-end xl:self-end"
        >
          <div className="relative w-full max-w-[540px]">
            <div className="absolute -left-8 top-10 h-32 w-32 rounded-full bg-sky-400/18 blur-3xl" />
            <div className="absolute -right-6 bottom-4 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#09111d]/62 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl">
              <div className="grid gap-4">
                <div className="overflow-hidden rounded-[26px] border border-white/10">
                  <div
                    className="h-[240px] w-full bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/bergamo-2.jpg')" }}
                  />
                </div>

                <div className="grid grid-cols-[1.1fr_0.9fr] gap-4">
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-white/45">
                      Ricerca su mappa
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      Zone precise
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      Disegna l’area che ti interessa e concentrati solo sugli
                      immobili coerenti con la tua ricerca.
                    </p>
                  </div>

                  <Link
                    href="/immobili/mappa-area"
                    className="group relative overflow-hidden rounded-[24px] border border-white/10"
                  >
                    <div className="absolute inset-0 bg-[url('/images/map-card-bg.jpg')] bg-cover bg-center opacity-100" />
                    <div className="absolute inset-0 bg-white/28 backdrop-blur-[1.5px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.24)_0%,rgba(255,255,255,0.04)_100%)]" />

                    <div className="relative flex h-full flex-col justify-between p-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.22em] text-black/50">
                          Mappa interattiva
                        </p>
                        <p className="mt-2 text-xl font-semibold text-black">
                          Vai alla mappa
                        </p>
                      </div>

                      <div className="mt-6 inline-flex w-fit rounded-full border border-black/10 bg-black px-3 py-2 text-xs font-semibold text-white transition group-hover:translate-x-0.5">
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