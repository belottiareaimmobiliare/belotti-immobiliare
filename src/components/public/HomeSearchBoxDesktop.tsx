'use client'
import { PROPERTY_TYPES } from '@/lib/propertyOptions'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import italyLocations from '@/data/italyLocations.json'

type ProvinceItem = {
  name: string
  code: string
  region: string
  comuni: { name: string; code: string }[]
}

const provinces = (italyLocations.provinces || []) as ProvinceItem[]

export default function HomeSearchBoxDesktop() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contractType, setContractType] = useState<'vendita' | 'affitto'>(
    searchParams.get('contractType') === 'affitto' ? 'affitto' : 'vendita'
  )
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [minRooms, setMinRooms] = useState(searchParams.get('minRooms') || '')

  const provinceOptions = useMemo(
    () => provinces.map((item) => ({ code: item.code, name: item.name })),
    []
  )

  const buildSearchParams = () => {
    const params = new URLSearchParams()

    params.set('contractType', contractType)

    if (q.trim()) params.set('q', q.trim())
    if (propertyType) params.set('propertyType', propertyType)
    if (province) params.set('province', province)
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())

    return params.toString()
  }

  const goToSearch = () => {
    router.push(`/immobili?${buildSearchParams()}`)
  }

  const goToAdvancedSearch = () => {
    router.push(`/immobili?${buildSearchParams()}`)
  }

  return (
    <section className="rounded-[34px] p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--site-text-faint)]">
            Cerca immobile
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
            Cerca la tua casa
          </h2>
          <p className="mt-2 text-sm text-[var(--site-text-muted)]">
            Filtri chiari, ricerca veloce e risultati utili per trovare più facilmente la soluzione giusta.
          </p>
        </div>

        <button
          type="button"
          onClick={goToAdvancedSearch}
          className="theme-button-secondary liquid-button rounded-full px-5 py-3 text-sm transition"
        >
          <span>Vai alla ricerca avanzata</span>
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setContractType('vendita')}
          data-active={contractType === 'vendita' ? 'true' : 'false'}
          className={`liquid-button rounded-[18px] px-6 py-3 text-base font-medium transition ${
            contractType === 'vendita'
              ? 'theme-pill-active border'
              : 'theme-pill border'
          }`}
        >
          <span>Cerca in Vendita</span>
        </button>

        <button
          type="button"
          onClick={() => setContractType('affitto')}
          data-active={contractType === 'affitto' ? 'true' : 'false'}
          className={`liquid-button rounded-[18px] px-6 py-3 text-base font-medium transition ${
            contractType === 'affitto'
              ? 'theme-pill-active border'
              : 'theme-pill border'
          }`}
        >
          <span>Cerca in Affitto</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/immobili?mapMode=zones')}
          className="theme-pill liquid-button rounded-[18px] border px-6 py-3 text-base font-medium transition"
        >
          <span>Seleziona zone</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/immobili/mappa-area')}
          className="group relative hidden min-w-[220px] shrink-0 overflow-hidden rounded-[18px] border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:scale-[1.02] md:inline-flex"
        >
          <div className="absolute inset-0 bg-[url('/images/map-card-bg.jpg')] bg-cover bg-center opacity-100" />
          <div className="absolute inset-0 bg-white/35 backdrop-blur-[1.5px]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_0%,rgba(255,255,255,0.05)_100%)]" />

          <div className="relative flex w-full items-center justify-between gap-4 px-5 py-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/60">
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
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr_1fr_0.9fr_0.9fr_auto]">
        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
            Cerca
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Titolo, zona, keyword..."
            className="theme-input w-full rounded-[18px] border px-5 py-3.5 text-base placeholder:text-[var(--site-text-faint)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
            Tipologia
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="theme-input w-full rounded-[18px] border px-5 py-3.5 text-base outline-none"
          >
            <option value="">Qualsiasi</option>
            {PROPERTY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
              <option value="negozio">Negozio</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
            Provincia
          </label>
          <select
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="theme-input w-full rounded-[18px] border px-5 py-3.5 text-base outline-none"
          >
            <option value="">Qualsiasi provincia</option>
            {provinceOptions.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name} ({item.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
            Prezzo max
          </label>
          <input
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Es. 300000"
            className="theme-input w-full rounded-[18px] border px-5 py-3.5 text-base placeholder:text-[var(--site-text-faint)]"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
            Locali min
          </label>
          <input
            value={minRooms}
            onChange={(e) => setMinRooms(e.target.value)}
            placeholder="Es. 3"
            className="theme-input w-full rounded-[18px] border px-5 py-3.5 text-base placeholder:text-[var(--site-text-faint)]"
          />
        </div>

        <div className="flex items-end">
          <button
            type="button"
            onClick={goToSearch}
            className="theme-button-primary liquid-button w-full rounded-[18px] px-6 py-3.5 text-base font-semibold transition"
          >
            <span>Cerca</span>
          </button>
        </div>
      </div>
    </section>
  )
}