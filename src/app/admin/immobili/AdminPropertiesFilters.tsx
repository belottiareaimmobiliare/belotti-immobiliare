'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

type ContractTypeFilter = '' | 'vendita' | 'affitto'

type AdminPropertiesFiltersProps = {
  initialQuery: string
  initialStatus: string
  initialContractType: string
}

function buildAdminPropertiesUrl({
  q,
  status,
  contractType,
}: {
  q: string
  status: string
  contractType: string
}) {
  const params = new URLSearchParams()

  if (q.trim()) params.set('q', q.trim())
  if (status.trim()) params.set('status', status.trim())
  if (contractType.trim()) params.set('contractType', contractType.trim())

  const queryString = params.toString()

  return `/admin/immobili${queryString ? `?${queryString}` : ''}`
}

function contractButtonClass(active: boolean) {
  return `rounded-xl px-4 py-3 text-center text-sm font-medium transition ${
    active ? 'theme-admin-chip-active' : 'theme-admin-chip'
  }`
}

export default function AdminPropertiesFilters({
  initialQuery,
  initialStatus,
  initialContractType,
}: AdminPropertiesFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [searchValue, setSearchValue] = useState(initialQuery)
  const [statusValue, setStatusValue] = useState(initialStatus)
  const [contractTypeValue, setContractTypeValue] = useState<ContractTypeFilter>(
    initialContractType === 'vendita' || initialContractType === 'affitto'
      ? initialContractType
      : ''
  )

  const lastUrlRef = useRef(
    buildAdminPropertiesUrl({
      q: initialQuery,
      status: initialStatus,
      contractType: initialContractType,
    })
  )

  function pushFilters(next?: {
    q?: string
    status?: string
    contractType?: ContractTypeFilter
  }) {
    const nextQuery = next?.q ?? searchValue
    const nextStatus = next?.status ?? statusValue
    const nextContractType = next?.contractType ?? contractTypeValue

    const nextUrl = buildAdminPropertiesUrl({
      q: nextQuery,
      status: nextStatus,
      contractType: nextContractType,
    })

    if (nextUrl === lastUrlRef.current) return

    lastUrlRef.current = nextUrl

    startTransition(() => {
      router.replace(nextUrl, { scroll: false })
    })
  }

  useEffect(() => {
    const nextUrl = buildAdminPropertiesUrl({
      q: searchValue,
      status: statusValue,
      contractType: contractTypeValue,
    })

    if (nextUrl === lastUrlRef.current) return

    const timer = window.setTimeout(() => {
      lastUrlRef.current = nextUrl

      startTransition(() => {
        router.replace(nextUrl, { scroll: false })
      })
    }, 1000)

    return () => window.clearTimeout(timer)
  }, [contractTypeValue, router, searchValue, statusValue])

  return (
    <div className="theme-admin-card mt-8 rounded-3xl p-5 md:p-6">
      <div className="mb-5 grid max-w-md grid-cols-3 gap-2 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-1">
        <button
          type="button"
          onClick={() => {
            setContractTypeValue('')
            pushFilters({ contractType: '' })
          }}
          className={contractButtonClass(contractTypeValue === '')}
        >
          Tutti
        </button>

        <button
          type="button"
          onClick={() => {
            setContractTypeValue('vendita')
            pushFilters({ contractType: 'vendita' })
          }}
          className={contractButtonClass(contractTypeValue === 'vendita')}
        >
          Vendita
        </button>

        <button
          type="button"
          onClick={() => {
            setContractTypeValue('affitto')
            pushFilters({ contractType: 'affitto' })
          }}
          className={contractButtonClass(contractTypeValue === 'affitto')}
        >
          Affitto
        </button>
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          pushFilters()
        }}
      >
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <input
            type="text"
            name="q"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Cerca per RIF, codice, titolo, comune, provincia..."
            className="theme-admin-input rounded-2xl px-4 py-3"
          />

          <select
            name="status"
            value={statusValue}
            onChange={(event) => setStatusValue(event.target.value)}
            className="theme-admin-select rounded-2xl px-4 py-3"
          >
            <option value="">Tutti gli stati</option>
            <option value="draft">Solo bozze</option>
            <option value="published">Solo pubblicati</option>
          </select>

          <div className="flex gap-3">
            <button
              type="submit"
              className="theme-admin-button-primary flex-1 rounded-2xl px-5 py-3 font-medium transition hover:opacity-95"
            >
              Filtra ora
            </button>

            <button
              type="button"
              onClick={() => {
                setSearchValue('')
                setStatusValue('')
                setContractTypeValue('')
                lastUrlRef.current = '/admin/immobili'

                startTransition(() => {
                  router.replace('/admin/immobili', { scroll: false })
                })
              }}
              className="theme-admin-button-secondary flex-1 rounded-2xl px-5 py-3 text-center font-medium transition hover:opacity-95"
            >
              Reset
            </button>
          </div>
        </div>

        <p className="theme-admin-muted mt-3 text-xs">
          {isPending
            ? 'Filtro in aggiornamento...'
            : 'La ricerca si aggiorna automaticamente 1 secondo dopo che smetti di scrivere.'}
        </p>
      </form>
    </div>
  )
}
