import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<{
  status?: string
  visible?: string
  source?: string
}>

type NewsItem = {
  id: string
  source_type: 'manual' | 'facebook'
  facebook_post_id: string | null
  title: string | null
  excerpt: string | null
  content: string | null
  image_url: string | null
  external_url: string | null
  is_visible: boolean
  is_pinned: boolean
  pin_order: number | null
  sort_order: number
  status: 'draft' | 'published'
  published_at: string | null
  facebook_created_at: string | null
  created_at: string
  updated_at: string
}

async function createManualNews(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const title = String(formData.get('title') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim()
  const content = String(formData.get('content') || '').trim()
  const imageUrl = String(formData.get('image_url') || '').trim()
  const externalUrl = String(formData.get('external_url') || '').trim()
  const status = String(formData.get('status') || 'published') as 'draft' | 'published'
  const sortOrder = Number(formData.get('sort_order') || 0)

  if (!title) {
    throw new Error('Titolo obbligatorio')
  }

  const { error } = await supabase.from('news_items').insert({
    source_type: 'manual',
    title,
    excerpt: excerpt || null,
    content: content || null,
    image_url: imageUrl || null,
    external_url: externalUrl || null,
    status,
    is_visible: true,
    is_pinned: false,
    pin_order: null,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    published_at: status === 'published' ? new Date().toISOString() : null,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

async function updateNewsItem(formData: FormData) {
  'use server'

  const supabase = await createClient()

  const id = String(formData.get('id') || '')
  const title = String(formData.get('title') || '').trim()
  const excerpt = String(formData.get('excerpt') || '').trim()
  const content = String(formData.get('content') || '').trim()
  const imageUrl = String(formData.get('image_url') || '').trim()
  const externalUrl = String(formData.get('external_url') || '').trim()
  const status = String(formData.get('status') || 'published') as 'draft' | 'published'
  const sortOrder = Number(formData.get('sort_order') || 0)
  const isVisible = String(formData.get('is_visible') || 'false') === 'true'
  const isPinned = String(formData.get('is_pinned') || 'false') === 'true'
  const rawPinOrder = String(formData.get('pin_order') || '').trim()

  if (!id) {
    throw new Error('ID news mancante')
  }

  const pinOrder =
    isPinned && rawPinOrder ? Math.min(Math.max(Number(rawPinOrder), 1), 3) : null

  const updatePayload = {
    title: title || null,
    excerpt: excerpt || null,
    content: content || null,
    image_url: imageUrl || null,
    external_url: externalUrl || null,
    status,
    is_visible: isVisible,
    is_pinned: isPinned,
    pin_order: pinOrder,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    published_at: status === 'published' ? new Date().toISOString() : null,
  }

  const { error } = await supabase.from('news_items').update(updatePayload).eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
}

async function deleteNewsItem(formData: FormData) {
  'use server'

  const supabase = await createClient()
  const id = String(formData.get('id') || '')

  if (!id) {
    throw new Error('ID news mancante')
  }

  const { error } = await supabase.from('news_items').delete().eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/news')
  revalidatePath('/news')
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

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('news_items')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (params.status === 'published' || params.status === 'draft') {
    query = query.eq('status', params.status)
  }

  if (params.visible === 'visible') {
    query = query.eq('is_visible', true)
  }

  if (params.visible === 'hidden') {
    query = query.eq('is_visible', false)
  }

  if (params.source === 'manual' || params.source === 'facebook') {
    query = query.eq('source_type', params.source)
  }

  const { data, error } = await query
  const newsItems = (data || []) as NewsItem[]

  const pinnedCount = newsItems.filter((item) => item.is_pinned).length

  return (
    <section className="text-[var(--site-text)]">
      <p className="theme-admin-faint text-sm uppercase tracking-[0.2em]">
        News
      </p>

      <h2 className="mt-2 text-3xl font-semibold text-[var(--site-text)]">
        Gestione news pubbliche
      </h2>

      <p className="theme-admin-muted mt-3 max-w-3xl">
        Qui gestisci le notizie visibili sul sito pubblico. Puoi creare news manuali,
        ordinare gli elementi, nasconderli dal sito e fissarne fino a 3 in alto.
      </p>

      <div className="mt-8 grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="theme-admin-card rounded-3xl p-6">
          <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
            Nuova news
          </p>

          <h3 className="mt-2 text-xl font-semibold text-[var(--site-text)]">
            Inserimento manuale
          </h3>

          <form action={createManualNews} className="mt-5 space-y-4">
            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                Titolo
              </label>
              <input
                name="title"
                required
                placeholder="Titolo news"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                Didascalia breve
              </label>
              <textarea
                name="excerpt"
                rows={3}
                placeholder="Breve introduzione"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                Testo completo
              </label>
              <textarea
                name="content"
                rows={6}
                placeholder="Contenuto della news"
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                URL immagine
              </label>
              <input
                name="image_url"
                placeholder="https://..."
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <div>
              <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                Link esterno
              </label>
              <input
                name="external_url"
                placeholder="https://..."
                className="theme-admin-input w-full rounded-2xl px-4 py-3"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                  Stato
                </label>
                <select
                  name="status"
                  defaultValue="published"
                  className="theme-admin-select w-full rounded-2xl px-4 py-3"
                >
                  <option value="published">Pubblicata</option>
                  <option value="draft">Bozza</option>
                </select>
              </div>

              <div>
                <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                  Ordine
                </label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={0}
                  className="theme-admin-input w-full rounded-2xl px-4 py-3"
                />
              </div>
            </div>

            <button
              type="submit"
              className="theme-admin-button-primary w-full rounded-2xl px-5 py-3 font-medium transition hover:opacity-95"
            >
              Crea news
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="theme-admin-card rounded-3xl p-6">
            <p className="theme-admin-faint text-xs uppercase tracking-[0.2em]">
              Stato gestione
            </p>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Totale</p>
                <p className="mt-2 text-2xl font-semibold">{newsItems.length}</p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Visibili</p>
                <p className="mt-2 text-2xl font-semibold">
                  {newsItems.filter((item) => item.is_visible).length}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Pinnate</p>
                <p className="mt-2 text-2xl font-semibold">{pinnedCount}</p>
              </div>

              <div className="rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)] p-4">
                <p className="theme-admin-muted text-sm">Manuali</p>
                <p className="mt-2 text-2xl font-semibold">
                  {newsItems.filter((item) => item.source_type === 'manual').length}
                </p>
              </div>
            </div>
          </div>

          <div className="theme-admin-card rounded-3xl p-6">
            <form method="GET" className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              <select
                name="status"
                defaultValue={params.status || ''}
                className="theme-admin-select rounded-2xl px-4 py-3"
              >
                <option value="">Tutti gli stati</option>
                <option value="published">Pubblicate</option>
                <option value="draft">Bozze</option>
              </select>

              <select
                name="visible"
                defaultValue={params.visible || ''}
                className="theme-admin-select rounded-2xl px-4 py-3"
              >
                <option value="">Tutta la visibilità</option>
                <option value="visible">Solo visibili</option>
                <option value="hidden">Solo nascoste</option>
              </select>

              <select
                name="source"
                defaultValue={params.source || ''}
                className="theme-admin-select rounded-2xl px-4 py-3"
              >
                <option value="">Tutte le fonti</option>
                <option value="manual">Manuali</option>
                <option value="facebook">Facebook</option>
              </select>

              <button
                type="submit"
                className="theme-admin-button-secondary rounded-2xl px-5 py-3 font-medium transition hover:opacity-95"
              >
                Applica filtri
              </button>
            </form>
          </div>

          {error && (
            <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-5 text-red-300">
              Errore nel caricamento news.
            </div>
          )}

          {!error && newsItems.length === 0 && (
            <div className="theme-admin-card rounded-3xl p-8 text-[var(--site-text-muted)]">
              Nessuna news presente.
            </div>
          )}

          {!error && newsItems.length > 0 && (
            <div className="space-y-5">
              {newsItems.map((item) => (
                <article key={item.id} className="theme-admin-card rounded-3xl p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                      {item.source_type}
                    </span>

                    <span className="theme-admin-chip rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                      {item.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em] ${
                        item.is_visible
                          ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                          : 'border border-white/10 bg-white/5 text-white/60'
                      }`}
                    >
                      {item.is_visible ? 'Visibile' : 'Nascosta'}
                    </span>

                    {item.is_pinned && (
                      <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-amber-300">
                        Pinnata #{item.pin_order || '?'}
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-6 xl:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-2)]">
                      {item.image_url ? (
                        <div
                          className="h-40 w-full bg-cover bg-center"
                          style={{ backgroundImage: `url('${item.image_url}')` }}
                        />
                      ) : (
                        <div className="flex h-40 items-center justify-center text-sm text-[var(--site-text-faint)]">
                          Nessuna immagine
                        </div>
                      )}
                    </div>

                    <form action={updateNewsItem} className="space-y-4">
                      <input type="hidden" name="id" value={item.id} />

                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Titolo
                          </label>
                          <input
                            name="title"
                            defaultValue={item.title || ''}
                            className="theme-admin-input w-full rounded-2xl px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            URL immagine
                          </label>
                          <input
                            name="image_url"
                            defaultValue={item.image_url || ''}
                            className="theme-admin-input w-full rounded-2xl px-4 py-3"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                          Didascalia breve
                        </label>
                        <textarea
                          name="excerpt"
                          rows={3}
                          defaultValue={item.excerpt || ''}
                          className="theme-admin-input w-full rounded-2xl px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                          Testo completo
                        </label>
                        <textarea
                          name="content"
                          rows={5}
                          defaultValue={item.content || ''}
                          className="theme-admin-input w-full rounded-2xl px-4 py-3"
                        />
                      </div>

                      <div>
                        <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                          Link esterno
                        </label>
                        <input
                          name="external_url"
                          defaultValue={item.external_url || ''}
                          className="theme-admin-input w-full rounded-2xl px-4 py-3"
                        />
                      </div>

                      <div className="grid gap-4 md:grid-cols-5">
                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Stato
                          </label>
                          <select
                            name="status"
                            defaultValue={item.status}
                            className="theme-admin-select w-full rounded-2xl px-4 py-3"
                          >
                            <option value="published">Pubblicata</option>
                            <option value="draft">Bozza</option>
                          </select>
                        </div>

                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Visibile
                          </label>
                          <select
                            name="is_visible"
                            defaultValue={item.is_visible ? 'true' : 'false'}
                            className="theme-admin-select w-full rounded-2xl px-4 py-3"
                          >
                            <option value="true">Sì</option>
                            <option value="false">No</option>
                          </select>
                        </div>

                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Pinnata
                          </label>
                          <select
                            name="is_pinned"
                            defaultValue={item.is_pinned ? 'true' : 'false'}
                            className="theme-admin-select w-full rounded-2xl px-4 py-3"
                          >
                            <option value="false">No</option>
                            <option value="true">Sì</option>
                          </select>
                        </div>

                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Pin order
                          </label>
                          <input
                            name="pin_order"
                            type="number"
                            min={1}
                            max={3}
                            defaultValue={item.pin_order || ''}
                            className="theme-admin-input w-full rounded-2xl px-4 py-3"
                          />
                        </div>

                        <div>
                          <label className="theme-admin-faint mb-2 block text-xs uppercase tracking-[0.18em]">
                            Sort order
                          </label>
                          <input
                            name="sort_order"
                            type="number"
                            defaultValue={item.sort_order}
                            className="theme-admin-input w-full rounded-2xl px-4 py-3"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--site-text-faint)]">
                        <span>Pubblicata: {formatDate(item.published_at)}</span>
                        <span>Creata: {formatDate(item.created_at)}</span>
                        <span>Aggiornata: {formatDate(item.updated_at)}</span>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <button
                          type="submit"
                          className="theme-admin-button-primary rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
                        >
                          Salva modifiche
                        </button>

                        <form action={deleteNewsItem}>
                          <input type="hidden" name="id" value={item.id} />
                          <button
                            type="submit"
                            className="rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/15"
                          >
                            Elimina
                          </button>
                        </form>

                        {item.external_url && (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="theme-admin-button-secondary rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
                          >
                            Apri link
                          </a>
                        )}
                      </div>
                    </form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}