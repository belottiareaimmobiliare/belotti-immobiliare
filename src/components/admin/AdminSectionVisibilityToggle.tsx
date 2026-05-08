'use client'

import { useEffect, useMemo, useState } from 'react'

type AdminSection = {
  id: string
  label: string
  description: string
  hrefs: string[]
  exactOnly?: boolean
}

const STORAGE_KEY = 'belotti-admin-hidden-sections-v1'

const sections: AdminSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Pagina iniziale area admin.',
    hrefs: ['/admin'],
    exactOnly: true,
  },
  {
    id: 'immobili',
    label: 'Immobili',
    description: 'Gestione immobili e schede.',
    hrefs: ['/admin/immobili'],
  },
  {
    id: 'news',
    label: 'News',
    description: 'Articoli, notizie e contenuti editoriali.',
    hrefs: ['/admin/news'],
  },
  {
    id: 'autori',
    label: 'Autori',
    description: 'Autori delle news.',
    hrefs: ['/admin/autori'],
  },
  {
    id: 'leads',
    label: 'Messaggi / Leads',
    description: 'Richieste arrivate dai form del sito.',
    hrefs: ['/admin/leads'],
  },
  {
    id: 'ricerche-salvate',
    label: 'Ricerche salvate',
    description: 'Utenti che vogliono ricevere immobili simili.',
    hrefs: ['/admin/ricerche-salvate'],
  },
  {
    id: 'contenuti',
    label: 'Pagine sito',
    description: 'Modifica Home, Chi siamo, Contatti e pagine testuali.',
    hrefs: ['/admin/contenuti'],
  },
  {
    id: 'utenti',
    label: 'Utenti',
    description: 'Gestione accessi admin.',
    hrefs: ['/admin/utenti'],
  },
  {
    id: 'kpi',
    label: 'KPI',
    description: 'Statistiche avanzate e controlli qualità.',
    hrefs: ['/admin/kpi'],
  },
  {
    id: 'exports',
    label: 'Export portali',
    description: 'Esportazioni tecniche verso portali.',
    hrefs: ['/admin/exports'],
  },
  {
    id: 'logs',
    label: 'Log tecnici',
    description: 'Storico tecnico attività.',
    hrefs: ['/admin/logs'],
  },
  {
    id: 'privacy',
    label: 'Privacy admin',
    description: 'Strumenti privacy interni.',
    hrefs: ['/admin/privacy'],
  },
]

function selectorsFor(section: AdminSection) {
  return section.hrefs.flatMap((href) => {
    if (section.exactOnly) {
      return [`a[href="${href}"]`]
    }

    return [
      `a[href="${href}"]`,
      `a[href^="${href}/"]`,
      `a[href^="${href}?"]`,
    ]
  })
}

export default function AdminSectionVisibilityToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds])

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []

      if (Array.isArray(parsed)) {
        setHiddenIds(parsed.filter((item) => typeof item === 'string'))
      }
    } catch {
      setHiddenIds([])
    }
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hiddenIds))
  }, [hiddenIds])

  const hiddenCss = useMemo(() => {
    const selectors = sections
      .filter((section) => hiddenSet.has(section.id))
      .flatMap(selectorsFor)

    if (selectors.length === 0) return ''

    return `
${selectors.join(',\n')} {
  display: none !important;
}
`
  }, [hiddenSet])

  function toggleSection(id: string) {
    setHiddenIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    )
  }

  function applySecretaryPreset() {
    setHiddenIds([
      'kpi',
      'exports',
      'logs',
      'privacy',
      'autori',
      'utenti',
    ])
  }

  function showAll() {
    setHiddenIds([])
  }

  return (
    <>
      {hiddenCss ? <style>{hiddenCss}</style> : null}

      <div className="fixed bottom-5 right-5 z-[120] text-[var(--site-text)]">
        {isOpen ? (
          <div className="mb-3 w-[min(420px,calc(100vw-2rem))] rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                  Solo administrator
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--site-text)]">
                  Nascondi sezioni
                </h2>
                <p className="mt-2 text-xs leading-5 text-[var(--site-text-muted)]">
                  Non cancella nulla: nasconde solo i collegamenti per provare una versione admin più semplice.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full border border-[var(--site-border)] px-3 py-1.5 text-xs font-semibold text-[var(--site-text-soft)] transition hover:bg-[#eef2f7] hover:text-black"
              >
                Chiudi
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {sections.map((section) => {
                const hidden = hiddenSet.has(section.id)

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => toggleSection(section.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      hidden
                        ? 'border-red-400/30 bg-red-500/10'
                        : 'border-emerald-400/25 bg-emerald-500/10'
                    }`}
                  >
                    <span className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-[var(--site-text)]">
                        {section.label}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${
                          hidden
                            ? 'bg-red-500/15 text-red-300'
                            : 'bg-emerald-500/15 text-emerald-300'
                        }`}
                      >
                        {hidden ? 'Nascosta' : 'Visibile'}
                      </span>
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-[var(--site-text-muted)]">
                      {section.description}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={applySecretaryPreset}
                className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--site-text-soft)] transition hover:bg-[#eef2f7] hover:text-black"
              >
                Preset segretaria
              </button>

              <button
                type="button"
                onClick={showAll}
                className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7]"
              >
                Mostra tutto
              </button>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setIsOpen((value) => !value)}
          className="rounded-full border border-[var(--site-border)] bg-white px-5 py-3 text-sm font-semibold text-black shadow-2xl shadow-black/25 transition hover:bg-[#eef2f7]"
        >
          Nascondi sezioni
          {hiddenIds.length > 0 ? (
            <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
              {hiddenIds.length}
            </span>
          ) : null}
        </button>
      </div>
    </>
  )
}
