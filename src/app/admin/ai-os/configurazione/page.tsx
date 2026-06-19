'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'

type CheckSection = {
  id: string
  section_key: string
  title: string
  description: string | null
  sort_order: number
  is_active: boolean
}

type CheckItem = {
  id: string
  section_key: string
  item_key: string
  item_label: string
  group_label: string | null
  is_required: boolean
  sort_order: number
  is_active: boolean
}

export default function AIOSConfigurazionePage() {
  const [sections, setSections] = useState<CheckSection[]>([])
  const [items, setItems] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [notice, setNotice] = useState('')

  const [newSectionKey, setNewSectionKey] = useState('documents')
  const [newGroupLabel, setNewGroupLabel] = useState('')
  const [newItemLabel, setNewItemLabel] = useState('')
  const [newRequired, setNewRequired] = useState(false)

  const itemsBySection = useMemo(() => {
    const map = new Map<string, CheckItem[]>()

    for (const item of items) {
      const list = map.get(item.section_key) ?? []
      list.push(item)
      map.set(item.section_key, list)
    }

    return map
  }, [items])

  async function loadChecks() {
    setLoading(true)
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/config/checks', {
        cache: 'no-store',
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore caricamento check')
      }

      setSections(payload?.sections ?? [])
      setItems(payload?.items ?? [])

      const firstSection = payload?.sections?.[0]?.section_key
      if (firstSection && !newSectionKey) {
        setNewSectionKey(firstSection)
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore caricamento check')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadChecks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveItem(item: CheckItem) {
    setSaving(item.id)
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/config/checks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          itemLabel: item.item_label,
          groupLabel: item.group_label,
          isRequired: item.is_required,
          isActive: item.is_active,
          sortOrder: item.sort_order,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore salvataggio check')
      }

      setNotice('Check salvato.')
      await loadChecks()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore salvataggio check')
    } finally {
      setSaving('')
    }
  }

  async function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving('new')
    setNotice('')

    try {
      const response = await fetch('/api/admin/ai-os/config/checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: newSectionKey,
          groupLabel: newGroupLabel,
          itemLabel: newItemLabel,
          isRequired: newRequired,
          isActive: true,
          sortOrder: items.length + 10,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(payload?.error || 'Errore creazione check')
      }

      setNewGroupLabel('')
      setNewItemLabel('')
      setNewRequired(false)
      setNotice('Nuovo check aggiunto.')
      await loadChecks()
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Errore creazione check')
    } finally {
      setSaving('')
    }
  }

  return (
    <main className="theme-admin-page min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="theme-admin-card rounded-[2rem] border p-6">
          <p className="theme-admin-faint text-xs font-semibold uppercase tracking-[0.35em]">
            AI-OS
          </p>

          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Configurazione check strumenti
              </h1>
              <p className="theme-admin-muted mt-2 max-w-3xl text-sm leading-6">
                Qui modifichi le checklist operative usate da Documenti agenzia,
                Pratiche e Social. I check salvati qui saranno poi agganciati agli
                strumenti AI-OS.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/admin/ai-os"
                className="theme-admin-button-secondary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Torna ad AI-OS
              </a>
              <a
                href="/admin/ai-os/strumenti"
                className="theme-admin-button-primary rounded-full px-5 py-3 text-sm font-semibold"
              >
                Apri strumenti
              </a>
            </div>
          </div>

          {notice ? (
            <div className="mt-5 rounded-2xl border border-[#8FBCBB]/30 bg-[#8FBCBB]/10 px-4 py-3 text-sm text-[#D8DEE9]">
              {notice}
            </div>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="theme-admin-card rounded-[2rem] border p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="theme-admin-faint text-xs font-semibold uppercase tracking-[0.3em]">
                  Checklist
                </p>
                <h2 className="mt-2 text-2xl font-black">Check modificabili</h2>
              </div>

              <button
                type="button"
                onClick={() => void loadChecks()}
                className="theme-admin-button-secondary rounded-full px-4 py-2 text-sm font-semibold"
              >
                Aggiorna
              </button>
            </div>

            {loading ? (
              <p className="theme-admin-muted mt-6 text-sm">Caricamento...</p>
            ) : (
              <div className="mt-6 space-y-7">
                {sections.map((section) => {
                  const sectionItems = itemsBySection.get(section.section_key) ?? []

                  return (
                    <div
                      key={section.id}
                      className="rounded-3xl border border-[var(--site-border)] bg-[var(--site-surface-strong)] p-5"
                    >
                      <div>
                        <h3 className="text-xl font-black">{section.title}</h3>
                        <p className="theme-admin-muted mt-1 text-sm">
                          {section.description}
                        </p>
                        <p className="theme-admin-faint mt-2 text-xs uppercase tracking-[0.2em]">
                          {section.section_key}
                        </p>
                      </div>

                      <div className="mt-5 space-y-3">
                        {sectionItems.map((item) => (
                          <div
                            key={item.id}
                            className="grid gap-3 rounded-2xl border border-[var(--site-border)] bg-black/10 p-4 lg:grid-cols-[1fr_190px_90px_90px_90px] lg:items-center"
                          >
                            <input
                              value={item.item_label}
                              onChange={(event) => {
                                const value = event.target.value
                                setItems((current) =>
                                  current.map((currentItem) =>
                                    currentItem.id === item.id
                                      ? { ...currentItem, item_label: value }
                                      : currentItem,
                                  ),
                                )
                              }}
                              className="theme-admin-input rounded-xl px-4 py-3 text-sm"
                            />

                            <input
                              value={item.group_label ?? ''}
                              onChange={(event) => {
                                const value = event.target.value
                                setItems((current) =>
                                  current.map((currentItem) =>
                                    currentItem.id === item.id
                                      ? { ...currentItem, group_label: value }
                                      : currentItem,
                                  ),
                                )
                              }}
                              placeholder="Gruppo"
                              className="theme-admin-input rounded-xl px-4 py-3 text-sm"
                            />

                            <label className="flex items-center gap-2 text-sm font-semibold">
                              <input
                                type="checkbox"
                                checked={item.is_required}
                                onChange={(event) => {
                                  const checked = event.target.checked
                                  setItems((current) =>
                                    current.map((currentItem) =>
                                      currentItem.id === item.id
                                        ? { ...currentItem, is_required: checked }
                                        : currentItem,
                                    ),
                                  )
                                }}
                              />
                              Obbl.
                            </label>

                            <label className="flex items-center gap-2 text-sm font-semibold">
                              <input
                                type="checkbox"
                                checked={item.is_active}
                                onChange={(event) => {
                                  const checked = event.target.checked
                                  setItems((current) =>
                                    current.map((currentItem) =>
                                      currentItem.id === item.id
                                        ? { ...currentItem, is_active: checked }
                                        : currentItem,
                                    ),
                                  )
                                }}
                              />
                              Attivo
                            </label>

                            <button
                              type="button"
                              onClick={() => void saveItem(item)}
                              disabled={saving === item.id}
                              className="theme-admin-button-primary rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
                            >
                              {saving === item.id ? 'Salvo...' : 'Salva'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <form onSubmit={addItem} className="theme-admin-card h-fit rounded-[2rem] border p-6">
            <p className="theme-admin-faint text-xs font-semibold uppercase tracking-[0.3em]">
              Nuovo check
            </p>
            <h2 className="mt-2 text-2xl font-black">Aggiungi voce</h2>

            <div className="mt-5 space-y-3">
              <select
                value={newSectionKey}
                onChange={(event) => setNewSectionKey(event.target.value)}
                className="theme-admin-select w-full rounded-xl px-4 py-3 text-sm"
              >
                {sections.map((section) => (
                  <option key={section.id} value={section.section_key}>
                    {section.title}
                  </option>
                ))}
              </select>

              <input
                value={newGroupLabel}
                onChange={(event) => setNewGroupLabel(event.target.value)}
                placeholder="Gruppo, es. Catasto"
                className="theme-admin-input w-full rounded-xl px-4 py-3 text-sm"
              />

              <input
                value={newItemLabel}
                onChange={(event) => setNewItemLabel(event.target.value)}
                placeholder="Nome check"
                className="theme-admin-input w-full rounded-xl px-4 py-3 text-sm"
              />

              <label className="flex items-center gap-2 text-sm font-semibold">
                <input
                  type="checkbox"
                  checked={newRequired}
                  onChange={(event) => setNewRequired(event.target.checked)}
                />
                Obbligatorio
              </label>

              <button
                type="submit"
                disabled={saving === 'new'}
                className="theme-admin-button-primary w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-50"
              >
                {saving === 'new' ? 'Aggiungo...' : 'Aggiungi check'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
