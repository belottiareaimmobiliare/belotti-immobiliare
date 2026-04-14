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
  const coverSrc = cover?.image_url || item.image_url || null

  return (
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            News
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-semibold leading-tight md:text-5xl text-[var(--site-text)]">
            {item.title || 'News'}
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="theme-panel overflow-hidden rounded-[30px] border">
            {coverSrc ? (
              <img
                src={coverSrc}
                alt={item.title || 'News'}
                className="h-full min-h-[340px] w-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex min-h-[340px] items-center justify-center text-sm text-[var(--site-text-faint)]">
                Nessuna immagine disponibile
              </div>
            )}
          </div>

          <div className="flex min-h-[340px] items-center">
            <div className="w-full text-xl italic leading-10 text-[var(--site-text-soft)]">
              {item.brief || 'Nessun testo introduttivo disponibile.'}
            </div>
          </div>
        </div>

        <div className="theme-panel mt-8 rounded-[30px] border px-8 py-6">
          <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--site-text-soft)]">
            {item.author_name && (
              <span>
                <span className="text-[var(--site-text-faint)]">Autore:</span>{' '}
                {item.author_name}
              </span>
            )}

            <span className="opacity-50">•</span>

            <span>
              <span className="text-[var(--site-text-faint)]">Data:</span>{' '}
              {formatDate(item.published_at || item.created_at)}
            </span>

            {item.source_name && (
              <>
                <span className="opacity-50">•</span>
                <span>
                  <span className="text-[var(--site-text-faint)]">Fonte:</span>{' '}
                  {item.source_name}
                </span>
              </>
            )}
          </div>
        </div>

        <article className="theme-panel mt-8 rounded-[30px] border p-8">
          <div className="space-y-5 text-base leading-8 text-[var(--site-text-muted)]">
            {(item.content || '')
              .split('\n')
              .filter((paragraph: string) => paragraph.trim().length > 0)
              .map((paragraph: string, index: number) => (
                <p key={index}>{paragraph}</p>
              ))}
          </div>

          {(item.source_url || item.external_url) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {item.source_url && (
                <a
                  href={item.source_url}
                  target="_blank"
                  rel="noreferrer"
                  className="theme-button-secondary inline-flex rounded-2xl px-4 py-3 text-sm transition"
                >
                  Apri fonte
                </a>
              )}

              {item.external_url && (
                <a
                  href={item.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="theme-button-primary inline-flex rounded-2xl px-4 py-3 text-sm font-medium transition hover:opacity-95"
                >
                  Apri approfondimento
                </a>
              )}
            </div>
          )}
        </article>

        {media.length > 1 && (
          <section className="theme-panel mt-8 rounded-[30px] border p-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {media.map((image) => (
                <a
                  key={image.id}
                  href={image.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="overflow-hidden rounded-[24px] border border-[var(--site-border)] bg-[var(--site-surface-2)] transition hover:border-[var(--site-border-strong)]"
                >
                  <img
                    src={image.image_url}
                    alt={image.caption || item.title || 'Immagine news'}
                    className="aspect-[4/3] w-full object-cover transition duration-300 hover:scale-[1.02]"
                    referrerPolicy="no-referrer"
                  />
                </a>
              ))}
            </div>
          </section>
        )}
      </section>

      <FooterReveal>
        <Footer />
      </FooterReveal>
    </main>
  )
}