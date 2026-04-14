'use client'

import { ChangeEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type NewsItem = {
  id: string
  source_type: 'manual' | 'facebook'
  facebook_post_id: string | null
  slug: string | null
  title: string | null
  brief: string | null
  content: string | null
  image_url: string | null
  external_url: string | null
  source_name: string | null
  source_url: string | null
  author_name: string | null
  is_visible: boolean
  is_pinned: boolean
  pin_order: number | null
  sort_order: number
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
  updated_at: string
}

type Props = {
  items: NewsItem[]
}

const AUTHORS = [
  'Gianfederico Belotti',
  "Omar Martalo'",
  'Francesca',
  'Area Immobiliare',
]

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function formatDate(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminNewsManager({ items }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [createForm, setCreateForm] = useState({
    title: '',
    brief: '',
    content: '',
    author_name: 'Area Immobiliare',
    source_name: '',
    source_url: '',
    external_url: '',
    status: 'published',
    sort_order: '0',
    image_url: '',
  })

  const [isUploadingCreateImage, setIsUploadingCreateImage] = useState(false)

  const visibleCount = useMemo(
    () => items.filter((item) => item.is_visible).length,
    [items]
  )

  const pinnedCount = useMemo(
    () => items.filter((item) => item.is_pinned).length,
    [items]
  )

  const uploadNewsImage = async (file: File) => {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `news-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const filePath = `news/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage.from('property-media').getPublicUrl(filePath)
    return data.publicUrl
  }

  const onCreateImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Carica un file immagine valido.')
      return
    }

    try {
      setIsUploadingCreateImage(true)
      const imageUrl = await uploadNewsImage(file)
      setCreateForm((prev) => ({ ...prev, image_url: imageUrl }))
    } catch (error) {
      console.error(error)
      alert("Errore durante l'upload immagine.")
    } finally {
      setIsUploadingCreateImage(false)
    }
  }

  const handleCreate = () => {
    if (!createForm.title.trim()) {
      alert('Inserisci il titolo della news.')
      return
    }

    startTransition(async () => {
      const slug = slugify(createForm.title)

      const { error } = await supabase.from('news_items').insert({
        source_type: 'manual',
        slug,
        title: createForm.title.trim(),
        brief: createForm.brief.trim() || null,
        content: createForm.content.trim() || null,
        author_name: createForm.author_name || null,
        source_name: createForm.source_name.trim() || null,
        source_url: createForm.source_url.trim() || null,
        external_url: createForm.external_url.trim() || null,
        image_url: createForm.image_url.trim() || null,
        is_visible: true,
        is_pinned: false,
        pin_order: null,
        sort_order: Number(createForm.sort_order || 0),
        status: createForm.status === 'draft' ? 'draft' : 'published',
        published_at:
          createForm.status === 'published' ? new Date().toISOString() : null,
      })

      if (error) {
        alert(error.message)
        return
      }

      setCreateForm({
        title: '',
        brief: '',
        content: '',
        author_name: 'Area Immobiliare',
        source_name: '',
        source_url: '',
        external_url: '',
        status: 'published',
        sort_order: '0',
        image_url: '',
      })

      router.refresh()
    })
  }

  const handleUpdate = (item: NewsItem, updates: Partial<NewsItem>) => {
    startTransition(async () => {
      const title = typeof updates.title === 'string' ? updates.title : item.title || ''
      const nextSlug = slugify(title)

      const payload = {
        ...updates,
        slug: nextSlug || item.slug,
      }

      const { error } = await supabase
        .from('news_items')
        .update(payload)
        .eq('id', item.id)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    })
  }

  const handleDelete = (id: string) => {
    const ok = window.confirm('Vuoi eliminare questa news?')
    if (!ok) return

    startTransition(async () => {
      const { error } = await supabase.from('news_items').delete().eq('id', id)

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
        News
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Gestione news pubbliche
      </h2>

      <p className="theme-admin-muted mt-3 max-w-3xl">
        Crea news manuali, gestisci ordine, autore, fonte, visibilità e apertura nel sito pubblico.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Nuova news
          </p>

          <div className="mt-5 space-y-4">
            <input
              value={createForm.title}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Titolo news"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={createForm.brief}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, brief: e.target.value }))
              }
              placeholder="Brief / occhiello"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <textarea
              rows={7}
              value={createForm.content}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Testo completo"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <select
              value={createForm.author_name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, author_name: e.target.value }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              {AUTHORS.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>

            <input
              value={createForm.source_name}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, source_name: e.target.value }))
              }
              placeholder="Fonte opzionale, es. Reuters"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={createForm.source_url}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, source_url: e.target.value }))
              }
              placeholder="Link fonte opzionale"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={createForm.external_url}
              onChange={(e) =>
                setCreateForm((prev) => ({ ...prev, external_url: e.target.value }))
              }
              placeholder="Link esterno opzionale"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <div className="space-y-3 rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.18em]">
                Immagine news
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={onCreateImageChange}
                className="theme-admin-input w-full rounded-2xl px-4 py-3 file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--site-surface-3)] file:px-3 file:py-2"
              />

              {isUploadingCreateImage && (
                <p className="text-sm text-[var(--site-text-muted)]">
                  Upload immagine in corso...
                </p>
              )}

              {createForm.image_url && (
                <div className="overflow-hidden rounded-2xl border border-[var(--site-border)]">
                  <div
                    className="h-44 w-full bg-cover bg-center"
                    style={{ backgroundImage: `url('${createForm.image_url}')` }}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <select
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, status: e.target.value }))
                }
                className="theme-admin-select w-full rounded-2xl px-4 py-3"
              >
                <option value="published">Pubblicata</option>
                <option value="draft">Bozza</option>
              </select>

              <input
                type="number"
                value={createForm.sort_order}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, sort_order: e.target.value }))
                }
                placeholder="Ordine"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <button
              type="button"
              disabled={isPending}
              onClick={handleCreate}
              className="theme-admin-button-primary w-full rounded-2xl px-5 py-3 font-medium transition hover:opacity-95 disabled:opacity-60"
            >
              Crea news
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="theme-admin-card rounded-3xl p-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Totale</p>
                <p className="mt-2 text-2xl font-semibold">{items.length}</p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Visibili</p>
                <p className="mt-2 text-2xl font-semibold">{visibleCount}</p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Pinnate</p>
                <p className="mt-2 text-2xl font-semibold">{pinnedCount}</p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Facebook</p>
                <p className="mt-2 text-2xl font-semibold">
                  {items.filter((item) => item.source_type === 'facebook').length}
                </p>
              </div>
            </div>
          </div>

          {items.length === 0 && (
            <div className="theme-admin-card rounded-3xl p-8 text-[var(--site-text-muted)]">
              Nessuna news presente.
            </div>
          )}

          {items.map((item) => (
            <NewsRow
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

function NewsRow({
  item,
  onUpdate,
  onDelete,
}: {
  item: NewsItem
  onUpdate: (item: NewsItem, updates: Partial<NewsItem>) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState({
    title: item.title || '',
    brief: item.brief || '',
    content: item.content || '',
    author_name: item.author_name || 'Area Immobiliare',
    source_name: item.source_name || '',
    source_url: item.source_url || '',
    external_url: item.external_url || '',
    image_url: item.image_url || '',
    status: item.status,
    is_visible: item.is_visible,
    is_pinned: item.is_pinned,
    pin_order: item.pin_order ? String(item.pin_order) : '',
    sort_order: String(item.sort_order ?? 0),
  })

  return (
    <article className="theme-admin-card rounded-3xl p-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
          {item.source_type}
        </span>

        <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
          {item.status}
        </span>

        {item.is_visible ? (
          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-300">
            Visibile
          </span>
        ) : (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/60">
            Nascosta
          </span>
        )}

        {item.is_pinned && (
          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-300">
            Pinnata {item.pin_order ? `#${item.pin_order}` : ''}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)]">
        <div className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)]">
          {form.image_url ? (
            <div
              className="h-44 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${form.image_url}')` }}
            />
          ) : (
            <div className="flex h-44 items-center justify-center text-sm text-[var(--site-text-faint)]">
              Nessuna immagine
            </div>
          )}
        </div>

        <div className="space-y-4">
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Titolo"
            className="theme-admin-input w-full rounded-2xl px-4 py-3"
          />

          <input
            value={form.brief}
            onChange={(e) => setForm((prev) => ({ ...prev, brief: e.target.value }))}
            placeholder="Brief"
            className="theme-admin-input w-full rounded-2xl px-4 py-3"
          />

          <textarea
            rows={6}
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            placeholder="Testo completo"
            className="theme-admin-input w-full rounded-2xl px-4 py-3"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.author_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, author_name: e.target.value }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              {AUTHORS.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>

            <input
              value={form.image_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, image_url: e.target.value }))
              }
              placeholder="URL immagine"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={form.source_name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, source_name: e.target.value }))
              }
              placeholder="Fonte"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={form.source_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, source_url: e.target.value }))
              }
              placeholder="Link fonte"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={form.external_url}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, external_url: e.target.value }))
              }
              placeholder="Link esterno"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as 'draft' | 'published',
                }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              <option value="published">Pubblicata</option>
              <option value="draft">Bozza</option>
            </select>

            <select
              value={form.is_visible ? 'true' : 'false'}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_visible: e.target.value === 'true' }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              <option value="true">Visibile</option>
              <option value="false">Nascosta</option>
            </select>

            <select
              value={form.is_pinned ? 'true' : 'false'}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_pinned: e.target.value === 'true' }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              <option value="false">Non pinnata</option>
              <option value="true">Pinnata</option>
            </select>

            <input
              type="number"
              min={1}
              max={3}
              value={form.pin_order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pin_order: e.target.value }))
              }
              placeholder="Pin"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, sort_order: e.target.value }))
              }
              placeholder="Ordine"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--site-text-faint)]">
            <span>Creata: {formatDate(item.created_at)}</span>
            <span>Aggiornata: {formatDate(item.updated_at)}</span>
            {item.published_at && <span>Pubblicata: {formatDate(item.published_at)}</span>}
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                onUpdate(item, {
                  title: form.title,
                  brief: form.brief,
                  content: form.content,
                  author_name: form.author_name,
                  source_name: form.source_name || null,
                  source_url: form.source_url || null,
                  external_url: form.external_url || null,
                  image_url: form.image_url || null,
                  status: form.status,
                  is_visible: form.is_visible,
                  is_pinned: form.is_pinned,
                  pin_order: form.is_pinned && form.pin_order ? Number(form.pin_order) : null,
                  sort_order: Number(form.sort_order || 0),
                })
              }
              className="theme-admin-button-primary rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
            >
              Salva modifiche
            </button>

            {item.slug && (
              <a
                href={`/news/${item.slug}`}
                target="_blank"
                rel="noreferrer"
                className="theme-admin-button-secondary rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
              >
                Apri news
              </a>
            )}

            <button
              type="button"
              onClick={() => onDelete(item.id)}
              className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}