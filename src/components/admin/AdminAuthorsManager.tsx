'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NewsAuthor = {
  id: string
  full_name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

type Props = {
  items: NewsAuthor[]
}

export default function AdminAuthorsManager({ items }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [newAuthor, setNewAuthor] = useState({
    full_name: '',
    sort_order: '0',
  })

  const handleCreate = () => {
    if (!newAuthor.full_name.trim()) {
      alert('Inserisci il nome autore.')
      return
    }

    startTransition(async () => {
      const { error } = await supabase.from('news_authors').insert({
        full_name: newAuthor.full_name.trim(),
        is_active: true,
        sort_order: Number(newAuthor.sort_order || 0),
      })

      if (error) {
        alert(error.message)
        return
      }

      setNewAuthor({
        full_name: '',
        sort_order: '0',
      })

      router.refresh()
    })
  }

  const handleUpdate = (id: string, updates: Partial<NewsAuthor>) => {
    startTransition(async () => {
      const { error } = await supabase
        .from('news_authors')
        .update(updates)
        .eq('id', id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    const ok = window.confirm('Vuoi eliminare questo autore?')
    if (!ok) return

    startTransition(async () => {
      const { error } = await supabase.from('news_authors').delete().eq('id', id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    })
  }

  return (
    <section className="text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        Autori
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Gestione autori news
      </h2>

      <p className="theme-admin-muted mt-3 max-w-3xl">
        Qui gestisci la lista firme disponibili nei post e nelle news.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Nuovo autore
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={newAuthor.full_name}
              onChange={(e) =>
                setNewAuthor((prev) => ({ ...prev, full_name: e.target.value }))
              }
              placeholder="Nome completo"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              type="number"
              value={newAuthor.sort_order}
              onChange={(e) =>
                setNewAuthor((prev) => ({ ...prev, sort_order: e.target.value }))
              }
              placeholder="Ordine"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <button
              type="button"
              disabled={isPending}
              onClick={handleCreate}
              className="theme-admin-button-primary w-full rounded-2xl px-5 py-3 font-medium transition hover:opacity-95 disabled:opacity-60"
            >
              Aggiungi autore
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {items.length === 0 && (
            <div className="theme-admin-card rounded-3xl p-8 text-[var(--site-text-muted)]">
              Nessun autore presente.
            </div>
          )}

          {items.map((item) => (
            <AuthorRow
              key={item.id}
              item={item}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

function AuthorRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: NewsAuthor
  onUpdate: (id: string, updates: Partial<NewsAuthor>) => void
  onDelete: (id: string) => void
}) {
  const [fullName, setFullName] = useState(item.full_name)
  const [sortOrder, setSortOrder] = useState(String(item.sort_order))
  const [isActive, setIsActive] = useState(item.is_active)

  return (
    <article className="theme-admin-card rounded-3xl p-6">
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_140px_160px]">
        <input
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="theme-admin-input w-full rounded-2xl px-4 py-3"
        />

        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="theme-admin-input w-full rounded-2xl px-4 py-3"
        />

        <select
          value={isActive ? 'true' : 'false'}
          onChange={(e) => setIsActive(e.target.value === 'true')}
          className="theme-admin-select w-full rounded-2xl px-4 py-3"
        >
          <option value="true">Attivo</option>
          <option value="false">Disattivo</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            onUpdate(item.id, {
              full_name: fullName.trim(),
              sort_order: Number(sortOrder || 0),
              is_active: isActive,
            })
          }
          className="theme-admin-button-primary rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
        >
          Salva
        </button>

        <button
          type="button"
          onClick={() => onDelete(item.id)}
          className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
        >
          Elimina
        </button>
      </div>
    </article>
  )
}