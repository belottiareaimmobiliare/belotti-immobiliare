'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import italyLocations from '@/data/italyLocations.json'

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

function normalizeSearch(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default function HomeSearchBoxMobile() {
  const router = useRouter()

  const [q, setQ] = useState('')
  const [contractType, setContractType] = useState<'vendita' | 'affitto'>('vendita')
  const [propertyType, setPropertyType] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minRooms, setMinRooms] = useState('')

  const [selectedProvince, setSelectedProvince] = useState('')
  const [comuneSearch, setComuneSearch] = useState('')
  const [selectedComuni, setSelectedComuni] = useState<string[]>([])

  const [hasGarage, setHasGarage] = useState(false)
  const [hasParking, setHasParking] = useState(false)
  const [hasGarden, setHasGarden] = useState(false)
  const [hasElevator, setHasElevator] = useState(false)
  const [isAuction, setIsAuction] = useState(false)

  const activeProvince = useMemo(() => {
    return provinces.find((province) => province.code === selectedProvince) || null
  }, [selectedProvince])

  const filteredComuni = useMemo(() => {
    if (!activeProvince) return []

    const normalized = normalizeSearch(comuneSearch)
    if (!normalized) return activeProvince.comuni

    return activeProvince.comuni.filter((comune) =>
      normalizeSearch(comune.name).includes(normalized)
    )
  }, [activeProvince, comuneSearch])

  const handleProvinceChange = (value: string) => {
    setSelectedProvince(value)
    setSelectedComuni([])
    setComuneSearch('')
  }

  const toggleComune = (comuneName: string) => {
    const alreadySelected = selectedComuni.includes(comuneName)

    if (alreadySelected) {
      setSelectedComuni((prev) => prev.filter((item) => item !== comuneName))
      return
    }

    if (selectedComuni.length >= 8) {
      alert('Puoi selezionare al massimo 8 comuni.')
      return
    }

    setSelectedComuni((prev) => [...prev, comuneName])
  }

  const removeComune = (comuneName: string) => {
    setSelectedComuni((prev) => prev.filter((item) => item !== comuneName))
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const params = new URLSearchParams()

    if (q.trim()) params.set('q', q.trim())
    if (contractType) params.set('contractType', contractType)
    if (propertyType) params.set('propertyType', propertyType)
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())
    if (selectedProvince) params.set('province', selectedProvince)

    selectedComuni.forEach((comune) => {
      params.append('comune', comune)
    })

    if (hasGarage) params.set('hasGarage', 'true')
    if (hasParking) params.set('hasParking', 'true')
    if (hasGarden) params.set('hasGarden', 'true')
    if (hasElevator) params.set('hasElevator', 'true')
    if (isAuction) params.set('isAuction', 'true')

    router.push(`/immobili?${params.toString()}`)
  }

  return (
    <div className="mt-12 rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl">
      <div className="mb-4">
        <p className="text-sm uppercase tracking-[0.25em] text-white/40">
          Cerca immobile
        </p>
        <h2 className="mt-2 text-xl font-semibold text-white">
          Ricerca mobile
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Contratto
          </label>
          <select
            value={contractType}
            onChange={(e) =>
              setContractType(e.target.value as 'vendita' | 'affitto')
            }
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            <option value="vendita">Vendita</option>
            <option value="affitto">Affitto</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Cerca
          </label>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titolo, zona, keyword..."
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />
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

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder={contractType === 'affitto' ? 'Max 1200' : 'Max 300000'}
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />

          <input
            type="number"
            value={minRooms}
            onChange={(e) => setMinRooms(e.target.value)}
            placeholder="Locali min."
            className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/35"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/40">
            Provincia
          </label>
          <select
            value={selectedProvince}
            onChange={(e) => handleProvinceChange(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white"
          >
            <option value="">Qualsiasi provincia</option>
            {provinces.map((province) => (
              <option key={`${province.code}-${province.name}`} value={province.code}>
                {province.name} ({province.code})
              </option>
            ))}
          </select>
        </div>

        {selectedProvince !== '' && (
          <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
            <div className="mb-3">
              <p className="text-xs uppercase tracking-[0.22em] text-white/35">
                Comuni
              </p>
              <p className="mt-2 text-sm text-white/55">
                Fino a 8 comuni della provincia selezionata.
              </p>
            </div>

            {activeProvince ? (
              <div className="space-y-4">
                <input
                  type="search"
                  value={comuneSearch}
                  onChange={(e) => setComuneSearch(e.target.value)}
                  placeholder="Cerca comune..."
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/35"
                />

                {selectedComuni.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedComuni.map((comune) => (
                      <button
                        key={comune}
                        type="button"
                        onClick={() => removeComune(comune)}
                        className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs text-white/85"
                      >
                        <span>{comune}</span>
                        <span className="text-white/60">×</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/40">Nessun comune selezionato</p>
                )}

                <div className="max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-2">
                  {filteredComuni.length === 0 ? (
                    <div className="px-3 py-3 text-sm text-white/45">
                      Nessun comune trovato.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredComuni.map((comune) => {
                        const selected = selectedComuni.includes(comune.name)

                        return (
                          <label
                            key={comune.code || comune.name}
                            className={`flex cursor-pointer items-center justify-between rounded-xl px-3 py-3 text-sm ${
                              selected
                                ? 'bg-white text-black'
                                : 'bg-transparent text-white/80'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => toggleComune(comune.name)}
                                className="h-4 w-4 accent-black"
                              />
                              <span>{comune.name}</span>
                            </div>

                            <span className="text-xs opacity-70">
                              {selected ? 'Selezionato' : ''}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>

                <p className="text-xs text-white/40">
                  Comuni selezionati: {selectedComuni.length}/8
                </p>
              </div>
            ) : (
              <div className="text-sm text-white/45">
                Provincia selezionata ma dati comuni non trovati.
              </div>
            )}
          </div>
        )}

        <details className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <summary className="cursor-pointer list-none text-sm font-medium text-white">
            Filtri avanzati
          </summary>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={hasGarage}
                onChange={(e) => setHasGarage(e.target.checked)}
                className="h-4 w-4"
              />
              Box / Garage
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={hasParking}
                onChange={(e) => setHasParking(e.target.checked)}
                className="h-4 w-4"
              />
              Posto auto
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={hasGarden}
                onChange={(e) => setHasGarden(e.target.checked)}
                className="h-4 w-4"
              />
              Giardino
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={hasElevator}
                onChange={(e) => setHasElevator(e.target.checked)}
                className="h-4 w-4"
              />
              Ascensore
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85">
              <input
                type="checkbox"
                checked={isAuction}
                onChange={(e) => setIsAuction(e.target.checked)}
                className="h-4 w-4"
              />
              Aste
            </label>
          </div>
        </details>

        <button className="w-full rounded-2xl bg-white py-3 font-medium text-black">
          Cerca immobile
        </button>
      </form>
    </div>
  )
}