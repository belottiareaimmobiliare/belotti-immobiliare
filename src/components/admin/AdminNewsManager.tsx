'use client'

import { ChangeEvent, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RichTextEditor from '@/components/admin/RichTextEditor'

type NewsMediaItem = {
  id: string
  news_item_id: string
  image_url: string
  caption: string | null
  sort_order: number
  is_cover: boolean
  created_at: string
}

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
  news_media?: NewsMediaItem[]
}

type NewsAuthor = {
  id: string
  full_name: string
  is_active: boolean
  sort_order: number
  created_at: string
}

type Props = {
  items: NewsItem[]
  authors: NewsAuthor[]
}

type ViewMode = 'cards' | 'list'
type FilterMode =
  | 'all'
  | 'visible'
  | 'draft'
  | 'pinned'
  | 'facebook'
  | 'manual'

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

function sortNewsItems(items: NewsItem[]) {
  return [...items].sort((a, b) => {
    if ((a.is_pinned ? 1 : 0) !== (b.is_pinned ? 1 : 0)) {
      return a.is_pinned ? -1 : 1
    }

    const aPin = a.pin_order ?? 9999
    const bPin = b.pin_order ?? 9999
    if (aPin !== bPin) return aPin - bPin

    const aSort = a.sort_order ?? 0
    const bSort = b.sort_order ?? 0
    if (aSort !== bSort) return aSort - bSort

    const aDate = a.published_at || a.created_at
    const bDate = b.published_at || b.created_at
    return new Date(bDate).getTime() - new Date(aDate).getTime()
  })
}

function matchesFilter(item: NewsItem, filter: FilterMode) {
  switch (filter) {
    case 'visible':
      return item.is_visible
    case 'draft':
      return item.status === 'draft'
    case 'pinned':
      return item.is_pinned
    case 'facebook':
      return item.source_type === 'facebook'
    case 'manual':
      return item.source_type === 'manual'
    default:
      return true
  }
}

function matchesSearch(item: NewsItem, search: string) {
  const q = search.trim().toLowerCase()
  if (!q) return true

  const haystack = [
    item.title || '',
    item.brief || '',
    item.content || '',
    item.author_name || '',
    item.source_name || '',
    item.external_url || '',
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}

export default function AdminNewsManager({ items, authors }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  const [filterMode, setFilterMode] = useState<FilterMode>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const defaultAuthorName =
    authors.find((author) => author.full_name === 'Area Immobiliare')?.full_name ||
    authors[0]?.full_name ||
    'Area Immobiliare'

  const [createForm, setCreateForm] = useState({
    title: '',
    brief: '',
    content: '',
    author_name: defaultAuthorName,
    source_name: '',
    source_url: '',
    external_url: '',
    status: 'published',
    sort_order: '0',
  })

  const sortedItems = useMemo(() => sortNewsItems(items), [items])

  const filteredItems = useMemo(
    () =>
      sortedItems.filter(
        (item) => matchesFilter(item, filterMode) && matchesSearch(item, searchTerm)
      ),
    [sortedItems, filterMode, searchTerm]
  )

  const visibleCount = useMemo(
    () => items.filter((item) => item.is_visible).length,
    [items]
  )

  const pinnedCount = useMemo(
    () => items.filter((item) => item.is_pinned).length,
    [items]
  )

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
        image_url: null,
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
        author_name: defaultAuthorName,
        source_name: '',
        source_url: '',
        external_url: '',
        status: 'published',
        sort_order: '0',
      })

      router.refresh()
    })
  }

  const handleUpdate = (item: NewsItem, updates: Partial<NewsItem>) => {
    startTransition(async () => {
      const title =
        typeof updates.title === 'string' ? updates.title : item.title || ''
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

  const persistOrderedList = (orderedVisibleList: NewsItem[]) => {
    startTransition(async () => {
      const completeList = [...sortedItems]

      const visibleIds = orderedVisibleList.map((item) => item.id)
      const reorderedVisible = orderedVisibleList.map((item, index) => ({
        ...item,
        sort_order: (index + 1) * 10,
      }))

      const reorderedMap = new Map(
        reorderedVisible.map((item) => [item.id, item])
      )

      const finalList = completeList.map((item) =>
        visibleIds.includes(item.id) ? reorderedMap.get(item.id)! : item
      )

      const changed = finalList.filter((item) => {
        const original = items.find((x) => x.id === item.id)
        return (original?.sort_order ?? 0) !== item.sort_order
      })

      if (changed.length === 0) return

      const results = await Promise.all(
        changed.map((item) =>
          supabase
            .from('news_items')
            .update({ sort_order: item.sort_order })
            .eq('id', item.id)
        )
      )

      const failed = results.find((r) => r.error)
      if (failed?.error) {
        alert(failed.error.message)
        return
      }

      router.refresh()
    })
  }

  const moveItem = (itemId: string, direction: -1 | 1) => {
    const list = [...filteredItems]
    const currentIndex = list.findIndex((item) => item.id === itemId)
    if (currentIndex === -1) return

    const nextIndex = currentIndex + direction
    if (nextIndex < 0 || nextIndex >= list.length) return

    ;[list[currentIndex], list[nextIndex]] = [
      list[nextIndex],
      list[currentIndex],
    ]
    persistOrderedList(list)
  }

  const handleDropReorder = (targetId: string) => {
    if (!draggedId || draggedId === targetId) {
      setDraggedId(null)
      return
    }

    const list = [...filteredItems]
    const fromIndex = list.findIndex((item) => item.id === draggedId)
    const toIndex = list.findIndex((item) => item.id === targetId)

    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null)
      return
    }

    const [moved] = list.splice(fromIndex, 1)
    list.splice(toIndex, 0, moved)

    setDraggedId(null)
    persistOrderedList(list)
  }

  return (
    <section className="min-w-0 overflow-x-hidden text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        News
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Gestione news pubbliche
      </h2>

      <p className="theme-admin-muted mt-3 max-w-3xl">
        Crea news manuali, gestisci ordine, autore, fonte, visibilità, pin e fino
        a 10 immagini per news.
      </p>

      <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <div className="theme-admin-card rounded-3xl p-6">
            <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
              Nuova news manuale
            </p>

            <div className="mt-5 space-y-4">
              <input
                value={createForm.title}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="Titolo news"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />

              <input
                value={createForm.brief}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    brief: e.target.value,
                  }))
                }
                placeholder="Brief / occhiello"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />

              <RichTextEditor
                value={createForm.content}
                onChange={(value) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    content: value,
                  }))
                }
                placeholder="Testo completo della news"
              />

              <select
                value={createForm.author_name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    author_name: e.target.value,
                  }))
                }
                className="theme-admin-select w-full rounded-2xl px-4 py-3"
              >
                {authors.map((author) => (
                  <option key={author.id} value={author.full_name}>
                    {author.full_name}
                  </option>
                ))}
              </select>

              <input
                value={createForm.source_name}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    source_name: e.target.value,
                  }))
                }
                placeholder="Fonte opzionale, es. Reuters"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />

              <input
                value={createForm.source_url}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    source_url: e.target.value,
                  }))
                }
                placeholder="Link fonte opzionale"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />

              <input
                value={createForm.external_url}
                onChange={(e) =>
                  setCreateForm((prev) => ({
                    ...prev,
                    external_url: e.target.value,
                  }))
                }
                placeholder="Link esterno opzionale"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <select
                  value={createForm.status}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
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
                    setCreateForm((prev) => ({
                      ...prev,
                      sort_order: e.target.value,
                    }))
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
        </div>

        <div className="min-w-0 space-y-6">
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

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === 'cards'
                    ? 'theme-admin-chip-active'
                    : 'theme-admin-button-secondary'
                }`}
              >
                Vista card
              </button>

              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                  viewMode === 'list'
                    ? 'theme-admin-chip-active'
                    : 'theme-admin-button-secondary'
                }`}
              >
                Vista lista
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'Tutte' },
                { key: 'visible', label: 'Visibili' },
                { key: 'draft', label: 'Bozze' },
                { key: 'pinned', label: 'Pinnate' },
                { key: 'facebook', label: 'Facebook' },
                { key: 'manual', label: 'Manuali' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilterMode(item.key as FilterMode)}
                  className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                    filterMode === item.key
                      ? 'theme-admin-chip-active'
                      : 'theme-admin-button-secondary'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cerca per titolo, autore, fonte, brief o contenuto..."
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>
          </div>

          {filteredItems.length === 0 && (
            <div className="theme-admin-card rounded-3xl p-8 text-[var(--site-text-muted)]">
              Nessuna news presente per questo filtro o ricerca.
            </div>
          )}

          {viewMode === 'cards' ? (
            filteredItems.map((item) => (
              <NewsRow
                key={item.id}
                item={item}
                authors={authors}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div className="theme-admin-card overflow-hidden rounded-3xl">
              <div className="grid grid-cols-[52px_minmax(0,1fr)_160px_110px_160px] gap-4 border-b border-[var(--site-border)] px-5 py-4 text-xs uppercase tracking-[0.18em] text-[var(--site-text-faint)]">
                <div />
                <div>Titolo</div>
                <div>Data</div>
                <div>Stato</div>
                <div>Ordine</div>
              </div>

              <div className="divide-y divide-[var(--site-border)]">
                {filteredItems.map((item, index) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={() => setDraggedId(item.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropReorder(item.id)}
                    className={`grid grid-cols-[52px_minmax(0,1fr)_160px_110px_160px] gap-4 px-5 py-4 transition ${
                      draggedId === item.id
                        ? 'bg-[var(--site-surface-3)]'
                        : 'hover:bg-[var(--site-surface-2)]'
                    }`}
                  >
                    <div className="flex items-center">
                      <button
                        type="button"
                        className="theme-admin-button-secondary flex h-10 w-10 cursor-grab items-center justify-center rounded-xl text-sm"
                        title="Trascina per riordinare"
                      >
                        ⋮⋮
                      </button>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="truncate text-sm font-medium text-[var(--site-text)]">
                          {item.title || 'News senza titolo'}
                        </p>

                        {item.slug && (
                          <a
                            href={`/news/${item.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="theme-admin-button-secondary rounded-xl px-3 py-1.5 text-xs"
                          >
                            Apri
                          </a>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="theme-admin-chip rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.16em]">
                          {item.source_type}
                        </span>

                        {item.is_pinned && (
                          <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-amber-300">
                            Pinnata
                          </span>
                        )}

                        {item.is_visible ? (
                          <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-300">
                            Visibile
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] text-[var(--site-text-faint)]">
                            Nascosta
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-sm text-[var(--site-text-muted)]">
                      {formatDate(item.published_at || item.created_at)}
                    </div>

                    <div className="text-sm text-[var(--site-text-soft)]">
                      {item.status}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => moveItem(item.id, -1)}
                        disabled={isPending || index === 0}
                        className="theme-admin-button-secondary rounded-xl px-3 py-2 text-xs disabled:opacity-50"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        onClick={() => moveItem(item.id, 1)}
                        disabled={isPending || index === filteredItems.length - 1}
                        className="theme-admin-button-secondary rounded-xl px-3 py-2 text-xs disabled:opacity-50"
                      >
                        ↓
                      </button>

                      <span className="min-w-[34px] text-center text-xs text-[var(--site-text-faint)]">
                        {item.sort_order ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function NewsRow({
  item,
  authors,
  onUpdate,
  onDelete,
}: {
  item: NewsItem
  authors: NewsAuthor[]
  onUpdate: (item: NewsItem, updates: Partial<NewsItem>) => void
  onDelete: (id: string) => void
}) {
  const supabase = createClient()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const media = (item.news_media || []).slice().sort((a, b) => {
    if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
      return a.is_cover ? -1 : 1
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const cover = media.find((m) => m.is_cover) || media[0] || null
  const totalImages = media.length

  const [form, setForm] = useState({
    title: item.title || '',
    brief: item.brief || '',
    content: item.content || '',
    author_name: item.author_name || authors[0]?.full_name || 'Area Immobiliare',
    source_name: item.source_name || '',
    source_url: item.source_url || '',
    external_url: item.external_url || '',
    status: item.status,
    is_visible: item.is_visible,
    is_pinned: item.is_pinned,
    pin_order: item.pin_order ? String(item.pin_order) : '',
    sort_order: String(item.sort_order ?? 0),
  })

  const [externalImageUrl, setExternalImageUrl] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  const uploadNewsImage = async (file: File) => {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `news-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`
    const filePath = `news/${item.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('property-media')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const { data } = supabase.storage
      .from('property-media')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const addMediaRecord = async (imageUrl: string) => {
    if (totalImages >= 10) {
      alert('Puoi inserire al massimo 10 immagini per news.')
      return
    }

    const { error } = await supabase.from('news_media').insert({
      news_item_id: item.id,
      image_url: imageUrl,
      caption: null,
      sort_order: totalImages + 1,
      is_cover: totalImages === 0,
    })

    if (error) {
      throw error
    }
  }

  const handleUploadImage = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (totalImages >= 10) {
      alert('Puoi inserire al massimo 10 immagini per news.')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Carica un file immagine valido.')
      return
    }

    try {
      setIsUploadingImage(true)
      const imageUrl = await uploadNewsImage(file)
      await addMediaRecord(imageUrl)
      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Errore durante l'upload immagine.")
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleAddExternalImage = () => {
    if (!externalImageUrl.trim()) {
      alert('Inserisci un URL immagine.')
      return
    }

    if (totalImages >= 10) {
      alert('Puoi inserire al massimo 10 immagini per news.')
      return
    }

    startTransition(async () => {
      const { error } = await supabase.from('news_media').insert({
        news_item_id: item.id,
        image_url: externalImageUrl.trim(),
        caption: null,
        sort_order: totalImages + 1,
        is_cover: totalImages === 0,
      })

      if (error) {
        alert(error.message)
        return
      }

      setExternalImageUrl('')
      router.refresh()
    })
  }

  const handleSetCover = (mediaId: string) => {
    startTransition(async () => {
      const { error: clearError } = await supabase
        .from('news_media')
        .update({ is_cover: false })
        .eq('news_item_id', item.id)

      if (clearError) {
        alert(clearError.message)
        return
      }

      const { error } = await supabase
        .from('news_media')
        .update({ is_cover: true })
        .eq('id', mediaId)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    })
  }

  const handleDeleteMedia = (mediaId: string) => {
    const ok = window.confirm('Vuoi eliminare questa immagine?')
    if (!ok) return

    startTransition(async () => {
      const { error } = await supabase.from('news_media').delete().eq('id', mediaId)

      if (error) {
        alert(error.message)
        return
      }

      router.refresh()
    })
  }

  return (
    <article className="theme-admin-card min-w-0 rounded-3xl p-6">
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

        <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
          {totalImages}/10 immagini
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)]">
            {cover ? (
              <div
                className="h-52 w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${cover.image_url}')` }}
              />
            ) : (
              <div className="flex h-52 items-center justify-center text-sm text-[var(--site-text-faint)]">
                Nessuna copertina
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
            <p className="theme-admin-faint text-xs uppercase tracking-[0.18em]">
              Aggiungi immagini
            </p>

            <div className="mt-3 space-y-3">
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadImage}
                disabled={isUploadingImage || totalImages >= 10}
                className="theme-admin-input w-full rounded-2xl px-4 py-3 file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--site-surface-3)] file:px-3 file:py-2 disabled:opacity-60"
              />

              {isUploadingImage && (
                <p className="text-sm text-[var(--site-text-muted)]">
                  Upload immagine in corso...
                </p>
              )}

              <input
                value={externalImageUrl}
                onChange={(e) => setExternalImageUrl(e.target.value)}
                placeholder="Oppure URL immagine"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
                disabled={totalImages >= 10}
              />

              <button
                type="button"
                onClick={handleAddExternalImage}
                disabled={isPending || totalImages >= 10}
                className="theme-admin-button-secondary w-full rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-95 disabled:opacity-60"
              >
                Aggiungi da URL
              </button>
            </div>
          </div>
        </div>

        <div className="min-w-0 space-y-4">
          <input
            value={form.title}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="Titolo"
            className="theme-admin-input w-full rounded-2xl px-4 py-3"
          />

          <input
            value={form.brief}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, brief: e.target.value }))
            }
            placeholder="Brief"
            className="theme-admin-input w-full rounded-2xl px-4 py-3"
          />

          <RichTextEditor
            value={form.content}
            onChange={(value) =>
              setForm((prev) => ({ ...prev, content: value }))
            }
            placeholder="Testo completo"
          />

          <div className="grid gap-4 md:grid-cols-2">
            <select
              value={form.author_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  author_name: e.target.value,
                }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              {authors.map((author) => (
                <option key={author.id} value={author.full_name}>
                  {author.full_name}
                </option>
              ))}
            </select>

            <input
              value={form.external_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  external_url: e.target.value,
                }))
              }
              placeholder="Link esterno"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              value={form.source_name}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  source_name: e.target.value,
                }))
              }
              placeholder="Fonte"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              value={form.source_url}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  source_url: e.target.value,
                }))
              }
              placeholder="Link fonte"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />

            <input
              type="number"
              value={form.sort_order}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  sort_order: e.target.value,
                }))
              }
              placeholder="Ordine"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-4">
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
                setForm((prev) => ({
                  ...prev,
                  is_visible: e.target.value === 'true',
                }))
              }
              className="theme-admin-select w-full rounded-2xl px-4 py-3"
            >
              <option value="true">Visibile</option>
              <option value="false">Nascosta</option>
            </select>

            <select
              value={form.is_pinned ? 'true' : 'false'}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  is_pinned: e.target.value === 'true',
                }))
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
                setForm((prev) => ({
                  ...prev,
                  pin_order: e.target.value,
                }))
              }
              placeholder="Pin"
              className="theme-admin-input w-full rounded-2xl px-4 py-3"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--site-text-faint)]">
            <span>Creata: {formatDate(item.created_at)}</span>
            <span>Aggiornata: {formatDate(item.updated_at)}</span>
            {item.published_at && (
              <span>Pubblicata: {formatDate(item.published_at)}</span>
            )}
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
                  image_url: cover?.image_url || null,
                  status: form.status,
                  is_visible: form.is_visible,
                  is_pinned: form.is_pinned,
                  pin_order:
                    form.is_pinned && form.pin_order
                      ? Number(form.pin_order)
                      : null,
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

          {media.length > 0 && (
            <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
              <p className="theme-admin-faint text-xs uppercase tracking-[0.18em]">
                Galleria news
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {media.map((m, index) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-3)]"
                  >
                    <div
                      className="h-36 w-full bg-cover bg-center"
                      style={{ backgroundImage: `url('${m.image_url}')` }}
                    />

                    <div className="space-y-2 p-3">
                      <p className="text-xs text-[var(--site-text-faint)]">
                        Immagine {index + 1}
                      </p>

                      {m.is_cover ? (
                        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300">
                          Copertina attiva
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetCover(m.id)}
                          disabled={isPending}
                          className="theme-admin-button-secondary w-full rounded-xl px-3 py-2 text-xs font-medium transition hover:opacity-95 disabled:opacity-60"
                        >
                          Imposta copertina
                        </button>
                      )}

                      <a
                        href={m.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="theme-admin-button-secondary block w-full rounded-xl px-3 py-2 text-center text-xs font-medium transition hover:opacity-95"
                      >
                        Apri immagine
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDeleteMedia(m.id)}
                        disabled={isPending}
                        className="w-full rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-300 transition hover:bg-red-500/15 disabled:opacity-60"
                      >
                        Elimina immagine
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}