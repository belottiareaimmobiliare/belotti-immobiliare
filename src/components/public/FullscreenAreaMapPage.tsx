'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'

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
}

const AreaDrawMap = dynamic(
  () => import('@/components/public/AreaDrawMap'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0f1a] text-white/55">
        Caricamento mappa...
      </div>
    ),
  }
)

type Props = {
  properties: MapProperty[]
  hasError?: boolean
}

export default function FullscreenAreaMapPage({
  properties,
  hasError = false,
}: Props) {
  return (
    <main className="fixed inset-0 z-[90] h-screen w-screen overflow-hidden bg-[#0a0f1a] text-white">
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#08111f] px-5 py-4">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.26em] text-white/40">
              Mappa area
            </p>
            <h1 className="text-2xl font-semibold">Esplora la zona sulla mappa</h1>
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

        <div className="shrink-0 border-b border-sky-400/20 bg-sky-500/10 px-5 py-3 text-sm text-sky-100">
          Muoviti sulla mappa con trascinamento e zoom. Poi attiva il disegno e crea la tua area cliccando sulla mappa.
        </div>

        {hasError ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-red-300">
            Errore nel caricamento della mappa.
          </div>
        ) : (
          <div className="min-h-0 flex-1">
            <AreaDrawMap properties={properties} />
          </div>
        )}
      </div>
    </main>
  )
}