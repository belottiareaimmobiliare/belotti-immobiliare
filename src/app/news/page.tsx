import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import { createClient } from '@/lib/supabase/server'

type NewsItem = {
  id: string
  slug: string | null
  source_type: 'manual' | 'facebook'
  title: string | null
  brief: string | null
  content: string | null
  image_url: string | null
  external_url: string | null
  source_name: string | null
  author_name: string | null
  is_visible: boolean
  is_pinned: boolean
  pin_order: number | null
  sort_order: number
  status: 'draft' | 'published'
  published_at: string | null
  created_at: string
}

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'
  return new Date(value).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function preview(item: NewsItem) {
  return item.brief || item.content || 'Contenuto in aggiornamento.'
}

function hrefFor(item: NewsItem) {
  if (item.slug) return `/news/${item.slug}`
  return item.external_url || '/news'
}

export default async function NewsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('news_items')
    .select('*')
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('is_pinned', { ascending: false })
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const items = (data || []) as NewsItem[]
  const pinned = items.filter((item) => item.is_pinned).slice(0, 3)
  const regular = items.filter((item) => !item.is_pinned)

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)]">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            News
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            Aggiornamenti e contenuti dal mondo immobiliare
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
            Approfondimenti, contenuti editoriali e aggiornamenti rilevanti per chi segue
            il mercato immobiliare.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {pinned.length > 0 && (
          <div className="mb-14">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              In evidenza
            </p>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {pinned.map((item) => (
                <Link
                  key={item.id}
                  href={hrefFor(item)}
                  className="theme-panel group overflow-hidden rounded-[30px] border transition duration-300 hover:border-[var(--site-border-strong)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--site-surface-2)]">
                    {item.image_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                        style={{ backgroundImage: `url('${item.image_url}')` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                        Nessuna immagine
                      </div>
                    )}
                  </div>

                  <div className="p-6 transition duration-300 group-hover:bg-[var(--site-surface-2)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="theme-badge rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                        In evidenza
                      </span>
                      <span className="theme-badge rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                        {item.source_type === 'facebook' ? 'Facebook' : 'Editoriale'}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-[var(--site-text-faint)]">
                      {formatDate(item.published_at || item.created_at)}
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold leading-tight text-[var(--site-text)] transition duration-300 group-hover:text-white">
                      {item.title || 'News'}
                    </h2>

                    {item.brief && (
                      <p className="mt-3 text-sm font-medium text-[var(--site-text-soft)]">
                        {item.brief}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {regular.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              Ultime news
            </p>

            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {regular.map((item) => (
                <Link
                  key={item.id}
                  href={hrefFor(item)}
                  className="theme-panel group overflow-hidden rounded-[30px] border transition duration-300 hover:border-[var(--site-border-strong)] hover:shadow-[0_18px_50px_rgba(0,0,0,0.20)]"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--site-surface-2)]">
                    {item.image_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-[1.03]"
                        style={{ backgroundImage: `url('${item.image_url}')` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                        Nessuna immagine
                      </div>
                    )}
                  </div>

                  <div className="p-6 transition duration-300 group-hover:bg-[var(--site-surface-2)]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="theme-badge rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                        {item.source_type === 'facebook' ? 'Facebook' : 'Editoriale'}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-[var(--site-text-faint)]">
                      {formatDate(item.published_at || item.created_at)}
                    </p>

                    <h3 className="mt-3 text-xl font-semibold leading-tight text-[var(--site-text)] transition duration-300 group-hover:text-white">
                      {item.title || 'News'}
                    </h3>

                    {item.brief && (
                      <p className="mt-3 text-sm font-medium text-[var(--site-text-soft)]">
                        {item.brief}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="theme-panel rounded-[30px] border p-8 text-[var(--site-text-muted)]">
            Nessuna news disponibile al momento.
          </div>
        )}
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}