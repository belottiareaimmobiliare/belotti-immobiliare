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
    const progress = Math.min(scrollY / 420, 1)
    const translateY = progress * -90
    const opacity = 1 - progress * 1.15

    return {
      transform: `translate3d(0, ${translateY}px, 0)`,
      opacity: Math.max(opacity, 0),
    }
  }, [scrollY])

  return (
    <section className="home-hero-sticky relative h-screen overflow-hidden border-b border-white/10">
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

        <div className="absolute inset-0 bg-white/58" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.42)_40%,rgba(255,255,255,0.58)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_42%)]" />
      </div>

      <div className="relative mx-auto flex h-full max-w-7xl items-center px-6">
        <div
          style={textStyle}
          className="max-w-5xl transition-[opacity,transform] duration-150"
        >
          <p className="text-sm font-medium uppercase tracking-[0.32em] text-black/55">
            Bergamo dal 1980
          </p>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.06] text-black md:text-6xl">
            Da oltre 40 anni, immobili in vendita e in affitto con serietà e competenza
          </h1>

          <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <p className="max-w-3xl text-base leading-8 text-black/72 md:text-lg">
              Esplora la mappa e filtra per trovare la casa più adatta alle tue esigenze.
            </p>

            {/* 🔥 BOTTONE MAPPA FIXATO */}
            <Link
              href="/immobili/mappa-area"
              className="group relative hidden min-w-[230px] shrink-0 overflow-hidden rounded-[22px] border border-black/10 shadow-[0_12px_28px_rgba(0,0,0,0.12)] transition hover:scale-[1.02] md:inline-flex"
            >
              {/* IMMAGINE */}
              <div className="absolute inset-0 bg-[url('/images/map-card-bg.jpg')] bg-cover bg-center opacity-100" />

              {/* 🔥 RIDOTTO BIANCO (prima era 68%) */}
              <div className="absolute inset-0 bg-white/35 backdrop-blur-[1.5px]" />

              {/* LEGGERO GRADIENT */}
              <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.05)_100%)]" />

              <div className="relative flex w-full items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/50">
                    Ricerca su mappa
                  </p>
                  <p className="mt-1 text-sm font-semibold text-black">
                    Vai alla mappa
                  </p>
                </div>

                <div className="rounded-full border border-black/10 bg-black px-3 py-2 text-xs font-semibold text-white transition group-hover:translate-x-0.5">
                  Apri
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/immobili"
              className="rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Cerca un immobile
            </Link>

            <Link
              href="/chi-siamo"
              className="rounded-2xl border border-black/10 bg-white/55 px-5 py-3 text-sm font-semibold text-black backdrop-blur-md transition hover:bg-white/65"
            >
              Scopri Area Immobiliare
            </Link>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white/50 px-5 py-4 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45">
                Storia
              </p>
              <p className="mt-2 text-[1.15rem] font-semibold text-black">
                Dal 1980
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/50 px-5 py-4 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45">
                Territorio
              </p>
              <p className="mt-2 text-[1.15rem] font-semibold text-black">
                Bergamo e provincia
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white/50 px-5 py-4 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.10)]">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-black/45">
                Metodo
              </p>
              <p className="mt-2 text-[1.15rem] font-semibold text-black">
                Valutazione e verifica
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}