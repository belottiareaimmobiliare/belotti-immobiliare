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
  const gallery = media.filter((m) => !cover || m.id !== cover.id)

  return (
    <main className="min-h-screen bg-[#040915] text-white">
      <SiteHeader />

      <section className="border-b border-white/10 bg-[#08101c]">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-white/38">
            News
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight md:text-5xl">
            {item.title || 'News'}
          </h1>

          {item.brief && (
            <p className="mt-6 max-w-3xl text-lg leading-8 text-white/72">
              {item.brief}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-white/45">
            <span>{formatDate(item.published_at || item.created_at)}</span>
            {item.author_name && <span>• {item.author_name}</span>}
            {item.source_name && <span>• Fonte: {item.source_name}</span>}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <div>
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[#0c1320]">
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={item.title || 'News'}
                  className="aspect-[4/3] w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center text-sm text-white/40">
                  Nessuna immagine
                </div>
              )}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/10 bg-[#0c1320] p-5">
              <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                Dettagli
              </p>

              <div className="mt-4 space-y-3 text-sm text-white/75">
                <div>
                  <span className="text-white/40">Data:</span>{' '}
                  {formatDate(item.published_at || item.created_at)}
                </div>

                {item.author_name && (
                  <div>
                    <span className="text-white/40">Firma:</span>{' '}
                    {item.author_name}
                  </div>
                )}

                {item.source_name && (
                  <div>
                    <span className="text-white/40">Fonte:</span>{' '}
                    {item.source_name}
                  </div>
                )}

                {item.source_url && (
                  <div className="pt-2">
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white/85 transition hover:bg-white/[0.09]"
                    >
                      Apri fonte
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          <article className="space-y-8">
            <div className="rounded-[30px] border border-white/10 bg-[#0c1320] p-7">
              <div className="space-y-5 text-base leading-8 text-white/74">
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
                    className="inline-flex rounded-2xl border border-white/10 bg-white px-5 py-3 text-sm font-medium text-black transition hover:opacity-95"
                  >
                    Apri approfondimento
                  </a>
                </div>
              )}
            </div>

            {gallery.length > 0 && (
              <div className="rounded-[30px] border border-white/10 bg-[#0c1320] p-7">
                <p className="text-xs uppercase tracking-[0.22em] text-white/38">
                  Galleria
                </p>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {gallery.map((image) => (
                    <a
                      key={image.id}
                      href={image.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03] transition hover:border-white/20"
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