'use client'
import { PROPERTY_TYPES } from '@/lib/propertyOptions'

import { FormEvent, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import FilterSwitch from '@/components/public/FilterSwitch'

type Props = {
  initialQ?: string
  initialMaxPrice?: string
  initialMinRooms?: string
  initialContractType?: string
  initialPropertyType?: string
  initialMinSurface?: string
  initialMaxSurface?: string
  initialMinBathrooms?: string
  initialHasGarage?: boolean
  initialHasParking?: boolean
  initialHasGarden?: boolean
  initialHasElevator?: boolean
  initialIsAuction?: boolean
}

export default function PropertiesFiltersDrawMode({
  initialQ = '',
  initialMaxPrice = '',
  initialMinRooms = '',
  initialContractType = '',
  initialPropertyType = '',
  initialMinSurface = '',
  initialMaxSurface = '',
  initialMinBathrooms = '',
  initialHasGarage = false,
  initialHasParking = false,
  initialHasGarden = false,
  initialHasElevator = false,
  initialIsAuction = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [q, setQ] = useState(initialQ)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
  const [minRooms, setMinRooms] = useState(initialMinRooms)
  const [contractType, setContractType] = useState(initialContractType)
  const [propertyType, setPropertyType] = useState(initialPropertyType)
  const [minSurface, setMinSurface] = useState(initialMinSurface)
  const [maxSurface, setMaxSurface] = useState(initialMaxSurface)
  const [minBathrooms, setMinBathrooms] = useState(initialMinBathrooms)
  const [hasGarage, setHasGarage] = useState(initialHasGarage)
  const [hasParking, setHasParking] = useState(initialHasParking)
  const [hasGarden, setHasGarden] = useState(initialHasGarden)
  const [hasElevator, setHasElevator] = useState(initialHasElevator)
  const [isAuction, setIsAuction] = useState(initialIsAuction)

  const activeContractLabel = useMemo(() => {
    if (contractType === 'vendita') return 'Vendita'
    if (contractType === 'affitto') return 'Affitto'
    return 'Qualsiasi contratto'
  }, [contractType])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

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
    params.delete('province')
    params.delete('comune')

    if (q.trim()) params.set('q', q.trim())
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())
    if (contractType) params.set('contractType', contractType)
    if (propertyType) params.set('propertyType', propertyType)
    if (minSurface.trim()) params.set('minSurface', minSurface.trim())
    if (maxSurface.trim()) params.set('maxSurface', maxSurface.trim())
    if (minBathrooms.trim()) params.set('minBathrooms', minBathrooms.trim())

    if (hasGarage) params.set('hasGarage', 'true')
    if (hasParking) params.set('hasParking', 'true')
    if (hasGarden) params.set('hasGarden', 'true')
    if (hasElevator) params.set('hasElevator', 'true')
    if (isAuction) params.set('isAuction', 'true')

    params.set('mapMode', 'draw')

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleReset = () => {
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
    params.delete('province')
    params.delete('comune')
    params.delete('polygon')
    params.set('mapMode', 'draw')

    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-white/35">
        Filtri area disegnata
      </p>

      <h2 className="mt-3 text-2xl font-semibold text-white">
        Rifinisci la ricerca
      </h2>

      <p className="mt-3 text-sm leading-7 text-white/55">
        In questa modalità scegli direttamente l’area sulla mappa, quindi provincia e comuni non servono.
      </p>

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
            {activeContractLabel}
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
            {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            <option value="box">Box / Garage</option>
              <option value="negozio">Negozio</option>
          </select>
        </div>

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
            onClick={handleReset}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-white transition hover:bg-white/10"
          >
            Reset mappa
          </button>
        </div>
      </form>
    </div>
  )
}