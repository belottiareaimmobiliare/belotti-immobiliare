'use client'

import dynamic from 'next/dynamic'
import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import italyLocations from '@/data/italyLocations.json'

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

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

type PolygonValue = {
  points: [number, number][]
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

const PropertiesMap = dynamic(() => import('@/components/public/PropertiesMap'), {
  ssr: false,
  loading: () => (
    <div className="theme-panel flex h-full min-h-[260px] items-center justify-center rounded-[28px] border text-[var(--site-text-muted)]">
      Caricamento mappa...
    </div>
  ),
})

type Props = {
  properties: MapProperty[]
  initialProvince?: string
  initialComuni?: string[]
  mapMode?: string
  initialPolygon?: PolygonValue | null
  emptyInsidePolygon?: boolean
  drawFullscreenMode?: boolean
  resultCount?: number
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function PropertiesMapSection({
  properties,
  initialProvince = '',
  initialComuni = [],
  initialPolygon = null,
  emptyInsidePolygon = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [showZonePicker, setShowZonePicker] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedComuni, setSelectedComuni] = useState<string[]>(initialComuni)

  const hasActivePolygon = Boolean(
    initialPolygon?.points?.length && initialPolygon.points.length >= 3
  )

  const availableComuni = useMemo(() => {
    if (initialProvince) {
      const province = provinces.find((item) => item.code === initialProvince)
      if (!province) return []

      return province.comuni.map((comune) => ({
        name: comune.name,
        provinceCode: province.code,
      }))
    }

    return provinces.flatMap((province) =>
      province.comuni.map((comune) => ({
        name: comune.name,
        provinceCode: province.code,
      }))
    )
  }, [initialProvince])

  const filteredComuni = useMemo(() => {
    const normalizedSearch = normalizeText(search)

    if (!normalizedSearch) {
      return availableComuni.slice(0, 80)
    }

    return availableComuni
      .filter((item) => normalizeText(item.name).includes(normalizedSearch))
      .slice(0, 80)
  }, [availableComuni, search])

  const toggleComune = (comuneName: string) => {
    if (selectedComuni.includes(comuneName)) {
      setSelectedComuni((prev) => prev.filter((item) => item !== comuneName))
      return
    }

    if (selectedComuni.length >= 8) {
      alert('Puoi selezionare al massimo 8 comuni.')
      return
    }

    setSelectedComuni((prev) => [...prev, comuneName])
  }

  const applyZones = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('comune')
    params.delete('polygon')
    params.delete('mapMode')
    params.delete('page')

    selectedComuni.forEach((comune) => {
      params.append('comune', comune)
    })

    router.push(`${pathname}?${params.toString()}`)
    setShowZonePicker(false)
  }

  const clearZones = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('comune')
    params.delete('polygon')
    params.delete('mapMode')
    params.delete('page')

    router.push(`${pathname}?${params.toString()}`)
    setSelectedComuni([])
    setSearch('')
    setShowZonePicker(false)
  }

  const goToMapView = () => {
    const params = new URLSearchParams(searchParams.toString())
    router.push(`/immobili/mappa-area?${params.toString()}`)
  }

  return (
    <div className="relative">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-[var(--site-text-faint)]">
            Area mappa
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
            Vista risultati su mappa
          </h2>
          <p className="mt-2 text-sm text-[var(--site-text-muted)]">
            {properties.length > 0
              ? `${properties.length} immobili con posizione disponibile`
              : 'Nessun immobile con coordinate disponibili per i filtri attuali'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowZonePicker((prev) => !prev)}
            data-open={showZonePicker ? 'true' : 'false'}
            aria-expanded={showZonePicker}
            className="theme-button-secondary liquid-dropdown rounded-2xl px-4 py-2 text-sm transition"
          >
            <span>Seleziona comuni</span>
          </button>

          <button
            type="button"
            onClick={goToMapView}
            className="theme-button-secondary liquid-button rounded-2xl px-4 py-2 text-sm transition"
          >
            <span className="hidden md:inline">
              {hasActivePolygon ? 'Ridisegna area su mappa' : 'Disegna area su mappa'}
            </span>
            <span className="md:hidden">Vedi su mappa</span>
          </button>
        </div>
      </div>

      {hasActivePolygon && (
        <div className="mb-5 rounded-[28px] border border-sky-200/70 bg-sky-50/80 px-4 py-4 text-sm text-sky-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100">
          <div className="font-medium text-sky-900 dark:text-sky-100">
            Area disegnata attiva
          </div>
          <div className="mt-1 text-sky-800/90 dark:text-sky-100/80">
            La mappa e i risultati stanno usando il poligono selezionato. Se vuoi cambiare zona,
            puoi ridisegnare l’area oppure rimuoverla dai filtri laterali.
          </div>
        </div>
      )}

      {emptyInsidePolygon && (
        <div className="mb-5 rounded-[28px] border border-sky-200/70 bg-sky-50/80 px-4 py-4 text-sm text-sky-800/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100/80">
          Nessun immobile è presente dentro l’area disegnata con i filtri attuali. La mappa continua
          comunque a mostrarti gli immobili disponibili con posizione per aiutarti a ridefinire meglio la zona.
        </div>
      )}

      {showZonePicker && (
        <div className="theme-panel mb-5 rounded-[28px] border p-4 shadow-2xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--site-text)]">Seleziona comuni</p>
              <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                {initialProvince
                  ? `Provincia selezionata: ${initialProvince}. Puoi scegliere fino a 8 comuni.`
                  : 'Nessuna provincia selezionata: puoi cercare comuni in tutta Italia.'}
              </p>

              {hasActivePolygon && (
                <div className="mt-3 rounded-2xl border border-sky-200/70 bg-sky-50/80 px-4 py-3 text-sm text-sky-800/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-100/80">
                  Applicando i comuni, l’area disegnata verrà rimossa per evitare sovrapposizioni tra due modalità di selezione diverse.
                </div>
              )}

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cerca comune..."
                className="theme-input mt-4 w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
              />

              <div className="mt-4 max-h-72 overflow-y-auto rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-2">
                <div className="space-y-2">
                  {filteredComuni.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-[var(--site-text-faint)]">
                      Nessun comune trovato.
                    </div>
                  ) : (
                    filteredComuni.map((item) => {
                      const selected = selectedComuni.includes(item.name)

                      return (
                        <button
                          key={`${item.provinceCode}-${item.name}`}
                          type="button"
                          onClick={() => toggleComune(item.name)}
                          data-active={selected ? 'true' : 'false'}
                          className={`liquid-button flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                            selected
                              ? 'theme-pill-active border'
                              : 'theme-pill border'
                          }`}
                        >
                          <span>
                            {item.name}
                            {!initialProvince ? (
                              <span className="ml-2 text-xs opacity-70">
                                ({item.provinceCode})
                              </span>
                            ) : null}
                          </span>

                          <span className="text-xs opacity-70">
                            {selected ? 'Selezionato' : 'Aggiungi'}
                          </span>
                        </button>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[320px]">
              <p className="text-sm font-medium text-[var(--site-text)]">Comuni selezionati</p>
              <p className="mt-1 text-sm text-[var(--site-text-muted)]">
                {selectedComuni.length}/8 scelti
              </p>

              <div className="mt-4 min-h-[160px] rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-3">
                {selectedComuni.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComuni.map((comune) => (
                      <button
                        key={comune}
                        type="button"
                        onClick={() => toggleComune(comune)}
                        className="theme-pill liquid-button rounded-full border px-3 py-2 text-sm transition"
                      >
                        <span>
                          {comune} <span className="opacity-60">×</span>
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex min-h-[130px] items-center justify-center text-sm text-[var(--site-text-faint)]">
                    Nessun comune selezionato
                  </div>
                )}
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={applyZones}
                  className="theme-button-primary liquid-button flex-1 rounded-2xl px-4 py-3 text-sm font-medium transition"
                >
                  <span>Applica</span>
                </button>

                <button
                  type="button"
                  onClick={clearZones}
                  className="theme-button-secondary liquid-button flex-1 rounded-2xl px-4 py-3 text-sm transition"
                >
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PropertiesMap
        properties={properties}
        polygon={initialPolygon}
        enableDrawing={false}
        emptyInsidePolygon={emptyInsidePolygon}
        heightClassName="h-[250px] md:h-[280px]"
      />
    </div>
  )
}