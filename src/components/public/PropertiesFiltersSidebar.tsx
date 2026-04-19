'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import italyLocations from '@/data/italyLocations.json'
import FilterSwitch from '@/components/public/FilterSwitch'

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

type Props = {
  initialQ?: string
  initialMaxPrice?: string
  initialMinRooms?: string
  initialContractType?: string
  initialPropertyType?: string
  initialProvince?: string
  initialComuni?: string[]
  initialMinSurface?: string
  initialMaxSurface?: string
  initialMinBathrooms?: string
  initialHasGarage?: boolean
  initialHasParking?: boolean
  initialHasGarden?: boolean
  initialHasElevator?: boolean
  initialIsAuction?: boolean
  hideLocationFilters?: boolean
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function PropertiesFiltersSidebar({
  initialQ = '',
  initialMaxPrice = '',
  initialMinRooms = '',
  initialContractType = '',
  initialPropertyType = '',
  initialProvince = '',
  initialComuni = [],
  initialMinSurface = '',
  initialMaxSurface = '',
  initialMinBathrooms = '',
  initialHasGarage = false,
  initialHasParking = false,
  initialHasGarden = false,
  initialHasElevator = false,
  initialIsAuction = false,
  hideLocationFilters = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(initialQ)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  const [minRooms, setMinRooms] = useState(initialMinRooms)
  const [contractType, setContractType] = useState(initialContractType)
  const [propertyType, setPropertyType] = useState(initialPropertyType)
  const [province, setProvince] = useState(initialProvince)
  const [selectedComuni, setSelectedComuni] = useState<string[]>(initialComuni)
  const [comuneSearch, setComuneSearch] = useState('')
  const [minSurface, setMinSurface] = useState(initialMinSurface)
  const [maxSurface, setMaxSurface] = useState(initialMaxSurface)
  const [minBathrooms, setMinBathrooms] = useState(initialMinBathrooms)
  const [hasGarage, setHasGarage] = useState(initialHasGarage)
  const [hasParking, setHasParking] = useState(initialHasParking)
  const [hasGarden, setHasGarden] = useState(initialHasGarden)
  const [hasElevator, setHasElevator] = useState(initialHasElevator)
  const [isAuction, setIsAuction] = useState(initialIsAuction)
  const [isAutoApplying, setIsAutoApplying] = useState(false)

  const isFirstRender = useRef(true)

  const currentProvince = useMemo(
    () => provinces.find((item) => item.code === province) || null,
    [province]
  )

  const filteredComuni = useMemo(() => {
    if (!currentProvince) return []

    const normalizedSearch = normalizeText(comuneSearch)

    if (!normalizedSearch) return currentProvince.comuni

    return currentProvince.comuni.filter((comune) =>
      normalizeText(comune.name).includes(normalizedSearch)
    )
  }, [currentProvince, comuneSearch])

  const buildQueryString = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('q')
    params.delete('maxPrice')
    params.delete('minRooms')
    params.delete('contractType')
    params.delete('propertyType')
    params.delete('province')
    params.delete('comune')
    params.delete('minSurface')
    params.delete('maxSurface')
    params.delete('minBathrooms')
    params.delete('hasGarage')
    params.delete('hasParking')
    params.delete('hasGarden')
    params.delete('hasElevator')
    params.delete('isAuction')
    params.delete('page')

    if (q.trim()) params.set('q', q.trim())
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())
    if (contractType) params.set('contractType', contractType)
    if (propertyType) params.set('propertyType', propertyType)

    if (!hideLocationFilters) {
      if (province) params.set('province', province)
      selectedComuni.forEach((comune) => params.append('comune', comune))
    }

    if (minSurface.trim()) params.set('minSurface', minSurface.trim())
    if (maxSurface.trim()) params.set('maxSurface', maxSurface.trim())
    if (minBathrooms.trim()) params.set('minBathrooms', minBathrooms.trim())

    if (hasGarage) params.set('hasGarage', 'true')
    if (hasParking) params.set('hasParking', 'true')
    if (hasGarden) params.set('hasGarden', 'true')
    if (hasElevator) params.set('hasElevator', 'true')
    if (isAuction) params.set('isAuction', 'true')

    return params.toString()
  }

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    setIsAutoApplying(true)

    const timeout = window.setTimeout(() => {
      const queryString = buildQueryString()
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      })
      setIsAutoApplying(false)
    }, 1000)

    return () => {
      window.clearTimeout(timeout)
      setIsAutoApplying(false)
    }
  }, [
    q,
    maxPrice,
    minRooms,
    contractType,
    propertyType,
    province,
    selectedComuni,
    minSurface,
    maxSurface,
    minBathrooms,
    hasGarage,
    hasParking,
    hasGarden,
    hasElevator,
    isAuction,
    hideLocationFilters,
    pathname,
    router,
    searchParams,
  ])

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

  const handleResetFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    params.delete('q')
    params.delete('maxPrice')
    params.delete('minRooms')
    params.delete('contractType')
    params.delete('propertyType')
    params.delete('minSurface')
    params.delete('maxSurface')
    params.delete('minBathrooms')
    params.delete('hasGarage')
    params.delete('hasParking')
    params.delete('hasGarden')
    params.delete('hasElevator')
    params.delete('isAuction')
    params.delete('page')

    if (!hideLocationFilters) {
      params.delete('province')
      params.delete('comune')
    }

    setQ('')
    setMaxPrice('')
    setMinRooms('')
    setContractType('')
    setPropertyType('')
    setMinSurface('')
    setMaxSurface('')
    setMinBathrooms('')
    setHasGarage(false)
    setHasParking(false)
    setHasGarden(false)
    setHasElevator(false)
    setIsAuction(false)

    if (!hideLocationFilters) {
      setProvince('')
      setSelectedComuni([])
      setComuneSearch('')
    }

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  const handleResetMap = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('polygon')
    params.delete('mapMode')
    params.delete('province')
    params.delete('comune')
    params.delete('page')

    setProvince('')
    setSelectedComuni([])
    setComuneSearch('')

    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname, {
      scroll: false,
    })
  }

  return (
    <div className="theme-panel rounded-[28px] border p-5 transition-colors duration-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Filtri di ricerca
          </p>

          <h2 className="mt-3 text-2xl font-semibold text-[var(--site-text)]">
            Affina i risultati
          </h2>
        </div>

        <div className="shrink-0 pt-1 text-xs text-[var(--site-text-faint)]">
          {isAutoApplying ? 'Aggiorno…' : 'Auto'}
        </div>
      </div>

      {hideLocationFilters && (
        <div className="mt-4 space-y-3">
          <div className="rounded-[24px] border border-sky-200 bg-sky-50 px-4 py-3 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] dark:border-sky-400/20 dark:bg-sky-500/10">
            <div className="font-semibold text-[#0f3b66] dark:text-sky-100">
              Ricerca per area attiva
            </div>
            <div className="mt-1 text-[#0f3b66] dark:text-sky-100/80">
              Stai visualizzando gli immobili contenuti nella zona che hai
              disegnato sulla mappa. I filtri di provincia e comuni sono nascosti
              per evitare conflitti con l’area selezionata.
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetMap}
            className="theme-button-secondary liquid-button liquid-button-vertical w-full rounded-2xl px-5 py-3 text-sm font-medium transition"
          >
            <span>Rimuovi area disegnata</span>
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
            Cerca
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titolo, keyword, zona..."
            className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
          />
        </div>

        <div className="grid gap-3">
          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContractType('vendita')}
                data-active={contractType === 'vendita' ? 'true' : 'false'}
                className={`liquid-button liquid-button-vertical rounded-xl px-4 py-3 text-sm transition ${
                  contractType === 'vendita'
                    ? 'theme-pill-active border'
                    : 'theme-pill border'
                }`}
              >
                <span>Vendita</span>
              </button>

              <button
                type="button"
                onClick={() => setContractType('affitto')}
                data-active={contractType === 'affitto' ? 'true' : 'false'}
                className={`liquid-button liquid-button-vertical rounded-xl px-4 py-3 text-sm transition ${
                  contractType === 'affitto'
                    ? 'theme-pill-active border'
                    : 'theme-pill border'
                }`}
              >
                <span>Affitto</span>
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setContractType('')}
            className="theme-pill liquid-button liquid-button-vertical w-full rounded-2xl border px-4 py-3 text-sm transition"
          >
            <span>Qualsiasi contratto</span>
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
            Tipologia
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="theme-input w-full rounded-2xl border px-4 py-3"
          >
            <option value="">Qualsiasi</option>
            <option value="appartamento">Appartamento</option>
            <option value="attico">Attico</option>
            <option value="villa">Villa</option>
            <option value="trilocale">Trilocale</option>
            <option value="bilocale">Bilocale</option>
            <option value="box">Box / Garage</option>
            <option value="ufficio">Ufficio</option>
            <option value="negozio">Negozio</option>
          </select>
        </div>

        {!hideLocationFilters && (
          <>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value)
                  setSelectedComuni([])
                  setComuneSearch('')
                }}
                className="theme-input w-full rounded-2xl border px-4 py-3"
              >
                <option value="">Qualsiasi provincia</option>
                {provinces.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                Comuni
              </p>

              {!province ? (
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-4 text-sm text-[var(--site-text-faint)]">
                  Seleziona prima una provincia.
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-[var(--site-text-muted)]">
                    Fino a 8 comuni della provincia selezionata.
                  </p>

                  <input
                    value={comuneSearch}
                    onChange={(e) => setComuneSearch(e.target.value)}
                    placeholder="Cerca comune..."
                    className="theme-input mt-4 w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
                  />

                  <div className="mt-4 min-h-[56px] rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-3">
                    {selectedComuni.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedComuni.map((comune) => (
                          <button
                            key={comune}
                            type="button"
                            onClick={() => toggleComune(comune)}
                            className="theme-pill liquid-button liquid-button-vertical rounded-full border px-3 py-2 text-sm transition"
                          >
                            <span>
                              {comune} <span className="opacity-60">×</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--site-text-faint)]">
                        Nessun comune selezionato
                      </div>
                    )}
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-2">
                    <div className="space-y-2">
                      {filteredComuni.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-[var(--site-text-faint)]">
                          Nessun comune trovato.
                        </div>
                      ) : (
                        filteredComuni.map((comune) => {
                          const selected = selectedComuni.includes(comune.name)

                          return (
                            <button
                              key={comune.code}
                              type="button"
                              onClick={() => toggleComune(comune.name)}
                              data-active={selected ? 'true' : 'false'}
                              className={`liquid-button liquid-button-vertical flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${
                                selected
                                  ? 'theme-pill-active'
                                  : 'theme-pill'
                              }`}
                            >
                              <span>{comune.name}</span>
                              <span className="text-xs opacity-70">
                                {selected ? 'Selezionato' : 'Aggiungi'}
                              </span>
                            </button>
                          )
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Prezzo max
            </label>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Es. 320000"
              className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Locali min
            </label>
            <input
              value={minRooms}
              onChange={(e) => setMinRooms(e.target.value)}
              placeholder="Es. 3"
              className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Superficie min
            </label>
            <input
              value={minSurface}
              onChange={(e) => setMinSurface(e.target.value)}
              placeholder="Es. 70"
              className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
              Superficie max
            </label>
            <input
              value={maxSurface}
              onChange={(e) => setMaxSurface(e.target.value)}
              placeholder="Es. 180"
              className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-[var(--site-text-faint)]">
            Bagni min
          </label>
          <input
            value={minBathrooms}
            onChange={(e) => setMinBathrooms(e.target.value)}
            placeholder="Es. 2"
            className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
          />
        </div>

        <div className="rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
            Filtri avanzati
          </p>

          <div className="grid gap-4">
            <FilterSwitch
              checked={hasGarage}
              onChange={setHasGarage}
              label="Box / Garage"
            />
            <FilterSwitch
              checked={hasParking}
              onChange={setHasParking}
              label="Posto auto"
            />
            <FilterSwitch
              checked={hasGarden}
              onChange={setHasGarden}
              label="Giardino"
            />
            <FilterSwitch
              checked={hasElevator}
              onChange={setHasElevator}
              label="Ascensore"
            />
            <FilterSwitch
              checked={isAuction}
              onChange={setIsAuction}
              label="Aste"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResetFilters}
            className="theme-button-secondary liquid-button liquid-button-vertical w-full rounded-2xl px-5 py-3 text-sm transition"
          >
            <span>Reset filtri</span>
          </button>

          {hideLocationFilters && (
            <button
              type="button"
              onClick={handleResetMap}
              className="theme-button-secondary liquid-button liquid-button-vertical w-full rounded-2xl px-5 py-3 text-sm transition"
            >
              <span>Reset mappa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}