'use client'

import { useEffect, useState, useTransition } from 'react'

type AdminSection = {
  id: string
  label: string
  description: string
}

const sections: AdminSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Pagina iniziale area admin.',
  },
  {
    id: 'immobili',
    label: 'Immobili',
    description: 'Gestione immobili e schede.',
  },
  {
    id: 'news',
    label: 'News',
    description: 'Articoli, notizie e contenuti editoriali.',
  },
  {
    id: 'autori',
    label: 'Autori',
    description: 'Autori delle news.',
  },
  {
    id: 'leads',
    label: 'Messaggi / Leads',
    description: 'Richieste arrivate dai form del sito.',
  },
  {
    id: 'ricerche-salvate',
    label: 'Ricerche salvate',
    description: 'Utenti che vogliono ricevere immobili simili.',
  },
  {
    id: 'contenuti',
    label: 'Pagine sito',
    description: 'Modifica Home, Chi siamo, Contatti e pagine testuali.',
  },
  {
    id: 'utenti',
    label: 'Utenti',
    description: 'Gestione accessi admin.',
  },
  {
    id: 'kpi',
    label: 'KPI',
    description: 'Statistiche avanzate e controlli qualità.',
  },
  {
    id: 'exports',
    label: 'Export portali',
    description: 'Esportazioni tecniche verso portali.',
  },
  {
    id: 'logs',
    label: 'Log tecnici',
    description: 'Storico tecnico attività.',
  },
  {
    id: 'privacy',
    label: 'Privacy admin',
    description: 'Strumenti privacy interni.',
  },
]

export default function AdminSectionVisibilityToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let active = true

    fetch('/api/admin/ui-settings', {
      cache: 'no-store',
    })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return

        const nextHiddenIds = Array.isArray(data?.hiddenSections)
          ? data.hiddenSections.filter((item: unknown) => typeof item === 'string')
          : []

        setHiddenIds(nextHiddenIds)
      })
      .catch((error) => {
        console.error('Errore caricamento impostazioni admin:', error)
        setHiddenIds([])
      })

    return () => {
      active = false
    }
  }, [])

  function saveHiddenSections(nextHiddenIds: string[]) {
    setHiddenIds(nextHiddenIds)
    setMessage(null)

    startTransition(async () => {
      const response = await fetch('/api/admin/ui-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hiddenSections: nextHiddenIds,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setMessage(result?.error || 'Errore salvataggio impostazioni.')
        return
      }

      setMessage('Impostazioni salvate. Gli altri utenti vedranno il menu semplificato.')
    })
  }

  function toggleSection(id: string) {
    const nextHiddenIds = hiddenIds.includes(id)
      ? hiddenIds.filter((item) => item !== id)
      : [...hiddenIds, id]

    saveHiddenSections(nextHiddenIds)
  }

  function applySecretaryPreset() {
    saveHiddenSections([
      'kpi',
      'exports',
      'logs',
      'privacy',
      'autori',
      'utenti',
    ])
  }

  function showAllForOthers() {
    saveHiddenSections([])
  }

  return (
    <div className="fixed bottom-5 right-5 z-[120] text-[var(--site-text)]">
      {isOpen ? (
        <div className="mb-3 w-[min(430px,calc(100vw-2rem))] rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-4 shadow-2xl shadow-black/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                Solo administrator
              </p>
              <h2 className="mt-1 text-lg font-semibold text-[var(--site-text)]">
                Nascondi sezioni agli altri
              </h2>
              <p className="mt-2 text-xs leading-5 text-[var(--site-text-muted)]">
                Tu continui a vedere tutto. Le sezioni selezionate vengono nascoste nel menu degli altri utenti admin.
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

          {message ? (
            <p className="mt-3 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-xs leading-5 text-[var(--site-text)]">
              {message}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2">
            {sections.map((section) => {
              const hidden = hiddenIds.includes(section.id)

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  disabled={isPending}
                  className={`rounded-2xl border px-4 py-3 text-left transition disabled:opacity-60 ${
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
                      {hidden ? 'Nascosta agli altri' : 'Visibile agli altri'}
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
              disabled={isPending}
              className="rounded-full border border-[var(--site-border)] bg-[var(--site-surface-strong)] px-4 py-3 text-sm font-semibold text-[var(--site-text-soft)] transition hover:bg-[#eef2f7] hover:text-black disabled:opacity-60"
            >
              Preset segretaria
            </button>

            <button
              type="button"
              onClick={showAllForOthers}
              disabled={isPending}
              className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:opacity-60"
            >
              Mostra tutto agli altri
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        className="rounded-full border border-[var(--site-border)] bg-white px-5 py-3 text-sm font-semibold text-black shadow-2xl shadow-black/25 transition hover:bg-[#eef2f7]"
      >
        Nascondi sezioni altri
        {hiddenIds.length > 0 ? (
          <span className="ml-2 rounded-full bg-black px-2 py-0.5 text-xs text-white">
            {hiddenIds.length}
          </span>
        ) : null}
      </button>
    </div>
  )
}
