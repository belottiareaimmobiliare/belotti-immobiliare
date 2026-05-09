'use client'

import { useEffect, useState, useTransition } from 'react'

type RoleKey = 'owner' | 'secretary' | 'agent' | 'editor'

type AdminSection = {
  id: string
  label: string
  description: string
}

const roles: Array<{ id: RoleKey; label: string }> = [
  { id: 'owner', label: 'Proprietario' },
  { id: 'secretary', label: 'Segretaria' },
  { id: 'agent', label: 'Agente' },
  { id: 'editor', label: 'Editor' },
]

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

function emptySettings(): Record<RoleKey, string[]> {
  return {
    owner: [],
    secretary: [],
    agent: [],
    editor: [],
  }
}

function normalizeSettings(value: unknown): Record<RoleKey, string[]> {
  const base = emptySettings()

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return base
  }

  for (const role of roles) {
    const raw = (value as Record<string, unknown>)[role.id]

    base[role.id] = Array.isArray(raw)
      ? raw.filter((item): item is string => typeof item === 'string')
      : []
  }

  return base
}

export default function AdminRoleVisibilitySettings() {
  const [settings, setSettings] = useState<Record<RoleKey, string[]>>(emptySettings)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let active = true

    fetch('/api/admin/ui-settings', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data) => {
        if (!active) return
        setSettings(normalizeSettings(data?.hiddenSectionsByRole))
      })
      .catch((error) => {
        console.error('Errore caricamento visibilità ruoli:', error)
        setSettings(emptySettings())
      })

    return () => {
      active = false
    }
  }, [])

  function save(nextSettings: Record<RoleKey, string[]>) {
    setSettings(nextSettings)
    setMessage(null)

    startTransition(async () => {
      const response = await fetch('/api/admin/ui-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hiddenSectionsByRole: nextSettings }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setMessage(result?.error || 'Errore salvataggio visibilità menu.')
        return
      }

      setMessage('Visibilità menu salvata per tutti gli altri utenti.')
    })
  }

  function toggle(role: RoleKey, sectionId: string) {
    const currentHidden = settings[role] || []
    const nextHidden = currentHidden.includes(sectionId)
      ? currentHidden.filter((item) => item !== sectionId)
      : [...currentHidden, sectionId]

    save({
      ...settings,
      [role]: nextHidden,
    })
  }

  function applySecretaryPreset() {
    save({
      ...settings,
      secretary: ['kpi', 'exports', 'logs', 'privacy', 'autori', 'utenti'],
    })
  }

  function showEverything() {
    save(emptySettings())
  }

  return (
    <section className="mt-8 rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface)] p-5 shadow-xl shadow-black/5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
            Solo administrator
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
            Visibilità menu per ruolo
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--site-text-muted)]">
            Tu vedi sempre tutto. Da qui scegli quali sezioni nascondere agli altri ruoli admin.
            Utile per tenere pulito il gestionale della segretaria o per futuri siti immobiliari.
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
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
            onClick={showEverything}
            disabled={isPending}
            className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-[#eef2f7] disabled:opacity-60"
          >
            Mostra tutto
          </button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--site-text)]">
          {message}
        </p>
      ) : null}

      <div className="mt-5 overflow-x-auto rounded-3xl border border-[var(--site-border)]">
        <table className="min-w-[850px] w-full border-collapse text-sm">
          <thead className="bg-[var(--site-surface-strong)]">
            <tr>
              <th className="border-b border-[var(--site-border)] px-4 py-3 text-left font-semibold text-[var(--site-text)]">
                Sezione
              </th>

              {roles.map((role) => (
                <th
                  key={role.id}
                  className="border-b border-[var(--site-border)] px-4 py-3 text-center font-semibold text-[var(--site-text)]"
                >
                  {role.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {sections.map((section) => (
              <tr key={section.id} className="border-b border-[var(--site-border)] last:border-b-0">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[var(--site-text)]">{section.label}</p>
                  <p className="mt-1 text-xs text-[var(--site-text-muted)]">
                    {section.description}
                  </p>
                </td>

                {roles.map((role) => {
                  const hidden = settings[role.id]?.includes(section.id) || false

                  return (
                    <td key={role.id} className="px-4 py-3 text-center">
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--site-border)] px-3 py-2 text-xs font-semibold text-[var(--site-text-soft)] transition hover:bg-[#eef2f7] hover:text-black">
                        <input
                          type="checkbox"
                          checked={!hidden}
                          disabled={isPending}
                          onChange={() => toggle(role.id, section.id)}
                          className="h-4 w-4 accent-black"
                        />
                        Visibile
                      </label>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
