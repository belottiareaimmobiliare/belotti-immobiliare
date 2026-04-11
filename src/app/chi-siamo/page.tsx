'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

type MapProperty = {
  id: string
  slug: string | null
  title: string | null
  comune: string | null
  province: string | null
  price: number | null
  latitude: number | null
  longitude: number | null
  location_mode?: string | null
  coverImage?: string | null
}

const AreaDrawMap = dynamic(() => import('@/components/public/AreaDrawMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0f1a] text-white/55">
      Caricamento mappa...
    </div>
  ),
})

const PropertiesMap = dynamic(() => import('@/components/public/PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0a0f1a] text-white/55">
      Caricamento mappa...
    </div>
  ),
})

type Props = {
  properties: MapProperty[]
  hasError?: boolean
}

export default function FullscreenAreaMapPage({
  properties,
  hasError = false,
}: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return (
    <main className="fixed inset-0 z-[90] h-screen w-screen overflow-hidden bg-[#0a0f1a] text-white">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#08111f] px-4 py-4 md:px-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.26em] text-white/40">
              Mappa risultati
            </p>
            <h1 className="text-xl font-semibold md:text-2xl">
              {isMobile ? 'Vista mappa immobili' : 'Esplora la zona sulla mappa'}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/immobili"
              className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
            >
              Torna agli immobili
            </Link>
          </div>
        </div>

        {!isMobile && (
          <div className="shrink-0 border-b border-sky-400/20 bg-sky-500/10 px-5 py-3 text-sm text-sky-100">
            Muoviti sulla mappa con trascinamento e zoom. Poi attiva il disegno e crea la tua area cliccando sulla mappa.
          </div>
        )}

        {hasError ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-red-300">
            Errore nel caricamento della mappa.
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            {isMobile ? (
              <PropertiesMap
                properties={properties}
                enableDrawing={false}
                heightClassName="h-full"
              />
            ) : (
              <AreaDrawMap properties={properties} />
            )}
          </div>
        )}
      </div>
    </main>
  )
}