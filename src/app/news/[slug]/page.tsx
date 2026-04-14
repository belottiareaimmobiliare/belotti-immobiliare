import { notFound } from 'next/navigation'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import { createClient } from '@/lib/supabase/server'

type NewsMediaItem = {
  id: string
  news_item_id: string
  image_url: string
  caption: string | null
  sort_order: number
  is_cover: boolean
  created_at: string
}

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'
  return new Date(value).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: item, error } = await supabase
    .from('news_items')
    .select(`
      *,
      news_media (*)
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('is_visible', true)
    .maybeSingle()

  if (error || !item) {
    notFound()
  }

  const media = ((item.news_media || []) as NewsMediaItem[]).slice().sort((a, b) => {
    if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
      return a.is_cover ? -1 : 1
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  const cover = media.find((m) => m.is_cover) || media[0] || null
  const gallery = media.filter((m) => !cover || m.id !== cover.id)

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)]">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            News
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            {item.title || 'News'}
          </h1>

          {item.brief && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-[var(--site-text-soft)]">
              {item.brief}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--site-text-faint)]">
            <span>{formatDate(item.published_at || item.created_at)}</span>
            {item.author_name && <span>• {item.author_name}</span>}
            {item.source_name && <span>• Fonte: {item.source_name}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <div>
            <div className="overflow-hidden rounded-[28px] border border-[var(--site-border)] bg-[var(--site-surface-2)]">
              {cover?.image_url || item.image_url ? (
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{ backgroundImage: `url('${cover?.image_url || item.image_url}')` }}
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-[var(--site-text-faint)]">
                  Nessuna immagine
                </div>
              )}
            </div>

            <div className="theme-panel mt-6 rounded-[28px] border p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                Dettagli
              </p>

              <div className="mt-4 space-y-3 text-sm text-[var(--site-text-soft)]">
                <div>
                  <span className="text-[var(--site-text-faint)]">Data:</span>{' '}
                  {formatDate(item.published_at || item.created_at)}
                </div>

                {item.author_name && (
                  <div>
                    <span className="text-[var(--site-text-faint)]">Firma:</span>{' '}
                    {item.author_name}
                  </div>
                )}

                {item.source_name && (
                  <div>
                    <span className="text-[var(--site-text-faint)]">Fonte:</span>{' '}
                    {item.source_name}
                  </div>
                )}

                {item.source_url && (
                  <div>
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="theme-button-secondary inline-flex rounded-2xl px-4 py-3 text-sm transition"
                    >
                      Apri fonte
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <article className="space-y-8">
            <div className="theme-panel rounded-[30px] border p-7">
              <div className="space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
                {(item.content || '')
                  .split('\n')
                  .filter((paragraph: string) => paragraph.trim().length > 0)
                  .map((paragraph: string, index: number) => (
                    <p key={index}>{paragraph}</p>
                  ))}
              </div>

              {item.external_url && (
                <div className="mt-8">
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noreferrer"
                    className="theme-button-primary inline-flex rounded-2xl px-5 py-3 text-sm font-medium transition hover:opacity-95"
                  >
                    Apri approfondimento
                  </a>
                </div>
              )}
            </div>

            {gallery.length > 0 && (
              <div className="theme-panel rounded-[30px] border p-7">
                <p className="text-xs uppercase tracking-[0.22em] text-[var(--site-text-faint)]">
                  Galleria
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {gallery.map((image) => (
                    <a
                      key={image.id}
                      href={image.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface-2)] transition hover:border-[var(--site-border-strong)]"
                    >
                      <div
                        className="aspect-[4/3] w-full bg-cover bg-center transition duration-500 hover:scale-[1.02]"
                        style={{ backgroundImage: `url('${image.image_url}')` }}
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}