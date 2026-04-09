'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function HomeSearchBoxMobile() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [contractType, setContractType] = useState<'sale' | 'rent'>(
    searchParams.get('contractType') === 'rent' ? 'rent' : 'sale'
  )
  const [q, setQ] = useState(searchParams.get('q') || '')
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '')
  const [minRooms, setMinRooms] = useState(searchParams.get('minRooms') || '')

  const goToSearch = () => {
    const params = new URLSearchParams()

    params.set('contractType', contractType)

    if (q.trim()) params.set('q', q.trim())
    if (maxPrice.trim()) params.set('maxPrice', maxPrice.trim())
    if (minRooms.trim()) params.set('minRooms', minRooms.trim())

    router.push(`/immobili?${params.toString()}`)
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
      <p className="text-xs uppercase tracking-[0.28em] text-white/40">
        Cerca immobile
      </p>

      <h2 className="mt-3 text-3xl font-semibold">Trova il tuo spazio</h2>

      <p className="mt-3 text-sm leading-7 text-white/60">
        Filtri rapidi e ricerca immediata da mobile.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setContractType('sale')}
          className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
            contractType === 'sale'
              ? 'bg-white text-black'
              : 'border border-white/10 bg-black/20 text-white/75'
          }`}
        >
          Vendita
        </button>

        <button
          type="button"
          onClick={() => setContractType('rent')}
          className={`rounded-[18px] px-4 py-3 text-sm font-medium transition ${
            contractType === 'rent'
              ? 'bg-white text-black'
              : 'border border-white/10 bg-black/20 text-white/75'
          }`}
        >
          Affitto
        </button>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => router.push('/immobili?mapMode=zones')}
          className="w-full rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/75 transition hover:bg-white/10"
        >
          Seleziona zone sulla mappa
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Titolo, zona, keyword..."
          className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/28"
        />

        <input
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          placeholder="Prezzo massimo"
          className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/28"
        />

        <input
          value={minRooms}
          onChange={(e) => setMinRooms(e.target.value)}
          placeholder="Locali minimi"
          className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-white placeholder:text-white/28"
        />

        <button
          type="button"
          onClick={goToSearch}
          className="w-full rounded-[18px] bg-white px-5 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Cerca
        </button>
      </div>
    </section>
  )
}