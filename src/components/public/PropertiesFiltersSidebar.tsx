'use client'

import { FormEvent, useMemo, useState } from 'react'
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

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

    router.push(`${pathname}?${params.toString()}`)
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

    if (!hideLocationFilters) {
      params.delete('province')
      params.delete('comune')
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleResetMap = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('polygon')
    params.delete('mapMode')
    params.delete('province')
    params.delete('comune')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        Filtri di ricerca
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-white">
        Affina i risultati
      </h2>

      {hideLocationFilters && (
        <div className="mt-4 space-y-3">
          <div className="rounded-[24px] border border-sky-400/20 bg-sky-500/10 px-4 py-3 text-sm text-sky-100">
            <div className="font-medium text-white">Ricerca per area attiva</div>
            <div className="mt-1 text-sky-100/90">
              Stai visualizzando gli immobili contenuti nella zona che hai disegnato sulla mappa.
              I filtri di provincia e comuni sono nascosti per evitare conflitti con l’area selezionata.
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetMap}
            className="w-full rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-3 text-sm font-medium text-sky-100 transition hover:bg-sky-500/15"
          >
            Rimuovi area disegnata
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Cerca
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titolo, keyword, zona..."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2 rounded-2xl border border-white/10 bg-black/20 p-1">
            <button
              type="button"
              onClick={() => setContractType('vendita')}
              className={`rounded-xl px-4 py-3 text-sm transition ${
                contractType === 'vendita'
                  ? 'bg-white text-black'
                  : 'text-white/75 hover:bg-white/10'
              }`}
            >
              Vendita
            </button>

            <button
              type="button"
              onClick={() => setContractType('affitto')}
              className={`rounded-xl px-4 py-3 text-sm transition ${
                contractType === 'affitto'
                  ? 'bg-white text-black'
                  : 'text-white/75 hover:bg-white/10'
              }`}
            >
              Affitto
            </button>
          </div>

          <button
            type="button"
            onClick={() => setContractType('')}
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10"
          >
            Qualsiasi contratto
          </button>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Tipologia
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
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
              <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
                Provincia
              </label>
              <select
                value={province}
                onChange={(e) => {
                  setProvince(e.target.value)
                  setSelectedComuni([])
                  setComuneSearch('')
                }}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
              >
                <option value="">Qualsiasi provincia</option>
                {provinces.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name} ({item.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Comuni
              </p>

              {!province ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 px-4 py-4 text-sm text-white/40">
                  Seleziona prima una provincia.
                </div>
              ) : (
                <>
                  <p className="mt-2 text-sm text-white/55">
                    Fino a 8 comuni della provincia selezionata.
                  </p>

                  <input
                    value={comuneSearch}
                    onChange={(e) => setComuneSearch(e.target.value)}
                    placeholder="Cerca comune..."
                    className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35"
                  />

                  <div className="mt-4 min-h-[56px] rounded-2xl border border-white/10 bg-white/5 p-3">
                    {selectedComuni.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {selectedComuni.map((comune) => (
                          <button
                            key={comune}
                            type="button"
                            onClick={() => toggleComune(comune)}
                            className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-white/85 transition hover:bg-white/15"
                          >
                            {comune} <span className="text-white/55">×</span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-white/40">
                        Nessun comune selezionato
                      </div>
                    )}
                  </div>

                  <div className="mt-4 max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
                    <div className="space-y-2">
                      {filteredComuni.length === 0 ? (
                        <div className="px-3 py-3 text-sm text-white/45">
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
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-sm transition ${
                                selected
                                  ? 'bg-white text-black'
                                  : 'bg-transparent text-white/80 hover:bg-white/10'
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
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
              Prezzo max
            </label>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              placeholder="Es. 320000"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
              Locali min
            </label>
            <input
              value={minRooms}
              onChange={(e) => setMinRooms(e.target.value)}
              placeholder="Es. 3"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
              Superficie min
            </label>
            <input
              value={minSurface}
              onChange={(e) => setMinSurface(e.target.value)}
              placeholder="Es. 70"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
              Superficie max
            </label>
            <input
              value={maxSurface}
              onChange={(e) => setMaxSurface(e.target.value)}
              placeholder="Es. 180"
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Bagni min
          </label>
          <input
            value={minBathrooms}
            onChange={(e) => setMinBathrooms(e.target.value)}
            placeholder="Es. 2"
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />
        </div>

        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/35">
            Filtri avanzati
          </p>

          <div className="grid gap-4">
            <FilterSwitch checked={hasGarage} onChange={setHasGarage} label="Box / Garage" />
            <FilterSwitch checked={hasParking} onChange={setHasParking} label="Posto auto" />
            <FilterSwitch checked={hasGarden} onChange={setHasGarden} label="Giardino" />
            <FilterSwitch checked={hasElevator} onChange={setHasElevator} label="Ascensore" />
            <FilterSwitch checked={isAuction} onChange={setIsAuction} label="Aste" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="submit"
            className="w-full rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Applica filtri
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Reset filtri
          </button>

          {hideLocationFilters && (
            <button
              type="button"
              onClick={handleResetMap}
              className="w-full rounded-2xl border border-sky-400/20 bg-sky-500/10 px-5 py-3 text-sm text-sky-100 transition hover:bg-sky-500/15"
            >
              Reset mappa
            </button>
          )}
        </div>
      </form>
    </div>
  )
}