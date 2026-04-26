'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, useTransition } from 'react'

type LeadStatus = 'new' | 'contacted' | 'closed' | 'archived'

type LeadsFiltersProps = {
  selectedStatus: 'all' | LeadStatus
  searchQuery: string
  filteredCount: number
  totalCount: number
}

const filterStatusOptions: Array<{ value: 'all' | LeadStatus; label: string }> = [
  { value: 'all', label: 'Tutti gli stati' },
  { value: 'new', label: 'Nuovi' },
  { value: 'contacted', label: 'Contattati' },
  { value: 'closed', label: 'Chiusi' },
  { value: 'archived', label: 'Archiviati' },
]

export default function LeadsFilters({
  selectedStatus,
  searchQuery,
  filteredCount,
  totalCount,
}: LeadsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const firstRun = useRef(true)
  const [isPending, startTransition] = useTransition()

  const [status, setStatus] = useState(selectedStatus)
  const [query, setQuery] = useState(searchQuery)

  const activeFilters = status !== 'all' || query.trim().length > 0

  useEffect(() => {
    setStatus(selectedStatus)
    setQuery(searchQuery)
  }, [selectedStatus, searchQuery])

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }

    const timer = window.setTimeout(() => {
      const params = new URLSearchParams()

      if (status !== 'all') {
        params.set('status', status)
      }

      if (query.trim()) {
        params.set('q', query.trim())
      }

      const nextUrl = params.toString()
        ? `${pathname}?${params.toString()}`
        : pathname

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [status, query, pathname, router])

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/35">
            Ricerca e filtri
          </p>
          <h2 className="mt-2 text-xl font-semibold text-white">
            Trova rapidamente una richiesta
          </h2>
          <p className="mt-2 text-sm text-white/50">
            Risultati visualizzati: {filteredCount} su {totalCount}
            {isPending ? ' · aggiornamento...' : ''}
          </p>
        </div>

        {activeFilters ? (
          <Link
            href="/admin/leads"
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Pulisci filtri
          </Link>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as 'all' | LeadStatus)}
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-white/30"
        >
          {filterStatusOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-950">
              {option.label}
            </option>
          ))}
        </select>

        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Cerca nome, email, telefono, messaggio o immobile..."
          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30"
        />
      </div>

      <p className="mt-3 text-xs text-white/35">
        I filtri si applicano automaticamente dopo 1 secondo.
      </p>
    </section>
  )
}
