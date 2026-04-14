import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import { createClient } from '@/lib/supabase/server'

type NewsItem = {
  id: string
  source_type: 'manual' | 'facebook'
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

function getPreviewText(item: NewsItem) {
  return item.excerpt || item.content || 'Contenuto in aggiornamento.'
}

export default async function NewsPage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('news_items')
    .select('*')
    .eq('status', 'published')
    .eq('is_visible', true)
    .order('is_pinned', { ascending: false })
    .order('pin_order', { ascending: true, nullsFirst: false })
    .order('sort_order', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const newsItems = (data || []) as NewsItem[]
  const pinnedNews = newsItems.filter((item) => item.is_pinned).slice(0, 3)
  const regularNews = newsItems.filter((item) => !item.is_pinned)

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            News
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--site-text)] md:text-5xl">
            Aggiornamenti, contenuti e notizie dal mondo immobiliare
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
            In questa sezione trovi contenuti editoriali, aggiornamenti utili e post selezionati
            dalla comunicazione pubblica di Area Immobiliare.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {error && (
          <div className="theme-panel rounded-[30px] border p-8 text-[var(--site-text-muted)]">
            Errore nel caricamento delle news.
          </div>
        )}

        {!error && newsItems.length === 0 && (
          <div className="theme-panel rounded-[30px] border p-8 text-[var(--site-text-muted)]">
            Nessuna news disponibile al momento.
          </div>
        )}

        {!error && pinnedNews.length > 0 && (
          <div className="mb-14">
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                In evidenza
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
                Le news fissate in alto
              </h2>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              {pinnedNews.map((item) => (
                <article
                  key={item.id}
                  className="theme-panel overflow-hidden rounded-[30px] border"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--site-surface-2)]">
                    {item.image_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${item.image_url}')` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                        Nessuna immagine
                      </div>
                    )}
                  </div>

                  <div className="p-6">
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

                    <h3 className="mt-3 text-2xl font-semibold leading-tight text-[var(--site-text)]">
                      {item.title || 'News'}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                      {getPreviewText(item)}
                    </p>

                    {(item.external_url || item.content) && (
                      <div className="mt-6">
                        {item.external_url ? (
                          <a
                            href={item.external_url}
                            target="_blank"
                            rel="noreferrer"
                            className="theme-button-primary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
                          >
                            Apri approfondimento
                          </a>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {!error && regularNews.length > 0 && (
          <div>
            <div className="mb-6">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
                Ultime news
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--site-text)]">
                Aggiornamenti recenti
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {regularNews.map((item) => (
                <article
                  key={item.id}
                  className="theme-panel overflow-hidden rounded-[30px] border"
                >
                  <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--site-surface-2)]">
                    {item.image_url ? (
                      <div
                        className="h-full w-full bg-cover bg-center"
                        style={{ backgroundImage: `url('${item.image_url}')` }}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
                        Nessuna immagine
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="theme-badge rounded-full px-3 py-1 text-xs uppercase tracking-[0.18em]">
                        {item.source_type === 'facebook' ? 'Facebook' : 'Editoriale'}
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-[var(--site-text-faint)]">
                      {formatDate(item.published_at || item.created_at)}
                    </p>

                    <h3 className="mt-3 text-xl font-semibold leading-tight text-[var(--site-text)]">
                      {item.title || 'News'}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-[var(--site-text-muted)]">
                      {getPreviewText(item)}
                    </p>

                    {item.external_url && (
                      <div className="mt-6">
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noreferrer"
                          className="theme-button-secondary inline-flex items-center justify-center rounded-2xl px-5 py-3 text-sm transition hover:opacity-95"
                        >
                          Apri link
                        </a>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}