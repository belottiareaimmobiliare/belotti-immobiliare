'use client'

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

export default function HomeSearchBoxMobile() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contractType, setContractType] = useState<'vendita' | 'affitto'>(
    searchParams.get('contractType') === 'affitto' ? 'affitto' : 'vendita'
  )
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [propertyType, setPropertyType] = useState(searchParams.get('propertyType') || '')
  const [province, setProvince] = useState(searchParams.get('province') || '')

  const provinceOptions = useMemo(
    () => provinces.map((item) => ({ code: item.code, name: item.name })),
    []
  )

  const goToSearch = () => {
    const params = new URLSearchParams()
    params.set('contractType', contractType)

    if (q.trim()) params.set('q', q.trim())
    if (propertyType) params.set('propertyType', propertyType)
    if (province) params.set('province', province)

    router.push(`/immobili?${params.toString()}`)
  }

  return (
    <section className="rounded-[30px] p-5">
      <p className="text-xs uppercase tracking-[0.26em] text-[var(--site-text-faint)]">
        Cerca immobile
      </p>

      <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
        Trova il tuo spazio
      </h2>

      <p className="mt-2 text-sm text-[var(--site-text-muted)]">
        Filtri rapidi e ricerca coerente col gestionale.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setContractType('vendita')}
          data-active={contractType === 'vendita' ? 'true' : 'false'}
          className={`liquid-button rounded-2xl px-4 py-3 text-sm font-medium transition ${
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
          className={`liquid-button rounded-2xl px-4 py-3 text-sm font-medium transition ${
            contractType === 'affitto'
              ? 'theme-pill-active border'
              : 'theme-pill border'
          }`}
        >
          <span>Affitto</span>
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Titolo, zona, keyword..."
          className="theme-input w-full rounded-2xl border px-4 py-3 placeholder:text-[var(--site-text-faint)]"
        />

        <select
          value={propertyType}
          onChange={(e) => setPropertyType(e.target.value)}
          className="theme-input w-full rounded-2xl border px-4 py-3"
        >
          <option value="">Qualsiasi tipologia</option>
          <option value="appartamento">Appartamento</option>
          <option value="bilocale">Bilocale</option>
          <option value="trilocale">Trilocale</option>
          <option value="attico">Attico</option>
          <option value="villa">Villa</option>
          <option value="ufficio">Ufficio</option>
          <option value="negozio">Negozio</option>
        </select>

        <select
          value={province}
          onChange={(e) => setProvince(e.target.value)}
          className="theme-input w-full rounded-2xl border px-4 py-3"
        >
          <option value="">Qualsiasi provincia</option>
          {provinceOptions.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} ({item.code})
            </option>
          ))}
        </select>

        <div className="grid gap-3">
          <button
            type="button"
            onClick={goToSearch}
            className="theme-button-primary liquid-button w-full rounded-2xl px-5 py-3 text-sm font-semibold transition"
          >
            <span>Cerca</span>
          </button>

          <button
            type="button"
            onClick={() => router.push('/immobili/mappa-area')}
            className="theme-button-secondary liquid-button w-full rounded-2xl px-5 py-3 text-sm transition"
          >
            <span>Vai alla mappa</span>
          </button>
        </div>
      </div>
    </section>
  )
}