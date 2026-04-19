import Link from 'next/link'
import SiteHeader from '@/components/public/SiteHeader'
import Footer from '@/components/public/Footer'
import FooterReveal from '@/components/public/FooterReveal'
import NewsHeroDecoration from '@/components/public/NewsHeroDecoration'
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
  news_media?: NewsMediaItem[]
}

function formatDate(value: string | null) {
  if (!value) return 'Data non disponibile'
  return new Date(value).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function hrefFor(item: NewsItem) {
  if (item.slug) return `/news/${item.slug}`
  return item.external_url || '/news'
}

function getCover(item: NewsItem) {
  const media = (item.news_media || []).slice().sort((a, b) => {
    if ((a.is_cover ? 1 : 0) !== (b.is_cover ? 1 : 0)) {
      return a.is_cover ? -1 : 1
    }
    return (a.sort_order ?? 0) - (b.sort_order ?? 0)
  })

  return media.find((m) => m.is_cover) || media[0] || null
}

function getPreview(item: NewsItem) {
  const text = item.brief || item.content || 'Contenuto in aggiornamento.'
  return text.length > 190 ? `${text.slice(0, 190)}...` : text
}

function NewsCard({
  item,
  featured = false,
}: {
  item: NewsItem
  featured?: boolean
}) {
  const cover = getCover(item)
  const imageSrc = cover?.image_url || item.image_url || null

  return (
    <Link
      href={hrefFor(item)}
      className="theme-panel group relative overflow-hidden rounded-[30px] border transition duration-300 hover:border-[var(--site-border-strong)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.22)]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.015)_30%,rgba(255,255,255,0.03)_60%,rgba(255,255,255,0.015)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_14%,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_82%_18%,rgba(255,255,255,0.04),transparent_24%)]" />

      <div className="relative">
        <div className="relative h-[250px] overflow-hidden bg-[var(--site-surface-2)]">
          {imageSrc ? (
            <>
              <img
                src={imageSrc}
                alt={item.title || 'News'}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,12,20,0.08)_0%,rgba(7,12,20,0.20)_45%,rgba(7,12,20,0.58)_100%)]" />
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-[var(--site-text-faint)]">
              Nessuna immagine
            </div>
          )}
        </div>

        <div className="relative px-6 pb-7 pt-5 transition duration-300 group-hover:bg-[var(--site-surface-2)]">
          <div className="inline-flex rounded-full border border-[var(--site-border)] bg-[var(--site-surface-2)] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-[var(--site-text-soft)] transition duration-300 group-hover:border-[var(--site-border-strong)] group-hover:text-[var(--site-text)]">
            {item.source_type === 'facebook' ? 'Facebook' : 'Editoriale'}
          </div>

          <p className="mt-4 text-sm text-[var(--site-text-faint)] transition duration-300 group-hover:text-[var(--site-text-soft)]">
            {formatDate(item.published_at || item.created_at)}
          </p>

          <h2
            className={`mt-4 font-semibold leading-tight text-[var(--site-text)] transition duration-300 group-hover:text-[var(--site-text)] ${
              featured ? 'text-[2rem]' : 'text-[1.9rem]'
            }`}
          >
            {item.title || 'News'}
          </h2>

          <p className="mt-5 text-[15px] leading-8 text-[var(--site-text-muted)] transition duration-300 group-hover:text-[var(--site-text-soft)]">
            {getPreview(item)}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--site-text-soft)] transition duration-300 group-hover:text-[var(--site-text)]">
            <span>Apri news</span>
            <span className="transition duration-300 group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default async function NewsPage() {
  const supabase = await createClient()

  const { data } = await supabase
    .from('news_items')
    .select(`
      *,
      news_media (*)
    `)
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
    <main className="min-h-screen bg-[var(--site-bg)] text-[var(--site-text)] transition-colors duration-300">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-[var(--site-border)] bg-[var(--site-bg-soft)] transition-colors duration-300">
        <NewsHeroDecoration />

        <div className="relative z-10 mx-auto max-w-7xl px-6 py-16">
          <p className="text-sm uppercase tracking-[0.3em] text-[var(--site-text-faint)]">
            News
          </p>

          <h1 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-[var(--site-text)] md:text-5xl">
            Aggiornamenti e contenuti dal mondo immobiliare
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-8 text-[var(--site-text-muted)] md:text-lg">
            Approfondimenti, contenuti editoriali, aggiornamenti e post selezionati
            per seguire il contesto immobiliare con una lettura più ordinata e utile.
          </p>

          <div className="mt-8">
            <p className="text-sm text-[var(--site-text-muted)] md:text-base">
              Seguici sui social per rimanere aggiornato sulle ultime news
            </p>

            <div className="mt-4 flex items-center gap-3">
              <a
                href="https://www.facebook.com/profile.php?id=61569251094453"
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook Area Immobiliare | Consigli Immobiliari e dintorni"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:scale-[1.04] hover:border-white/25 hover:bg-white/10"
                title="Area Immobiliare | Consigli Immobiliari e dintorni"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6H16.7V4.8c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4V11H8v3h2.5v8h3z" />
                </svg>
              </a>

              <span className="text-base text-white/40">|</span>

              <a
                href="https://www.tiktok.com/@consigli.immobili"
                target="_blank"
                rel="noreferrer"
                aria-label="TikTok Consigli Immobiliari AI"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:scale-[1.04] hover:border-white/25 hover:bg-white/10"
                title="Consigli Immobiliari AI"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5 fill-current"
                >
                  <path d="M16.6 3c.2 1.6 1.1 3 2.4 3.8.8.5 1.6.8 2.5.9v2.7c-1.3 0-2.7-.4-3.9-1.1v5.7c0 1.6-.6 3.1-1.8 4.2A6.2 6.2 0 0 1 11.5 21a6 6 0 0 1-4.2-1.7A6 6 0 0 1 5.6 15c0-3.3 2.7-6 6-6 .3 0 .7 0 1 .1v2.9a3.2 3.2 0 0 0-1-.2 3.2 3.2 0 1 0 3.2 3.2V3h2.8z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        {pinned.length > 0 && (
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.24em] text-[var(--site-text-faint)]">
              In evidenza
            </p>

            <div className="mt-6 grid gap-6 xl:grid-cols-3">
              {pinned.map((item) => (
                <NewsCard key={item.id} item={item} featured />
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
                <NewsCard key={item.id} item={item} />
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